-- Seasons: self-running competitive periods over a rotating roster of games.
-- Apply this migration against the RetroFight Supabase project.
--
-- Product shape:
--   * Several seasons run CONCURRENTLY, each covering a small roster of games, so
--     the catalog gets exercised instead of everyone grinding the same title. A
--     player who wants a game that is not in season simply waits for its turn.
--   * Every season is a CLEAN SLATE: the first ranked match a player plays on a
--     roster game creates their season row at the initial rating, so a veteran and
--     a newcomer start the season level (see rankingPersist.ts, which writes the
--     all-time ladder and the season ladder independently).
--   * The lifecycle is AUTONOMOUS: advance_seasons() closes what expired, opens
--     what is missing, picks the rosters and publishes both news posts. Nobody has
--     to remember to start a season.
--
-- Invariants worth keeping:
--   * A game belongs to AT MOST ONE active season -- otherwise a match would owe
--     points to two ladders at once.
--   * Rosters are drawn ONLY from ranked_games (published as ranked + carrying a
--     detector). A season can therefore never schedule a game the runtime cannot
--     score, whatever the picker does.
--   * A game that was used recently is on cooldown for the next 2 seasons, so the
--     rotation keeps moving instead of re-drawing the same crowd-pleasers.

-- ─── ranking_seasons: window + lifecycle status ──────────────────────────────
-- The original table modelled ONE season at a time (started_at/ended_at plus a
-- unique index on active). Concurrency makes that shape wrong: what a season needs
-- is a planned window and an explicit status.
DROP INDEX IF EXISTS ranking_seasons_active_unique;

ALTER TABLE ranking_seasons DROP COLUMN IF EXISTS active;
ALTER TABLE ranking_seasons DROP COLUMN IF EXISTS started_at;
ALTER TABLE ranking_seasons DROP COLUMN IF EXISTS ended_at;

ALTER TABLE ranking_seasons
  ADD COLUMN IF NOT EXISTS slug       TEXT,
  ADD COLUMN IF NOT EXISTS status     TEXT        NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS starts_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS ends_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '28 days',
  ADD COLUMN IF NOT EXISTS closed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE ranking_seasons
  DROP CONSTRAINT IF EXISTS ranking_seasons_status_check;
ALTER TABLE ranking_seasons
  ADD CONSTRAINT ranking_seasons_status_check CHECK (status IN ('active', 'ended'));

CREATE UNIQUE INDEX IF NOT EXISTS ranking_seasons_slug_unique ON ranking_seasons (slug);
CREATE INDEX IF NOT EXISTS ranking_seasons_status_idx ON ranking_seasons (status, ends_at);

-- `active` is kept as a DERIVED column so any existing reader that filters
-- active=eq.true (PostgREST callers, older server builds) keeps working while
-- `status` is the single writable truth.
ALTER TABLE ranking_seasons
  ADD COLUMN IF NOT EXISTS active BOOLEAN GENERATED ALWAYS AS (status = 'active') STORED;

-- ─── ranking_season_games: the roster ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ranking_season_games (
  season_id UUID NOT NULL REFERENCES ranking_seasons(id) ON DELETE CASCADE,
  game      TEXT NOT NULL REFERENCES ranked_games(game) ON DELETE RESTRICT,
  PRIMARY KEY (season_id, game)
);

CREATE INDEX IF NOT EXISTS ranking_season_games_game_idx ON ranking_season_games (game);

-- Structural guard for the "one active season per game" invariant. The picker
-- already excludes active games, and advance_seasons() serialises on an advisory
-- lock, so this is the belt to that pair of braces: any future writer that gets it
-- wrong fails loudly instead of quietly double-counting a match.
CREATE OR REPLACE FUNCTION assert_game_free_for_season()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM ranking_season_games g
    JOIN ranking_seasons s ON s.id = g.season_id
    WHERE g.game = NEW.game
      AND s.status = 'active'
      AND g.season_id <> NEW.season_id
  ) THEN
    RAISE EXCEPTION 'game_already_in_active_season: %', NEW.game;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ranking_season_games_one_active ON ranking_season_games;
