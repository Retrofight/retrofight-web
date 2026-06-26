-- Milestone 5: public profiles, match history, identity
-- Apply this migration against the RetroFight Supabase project.

-- ─── Extend profiles table ───────────────────────────────────────────────────
-- The table already has: id UUID (PK, FK → auth.users), display_name TEXT UNIQUE.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT,
  ADD COLUMN IF NOT EXISTS country     CHAR(2),
  ADD COLUMN IF NOT EXISTS is_public   BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── RLS: profiles ───────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile regardless of is_public
DROP POLICY IF EXISTS "profiles_own_select" ON profiles;
CREATE POLICY "profiles_own_select" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Public profiles are visible to everyone
DROP POLICY IF EXISTS "profiles_public_select" ON profiles;
CREATE POLICY "profiles_public_select" ON profiles
  FOR SELECT USING (is_public = TRUE);

-- Users can update only their own profile row
DROP POLICY IF EXISTS "profiles_own_update" ON profiles;
CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── Match history table ─────────────────────────────────────────────────────
-- p1/p2/winner FKs use SET NULL so deleted accounts produce anonymous records.
CREATE TABLE IF NOT EXISTS match_history (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id          TEXT        NOT NULL,
  p1_id            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  p1_name          TEXT,
  p2_id            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  p2_name          TEXT,
  game             TEXT        NOT NULL,
  winner_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  p1_score         INTEGER,
  p2_score         INTEGER,
  p1_char          INTEGER,
  p2_char          INTEGER,
  status           TEXT        NOT NULL CHECK (status IN ('confirmed', 'disputed', 'forfeit')),
  turbo_detected   BOOLEAN     NOT NULL DEFAULT FALSE,
  runtime_version  TEXT,
  protocol_version TEXT,
  audit_id         UUID        NOT NULL DEFAULT gen_random_uuid(),
  played_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS match_history_p1_id_idx ON match_history (p1_id, played_at DESC);
CREATE INDEX IF NOT EXISTS match_history_p2_id_idx ON match_history (p2_id, played_at DESC);

-- ─── RLS: match_history ───────────────────────────────────────────────────────
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;

-- Players can always read their own matches
DROP POLICY IF EXISTS "match_history_own_select" ON match_history;
CREATE POLICY "match_history_own_select" ON match_history
  FOR SELECT USING (auth.uid() = p1_id OR auth.uid() = p2_id);

-- Confirmed and forfeit matches between two public players are visible to everyone.
-- Disputed matches are excluded: no verified outcome, not suitable for public display.
DROP POLICY IF EXISTS "match_history_public_select" ON match_history;
CREATE POLICY "match_history_public_select" ON match_history
  FOR SELECT USING (
    status IN ('confirmed', 'forfeit')
    AND EXISTS (SELECT 1 FROM profiles WHERE id = p1_id AND is_public = TRUE)
    AND EXISTS (SELECT 1 FROM profiles WHERE id = p2_id AND is_public = TRUE)
  );

-- The server uses the service role (bypasses RLS) to INSERT match results.
-- No INSERT policy is needed for regular users.
