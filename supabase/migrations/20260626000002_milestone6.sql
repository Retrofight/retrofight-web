-- Milestone 6: competitive results, disputes, and Glicko-2 ranking
-- Apply this migration against the RetroFight Supabase project.

-- ─── Extend match_history ─────────────────────────────────────────────────────
-- Add match_type and ft_n. match_type already existed as a column in some
-- server-side code; add it idempotently. status constraint is extended to
-- include 'played' for casual matches.

ALTER TABLE match_history
  DROP CONSTRAINT IF EXISTS match_history_status_check;

ALTER TABLE match_history
  ADD COLUMN IF NOT EXISTS match_type TEXT NOT NULL DEFAULT 'casual',
  ADD COLUMN IF NOT EXISTS ft_n       INTEGER;

ALTER TABLE match_history
  DROP CONSTRAINT IF EXISTS match_history_match_type_check,
  DROP CONSTRAINT IF EXISTS match_history_ft_n_check;

ALTER TABLE match_history
  ADD CONSTRAINT match_history_status_check
    CHECK (status IN ('played', 'confirmed', 'disputed', 'forfeit')),
  ADD CONSTRAINT match_history_match_type_check
    CHECK (match_type IN ('casual', 'ranked')),
  ADD CONSTRAINT match_history_ft_n_check
    CHECK (ft_n IS NULL OR (ft_n >= 1 AND ft_n <= 5));

CREATE INDEX IF NOT EXISTS match_history_match_type_idx ON match_history (match_type, played_at DESC);

-- ─── Ranking seasons ─────────────────────────────────────────────────────────
-- A season groups player ratings into a named period. NULL season_id in
-- player_game_ratings means "all-time" (pre-season or unranked).
CREATE TABLE IF NOT EXISTS ranking_seasons (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at   TIMESTAMPTZ,
  active     BOOLEAN     NOT NULL DEFAULT TRUE
);

-- Only one season can be active at a time.
CREATE UNIQUE INDEX IF NOT EXISTS ranking_seasons_active_unique
  ON ranking_seasons (active)
  WHERE active = TRUE;

-- Seasons are readable by everyone.
ALTER TABLE ranking_seasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ranking_seasons_public_select" ON ranking_seasons;
CREATE POLICY "ranking_seasons_public_select" ON ranking_seasons
  FOR SELECT USING (TRUE);

-- ─── Player game ratings ──────────────────────────────────────────────────────
-- One row per (player, game, season). season_id NULL = all-time totals.
-- Glicko-2 internal values (rating, rd, volatility) are stored but never exposed
-- to clients; only visible_rank (0-6) is shown publicly.
CREATE TABLE IF NOT EXISTS player_game_ratings (
  player_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game           TEXT        NOT NULL,
  season_id      UUID        REFERENCES ranking_seasons(id) ON DELETE SET NULL,
  rating         DOUBLE PRECISION NOT NULL DEFAULT 1500,
  rd             DOUBLE PRECISION NOT NULL DEFAULT 350,
  volatility     DOUBLE PRECISION NOT NULL DEFAULT 0.06,
  visible_rank   SMALLINT    NOT NULL DEFAULT 0
                             CHECK (visible_rank BETWEEN 0 AND 6),
  wins           INTEGER     NOT NULL DEFAULT 0 CHECK (wins >= 0),
  losses         INTEGER     NOT NULL DEFAULT 0 CHECK (losses >= 0),
  streak         INTEGER     NOT NULL DEFAULT 0,
  best_streak    INTEGER     NOT NULL DEFAULT 0,
  total_matches  INTEGER     NOT NULL DEFAULT 0 CHECK (total_matches >= 0),
  last_match_at  TIMESTAMPTZ,
  PRIMARY KEY (player_id, game, season_id)
);

CREATE INDEX IF NOT EXISTS player_game_ratings_game_rank_idx
  ON player_game_ratings (game, visible_rank DESC, rating DESC);

CREATE INDEX IF NOT EXISTS player_game_ratings_season_game_idx
  ON player_game_ratings (season_id, game, visible_rank DESC, rating DESC);

-- ─── RLS: player_game_ratings ─────────────────────────────────────────────────
ALTER TABLE player_game_ratings ENABLE ROW LEVEL SECURITY;

-- Public leaderboard: read own stats or any player with a public profile
DROP POLICY IF EXISTS "pgr_own_select" ON player_game_ratings;
CREATE POLICY "pgr_own_select" ON player_game_ratings
  FOR SELECT USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "pgr_public_select" ON player_game_ratings;
CREATE POLICY "pgr_public_select" ON player_game_ratings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = player_id AND is_public = TRUE)
  );

-- Service role upserts ratings (bypasses RLS).

-- ─── Ranking history ─────────────────────────────────────────────────────────
-- Audit trail: one row per player per match (two rows per match).
-- Enables admin review of disputes and full rating trajectory.
CREATE TABLE IF NOT EXISTS ranking_history (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game             TEXT        NOT NULL,
  season_id        UUID        REFERENCES ranking_seasons(id) ON DELETE SET NULL,
  rating_before    DOUBLE PRECISION NOT NULL,
  rating_after     DOUBLE PRECISION NOT NULL,
  rd_before        DOUBLE PRECISION NOT NULL,
  rd_after         DOUBLE PRECISION NOT NULL,
  rank_before      SMALLINT    NOT NULL CHECK (rank_before BETWEEN 0 AND 6),
  rank_after       SMALLINT    NOT NULL CHECK (rank_after BETWEEN 0 AND 6),
  match_room_id    TEXT        NOT NULL,
  outcome          TEXT        NOT NULL CHECK (outcome IN ('win', 'loss')),
  boost_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  occurred_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ranking_history_player_game_idx
  ON ranking_history (player_id, game, occurred_at DESC);

CREATE INDEX IF NOT EXISTS ranking_history_room_idx
  ON ranking_history (match_room_id);

-- ─── RLS: ranking_history ─────────────────────────────────────────────────────
ALTER TABLE ranking_history ENABLE ROW LEVEL SECURITY;

-- Players can see their own history; admins query via service role.
DROP POLICY IF EXISTS "ranking_history_own_select" ON ranking_history;
CREATE POLICY "ranking_history_own_select" ON ranking_history
  FOR SELECT USING (auth.uid() = player_id);

-- Public profiles expose ranking history to anyone.
DROP POLICY IF EXISTS "ranking_history_public_select" ON ranking_history;
CREATE POLICY "ranking_history_public_select" ON ranking_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = player_id AND is_public = TRUE)
  );

-- Service role inserts history (bypasses RLS).

-- ─── Handle NULL season_id in PRIMARY KEY ─────────────────────────────────────
-- PostgreSQL treats two NULL values as NOT equal in a unique constraint,
-- so (player_id, game, NULL) would allow duplicates. Work around this with
-- a partial unique index covering the NULL season case.
CREATE UNIQUE INDEX IF NOT EXISTS player_game_ratings_no_season_unique
  ON player_game_ratings (player_id, game)
  WHERE season_id IS NULL;
