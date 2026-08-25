-- Visible progression: League Points, tiers and stars.
--
-- Until now the only thing a player could see was one of seven letters derived from
-- the hidden Glicko-2 rating. It moved rarely, said nothing about how far the next
-- one was, and gave a session no goal. This adds the visible ladder next to the
-- hidden estimate rather than replacing it:
--
--   * rating / rd / volatility  stay exactly as they are -- the hidden skill
--     estimate, still the only thing matchmaking reads.
--   * lp / tier / star          the visible ladder. Six tiers of 1000 LP cut into
--     5 stars of 200, then Master at 6000 with no stars.
--
-- tier and star are stored rather than derived on read because leaderboards filter
-- and sort on them; lp is the source of truth and both are a pure function of it
-- (see the server's progression.ts, which must agree with lp_tier/lp_star below).
--
-- visible_rank is NOT dropped. Every existing surface still reads it -- the friend
-- list badge, Match Found, the in-runtime HUD, the matchmaking scorer -- and pulling
-- it out in the same migration that introduces its replacement would break all of
-- them at once. It keeps being written; the surfaces move over one at a time.

-- ─── Columns ─────────────────────────────────────────────────────────────────

ALTER TABLE player_game_ratings
  ADD COLUMN IF NOT EXISTS lp   INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tier SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS star SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE player_game_ratings
  DROP CONSTRAINT IF EXISTS player_game_ratings_lp_check,
  DROP CONSTRAINT IF EXISTS player_game_ratings_tier_check,
  DROP CONSTRAINT IF EXISTS player_game_ratings_star_check;

ALTER TABLE player_game_ratings
  ADD CONSTRAINT player_game_ratings_lp_check   CHECK (lp >= 0),
  ADD CONSTRAINT player_game_ratings_tier_check CHECK (tier BETWEEN 0 AND 6),
  -- 0 means "no star": an unranked player, and Master, which is a single step.
  ADD CONSTRAINT player_game_ratings_star_check CHECK (star BETWEEN 0 AND 5);

-- The ladder query: highest LP first within a game (and within a season).
CREATE INDEX IF NOT EXISTS player_game_ratings_game_lp_idx
  ON player_game_ratings (game, lp DESC);

CREATE INDEX IF NOT EXISTS player_game_ratings_season_game_lp_idx
  ON player_game_ratings (season_id, game, lp DESC);

-- ─── Derivation, shared by the backfill and anything reading LP in SQL ───────
-- These MUST match progression.ts. Kept as functions so the two places that need
-- them (this backfill, and any future leaderboard view) cannot drift apart.

CREATE OR REPLACE FUNCTION lp_tier(p_lp INTEGER)
RETURNS SMALLINT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT LEAST(6, GREATEST(0, COALESCE(p_lp, 0) / 1000))::SMALLINT;
$$;

CREATE OR REPLACE FUNCTION lp_star(p_lp INTEGER)
RETURNS SMALLINT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN lp_tier(p_lp) = 6 THEN 0                       -- Master has no stars
    ELSE ((GREATEST(0, COALESCE(p_lp, 0)) % 1000) / 200) + 1
  END::SMALLINT;
$$;

-- ─── Backfill ────────────────────────────────────────────────────────────────
-- Existing players must not be reset to zero, and they must not be re-derived from
-- the raw rating either -- that would ignore the rank they were already shown.
-- Instead each old letter maps onto the tier that replaces it, and the position
-- INSIDE the old rating band becomes the position inside the new tier:
--
--   E -> Rookie   D -> Bronze   C -> Silver   B -> Gold   A -> Platinum   S -> Diamond
--
-- The old bands are 200 rating wide and the new tiers are 1000 LP wide, so a rating
-- point is worth 5 LP. The open-ended bottom (E) and top (S) bands are clamped: S
-- fills Diamond and spills into Master, which is exactly where a 2100+ player
-- belongs. NR (no ranked match yet) stays at 0.

UPDATE player_game_ratings
SET lp = CASE visible_rank
    WHEN 1 THEN            LEAST( 999, GREATEST(0, ROUND((rating - 1100) * 5)))   -- E -> Rookie
    WHEN 2 THEN 1000 + LEAST( 999, GREATEST(0, ROUND((rating - 1300) * 5)))       -- D -> Bronze
    WHEN 3 THEN 2000 + LEAST( 999, GREATEST(0, ROUND((rating - 1500) * 5)))       -- C -> Silver
    WHEN 4 THEN 3000 + LEAST( 999, GREATEST(0, ROUND((rating - 1700) * 5)))       -- B -> Gold
    WHEN 5 THEN 4000 + LEAST( 999, GREATEST(0, ROUND((rating - 1900) * 5)))       -- A -> Platinum
    WHEN 6 THEN 5000 + LEAST(1999, GREATEST(0, ROUND((rating - 2100) * 5)))       -- S -> Diamond/Master
    ELSE 0                                                                        -- NR
  END
WHERE lp = 0 AND total_matches > 0;

UPDATE player_game_ratings
SET tier = lp_tier(lp),
    star = lp_star(lp);

-- A player with no completed ranked match has no star to show, whatever the LP
-- default says.
UPDATE player_game_ratings
SET star = 0
WHERE total_matches = 0;

-- ─── Ranking history ─────────────────────────────────────────────────────────
-- The audit trail gains the visible side of the move, which is also what the
-- post-match recap replays back to the player ("+34 LP, 120 to the next star").
-- Nullable: rows written before this migration have no LP to report, and inventing
-- one would make the trail lie.

ALTER TABLE ranking_history
  ADD COLUMN IF NOT EXISTS lp_before   INTEGER,
  ADD COLUMN IF NOT EXISTS lp_after    INTEGER,
  ADD COLUMN IF NOT EXISTS tier_before SMALLINT,
  ADD COLUMN IF NOT EXISTS tier_after  SMALLINT,
  ADD COLUMN IF NOT EXISTS star_before SMALLINT,
  ADD COLUMN IF NOT EXISTS star_after  SMALLINT;

-- ─── Notifications ───────────────────────────────────────────────────────────
-- Reaching a new tier is worth telling someone about even if they closed the
-- client right after the match. The kind vocabulary is closed by CHECK on purpose
-- (see the notifications migration), so adding a producer means extending it here.

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_kind_check
  CHECK (kind IN (
    'friend_request',
    'friend_request_accepted',
    'season_opened',
    'season_closed',
    'rank_promoted'
  ));
