-- Friends foundation: social graph (friendships + blocks) and discovery RPCs.
-- Apply this migration against the RetroFight Supabase project.
--
-- Design invariants (kept in ONE place so no future endpoint can bypass them):
--   * The friendship graph is UNDIRECTED and stored canonically as one row per
--     pair, with user_low < user_high. This makes duplicate / crossed requests
--     structurally impossible (PK on the ordered pair) instead of relying on
--     application logic.
--   * requested_by records WHO opened a still-pending request (direction), and
--     is enforced to be one of the two participants.
--   * Only two statuses exist: 'pending' and 'accepted'. Decline and unfriend
--     both DELETE the row -- fewer states, fewer edge cases.
--   * Tables are READ via RLS (participants only). All WRITES go through the
--     SECURITY DEFINER RPCs below, which use auth.uid() to identify the caller.
--     No INSERT/UPDATE/DELETE policies are granted to regular users.

-- ─── profiles: opt-in email discoverability ──────────────────────────────────
-- Exact-email lookup is gated by this flag. Defaults to TRUE (product intent:
-- friends can find each other by the email they already know); exact match only,
-- never fuzzy, so it cannot be used to enumerate the user base.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS discoverable_by_email BOOLEAN NOT NULL DEFAULT TRUE;

-- ─── friendships ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friendships (
  user_low     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_high    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL CHECK (status IN ('pending', 'accepted')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_low, user_high),
  CONSTRAINT friendships_ordered_pair CHECK (user_low < user_high),
  CONSTRAINT friendships_requester_is_participant
    CHECK (requested_by = user_low OR requested_by = user_high)
);

-- Fast "list everything involving me" lookups from either side of the pair.
CREATE INDEX IF NOT EXISTS friendships_user_high_idx ON friendships (user_high);
-- Pending requests addressed to a user (incoming): the addressee is whichever
-- participant is NOT requested_by.
CREATE INDEX IF NOT EXISTS friendships_pending_idx
  ON friendships (status, requested_by)
  WHERE status = 'pending';

DROP TRIGGER IF EXISTS friendships_updated_at ON friendships;
CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_blocks ─────────────────────────────────────────────────────────────
-- Directional: blocker_id has blocked blocked_id. A block hides the blocker from
-- the blocked user's searches and forbids friend requests in either direction.
CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT user_blocks_no_self CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx ON user_blocks (blocked_id);

-- ─── RLS: friendships ────────────────────────────────────────────────────────
-- Participants can read their own relationships. Writes go through RPCs only.
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friendships_participant_select" ON friendships;
CREATE POLICY "friendships_participant_select" ON friendships
  FOR SELECT USING (auth.uid() = user_low OR auth.uid() = user_high);

-- ─── RLS: user_blocks ────────────────────────────────────────────────────────
-- Only the blocker can see their own block list. The blocked user must NOT be
-- able to learn they were blocked, so no policy exposes rows to blocked_id.
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_blocks_own_select" ON user_blocks;
CREATE POLICY "user_blocks_own_select" ON user_blocks
  FOR SELECT USING (auth.uid() = blocker_id);

-- ═══ RPCs ════════════════════════════════════════════════════════════════════
-- All run SECURITY DEFINER (bypass RLS) but derive the actor from auth.uid(),
-- so a user can only ever act as themselves. Granted to authenticated only.

