-- Milestone 7: matchmaking competitivo
-- Persisted per-player, per-game connection-quality signal used only as a soft
-- matchmaking scoring bonus (never a hard filter, never exposed to clients).
-- direct_success_count/direct_total_count are fed from the always-on netplay:punch_result
-- event (every authenticated match). avg_probe_latency_ms is fed only from opt-in telemetry
-- (netplay_attempt events with a probeLatencyMs sample).
CREATE TABLE IF NOT EXISTS player_network_stats (
  player_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game                 TEXT NOT NULL,
  direct_success_count INTEGER NOT NULL DEFAULT 0 CHECK (direct_success_count >= 0),
  direct_total_count   INTEGER NOT NULL DEFAULT 0 CHECK (direct_total_count >= 0),
  latency_sample_count INTEGER NOT NULL DEFAULT 0 CHECK (latency_sample_count >= 0),
  avg_probe_latency_ms DOUBLE PRECISION,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (player_id, game)
);

CREATE INDEX IF NOT EXISTS player_network_stats_game_idx
  ON player_network_stats (game, updated_at DESC);

-- ─── RLS: player_network_stats ─────────────────────────────────────────────────
ALTER TABLE player_network_stats ENABLE ROW LEVEL SECURITY;

-- Players can read their own connection-quality stats. No public/leaderboard
-- exposure -- this table is a matchmaking-internal signal, not a player-facing stat.
DROP POLICY IF EXISTS "pns_own_select" ON player_network_stats;
CREATE POLICY "pns_own_select" ON player_network_stats
  FOR SELECT USING (auth.uid() = player_id);

-- Service role reads/upserts (matchmaking scoring, punch_result/telemetry ingestion)
-- bypasses RLS.
