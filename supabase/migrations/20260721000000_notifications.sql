-- Notifications foundation: one typed, durable inbox for every social event.
-- Apply this migration against the RetroFight Supabase project.
--
-- Why this exists: until now the only live social signals were `friends:changed`
-- (consumed solely by the Friends page) and the transient challenge handshake. An
-- event that arrives while the user is anywhere else in the app was simply lost.
-- This table is the durable half of the model; Socket.IO stays the transient half.
--
-- Design invariants (kept in ONE place so no future producer can bypass them):
--   * A notification is addressed to exactly ONE recipient (user_id). Fan-out to
--     several users = several rows, so read state is naturally per-user.
--   * `kind` is a closed vocabulary (CHECK). Adding a producer = extend the CHECK
--     in a new migration; that is deliberate, so an unknown kind can never reach a
--     client that has no renderer for it.
--   * `payload` carries only kind-specific EXTRA data. Actor identity is NOT
--     duplicated into it -- it is joined live from profiles at read time, so a
--     renamed player is never stale in the inbox.
--   * The table is READ via RLS (own rows only). All WRITES go through the
--     SECURITY DEFINER RPCs / triggers below; no INSERT/UPDATE/DELETE policy is
--     granted to regular users, so a client cannot forge or mark someone else's.
--   * Producers are TRIGGERS on the source-of-truth table, never hand-written
--     calls inside each RPC: the friends RPCs have already been rewritten twice
--     (cap, cap lock), and a copy of the insert in each body would rot.

-- ─── notifications ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind       TEXT        NOT NULL,
  actor_id   UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  payload    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at    TIMESTAMPTZ,
  CONSTRAINT notifications_kind_check
    CHECK (kind IN ('friend_request', 'friend_request_accepted')),
  CONSTRAINT notifications_no_self CHECK (actor_id IS NULL OR actor_id <> user_id)
);

-- The inbox query: newest first for one recipient.
CREATE INDEX IF NOT EXISTS notifications_inbox_idx
  ON notifications (user_id, created_at DESC);

-- The badge query: unread only, for one recipient.
CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON notifications (user_id)
  WHERE read_at IS NULL;

-- An ACTIONABLE notification is one the user is expected to answer, and there can
-- only ever be one live instance of it per (recipient, actor): a second pending
-- friend request from the same person is the same fact, not a new one. Enforced
-- structurally so the producer can stay a plain ON CONFLICT DO NOTHING insert.
CREATE UNIQUE INDEX IF NOT EXISTS notifications_actionable_unique_idx
  ON notifications (user_id, kind, actor_id)
  WHERE kind = 'friend_request';

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Recipients read their own inbox. Writes go through RPCs/triggers only.
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_own_select" ON notifications;
CREATE POLICY "notifications_own_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- ═══ Producer plumbing ═══════════════════════════════════════════════════════

