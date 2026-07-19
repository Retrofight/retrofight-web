-- Friends inversion: paginated/filtered management list + presence-driven hydration.
-- Apply this migration against the RetroFight Supabase project.
--
-- Two access patterns, split so the main "Online" view never depends on the total
-- friend-list size:
--   * get_friend_profiles(ids[]) -- hydrate ONLY the presence-supplied online ids
--     (bounded by who is online), used by the main view. RLS-safe: it returns a
--     profile only when it is an ACCEPTED friend of the caller, so it cannot be
--     used to hydrate arbitrary users.
--   * list_friends(limit, offset, filter) -- the paginated management view, the
--     only place that walks the whole relationship set. Carries total_count so the
--     client can render pagination without a second round-trip.

-- ─── list_friends: now paginated + filtered ─────────────────────────────────────
-- Replaces the zero-arg version. filter ∈ ('all','accepted','incoming','outgoing').
-- 'incoming'/'outgoing' select PENDING requests by direction; 'accepted' the friends;
-- 'all' everything (default). total_count is the pre-pagination row count for the
-- chosen filter, repeated on every row via a window function.
DROP FUNCTION IF EXISTS list_friends();

CREATE OR REPLACE FUNCTION list_friends(
  p_limit  INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0,
  p_filter TEXT    DEFAULT 'all'
)
RETURNS TABLE (
  friend_id    UUID,
  display_name TEXT,
  avatar_url   TEXT,
  country      CHAR(2),
  status       TEXT,
  direction    TEXT,
  since        TIMESTAMPTZ,
  total_count  BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH rows AS (
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
    WHERE (f.user_low = auth.uid() OR f.user_high = auth.uid())
      AND CASE COALESCE(NULLIF(TRIM(LOWER(p_filter)), ''), 'all')
            WHEN 'accepted' THEN f.status = 'accepted'
            WHEN 'incoming' THEN f.status = 'pending' AND f.requested_by <> auth.uid()
            WHEN 'outgoing' THEN f.status = 'pending' AND f.requested_by =  auth.uid()
            ELSE TRUE
          END
  )
  SELECT
    r.friend_id, r.display_name, r.avatar_url, r.country, r.status, r.direction, r.since,
    COUNT(*) OVER() AS total_count
  FROM rows r
  ORDER BY r.status, r.display_name
  LIMIT  LEAST(GREATEST(COALESCE(p_limit, 25), 1), 50)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

-- ─── get_friend_profiles: RLS-safe hydration of specific ids ─────────────────────
-- Returns profile rows for the given ids, but ONLY for ids that are accepted friends
-- of the caller. Used to hydrate the presence-supplied online-friend ids for the main
-- view, so that view costs O(online friends) instead of O(total friends). The input
-- array is capped so a caller cannot pass an unbounded id list.
CREATE OR REPLACE FUNCTION get_friend_profiles(p_ids UUID[])
RETURNS TABLE (
  id           UUID,
  display_name TEXT,
  avatar_url   TEXT,
  country      CHAR(2)
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.country
  FROM profiles p
  JOIN friendships f
    ON f.status = 'accepted'
   AND (
        (f.user_low = auth.uid() AND f.user_high = p.id)
     OR (f.user_high = auth.uid() AND f.user_low = p.id)
   )
  WHERE p.id = ANY((COALESCE(p_ids, '{}'::uuid[]))[1:60]);
$$;

-- ─── Grants ──────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION list_friends(INTEGER, INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_friend_profiles(UUID[])          FROM PUBLIC;

GRANT EXECUTE ON FUNCTION list_friends(INTEGER, INTEGER, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_friend_profiles(UUID[])          TO authenticated, service_role;
