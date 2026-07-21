-- Season titles: give a season a name instead of a counter.
-- Apply this migration against the RetroFight Supabase project.
--
-- "Season 1 ... Season 1000" is a serial number, not a title: it says nothing, and
-- it ages badly once the count gets high. What a season needs is a short handle a
-- player can say out loud ("I hit A rank in Neon Gauntlet").
--
-- Generated, not curated: a hand-written list runs out, and nobody wants to name
-- seasons forever. Two small word lists of COPRIME lengths (13 x 11) are indexed
-- independently by the season number, so the pair only repeats after
-- lcm(13, 11) = 143 seasons -- roughly three and a half years at a 9-day cadence,
-- by which point recycling a name is a feature, not a collision.
--
-- The number does NOT disappear: it stays in `slug` (season-14), which is what the
-- news posts, URLs and any future tooling key off. Only the human-facing title
-- changes, so nothing machine-readable depends on the word lists.

CREATE OR REPLACE FUNCTION season_title(p_number INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  -- Deliberately plain fighting-game vocabulary: evocative, short, and safe to pair
  -- in any combination -- every adjective reads correctly with every noun, which is
  -- what makes the generation trustworthy without a human reviewing each result.
  c_adjectives CONSTANT TEXT[] := ARRAY[
    'Iron', 'Neon', 'Crimson', 'Golden', 'Shadow', 'Thunder', 'Frost',
    'Ember', 'Jade', 'Steel', 'Violet', 'Storm', 'Solar'
  ];                                                          -- 13 entries
  c_nouns CONSTANT TEXT[] := ARRAY[
    'Gauntlet', 'Circuit', 'Clash', 'Arena', 'Rush', 'Front',
    'League', 'Assault', 'Trial', 'Uprising', 'Showdown'
  ];                                                          -- 11 entries
  v_index INTEGER;
BEGIN
  -- Season numbers start at 1; shift to a 0-based index so the first season is the
  -- first word of each list rather than the second.
  v_index := GREATEST(COALESCE(p_number, 1), 1) - 1;

  RETURN c_adjectives[(v_index % array_length(c_adjectives, 1)) + 1]
      || ' '
      || c_nouns[(v_index % array_length(c_nouns, 1)) + 1];
END;
$$;

-- Rename any season already created under the old scheme. Slugs are untouched, so
-- existing news posts keep resolving.
UPDATE ranking_seasons s
SET name = season_title(NULLIF(regexp_replace(s.slug, '^season-', ''), '')::INTEGER)
WHERE s.slug ~ '^season-[0-9]+$'
  AND s.name ~ '^Season [0-9]+$';


-- ─── advance_seasons: same lifecycle, generated titles ───────────────────────
-- Full replacement of the version in 20260721000002_seasons.sql. The ONLY change
-- is the season's human name (`season_title(v_number)` instead of 'Season N') --
-- the slug, the cadence, the roster draw, the cooldown and both news posts are
-- unchanged. It has to be restated in full because Postgres has no way to patch a
-- function body; this file is now the current definition.

CREATE OR REPLACE FUNCTION advance_seasons(p_now TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_duration_days     CONSTANT INTEGER := 28;   -- one season lasts four weeks
  c_open_every_days   CONSTANT INTEGER := 9;    -- ...and a new one opens every nine days,
                                                -- so ~3 overlap without ever launching
                                                -- (or announcing) two at once
  c_max_active        CONSTANT INTEGER := 4;    -- safety cap, not a target: with 28/9 only
                                                -- 3-4 can overlap, and more would mean the
                                                -- cadence or the duration drifted
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
  v_season      RECORD;
  v_new_id      UUID;
  v_last_start  TIMESTAMPTZ;
  v_active      INTEGER;
  v_number      INTEGER;
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
                    st.rank_position, st.display_name, st.points, st.games_played, st.total_matches),
             E'\n' ORDER BY st.rank_position)
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

  -- ── Open the next season, if one is due ───────────────────────────────────
  -- Deliberately AT MOST ONE per pass. Seasons are staggered by cadence, not by
  -- batching: opening several at once would also mean publishing several "new
  -- season" posts on the same day, which is exactly what the news feed must not do.
  SELECT MAX(s.starts_at) INTO v_last_start FROM ranking_seasons s;
  SELECT COUNT(*) INTO v_active FROM ranking_seasons s WHERE s.status = 'active';

  IF v_active >= c_max_active THEN
    v_skipped := format('max_active_reached: %s season(s) already running', v_active);
  ELSIF v_last_start IS NOT NULL AND v_last_start > v_now - make_interval(days => c_open_every_days) THEN
    -- Not due yet. The very first run (no seasons at all) opens immediately.
    NULL;
  ELSE
    -- Cooldown: everything used by the last c_cooldown_seasons seasons (by start
    -- date), plus anything currently running. A game freed by the cooldown becomes
    -- drawable again on the season after that.
    SELECT COALESCE(ARRAY_AGG(DISTINCT g.game), '{}')
      INTO v_excluded
    FROM ranking_season_games g
    WHERE g.season_id IN (
      SELECT s.id FROM ranking_seasons s WHERE s.status = 'active'
      UNION
      SELECT recent.id FROM (
        SELECT s2.id FROM ranking_seasons s2 ORDER BY s2.starts_at DESC LIMIT c_cooldown_seasons
      ) recent
    );

    -- 3 from the most-played games of the last 90 days...
    SELECT COALESCE(ARRAY_AGG(picked.game), '{}') INTO v_games
    FROM (
      SELECT rg.game
      FROM ranked_games rg
      JOIN (
        SELECT m.game AS game, COUNT(*) AS plays
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
    SELECT v_games || COALESCE(ARRAY_AGG(picked.game), '{}') INTO v_games
    FROM (
      SELECT rg.game
      FROM ranked_games rg
      WHERE rg.ranked AND rg.in_catalog AND rg.enabled
        AND NOT (rg.game = ANY(v_excluded))
        AND NOT (rg.game = ANY(v_games))
      ORDER BY random()
      LIMIT c_games_per_season - COALESCE(array_length(v_games, 1), 0)
    ) picked;

    -- Pool exhausted (too few ranked games, or too many on cooldown): skip this
    -- opening rather than launch a thin season. The next pass tries again, so the
    -- season simply starts late instead of starting wrong.
    IF COALESCE(array_length(v_games, 1), 0) < c_min_games THEN
      v_skipped := format('pool_too_small: %s game(s) available, %s required',
                          COALESCE(array_length(v_games, 1), 0), c_min_games);
    ELSE
      SELECT COUNT(*)::INTEGER + 1 INTO v_number FROM ranking_seasons;
      v_slug := 'season-' || v_number;
      v_name := season_title(v_number);

      INSERT INTO ranking_seasons (name, slug, status, starts_at, ends_at)
      VALUES (v_name, v_slug, 'active', v_now, v_now + make_interval(days => c_duration_days))
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
        || E'- Everyone starts from %s on every season game -- veterans and newcomers alike.\n'
        || E'- Play a season game in **ranked** mode; casual matches do not count.\n'
        || E'- Your season score is the rating you build above %s, summed across the season '
        || E'games you played (at least 3 matches on a game for it to count).\n'
        || E'- A game never costs you points, so trying a new one is free.\n'
        || E'- You appear in the standings after 5 matches.\n'
        || E'- Other seasons may still be running: each has its own games and its own table.',
        v_name,
        to_char(v_now + make_interval(days => c_duration_days), 'FMMonth FMDDth'),
        COALESCE(v_body, '- (roster pending)'), 1500, 1500
      );

      PERFORM publish_season_news(
        v_slug || '-open',
        v_name || ' has started',
        format('%s games in rotation -- everyone starts level.', COALESCE(array_length(v_games, 1), 0)),
        v_body
      );

      v_opened_slugs := v_opened_slugs || v_slug;
      v_opened := 1;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'closed', v_closed,
    'opened', v_opened,
    'opened_slugs', to_jsonb(v_opened_slugs),
    'active', (SELECT COUNT(*) FROM ranking_seasons WHERE status = 'active'),
    'skipped', v_skipped
  );
END;
$$;

REVOKE ALL ON FUNCTION season_title(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION season_title(INTEGER) TO service_role;