-- Send (or auto-accept) a friend request toward p_target.
-- Returns the resulting status: 'pending' or 'accepted'. Idempotent.
CREATE OR REPLACE FUNCTION send_friend_request(p_target UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_low    UUID;
  v_high   UUID;
  v_row    friendships%ROWTYPE;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_target IS NULL OR p_target = v_caller THEN
    RAISE EXCEPTION 'invalid_target';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_target) THEN
    RAISE EXCEPTION 'target_not_found';
  END IF;
  -- A block in either direction forbids the request (error is intentionally
  -- generic so the caller cannot probe who blocked whom).
  IF EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = v_caller AND blocked_id = p_target)
       OR (blocker_id = p_target AND blocked_id = v_caller)
  ) THEN
    RAISE EXCEPTION 'blocked';
  END IF;

  v_low  := LEAST(v_caller, p_target);
  v_high := GREATEST(v_caller, p_target);

  SELECT * INTO v_row FROM friendships
    WHERE user_low = v_low AND user_high = v_high;

  IF NOT FOUND THEN
    INSERT INTO friendships (user_low, user_high, requested_by, status)
    VALUES (v_low, v_high, v_caller, 'pending');
    RETURN 'pending';
  END IF;

  IF v_row.status = 'accepted' THEN
    RETURN 'accepted';                       -- already friends (idempotent)
  END IF;

  -- status = 'pending'
  IF v_row.requested_by = v_caller THEN
    RETURN 'pending';                        -- already sent (idempotent)
  END IF;

  -- The other side had already requested me: sending back means mutual consent.
  UPDATE friendships SET status = 'accepted'
    WHERE user_low = v_low AND user_high = v_high;
  RETURN 'accepted';
END;
$$;

-- Accept or decline a PENDING request that p_requester sent to the caller.
-- Accept -> 'accepted'; decline -> row deleted, returns 'declined'.
CREATE OR REPLACE FUNCTION respond_friend_request(p_requester UUID, p_accept BOOLEAN)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_low    UUID;
  v_high   UUID;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  v_low  := LEAST(v_caller, p_requester);
  v_high := GREATEST(v_caller, p_requester);

  -- Must be a pending request opened by the OTHER party (not the caller).
  IF NOT EXISTS (
    SELECT 1 FROM friendships
    WHERE user_low = v_low AND user_high = v_high
      AND status = 'pending' AND requested_by = p_requester
  ) THEN
    RAISE EXCEPTION 'no_pending_request';
  END IF;

  IF p_accept THEN
    UPDATE friendships SET status = 'accepted'
      WHERE user_low = v_low AND user_high = v_high;
    RETURN 'accepted';
  END IF;

  DELETE FROM friendships WHERE user_low = v_low AND user_high = v_high;
  RETURN 'declined';
END;
$$;

