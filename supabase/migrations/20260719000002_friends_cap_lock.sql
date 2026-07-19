-- Friends cap: close the count-then-write race on the 50-friend limit.
-- Apply this migration against the RetroFight Supabase project (after friends_cap).
--
-- The cap is checked by COUNT-ing accepted friends and then writing the accepted
-- edge. Under READ COMMITTED two concurrent accepts that share a participant (e.g.
-- user X, at 49 friends, accepting A and B at the same instant) each COUNT 49, both
-- pass, and both write DIFFERENT pair rows -- so no row lock serializes them and X
-- lands at 51. The overshoot is bounded (one per concurrent accept) and accepts are
-- rare, but this makes the invariant exact.
--
-- Fix: before the count, take a per-participant transaction advisory lock on BOTH
-- users of the pair. Any two accepts that share a user then contend on that user's
-- lock and serialize, so the second one counts AFTER the first commits and is
-- correctly rejected. Locks are acquired in ascending key order so two transactions
-- touching the same pair (accept via respond + mutual send-back) cannot deadlock.
-- Locks are transaction-scoped (pg_advisory_xact_lock) and released when PostgREST's
-- per-request transaction ends. classid = hashtext('friends_cap') namespaces them.

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
    -- a pending row they could never accept, so block it up front. (No advisory
    -- lock needed here: a pending row does not create an accepted edge, so it
    -- cannot overshoot the cap.)
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
  -- This creates an accepted edge for BOTH, so serialize concurrent accepts that
  -- share a participant, then enforce the cap on both.
  IF hashtext(v_low::text) <= hashtext(v_high::text) THEN
    PERFORM pg_advisory_xact_lock(hashtext('friends_cap'), hashtext(v_low::text));
    PERFORM pg_advisory_xact_lock(hashtext('friends_cap'), hashtext(v_high::text));
  ELSE
    PERFORM pg_advisory_xact_lock(hashtext('friends_cap'), hashtext(v_high::text));
    PERFORM pg_advisory_xact_lock(hashtext('friends_cap'), hashtext(v_low::text));
  END IF;

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
    -- Serialize concurrent accepts that share a participant (ascending key order =
    -- deadlock-free) so the cap count-then-write below cannot be raced past 50.
    IF hashtext(v_low::text) <= hashtext(v_high::text) THEN
      PERFORM pg_advisory_xact_lock(hashtext('friends_cap'), hashtext(v_low::text));
      PERFORM pg_advisory_xact_lock(hashtext('friends_cap'), hashtext(v_high::text));
    ELSE
      PERFORM pg_advisory_xact_lock(hashtext('friends_cap'), hashtext(v_high::text));
      PERFORM pg_advisory_xact_lock(hashtext('friends_cap'), hashtext(v_low::text));
    END IF;

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
