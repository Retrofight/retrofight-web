-- Fix: player_game_ratings primary key included season_id which was implicitly NOT NULL.
-- Since no active seasons exist yet and season_id is passed as NULL by the server,
-- all upserts failed with HTTP 400 "null value in column season_id violates not-null constraint".
--
-- New design:
--   - Primary key is (player_id, game) — covers all-time ratings (no season).
--   - season_id is a regular nullable FK column for future seasonal support.
--   - A separate unique index enforces (player_id, game, season_id) when season is active.

-- 1. Drop the broken primary key (implicitly added NOT NULL to season_id)
ALTER TABLE player_game_ratings DROP CONSTRAINT IF EXISTS player_game_ratings_pkey;

-- 2. Allow NULL in season_id (the PK had made it implicitly NOT NULL)
ALTER TABLE player_game_ratings ALTER COLUMN season_id DROP NOT NULL;

-- 3. Truncate any rows that may have been inserted with wrong state during partial failures
--    (safe: all upserts returned HTTP 400 so the table should be empty, but defensive)
TRUNCATE TABLE player_game_ratings;

-- 4. New primary key: (player_id, game) for the all-time ratings case
ALTER TABLE player_game_ratings ADD PRIMARY KEY (player_id, game);

-- 5. Drop the old partial unique index (now superseded by the PK for the NULL season case)
DROP INDEX IF EXISTS player_game_ratings_no_season_unique;

-- 6. Unique index for seasonal ratings: (player_id, game, season_id) when season is active
CREATE UNIQUE INDEX IF NOT EXISTS pgr_seasonal_uniq
  ON player_game_ratings (player_id, game, season_id)
  WHERE season_id IS NOT NULL;