-- Remove a friend, or cancel a request the caller sent. Idempotent.
CREATE OR REPLACE FUNCTION remove_friend(p_other UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller UUID := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  DELETE FROM friendships
    WHERE user_low = LEAST(v_caller, p_other)
      AND user_high = GREATEST(v_caller, p_other);
END;
$$;

-- Block a user: record the block and tear down any existing relationship.
CREATE OR REPLACE FUNCTION block_user(p_target UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller UUID := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_target IS NULL OR p_target = v_caller THEN
    RAISE EXCEPTION 'invalid_target';
  END IF;

  INSERT INTO user_blocks (blocker_id, blocked_id)
  VALUES (v_caller, p_target)
  ON CONFLICT DO NOTHING;

  DELETE FROM friendships
    WHERE user_low = LEAST(v_caller, p_target)
      AND user_high = GREATEST(v_caller, p_target);
END;
$$;

-- Remove a block the caller previously set. Idempotent.
CREATE OR REPLACE FUNCTION unblock_user(p_target UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller UUID := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  DELETE FROM user_blocks
    WHERE blocker_id = v_caller AND blocked_id = p_target;
END;
$$;

-- Prefix search over public profiles by (unique) display_name, excluding self
-- and anyone involved in a block with the caller. Each row carries the caller's
-- current friendship status so the UI can render the right action button.
CREATE OR REPLACE FUNCTION search_profiles(p_query TEXT, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id            UUID,
  display_name  TEXT,
  avatar_url    TEXT,
  country       CHAR(2),
  friend_status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    p.id,
    p.display_name,
    p.avatar_url,
    p.country,
    CASE
      WHEN f.status = 'accepted'                             THEN 'friends'
      WHEN f.status = 'pending' AND f.requested_by = auth.uid() THEN 'request_sent'
      WHEN f.status = 'pending'                              THEN 'request_received'
      ELSE 'none'
    END AS friend_status
  FROM profiles p
  LEFT JOIN friendships f
    ON f.user_low  = LEAST(auth.uid(), p.id)
   AND f.user_high = GREATEST(auth.uid(), p.id)
  WHERE p.is_public = TRUE
    AND p.id <> auth.uid()
    AND p.display_name ILIKE p_query || '%'
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p.id)
         OR (b.blocker_id = p.id       AND b.blocked_id = auth.uid())
    )
  ORDER BY p.display_name
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
$$;

-- Exact-email lookup, gated by profiles.discoverable_by_email. Reads auth.users
-- (hence SECURITY DEFINER) but never returns the email itself.
CREATE OR REPLACE FUNCTION find_profile_by_email(p_email TEXT)
RETURNS TABLE (
  id            UUID,
  display_name  TEXT,
  avatar_url    TEXT,
  country       CHAR(2),
  friend_status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    p.id,
    p.display_name,
    p.avatar_url,
    p.country,
    CASE
      WHEN f.status = 'accepted'                             THEN 'friends'
      WHEN f.status = 'pending' AND f.requested_by = auth.uid() THEN 'request_sent'
      WHEN f.status = 'pending'                              THEN 'request_received'
      ELSE 'none'
    END AS friend_status
  FROM auth.users u
  JOIN profiles p ON p.id = u.id
  LEFT JOIN friendships f
    ON f.user_low  = LEAST(auth.uid(), p.id)
   AND f.user_high = GREATEST(auth.uid(), p.id)
  WHERE LOWER(u.email) = LOWER(TRIM(p_email))
    AND p.discoverable_by_email = TRUE
    AND p.id <> auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p.id)
         OR (b.blocker_id = p.id       AND b.blocked_id = auth.uid())
    )
  LIMIT 1;
$$;

-- The caller's full relationship list (accepted + pending, both directions),
-- joined to the friend's profile so the client needs a single round-trip.
CREATE OR REPLACE FUNCTION list_friends()
RETURNS TABLE (
  friend_id    UUID,
  display_name TEXT,
  avatar_url   TEXT,
  country      CHAR(2),
  status       TEXT,
  direction    TEXT,
  since        TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    CASE WHEN f.user_low = auth.uid() THEN f.user_high ELSE f.user_low END AS friend_id,
    p.display_name,
    p.avatar_url,
    p.country,
    f.status,
    CASE
      WHEN f.status = 'accepted'        THEN 'accepted'
      WHEN f.requested_by = auth.uid()  THEN 'outgoing'
      ELSE 'incoming'
    END AS direction,
    f.updated_at AS since
  FROM friendships f
  JOIN profiles p
    ON p.id = CASE WHEN f.user_low = auth.uid() THEN f.user_high ELSE f.user_low END
  WHERE f.user_low = auth.uid() OR f.user_high = auth.uid()
  ORDER BY f.status, p.display_name;
$$;

-- ─── Grants ──────────────────────────────────────────────────────────────────
-- These RPCs are the only write path to the social graph, so authenticated
-- users must be able to execute them. anon stays locked out.
REVOKE ALL ON FUNCTION send_friend_request(UUID)              FROM PUBLIC;
REVOKE ALL ON FUNCTION respond_friend_request(UUID, BOOLEAN)  FROM PUBLIC;
REVOKE ALL ON FUNCTION remove_friend(UUID)                    FROM PUBLIC;
REVOKE ALL ON FUNCTION block_user(UUID)                       FROM PUBLIC;
REVOKE ALL ON FUNCTION unblock_user(UUID)                     FROM PUBLIC;
REVOKE ALL ON FUNCTION search_profiles(TEXT, INTEGER)         FROM PUBLIC;
REVOKE ALL ON FUNCTION find_profile_by_email(TEXT)            FROM PUBLIC;
REVOKE ALL ON FUNCTION list_friends()                         FROM PUBLIC;

GRANT EXECUTE ON FUNCTION send_friend_request(UUID)             TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION respond_friend_request(UUID, BOOLEAN) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION remove_friend(UUID)                   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION block_user(UUID)                      TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION unblock_user(UUID)                    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION search_profiles(TEXT, INTEGER)        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION find_profile_by_email(TEXT)           TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION list_friends()                        TO authenticated, service_role;
