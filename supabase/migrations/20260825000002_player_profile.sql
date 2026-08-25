-- Player profile: the card, the per-game ranks, and the match history behind it.
-- Apply after 20260825000001_friends_main_lp.sql.
--
-- Until now a player existed only as a row in someone else's list. There was no
-- surface that answered "who is this, and how do they play" -- which is the surface
-- every other social feature hangs off: a replay is watched from a profile, a club
-- lists profiles, a standings row leads to one.
--
-- Two RPCs, because they have different shapes and different costs:
--
--   get_player_profile   one row, everything the card needs, ranks folded into
--                        JSONB. Cheap and called on every open.
--   get_player_matches   a paginated list. Only fetched when the history section is
--                        actually looked at.
--
-- VISIBILITY. Both functions are SECURITY DEFINER, so RLS does NOT apply inside
-- them and the rule has to be written out by hand. It is deliberately the SAME rule
-- the policies enforce, restated rather than relaxed:
--
--   * a profile is readable by its owner, or by anyone when is_public
--   * a match is readable by a participant, or by anyone when it is confirmed or
--     forfeit AND both players are public (a disputed match has no verified
--     outcome and is nobody else's business)
--
-- Friends do NOT get to see a private profile. That would quietly redefine what
-- is_public means for every player who already set it, and it is a policy decision,
-- not a side effect of adding a page.

-- ─── get_player_profile ──────────────────────────────────────────────────────
-- p_id NULL = the caller. Returning ZERO rows is the "not visible" answer: no
-- error, no partial card, so a private profile and a deleted one look the same
-- from outside, which is the point.
CREATE OR REPLACE FUNCTION get_player_profile(p_id UUID DEFAULT NULL)
RETURNS TABLE (
  id            UUID,
  display_name  TEXT,
  avatar_url    TEXT,
  country       CHAR(2),
  is_public     BOOLEAN,
  is_self       BOOLEAN,
  -- 'self' | 'none' | 'accepted' | 'incoming' | 'outgoing' | 'blocked'
  friendship    TEXT,
  member_since  TIMESTAMPTZ,
  last_match_at TIMESTAMPTZ,
  total_matches INTEGER,
  wins          INTEGER,
  losses        INTEGER,
  best_streak   INTEGER,
  main_game     TEXT,
  main_lp       INTEGER,
  -- One entry per game the player has ranked matches on, best first. The client
  -- derives tier and stars from lp, so only lp travels.
  ranks         JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH target AS (
    SELECT COALESCE(p_id, auth.uid()) AS uid
  ),
  visible AS (
    SELECT p.*
    FROM profiles p, target t
    WHERE p.id = t.uid
      AND (p.id = auth.uid() OR p.is_public = TRUE)
  ),
  -- All-time ladder rows only (season_id IS NULL): a profile shows a career, and
  -- the season ladders are a parallel scoreboard with their own page.
  rated AS (
    SELECT r.*
    FROM player_game_ratings r, visible v
    WHERE r.player_id = v.id
      AND r.season_id IS NULL
      AND r.total_matches > 0
  ),
  totals AS (
    SELECT
      COALESCE(SUM(rated.total_matches), 0)::INTEGER AS total_matches,
      COALESCE(SUM(rated.wins), 0)::INTEGER          AS wins,
      COALESCE(SUM(rated.losses), 0)::INTEGER        AS losses,
      COALESCE(MAX(rated.best_streak), 0)::INTEGER   AS best_streak,
      MAX(rated.last_match_at)                       AS last_match_at
    FROM rated
  ),
  -- The main is the game with the most matches, tie-broken by recency -- the same
  -- rule the friend badge uses, so the two never disagree about someone's main.
  main AS (
    SELECT rated.game, rated.lp
    FROM rated
    ORDER BY rated.total_matches DESC, rated.last_match_at DESC NULLS LAST
    LIMIT 1
  )
  SELECT
    v.id,
    v.display_name,
    v.avatar_url,
    v.country,
    v.is_public,
    (v.id = auth.uid()) AS is_self,
    CASE
      WHEN v.id = auth.uid() THEN 'self'
      WHEN EXISTS (SELECT 1 FROM user_blocks b WHERE b.blocker_id = auth.uid() AND b.blocked_id = v.id) THEN 'blocked'
      ELSE COALESCE((
        SELECT CASE
          WHEN f.status = 'accepted'       THEN 'accepted'
          WHEN f.requested_by = auth.uid() THEN 'outgoing'
          ELSE 'incoming'
        END
        FROM friendships f
        WHERE (f.user_low = LEAST(auth.uid(), v.id) AND f.user_high = GREATEST(auth.uid(), v.id))
      ), 'none')
    END AS friendship,
    v.created_at AS member_since,
    t.last_match_at,
    t.total_matches,
    t.wins,
    t.losses,
    t.best_streak,
    m.game AS main_game,
    m.lp   AS main_lp,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'game', rated.game,
          'lp', rated.lp,
          'tier', rated.tier,
          'star', rated.star,
          'wins', rated.wins,
          'losses', rated.losses,
          'matches', rated.total_matches,
          'best_streak', rated.best_streak,
          'last_match_at', rated.last_match_at
        )
        ORDER BY rated.lp DESC, rated.total_matches DESC
      )
      FROM rated
    ), '[]'::jsonb) AS ranks
  FROM visible v
  CROSS JOIN totals t
  LEFT JOIN main m ON TRUE;
$$;

