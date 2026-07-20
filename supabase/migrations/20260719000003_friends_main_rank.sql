-- Friends rank badge: expose each player's "main" game rank on the friend lists.
-- Apply this migration against the RetroFight Supabase project (after friends_pagination).
--
-- Problem: a friend row has no game context, so there is no single honest rank to
-- show -- averaging across games would be meaningless. Fighting-game players have a
-- MAIN, and player_game_ratings already encodes it: the row with the most matches.
--
-- Rule: show the rank of the game the context knows (the challenge banner already
-- does, the game is known there); where there is NO context, show the main AND name
-- the game, so the badge reads "S · 1610 · SFA3" instead of a context-free number.
--
-- The main is the (player, game) row with the most total_matches, tie-broken by the
-- most recent last_match_at. Scoped to season_id IS NULL, which is the all-time row
-- the rest of the UI displays (fetchPlayerDisplayRating/VisibleRank read the same),
-- and requires total_matches > 0 so a player with no ranked match has NO main and
-- the client renders "New" rather than inventing a rank.
--
-- Honesty note: main_rating/main_rank come from the actual row or are NULL -- never
-- an INITIAL_RATING fallback. This keeps the badge free of the 1500 ambiguity fixed
-- server-side in RANKING_FALLBACKS_PLAN.md, which would otherwise be multiplied
-- across every row of the list.
--
-- Both functions change their return type, so they must be dropped and recreated
-- (CREATE OR REPLACE cannot change OUT columns); grants are re-applied below.

DROP FUNCTION IF EXISTS get_friend_profiles(UUID[]);
DROP FUNCTION IF EXISTS list_friends(INTEGER, INTEGER, TEXT);

-- ─── get_friend_profiles: hydration for the presence-driven Online view ──────────
CREATE OR REPLACE FUNCTION get_friend_profiles(p_ids UUID[])
RETURNS TABLE (
  id           UUID,
  display_name TEXT,
  avatar_url   TEXT,
  country      CHAR(2),
  main_game    TEXT,
  main_rank    INTEGER,
  main_rating  INTEGER,
  main_matches INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    p.id, p.display_name, p.avatar_url, p.country,
    m.game, m.visible_rank::INTEGER, ROUND(m.rating)::INTEGER, m.total_matches
  FROM profiles p
  JOIN friendships f
    ON f.status = 'accepted'
   AND (
        (f.user_low = auth.uid() AND f.user_high = p.id)
     OR (f.user_high = auth.uid() AND f.user_low = p.id)
   )
  LEFT JOIN LATERAL (
    SELECT r.game, r.visible_rank, r.rating, r.total_matches
    FROM player_game_ratings r
    WHERE r.player_id = p.id
      AND r.season_id IS NULL
      AND r.total_matches > 0
    ORDER BY r.total_matches DESC, r.last_match_at DESC NULLS LAST
    LIMIT 1
  ) m ON TRUE
  WHERE p.id = ANY((COALESCE(p_ids, '{}'::uuid[]))[1:60]);
$$;

-- ─── list_friends: paginated management list, same badge data ────────────────────
-- The main lookup is applied AFTER pagination (the `page` CTE) so it runs once per
-- returned row, not once per relationship. total_count still uses a window function
-- inside `page`, which is evaluated before LIMIT/OFFSET, so it stays the full count.
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
  total_count  BIGINT,
  main_game    TEXT,
  main_rank    INTEGER,
  main_rating  INTEGER,
  main_matches INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH matched AS (
    SELECT
      CASE WHEN f.user_low = auth.uid() THEN f.user_high ELSE f.user_low END AS friend_id,
      pr.display_name,
      pr.avatar_url,
      pr.country,
      f.status,
      CASE
        WHEN f.status = 'accepted'        THEN 'accepted'
        WHEN f.requested_by = auth.uid()  THEN 'outgoing'
        ELSE 'incoming'
      END AS direction,
      f.updated_at AS since
    FROM friendships f
    JOIN profiles pr
      ON pr.id = CASE WHEN f.user_low = auth.uid() THEN f.user_high ELSE f.user_low END
    WHERE (f.user_low = auth.uid() OR f.user_high = auth.uid())
      AND CASE COALESCE(NULLIF(TRIM(LOWER(p_filter)), ''), 'all')
            WHEN 'accepted' THEN f.status = 'accepted'
            WHEN 'incoming' THEN f.status = 'pending' AND f.requested_by <> auth.uid()
            WHEN 'outgoing' THEN f.status = 'pending' AND f.requested_by =  auth.uid()
            ELSE TRUE
          END
  ),
  page AS (
    SELECT m.*, COUNT(*) OVER() AS total_count
    FROM matched m
    ORDER BY m.status, m.display_name
    LIMIT  LEAST(GREATEST(COALESCE(p_limit, 25), 1), 50)
    OFFSET GREATEST(COALESCE(p_offset, 0), 0)
  )
  SELECT
    pp.friend_id, pp.display_name, pp.avatar_url, pp.country,
    pp.status, pp.direction, pp.since, pp.total_count,
    mr.game, mr.visible_rank::INTEGER, ROUND(mr.rating)::INTEGER, mr.total_matches
  FROM page pp
  LEFT JOIN LATERAL (
    SELECT r.game, r.visible_rank, r.rating, r.total_matches
    FROM player_game_ratings r
    WHERE r.player_id = pp.friend_id
      AND r.season_id IS NULL
      AND r.total_matches > 0
    ORDER BY r.total_matches DESC, r.last_match_at DESC NULLS LAST
    LIMIT 1
  ) mr ON TRUE
  ORDER BY pp.status, pp.display_name;
$$;

-- ─── Grants (re-applied: DROP removed the previous ACLs) ─────────────────────────
REVOKE ALL ON FUNCTION get_friend_profiles(UUID[])          FROM PUBLIC;
REVOKE ALL ON FUNCTION list_friends(INTEGER, INTEGER, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION get_friend_profiles(UUID[])          TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION list_friends(INTEGER, INTEGER, TEXT) TO authenticated, service_role;
