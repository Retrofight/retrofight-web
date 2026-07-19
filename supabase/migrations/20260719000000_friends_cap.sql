-- Friends cap: enforce a hard per-user limit on ACCEPTED friendships.
-- Apply this migration against the RetroFight Supabase project.
--
-- Invariant (kept in ONE place, the SECURITY DEFINER write RPCs, so no endpoint
-- can bypass it): every user has AT MOST 50 accepted friends. The limit is checked
-- on both sides at each transition that would create an 'accepted' edge, because
-- accepting/mutually-consenting adds a friend to BOTH participants at once.
--
-- Only 'accepted' rows count toward the cap; 'pending' requests do not (a user may
-- still receive requests while full, they just cannot accept more). The cap is a
-- constant in plpgsql (c_max_friends) rather than a config row: bumping it later is
-- a one-line migration, and this keeps the check branch-free and fast.
--
-- Known limitation (acceptable for v1): the count-then-write is not serialized, so
-- two concurrent accepts could both pass the check and land at 51. A stricter
-- version would take a row lock or add a counting constraint; deferred.

-- Send (or auto-accept) a friend request toward p_target. Adds the cap guards:
--   * caller must be below the cap to open OR mutually-accept a request;
--   * the target must also be below the cap when sending-back mutually accepts.
CREATE OR REPLACE FUNCTION send_friend_request(p_target UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  c_max_friends CONSTANT INTEGER := 50;
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
    -- Opening a request: if the caller is already full there is no point creating
    -- a pending row they could never accept, so block it up front.
    IF (SELECT COUNT(*) FROM friendships
          WHERE status = 'accepted' AND (user_low = v_caller OR user_high = v_caller)) >= c_max_friends THEN
      RAISE EXCEPTION 'friend_limit_reached';
    END IF;
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
  -- This creates an accepted edge for BOTH, so both must be below the cap.
  IF (SELECT COUNT(*) FROM friendships
        WHERE status = 'accepted' AND (user_low = v_caller OR user_high = v_caller)) >= c_max_friends
     OR (SELECT COUNT(*) FROM friendships
        WHERE status = 'accepted' AND (user_low = p_target OR user_high = p_target)) >= c_max_friends THEN
    RAISE EXCEPTION 'friend_limit_reached';
  END IF;

  UPDATE friendships SET status = 'accepted'
    WHERE user_low = v_low AND user_high = v_high;
  RETURN 'accepted';
END;
$$;

-- Accept or decline a PENDING request that p_requester sent to the caller.
-- Accepting creates an accepted edge for both, so both must be below the cap.
CREATE OR REPLACE FUNCTION respond_friend_request(p_requester UUID, p_accept BOOLEAN)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  c_max_friends CONSTANT INTEGER := 50;
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
    -- Enforce the cap on BOTH sides before the edge becomes accepted.
    IF (SELECT COUNT(*) FROM friendships
          WHERE status = 'accepted' AND (user_low = v_caller OR user_high = v_caller)) >= c_max_friends
       OR (SELECT COUNT(*) FROM friendships
          WHERE status = 'accepted' AND (user_low = p_requester OR user_high = p_requester)) >= c_max_friends THEN
      RAISE EXCEPTION 'friend_limit_reached';
    END IF;
    UPDATE friendships SET status = 'accepted'
      WHERE user_low = v_low AND user_high = v_high;
    RETURN 'accepted';
  END IF;

  DELETE FROM friendships WHERE user_low = v_low AND user_high = v_high;
  RETURN 'declined';
END;
$$;
