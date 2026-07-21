-- Season notifications: tell players when a season opens, and how they finished
-- when it closes.
-- Apply this migration against the RetroFight Supabase project.
--
-- Producers are TRIGGERS on ranking_seasons, not calls inside advance_seasons() --
-- the same rule the friend-graph notifications follow. The lifecycle RPC has
-- already been rewritten once (the cadence fix), and an insert buried in its body
-- would rot the next time it changes. A trigger also covers any other path that
-- ever opens or closes a season.
--
-- Audience, deliberately narrow in both cases:
--   * opened  -> players who actually played recently. A season announcement is
--     not worth an inbox row for an account that has been dormant for months, and
--     the news post already covers the broadcast case.
--   * closed  -> the players who took part, and only them. The notification
--     carries THEIR result, which is the only reason to send it.

-- ─── Vocabulary ──────────────────────────────────────────────────────────────
-- `kind` is a closed CHECK on purpose (see the notifications migration): a client
-- must never receive a kind it has no renderer for. Extending it is one line.
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_kind_check
  CHECK (kind IN (
    'friend_request',
    'friend_request_accepted',
    'season_opened',
    'season_closed'
  ));

-- ─── Bulk producer ───────────────────────────────────────────────────────────
-- push_notification() trims the recipient's inbox on every insert, which is right
-- for a single row and wrong for a fan-out (one trim per recipient). This is the
-- set-based version: one INSERT for everyone, then one trim pass restricted to the
-- recipients that are actually over the cap.
CREATE OR REPLACE FUNCTION push_notification_many(
  p_user_ids UUID[],
  p_kind     TEXT,
  p_actor_id UUID,
  p_payload  JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  c_max_per_user CONSTANT INTEGER := 100;
  v_inserted     INTEGER := 0;
BEGIN
  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  INSERT INTO notifications (user_id, kind, actor_id, payload)
  SELECT DISTINCT u.id, p_kind, p_actor_id, COALESCE(p_payload, '{}'::jsonb)
  FROM unnest(p_user_ids) AS u(id)
  WHERE u.id IS NOT NULL
    AND (p_actor_id IS NULL OR p_actor_id <> u.id)
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  DELETE FROM notifications n
  WHERE n.user_id = ANY(p_user_ids)
    AND n.id NOT IN (
      SELECT keep.id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id) AS rn
        FROM notifications
        WHERE user_id = ANY(p_user_ids)
      ) keep
      WHERE keep.rn <= c_max_per_user
    );

  RETURN v_inserted;
END;
$$;

-- ─── Season opened ───────────────────────────────────────────────────────────
-- Fires on INSERT, which is BEFORE the roster rows exist (advance_seasons inserts
-- the season, then its games), so the payload deliberately carries no game list --
-- the client opens the Seasons page for that. It carries the window instead, which
-- is what makes the row actionable ("you have 28 days").
CREATE OR REPLACE FUNCTION notify_season_opened()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  c_active_days CONSTANT INTEGER := 90;
  v_recipients  UUID[];
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NULL;
  END IF;

  -- Recently active players, read from the all-time ladder (season_id IS NULL is
  -- the career row, so this is "has played ranked at all, lately").
  SELECT COALESCE(ARRAY_AGG(DISTINCT r.player_id), '{}')
    INTO v_recipients
  FROM player_game_ratings r
  WHERE r.season_id IS NULL
    AND r.last_match_at IS NOT NULL
    AND r.last_match_at >= NOW() - make_interval(days => c_active_days);

  PERFORM push_notification_many(
    v_recipients,
    'season_opened',
    NULL,
    jsonb_build_object(
      'season_id', NEW.id,
      'slug',      NEW.slug,
      'name',      NEW.name,
      'ends_at',   NEW.ends_at
    )
  );

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS ranking_seasons_notify_opened ON ranking_seasons;
CREATE TRIGGER ranking_seasons_notify_opened
  AFTER INSERT ON ranking_seasons
  FOR EACH ROW EXECUTE FUNCTION notify_season_opened();

-- ─── Season closed ───────────────────────────────────────────────────────────
-- One row per participant, carrying that player's own final result. Players who
-- never reached the standings threshold still get a row (they took part), just
-- without a position -- the client renders that honestly rather than inventing one.
CREATE OR REPLACE FUNCTION notify_season_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_participants INTEGER;
  v_player       RECORD;
BEGIN
  IF OLD.status <> 'active' OR NEW.status <> 'ended' THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_participants FROM get_season_standings(NEW.id, 100);

  -- Per player, because the payload differs per player. The set is bounded by the
  -- number of people who played the season, and this runs once per season.
  FOR v_player IN
    SELECT
      r.player_id AS player_id,
      st.rank_position AS rank_position,
      COALESCE(st.points, 0) AS points
    FROM (
      SELECT DISTINCT pgr.player_id
      FROM player_game_ratings pgr
      WHERE pgr.season_id = NEW.id
    ) r
    LEFT JOIN get_season_standings(NEW.id, 100) st ON st.player_id = r.player_id
  LOOP
    PERFORM push_notification(
      v_player.player_id,
      'season_closed',
      NULL,
      jsonb_build_object(
        'season_id',     NEW.id,
        'slug',          NEW.slug,
        'name',          NEW.name,
        'rank_position', v_player.rank_position,
        'points',        v_player.points,
        'participants',  v_participants
      )
    );
  END LOOP;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS ranking_seasons_notify_closed ON ranking_seasons;
CREATE TRIGGER ranking_seasons_notify_closed
  AFTER UPDATE ON ranking_seasons
  FOR EACH ROW EXECUTE FUNCTION notify_season_closed();

-- ─── Grants ──────────────────────────────────────────────────────────────────
-- Producer-side only: triggers run as the definer, and granting this to a client
-- role would let a user write an inbox row for anyone.
REVOKE ALL ON FUNCTION push_notification_many(UUID[], TEXT, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION push_notification_many(UUID[], TEXT, UUID, JSONB) TO service_role;