CREATE TRIGGER ranking_season_games_one_active
  BEFORE INSERT ON ranking_season_games
  FOR EACH ROW EXECUTE FUNCTION assert_game_free_for_season();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Seasons and their rosters are public (they are announced in the news anyway).
ALTER TABLE ranking_season_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ranking_season_games_public_select" ON ranking_season_games;
CREATE POLICY "ranking_season_games_public_select" ON ranking_season_games
  FOR SELECT USING (TRUE);

-- ═══ Reads ═══════════════════════════════════════════════════════════════════

-- Season standings.
--
-- Scoring: a season covers SEVERAL games, so the score has to say something about
-- the season, not about one game. Points = the rating a player built ABOVE the
-- starting rating, summed over the roster games they actually played, and floored
-- at zero per game. The floor is deliberate: a bad run on a new game must never
-- cost you points, or the safe play would be to touch only one title -- the exact
-- opposite of what a rotating roster is for.
--
-- The 1500 baseline mirrors INITIAL_RATING in the server's ranking.ts: if that ever
-- moves, this function moves with it. Requiring 3 matches on a game keeps a single
-- lucky win from producing points; the standings also carry total matches so a
-- client can show "Calibrating" until a player qualifies.
CREATE OR REPLACE FUNCTION get_season_standings(
  p_season_id UUID,
  p_limit     INTEGER DEFAULT 10
)
RETURNS TABLE (
  player_id     UUID,
  display_name  TEXT,
  avatar_url    TEXT,
  country       CHAR(2),
  points        INTEGER,
  games_played  INTEGER,
  total_matches INTEGER,
  wins          INTEGER,
  losses        INTEGER,
  position      INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH per_game AS (
    SELECT
      r.player_id,
      GREATEST(ROUND(r.rating)::INTEGER - 1500, 0) AS game_points,
      r.total_matches,
      r.wins,
      r.losses,
      (r.total_matches >= 3) AS counts
    FROM player_game_ratings r
    JOIN ranking_season_games g ON g.game = r.game AND g.season_id = p_season_id
    WHERE r.season_id = p_season_id
  ),
  totals AS (
    SELECT
      player_id,
      COALESCE(SUM(game_points) FILTER (WHERE counts), 0)::INTEGER AS points,
      COUNT(*) FILTER (WHERE counts)::INTEGER                      AS games_played,
      SUM(total_matches)::INTEGER                                  AS total_matches,
      SUM(wins)::INTEGER                                           AS wins,
      SUM(losses)::INTEGER                                         AS losses
    FROM per_game
    GROUP BY player_id
  )
  SELECT
    t.player_id,
    p.display_name,
    p.avatar_url,
    p.country,
    t.points,
    t.games_played,
    t.total_matches,
    t.wins,
    t.losses,
    RANK() OVER (ORDER BY t.points DESC, t.wins DESC, t.total_matches ASC)::INTEGER AS position
  FROM totals t
  JOIN profiles p ON p.id = t.player_id
  WHERE t.total_matches >= 5          -- below this a player is still calibrating
  ORDER BY position, p.display_name
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 100);
$$;

-- Every running season with its roster, for the client's Seasons page.
CREATE OR REPLACE FUNCTION list_active_seasons()
RETURNS TABLE (
  id        UUID,
  slug      TEXT,
  name      TEXT,
  starts_at TIMESTAMPTZ,
  ends_at   TIMESTAMPTZ,
  games     JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id, s.slug, s.name, s.starts_at, s.ends_at,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('game', g.game, 'name', rg.name) ORDER BY rg.name)
       FROM ranking_season_games g
       JOIN ranked_games rg ON rg.game = g.game
       WHERE g.season_id = s.id),
      '[]'::jsonb
    ) AS games
  FROM ranking_seasons s
  WHERE s.status = 'active'
  ORDER BY s.ends_at;