-- Single insert path for every producer. Keeps the retention trim in one place:
-- an inbox is a tail, not an archive, so each write drops anything past the most
-- recent c_max_per_user rows for that recipient. Bounded work (the trim only runs
-- when the user is already over the cap) and it makes the table self-limiting
-- without a scheduled job.
CREATE OR REPLACE FUNCTION push_notification(
  p_user_id  UUID,
  p_kind     TEXT,
  p_actor_id UUID,
  p_payload  JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  c_max_per_user CONSTANT INTEGER := 100;
BEGIN
  IF p_user_id IS NULL OR p_actor_id = p_user_id THEN
    RETURN;                                    -- never notify a user about themselves
  END IF;

  INSERT INTO notifications (user_id, kind, actor_id, payload)
  VALUES (p_user_id, p_kind, p_actor_id, COALESCE(p_payload, '{}'::jsonb))
  ON CONFLICT DO NOTHING;                      -- duplicate actionable item: keep the first

  DELETE FROM notifications n
  WHERE n.user_id = p_user_id
    AND n.id NOT IN (
      SELECT id FROM notifications
      WHERE user_id = p_user_id
      ORDER BY created_at DESC, id
      LIMIT c_max_per_user
    );
END;
$$;

-- Friend-graph producer. Attached to `friendships` rather than called from inside
-- send_friend_request / respond_friend_request, so EVERY path that creates or
-- accepts an edge is covered by construction -- including the mutual-consent
-- branch of send_friend_request, which accepts without going through respond.
--
-- The addressee of a pending request is whichever participant is NOT requested_by;
-- symmetrically, the accepter of a pending edge is the participant that is NOT
-- requested_by, so both sides are derivable from the row alone.
CREATE OR REPLACE FUNCTION notify_friendship_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_addressee UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'pending' THEN
      v_addressee := CASE WHEN NEW.requested_by = NEW.user_low THEN NEW.user_high ELSE NEW.user_low END;
      PERFORM push_notification(v_addressee, 'friend_request', NEW.requested_by);
    END IF;
    RETURN NULL;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- The accepter is the non-requester; tell the requester their request landed.
    v_addressee := CASE WHEN NEW.requested_by = NEW.user_low THEN NEW.user_high ELSE NEW.user_low END;
    PERFORM push_notification(NEW.requested_by, 'friend_request_accepted', v_addressee);
    -- The invitation itself is no longer actionable: drop it instead of leaving a
    -- dead "Accept / Decline" row in the accepter's inbox.
    DELETE FROM notifications
    WHERE kind = 'friend_request'
      AND user_id = v_addressee AND actor_id = NEW.requested_by;
    RETURN NULL;
  END IF;

  RETURN NULL;
END;
$$;

-- Decline / cancel / unfriend / block all DELETE the row (see the friends
-- foundation migration), which must also retract the pending invitation.
CREATE OR REPLACE FUNCTION notify_friendship_removed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_addressee UUID;
BEGIN
  IF OLD.status = 'pending' THEN
    v_addressee := CASE WHEN OLD.requested_by = OLD.user_low THEN OLD.user_high ELSE OLD.user_low END;
    DELETE FROM notifications
    WHERE kind = 'friend_request'
      AND user_id = v_addressee AND actor_id = OLD.requested_by;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS friendships_notify_change ON friendships;
CREATE TRIGGER friendships_notify_change
  AFTER INSERT OR UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION notify_friendship_change();

DROP TRIGGER IF EXISTS friendships_notify_removed ON friendships;
CREATE TRIGGER friendships_notify_removed
  AFTER DELETE ON friendships
  FOR EACH ROW EXECUTE FUNCTION notify_friendship_removed();

-- ═══ Read / write RPCs ═══════════════════════════════════════════════════════
-- Same model as the friends RPCs: SECURITY DEFINER, actor derived from auth.uid(),
-- so a caller can only ever touch their own inbox.

-- The inbox, newest first, joined to the actor's profile so the client needs a
-- single round-trip. total_count is the pre-pagination count for the chosen
-- filter and unread_count is always the FULL unread total (the badge must not
-- change meaning when the user pages), both repeated on every row.
CREATE OR REPLACE FUNCTION list_notifications(
  p_limit       INTEGER DEFAULT 25,
  p_offset      INTEGER DEFAULT 0,
  p_unread_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id            UUID,
  kind          TEXT,
  actor_id      UUID,
  actor_name    TEXT,
  actor_avatar  TEXT,
  actor_country CHAR(2),
  payload       JSONB,
  created_at    TIMESTAMPTZ,
  read_at       TIMESTAMPTZ,
  total_count   BIGINT,
  unread_count  BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH rows AS (
    SELECT
      n.id, n.kind, n.actor_id,
      p.display_name AS actor_name,
      p.avatar_url   AS actor_avatar,
      p.country      AS actor_country,
      n.payload, n.created_at, n.read_at
    FROM notifications n
    LEFT JOIN profiles p ON p.id = n.actor_id
    WHERE n.user_id = auth.uid()
      AND (NOT COALESCE(p_unread_only, FALSE) OR n.read_at IS NULL)
  )
  SELECT
    r.id, r.kind, r.actor_id, r.actor_name, r.actor_avatar, r.actor_country,
    r.payload, r.created_at, r.read_at,
    COUNT(*) OVER() AS total_count,
    (SELECT COUNT(*) FROM notifications u
      WHERE u.user_id = auth.uid() AND u.read_at IS NULL) AS unread_count
  FROM rows r
  ORDER BY r.created_at DESC, r.id
  LIMIT  LEAST(GREATEST(COALESCE(p_limit, 25), 1), 50)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

-- Badge-only read: the tray needs the count on login without paying for the list.
CREATE OR REPLACE FUNCTION count_unread_notifications()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COUNT(*) FROM notifications
  WHERE user_id = auth.uid() AND read_at IS NULL;
$$;

-- Mark specific rows read. Returns the remaining unread count so the client can
-- update the badge from the same round-trip. Idempotent; ids that are not the
-- caller's are silently ignored (never a 404 that would confirm they exist).
CREATE OR REPLACE FUNCTION mark_notifications_read(p_ids UUID[])
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE notifications
  SET read_at = NOW()
  WHERE user_id = auth.uid()
    AND read_at IS NULL
    AND id = ANY((COALESCE(p_ids, '{}'::uuid[]))[1:100]);

  RETURN (SELECT COUNT(*) FROM notifications
          WHERE user_id = auth.uid() AND read_at IS NULL);
END;
$$;

-- "Mark all read" from the tray header. Returns 0 (the new unread count) for
-- symmetry with mark_notifications_read.
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE notifications SET read_at = NOW()
  WHERE user_id = auth.uid() AND read_at IS NULL;

  RETURN 0;
END;
$$;

-- Remove one row from the caller's own inbox (the tray's per-row dismiss).
CREATE OR REPLACE FUNCTION dismiss_notification(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  DELETE FROM notifications WHERE id = p_id AND user_id = auth.uid();
END;
$$;

-- ─── Backfill ────────────────────────────────────────────────────────────────
-- Existing pending requests predate the triggers, so their addressees would never
-- see them in the tray. Seed one actionable row per live pending edge.
INSERT INTO notifications (user_id, kind, actor_id, created_at)
SELECT
  CASE WHEN f.requested_by = f.user_low THEN f.user_high ELSE f.user_low END,
  'friend_request',
  f.requested_by,
  f.created_at
FROM friendships f
WHERE f.status = 'pending'
ON CONFLICT DO NOTHING;

-- ─── Grants ──────────────────────────────────────────────────────────────────
-- push_notification is producer-side only: triggers run as the definer, so no
-- client role needs EXECUTE on it (granting it would let a user forge an inbox
-- entry for anyone).
REVOKE ALL ON FUNCTION push_notification(UUID, TEXT, UUID, JSONB)      FROM PUBLIC;
REVOKE ALL ON FUNCTION list_notifications(INTEGER, INTEGER, BOOLEAN)   FROM PUBLIC;
REVOKE ALL ON FUNCTION count_unread_notifications()                    FROM PUBLIC;
REVOKE ALL ON FUNCTION mark_notifications_read(UUID[])                 FROM PUBLIC;
REVOKE ALL ON FUNCTION mark_all_notifications_read()                   FROM PUBLIC;
REVOKE ALL ON FUNCTION dismiss_notification(UUID)                      FROM PUBLIC;

GRANT EXECUTE ON FUNCTION push_notification(UUID, TEXT, UUID, JSONB)    TO service_role;
GRANT EXECUTE ON FUNCTION list_notifications(INTEGER, INTEGER, BOOLEAN) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION count_unread_notifications()                  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_notifications_read(UUID[])               TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read()                 TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION dismiss_notification(UUID)                    TO authenticated, service_role;