-- ─── get_player_matches ──────────────────────────────────────────────────────
-- Perspective-aware: every row is stated from p_id's side ("you won", "your
-- score"), so the client never has to work out which of p1/p2 the profile is.
--
-- The LP move for each match is joined from ranking_history when it exists. It is
-- LEFT joined and stays NULL for casual matches and for anything played before the
-- LP ladder existed -- inventing a zero there would read as "you earned nothing".
CREATE OR REPLACE FUNCTION get_player_matches(
  p_id     UUID    DEFAULT NULL,
  p_limit  INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id             UUID,
  game           TEXT,
  played_at      TIMESTAMPTZ,
  match_type     TEXT,
  ft_n           INTEGER,
  status         TEXT,
  opponent_id    UUID,
  opponent_name  TEXT,
  you_won        BOOLEAN,
  your_score     INTEGER,
  opponent_score INTEGER,
  lp_delta       INTEGER,
  total_count    BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH target AS (
    SELECT COALESCE(p_id, auth.uid()) AS uid
  ),
  readable AS (
    SELECT h.*, t.uid
    FROM match_history h, target t
    WHERE (h.p1_id = t.uid OR h.p2_id = t.uid)
      AND (
        -- A participant always sees their own match, whatever its state.
        auth.uid() IN (h.p1_id, h.p2_id)
        -- Everyone else sees only a settled match between two public players.
        OR (
          h.status IN ('confirmed', 'forfeit')
          AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = h.p1_id AND p.is_public)
          AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = h.p2_id AND p.is_public)
        )
      )
  ),
  page AS (
    SELECT r.*, COUNT(*) OVER() AS total_count
    FROM readable r
    ORDER BY r.played_at DESC
    LIMIT  LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50)
    OFFSET GREATEST(COALESCE(p_offset, 0), 0)
  )
  SELECT
    pg.id,
    pg.game,
    pg.played_at,
    pg.match_type,
    pg.ft_n,
    pg.status,
    CASE WHEN pg.p1_id = pg.uid THEN pg.p2_id   ELSE pg.p1_id   END AS opponent_id,
    CASE WHEN pg.p1_id = pg.uid THEN pg.p2_name ELSE pg.p1_name END AS opponent_name,
    -- NULL for a casual match ("played"): it has no competitive outcome at all.
    CASE WHEN pg.winner_id IS NULL THEN NULL ELSE (pg.winner_id = pg.uid) END AS you_won,
    CASE WHEN pg.p1_id = pg.uid THEN pg.p1_score ELSE pg.p2_score END AS your_score,
    CASE WHEN pg.p1_id = pg.uid THEN pg.p2_score ELSE pg.p1_score END AS opponent_score,
    rh.lp_delta,
    pg.total_count
  FROM page pg
  LEFT JOIN LATERAL (
    SELECT (h.lp_after - h.lp_before) AS lp_delta
    FROM ranking_history h
    WHERE h.match_room_id = pg.room_id
      AND h.player_id = pg.uid
      AND h.season_id IS NULL
      AND h.lp_after IS NOT NULL
    LIMIT 1
  ) rh ON TRUE
  ORDER BY pg.played_at DESC;
$$;

-- ─── update_my_profile ───────────────────────────────────────────────────────
-- Editing is limited to the four fields a player owns. Deliberately an RPC rather
-- than a direct UPDATE through RLS: the display-name rules (length, uniqueness,
-- no impersonating whitespace) belong in one place, and a policy cannot express
-- them.
--
-- avatar_url is chosen from a fixed preset set on the client, not uploaded, so
-- there is nothing to moderate and no storage to police. Anything that is not a
-- short relative preset key is rejected.
CREATE OR REPLACE FUNCTION update_my_profile(
  p_display_name TEXT DEFAULT NULL,
  p_country      TEXT DEFAULT NULL,
  p_avatar_url   TEXT DEFAULT NULL,
  p_is_public    BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_name TEXT := NULLIF(TRIM(COALESCE(p_display_name, '')), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF v_name IS NOT NULL THEN
    IF LENGTH(v_name) < 3 OR LENGTH(v_name) > 24 THEN
      RAISE EXCEPTION 'display name must be 3-24 characters';
    END IF;
    -- Collapse internal runs of whitespace: two names that differ only by spacing
    -- are the same name to a reader, and the UNIQUE index would not catch it.
    v_name := REGEXP_REPLACE(v_name, '\s+', ' ', 'g');
  END IF;

  IF p_avatar_url IS NOT NULL AND p_avatar_url !~ '^[a-z0-9_-]{1,40}$' THEN
    RAISE EXCEPTION 'avatar must be a preset key';
  END IF;

  IF p_country IS NOT NULL AND p_country !~ '^[a-z]{2}$' THEN
    RAISE EXCEPTION 'country must be a two-letter code';
  END IF;

  UPDATE profiles SET
    display_name = COALESCE(v_name, display_name),
    country      = COALESCE(p_country, country),
    avatar_url   = COALESCE(p_avatar_url, avatar_url),
    is_public    = COALESCE(p_is_public, is_public)
  WHERE id = auth.uid();
END;
$$;

-- ─── Grants ──────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION get_player_profile(UUID)                        FROM PUBLIC;
REVOKE ALL ON FUNCTION get_player_matches(UUID, INTEGER, INTEGER)      FROM PUBLIC;
REVOKE ALL ON FUNCTION update_my_profile(TEXT, TEXT, TEXT, BOOLEAN)    FROM PUBLIC;

GRANT EXECUTE ON FUNCTION get_player_profile(UUID)                     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_player_matches(UUID, INTEGER, INTEGER)   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_my_profile(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated, service_role;