$$;

-- The caller's own line in every running season, plus their result in the last
-- season that has already closed. Drives the client's Seasons page in one call.
CREATE OR REPLACE FUNCTION get_my_season_summary()
RETURNS TABLE (
  season_id     UUID,
  slug          TEXT,
  name          TEXT,
  status        TEXT,
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  points        INTEGER,
  games_played  INTEGER,
  total_matches INTEGER,
  position      INTEGER,
  participants  INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH seasons AS (
    SELECT * FROM ranking_seasons WHERE status = 'active'
    UNION ALL
    SELECT * FROM (
      SELECT * FROM ranking_seasons WHERE status = 'ended' ORDER BY ends_at DESC LIMIT 1
    ) last_closed
  )
  SELECT
    s.id, s.slug, s.name, s.status, s.starts_at, s.ends_at,
    COALESCE(me.points, 0),
    COALESCE(me.games_played, 0),
    COALESCE(me.total_matches, 0),
    me.position,
    (SELECT COUNT(*)::INTEGER FROM get_season_standings(s.id, 100))
  FROM seasons s
  LEFT JOIN LATERAL (
    SELECT * FROM get_season_standings(s.id, 100) st WHERE st.player_id = auth.uid()
  ) me ON TRUE
  ORDER BY (s.status = 'active') DESC, s.ends_at;
$$;

-- ═══ Lifecycle ═══════════════════════════════════════════════════════════════

-- Publishes a news post. Season announcements are ordinary news items, so they
-- reach the client ticker and the website with no extra plumbing.
CREATE OR REPLACE FUNCTION publish_season_news(
  p_slug    TEXT,
  p_title   TEXT,
  p_summary TEXT,
  p_body    TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category UUID;
BEGIN
  SELECT id INTO v_category FROM news_categories WHERE slug = 'ranked';

  INSERT INTO news (slug, title, summary, body, category_id, status, published_at)
  VALUES (p_slug, p_title, p_summary, p_body, v_category, 'published', NOW())
  ON CONFLICT (slug) DO NOTHING;    -- a re-run must not duplicate the post
END;
$$;

-- Opens, closes and announces seasons. Idempotent and safe to call on a timer:
-- it only acts on what is actually due, and serialises on an advisory lock so two
-- server instances (or an overlapping tick) cannot open the same season twice.
--
-- p_now exists for tests; production passes nothing.
CREATE OR REPLACE FUNCTION advance_seasons(p_now TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_duration_days     CONSTANT INTEGER := 28;   -- one season lasts four weeks
  c_stagger_days      CONSTANT INTEGER := 9;    -- new seasons opened together are offset,
                                                -- so they never all end on the same day
  c_target_active     CONSTANT INTEGER := 3;    -- seasons running concurrently
  c_games_per_season  CONSTANT INTEGER := 5;
  c_min_games         CONSTANT INTEGER := 3;    -- below this the pool is too small: skip
  c_from_top_played   CONSTANT INTEGER := 3;    -- of which, drawn from the most played
  c_top_pool          CONSTANT INTEGER := 10;   -- "most played" = top 10
  c_recent_days       CONSTANT INTEGER := 90;   -- ...over the last 90 days
  c_cooldown_seasons  CONSTANT INTEGER := 2;    -- a game rests for two seasons

  v_now       TIMESTAMPTZ := COALESCE(p_now, NOW());
  v_closed    INTEGER := 0;
  v_opened    INTEGER := 0;
  v_skipped   TEXT := NULL;
  v_season    RECORD;
  v_new_id    UUID;
  v_index     INTEGER := 0;
  v_number    INTEGER;
  v_slug      TEXT;
  v_name      TEXT;
  v_games     TEXT[];
  v_excluded  TEXT[];
  v_body      TEXT;
  v_summary   TEXT;
  v_opened_slugs TEXT[] := '{}';
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('ranking_seasons'), 0);

  -- ── Close what expired ────────────────────────────────────────────────────
  FOR v_season IN
    SELECT * FROM ranking_seasons
    WHERE status = 'active' AND ends_at <= v_now
    ORDER BY ends_at
  LOOP
    UPDATE ranking_seasons
    SET status = 'ended', closed_at = v_now
    WHERE id = v_season.id;

    -- Results post: the top 10 by season points.
    SELECT string_agg(
             format('%s. **%s** — %s pts (%s games, %s matches)',
                    st.position, st.display_name, st.points, st.games_played, st.total_matches),
             E'\n' ORDER BY st.position)
      INTO v_body
    FROM get_season_standings(v_season.id, 10) st;

    IF v_body IS NULL THEN
      v_body := 'This season closed with no ranked results.';
      v_summary := format('%s has ended.', v_season.name);
    ELSE
      v_body := format(E'**%s** is over. Here are the top players:\n\n%s\n\n'
                       || 'Points are the rating you built above the %s starting point, '
                       || 'summed across the season games you played.',
                       v_season.name, v_body, 1500);
      v_summary := format('%s has ended — final standings inside.', v_season.name);
    END IF;

    PERFORM publish_season_news(
      v_season.slug || '-results',
      v_season.name || ' — Final standings',
      v_summary,
      v_body
    );

    v_closed := v_closed + 1;
  END LOOP;

  -- ── Open what is missing ──────────────────────────────────────────────────
  WHILE (SELECT COUNT(*) FROM ranking_seasons WHERE status = 'active') < c_target_active LOOP
    -- Cooldown: everything used by the last c_cooldown_seasons seasons (by start
    -- date), plus anything currently running. A game freed by the cooldown becomes
    -- drawable again on the season after that.
    SELECT COALESCE(ARRAY_AGG(DISTINCT g.game), '{}')
      INTO v_excluded
    FROM ranking_season_games g
    WHERE g.season_id IN (
      SELECT id FROM ranking_seasons WHERE status = 'active'
      UNION
      SELECT id FROM (
        SELECT id FROM ranking_seasons ORDER BY starts_at DESC LIMIT c_cooldown_seasons
      ) recent
    );

    -- 3 from the most-played games of the last 90 days...
    SELECT COALESCE(ARRAY_AGG(game), '{}') INTO v_games
    FROM (
      SELECT rg.game
      FROM ranked_games rg
      JOIN (
        SELECT m.game, COUNT(*) AS plays
        FROM match_history m
        WHERE m.played_at >= v_now - make_interval(days => c_recent_days)
        GROUP BY m.game
        ORDER BY plays DESC
        LIMIT c_top_pool
      ) popular ON popular.game = rg.game
      WHERE rg.ranked AND rg.in_catalog AND rg.enabled
        AND NOT (rg.game = ANY(v_excluded))
      ORDER BY random()
      LIMIT c_from_top_played
    ) picked;

    -- ...the rest from anywhere else in the pool, so titles nobody has tried yet
    -- still get their turn.
    SELECT v_games || COALESCE(ARRAY_AGG(game), '{}') INTO v_games
    FROM (
      SELECT rg.game
      FROM ranked_games rg
      WHERE rg.ranked AND rg.in_catalog AND rg.enabled
        AND NOT (rg.game = ANY(v_excluded))
        AND NOT (rg.game = ANY(v_games))
      ORDER BY random()
      LIMIT c_games_per_season - COALESCE(array_length(v_games, 1), 0)
    ) picked;

    -- Pool exhausted (too few ranked games, or too many on cooldown): stop rather
    -- than open a thin season. The caller sees why in the returned summary.
    IF COALESCE(array_length(v_games, 1), 0) < c_min_games THEN
      v_skipped := format('pool_too_small: %s game(s) available, %s required',
                          COALESCE(array_length(v_games, 1), 0), c_min_games);
      EXIT;
    END IF;

    SELECT COUNT(*)::INTEGER + 1 INTO v_number FROM ranking_seasons;
    v_slug := 'season-' || v_number;
    v_name := 'Season ' || v_number;

    INSERT INTO ranking_seasons (name, slug, status, starts_at, ends_at)
    VALUES (
      v_name,
      v_slug,
      'active',
      v_now,
      v_now + make_interval(days => c_duration_days + v_index * c_stagger_days)
    )
    RETURNING id INTO v_new_id;

    INSERT INTO ranking_season_games (season_id, game)
    SELECT v_new_id, unnest(v_games);

    -- Opening post: what to play, how it is scored, when it ends.
    SELECT string_agg(format('- **%s**', rg.name), E'\n' ORDER BY rg.name)
      INTO v_body
    FROM ranked_games rg WHERE rg.game = ANY(v_games);

    v_body := format(
      E'**%s** is open until %s.\n\n**Games this season**\n\n%s\n\n'
      || E'**How it works**\n\n'
      || E'- Everyone starts from %s on every season game — veterans and newcomers alike.\n'
      || E'- Play a season game in **ranked** mode; casual matches do not count.\n'
      || E'- Your season score is the rating you build above %s, summed across the season '
      || E'games you played (at least 3 matches on a game for it to count).\n'
      || E'- A game never costs you points, so trying a new one is free.\n'
      || E'- You appear in the standings after 5 matches.',
      v_name, to_char(v_now + make_interval(days => c_duration_days + v_index * c_stagger_days), 'FMMonth FMDDth'),
      COALESCE(v_body, '- (roster pending)'), 1500, 1500
    );

    PERFORM publish_season_news(
      v_slug || '-open',
      v_name || ' has started',
      format('%s new games in rotation — everyone starts level.', COALESCE(array_length(v_games, 1), 0)),
      v_body
    );

    v_opened_slugs := v_opened_slugs || v_slug;
    v_opened := v_opened + 1;
    v_index := v_index + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'closed', v_closed,
    'opened', v_opened,
    'opened_slugs', to_jsonb(v_opened_slugs),
    'active', (SELECT COUNT(*) FROM ranking_seasons WHERE status = 'active'),
    'skipped', v_skipped
  );
END;
$$;

-- Resolves the season a game currently belongs to, if any. This is what the
-- server asks after every ranked match to know which second ladder to write.
CREATE OR REPLACE FUNCTION get_active_season_for_game(p_game TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id
  FROM ranking_seasons s
  JOIN ranking_season_games g ON g.season_id = s.id
  WHERE s.status = 'active' AND g.game = p_game
  LIMIT 1;
$$;

-- ─── Grants ──────────────────────────────────────────────────────────────────
-- Lifecycle functions are machinery (service role only); the reads are public.
REVOKE ALL ON FUNCTION advance_seasons(TIMESTAMPTZ)                   FROM PUBLIC;
REVOKE ALL ON FUNCTION publish_season_news(TEXT, TEXT, TEXT, TEXT)    FROM PUBLIC;
REVOKE ALL ON FUNCTION get_season_standings(UUID, INTEGER)            FROM PUBLIC;
REVOKE ALL ON FUNCTION list_active_seasons()                          FROM PUBLIC;
REVOKE ALL ON FUNCTION get_my_season_summary()                        FROM PUBLIC;
REVOKE ALL ON FUNCTION get_active_season_for_game(TEXT)               FROM PUBLIC;

GRANT EXECUTE ON FUNCTION advance_seasons(TIMESTAMPTZ)                TO service_role;
GRANT EXECUTE ON FUNCTION publish_season_news(TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_season_standings(UUID, INTEGER)         TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION list_active_seasons()                       TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_my_season_summary()                     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_active_season_for_game(TEXT)            TO service_role;
