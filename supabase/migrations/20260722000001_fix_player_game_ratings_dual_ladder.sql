-- Root cause of the "every ranked match restarts from 1500" bug.
--
-- 20260626000003 set the primary key to (player_id, game). That key can hold only
-- ONE row per player+game, but the dual-ladder design needs TWO: the all-time row
-- (season_id IS NULL) and the season row (season_id set). While a season is
-- active, the two upserts in persistScope both target that PK (PostgREST's
-- merge-duplicates infers the primary key as the conflict target), so each write
-- clobbered the other. The single surviving row ping-ponged its season_id between
-- NULL and the season id, every rating read missed, and every match recomputed
-- from the 1500/350 default -- exactly the frozen ratings seen in ranking_history.
--
-- Fix: key the table on all three columns, treating a NULL season_id as a single
-- value (NULLS NOT DISTINCT, PostgreSQL 15+). The all-time row is then unique per
-- (player, game) and the season row unique per (player, game, season), so both
-- coexist and each scope's upsert merges into its own row.

-- 1. Drop the collision-prone composite primary key.
ALTER TABLE player_game_ratings DROP CONSTRAINT IF EXISTS player_game_ratings_pkey;

-- 2. Drop the now-redundant unique indexes (superseded by the three-column key).
DROP INDEX IF EXISTS pgr_seasonal_uniq;
DROP INDEX IF EXISTS player_game_ratings_no_season_unique;

-- 3. Reset the corrupted ratings. Every existing row is a garbage 1500 ping-pong
--    where the all-time and season scopes overwrote each other, so there is
--    nothing worth keeping. ranking_history is left untouched.
TRUNCATE TABLE player_game_ratings;

-- 4. Give the table a stable surrogate primary key so it keeps a default replica
--    identity (a nullable column cannot sit in the natural key).
ALTER TABLE player_game_ratings
  ADD COLUMN IF NOT EXISTS id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE player_game_ratings ADD PRIMARY KEY (id);

-- 5. The actual fix: one unique key across the full natural key, with NULL
--    season_id treated as a single value so the all-time upsert merges instead of
--    inserting a duplicate every match. This is the arbiter index the server
--    upsert targets via ?on_conflict=player_id,game,season_id.
CREATE UNIQUE INDEX IF NOT EXISTS pgr_player_game_season_uniq
  ON player_game_ratings (player_id, game, season_id) NULLS NOT DISTINCT;
