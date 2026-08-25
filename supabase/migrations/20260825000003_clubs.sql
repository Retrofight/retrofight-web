-- Clubs: named groups a player belongs to, with a composed emblem.
-- Apply after 20260825000002_player_profile.sql.
--
-- The point of a club is that it is CHEAP to create. A player should get a
-- recognisable badge out of a few choices, not out of an art pipeline -- so the
-- emblem is composed from preset keys (shape + symbol + two palette colours) and
-- rendered as SVG on the client. Nothing is uploaded, so there is nothing to
-- moderate, no storage to police, and no way for one club to look like a real
-- brand it is not.
--
-- Preset keys are validated by SHAPE here, not by an enumerated list. An
-- enumerated CHECK would mean a migration every time an artist adds a symbol, and
-- the failure mode of an unknown key is already graceful: the client falls back to
-- its default for that slot. A key it does not recognise renders as a plain badge,
-- which is a cosmetic miss, not a broken row.
--
-- Membership is multiple by design (a player follows more than one scene), but
-- capped -- see the caps below. Joining is open or closed for now; INVITES are
-- deliberately not in this migration, because an invite is an inbox event and that
-- pulls the whole notification vocabulary in with it. A club is created open,
-- fills up, and the owner closes it.

-- ─── clubs ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clubs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Short handle shown next to a player's name. Uppercase so it reads as a tag
  -- rather than a word, and unique so two clubs never wear the same one.
  tag           TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  description   TEXT        NOT NULL DEFAULT '',
  -- Composed emblem. Keys, never URLs: see the header.
  emblem_shape  TEXT        NOT NULL DEFAULT 'shield',
  emblem_symbol TEXT        NOT NULL DEFAULT 'fist',
  emblem_fg     TEXT        NOT NULL DEFAULT 'gold',
  emblem_bg     TEXT        NOT NULL DEFAULT 'crimson',
  banner        TEXT        NOT NULL DEFAULT 'grid',
  join_policy   TEXT        NOT NULL DEFAULT 'open',
  owner_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Denormalised so a browse list does not count members per row. Maintained by
  -- the trigger below; never written by hand.
  member_count  INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT clubs_tag_format   CHECK (tag ~ '^[A-Z0-9]{2,5}$'),
  CONSTRAINT clubs_name_length  CHECK (LENGTH(name) BETWEEN 3 AND 32),
  CONSTRAINT clubs_desc_length  CHECK (LENGTH(description) <= 200),
  CONSTRAINT clubs_join_policy  CHECK (join_policy IN ('open', 'closed')),
  CONSTRAINT clubs_emblem_keys  CHECK (
    emblem_shape  ~ '^[a-z0-9-]{1,24}$' AND
    emblem_symbol ~ '^[a-z0-9-]{1,24}$' AND
    emblem_fg     ~ '^[a-z0-9-]{1,24}$' AND
    emblem_bg     ~ '^[a-z0-9-]{1,24}$' AND
    banner        ~ '^[a-z0-9-]{1,24}$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS clubs_tag_unique ON clubs (tag);
-- Names are compared case-insensitively: two clubs called "Shoryuken" and
-- "SHORYUKEN" are the same name to a reader.
CREATE UNIQUE INDEX IF NOT EXISTS clubs_name_unique ON clubs (LOWER(name));
CREATE INDEX IF NOT EXISTS clubs_browse_idx ON clubs (member_count DESC, created_at DESC);

DROP TRIGGER IF EXISTS clubs_updated_at ON clubs;
CREATE TRIGGER clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── club_members ────────────────────────────────────────────────────────────
-- role: 'owner' (exactly one, enforced below) | 'officer' | 'member'.
CREATE TABLE IF NOT EXISTS club_members (
  club_id   UUID        NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  player_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT        NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (club_id, player_id),
  CONSTRAINT club_members_role CHECK (role IN ('owner', 'officer', 'member'))
);

CREATE INDEX IF NOT EXISTS club_members_player_idx ON club_members (player_id);

-- One owner per club, structurally. Ownership transfer therefore has to demote the
-- old owner and promote the new one in the same statement (see the RPC).
CREATE UNIQUE INDEX IF NOT EXISTS club_members_single_owner
  ON club_members (club_id)
  WHERE role = 'owner';

-- ─── Caps and the member counter ─────────────────────────────────────────────
-- Two triggers, not one, and the split is load-bearing.
--
-- The cap check has to run BEFORE the insert so it can reject. The counter has to
-- run AFTER, because join_club inserts with ON CONFLICT DO NOTHING: a BEFORE
-- trigger fires before the uniqueness check, so a duplicate join would bump the
-- count for a row that never lands, and the count would drift up forever.
CREATE OR REPLACE FUNCTION check_club_membership_caps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_max_members CONSTANT INTEGER := 100;
  c_max_clubs   CONSTANT INTEGER := 5;
  v_members INTEGER;
  v_clubs   INTEGER;
BEGIN
  -- Lock the club row so two concurrent joins cannot both read a count one under
  -- the cap and both pass. Same reason the friends cap takes a lock.
  PERFORM 1 FROM clubs WHERE id = NEW.club_id FOR UPDATE;

  SELECT COUNT(*) INTO v_members FROM club_members WHERE club_id = NEW.club_id;
  IF v_members >= c_max_members THEN
    RAISE EXCEPTION 'club_full';
  END IF;

  SELECT COUNT(*) INTO v_clubs FROM club_members WHERE player_id = NEW.player_id;
  IF v_clubs >= c_max_clubs THEN
    RAISE EXCEPTION 'club_limit_reached';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_club_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
    RETURN NEW;
  END IF;
  UPDATE clubs SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.club_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS club_members_enforce ON club_members;
DROP TRIGGER IF EXISTS club_members_caps ON club_members;
CREATE TRIGGER club_members_caps
  BEFORE INSERT ON club_members
  FOR EACH ROW EXECUTE FUNCTION check_club_membership_caps();

DROP TRIGGER IF EXISTS club_members_count ON club_members;
CREATE TRIGGER club_members_count
  AFTER INSERT OR DELETE ON club_members
  FOR EACH ROW EXECUTE FUNCTION sync_club_member_count();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Clubs are a public directory: the whole point is being found and joined. Writes
-- go through the SECURITY DEFINER RPCs below, which is where the role checks live
-- -- a policy cannot express "an officer may kick a member but not another
-- officer".
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clubs_public_select" ON clubs;
CREATE POLICY "clubs_public_select" ON clubs FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "club_members_public_select" ON club_members;
CREATE POLICY "club_members_public_select" ON club_members FOR SELECT USING (TRUE);

-- ═══ RPCs ════════════════════════════════════════════════════════════════════

-- Creating a club makes you its owner in the same transaction: a club with no
-- owner is not a state the rest of the code should ever have to handle.
CREATE OR REPLACE FUNCTION create_club(
  p_tag         TEXT,
  p_name        TEXT,
  p_description TEXT DEFAULT '',
  p_shape       TEXT DEFAULT 'shield',
  p_symbol      TEXT DEFAULT 'fist',
  p_fg          TEXT DEFAULT 'gold',
  p_bg          TEXT DEFAULT 'crimson',
  p_banner      TEXT DEFAULT 'grid',
  p_join_policy TEXT DEFAULT 'open'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO clubs (tag, name, description, emblem_shape, emblem_symbol,
                     emblem_fg, emblem_bg, banner, join_policy, owner_id)
  VALUES (
    UPPER(TRIM(COALESCE(p_tag, ''))),
    REGEXP_REPLACE(TRIM(COALESCE(p_name, '')), '\s+', ' ', 'g'),
    TRIM(COALESCE(p_description, '')),
    p_shape, p_symbol, p_fg, p_bg, p_banner,
    COALESCE(p_join_policy, 'open'),
    auth.uid()
  )
  RETURNING id INTO v_id;

  -- The cap trigger runs here too, so creating a sixth club fails the same way
  -- joining one would.
  INSERT INTO club_members (club_id, player_id, role)
  VALUES (v_id, auth.uid(), 'owner');

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION join_club(p_club_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_policy TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT join_policy INTO v_policy FROM clubs WHERE id = p_club_id;
  IF v_policy IS NULL THEN
    RAISE EXCEPTION 'club_not_found';
  END IF;
  IF v_policy <> 'open' THEN
    RAISE EXCEPTION 'club_closed';
  END IF;

  -- Already a member is not an error: the button that sent this was drawn from a
  -- list that may be a few seconds stale.
  INSERT INTO club_members (club_id, player_id, role)
  VALUES (p_club_id, auth.uid(), 'member')
  ON CONFLICT DO NOTHING;
END;
$$;

-- Leaving is always allowed EXCEPT for the owner, who would leave the club without
-- one. Transfer first, or disband.
CREATE OR REPLACE FUNCTION leave_club(p_club_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM club_members
  WHERE club_id = p_club_id AND player_id = auth.uid();

  IF v_role IS NULL THEN
    RETURN;                                   -- not a member: nothing to leave
  END IF;
  IF v_role = 'owner' THEN
    RAISE EXCEPTION 'owner_must_transfer';
  END IF;

  DELETE FROM club_members WHERE club_id = p_club_id AND player_id = auth.uid();
END;
$$;

-- An owner may remove anyone; an officer may remove plain members only. Neither
-- may remove the owner, which is what keeps a club from being taken over.
CREATE OR REPLACE FUNCTION remove_club_member(p_club_id UUID, p_player_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor_role  TEXT;
  v_target_role TEXT;
BEGIN
  SELECT role INTO v_actor_role FROM club_members
  WHERE club_id = p_club_id AND player_id = auth.uid();
  SELECT role INTO v_target_role FROM club_members
  WHERE club_id = p_club_id AND player_id = p_player_id;

  IF v_target_role IS NULL THEN
    RETURN;
  END IF;
  IF v_actor_role IS NULL OR v_actor_role = 'member' THEN
    RAISE EXCEPTION 'not_permitted';
  END IF;
  IF v_target_role = 'owner' THEN
    RAISE EXCEPTION 'not_permitted';
  END IF;
  IF v_actor_role = 'officer' AND v_target_role <> 'member' THEN
    RAISE EXCEPTION 'not_permitted';
  END IF;

  DELETE FROM club_members WHERE club_id = p_club_id AND player_id = p_player_id;
END;
$$;

-- Promote/demote between officer and member. The owner's own role is not settable
-- here: it moves only through a transfer, so the single-owner index can never be
-- violated by a role edit.
CREATE OR REPLACE FUNCTION set_club_role(p_club_id UUID, p_player_id UUID, p_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor_role TEXT;
BEGIN
  IF p_role NOT IN ('officer', 'member') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  SELECT role INTO v_actor_role FROM club_members
  WHERE club_id = p_club_id AND player_id = auth.uid();

  IF v_actor_role IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'not_permitted';
  END IF;

  UPDATE club_members SET role = p_role
  WHERE club_id = p_club_id AND player_id = p_player_id AND role <> 'owner';
END;
$$;

-- Demote the old owner and promote the new one together, because the single-owner
-- index means neither half is valid on its own.
CREATE OR REPLACE FUNCTION transfer_club_ownership(p_club_id UUID, p_player_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = p_club_id AND player_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'not_permitted';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM club_members WHERE club_id = p_club_id AND player_id = p_player_id
  ) THEN
    RAISE EXCEPTION 'not_a_member';
  END IF;

  UPDATE club_members SET role = 'officer'
  WHERE club_id = p_club_id AND player_id = auth.uid();
  UPDATE club_members SET role = 'owner'
  WHERE club_id = p_club_id AND player_id = p_player_id;
  UPDATE clubs SET owner_id = p_player_id WHERE id = p_club_id;
END;
$$;

-- Disbanding is the owner's alone. The cascade takes the memberships with it.
CREATE OR REPLACE FUNCTION disband_club(p_club_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = p_club_id AND player_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'not_permitted';
  END IF;

  DELETE FROM clubs WHERE id = p_club_id;
END;
$$;

-- Owner or officer may edit the presentation; only the owner may change who can
-- join. NULL means "leave it alone", so a form that edits one field does not have
-- to send the rest back.
CREATE OR REPLACE FUNCTION update_club(
  p_club_id     UUID,
  p_name        TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_shape       TEXT DEFAULT NULL,
  p_symbol      TEXT DEFAULT NULL,
  p_fg          TEXT DEFAULT NULL,
  p_bg          TEXT DEFAULT NULL,
  p_banner      TEXT DEFAULT NULL,
  p_join_policy TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM club_members
  WHERE club_id = p_club_id AND player_id = auth.uid();

  IF v_role IS NULL OR v_role = 'member' THEN
    RAISE EXCEPTION 'not_permitted';
  END IF;
  IF p_join_policy IS NOT NULL AND v_role <> 'owner' THEN
    RAISE EXCEPTION 'not_permitted';
  END IF;

  UPDATE clubs SET
    name          = COALESCE(REGEXP_REPLACE(TRIM(p_name), '\s+', ' ', 'g'), name),
    description   = COALESCE(TRIM(p_description), description),
    emblem_shape  = COALESCE(p_shape, emblem_shape),
    emblem_symbol = COALESCE(p_symbol, emblem_symbol),
    emblem_fg     = COALESCE(p_fg, emblem_fg),
    emblem_bg     = COALESCE(p_bg, emblem_bg),
    banner        = COALESCE(p_banner, banner),
    join_policy   = COALESCE(p_join_policy, join_policy)
  WHERE id = p_club_id;
END;
$$;

-- ─── Reads ───────────────────────────────────────────────────────────────────

-- The clubs the caller belongs to, with their own role in each.
CREATE OR REPLACE FUNCTION list_my_clubs()
RETURNS TABLE (
  id           UUID,
  tag          TEXT,
  name         TEXT,
  emblem_shape TEXT,
  emblem_symbol TEXT,
  emblem_fg    TEXT,
  emblem_bg    TEXT,
  banner       TEXT,
  member_count INTEGER,
  my_role      TEXT,
  joined_at    TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT c.id, c.tag, c.name, c.emblem_shape, c.emblem_symbol, c.emblem_fg,
         c.emblem_bg, c.banner, c.member_count, m.role, m.joined_at
  FROM club_members m
  JOIN clubs c ON c.id = m.club_id
  WHERE m.player_id = auth.uid()
  ORDER BY m.joined_at;
$$;

-- The public directory. An empty query lists the busiest clubs, which is the right
-- default: a club worth joining is one that has people in it.
CREATE OR REPLACE FUNCTION browse_clubs(
  p_query  TEXT    DEFAULT NULL,
  p_limit  INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id            UUID,
  tag           TEXT,
  name          TEXT,
  description   TEXT,
  emblem_shape  TEXT,
  emblem_symbol TEXT,
  emblem_fg     TEXT,
  emblem_bg     TEXT,
  banner        TEXT,
  join_policy   TEXT,
  member_count  INTEGER,
  is_member     BOOLEAN,
  total_count   BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH matched AS (
    SELECT c.*
    FROM clubs c
    WHERE COALESCE(NULLIF(TRIM(p_query), ''), '') = ''
       OR c.name ILIKE '%' || TRIM(p_query) || '%'
       OR c.tag  ILIKE '%' || TRIM(p_query) || '%'
  )
  SELECT
    m.id, m.tag, m.name, m.description, m.emblem_shape, m.emblem_symbol,
    m.emblem_fg, m.emblem_bg, m.banner, m.join_policy, m.member_count,
    EXISTS (SELECT 1 FROM club_members cm WHERE cm.club_id = m.id AND cm.player_id = auth.uid()),
    COUNT(*) OVER()
  FROM matched m
  ORDER BY m.member_count DESC, m.created_at DESC
  LIMIT  LEAST(GREATEST(COALESCE(p_limit, 25), 1), 50)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

-- One club with its roster folded in, plus the caller's own role, so the page
-- knows in one call what it may offer.
CREATE OR REPLACE FUNCTION get_club(p_club_id UUID)
RETURNS TABLE (
  id            UUID,
  tag           TEXT,
  name          TEXT,
  description   TEXT,
  emblem_shape  TEXT,
  emblem_symbol TEXT,
  emblem_fg     TEXT,
  emblem_bg     TEXT,
  banner        TEXT,
  join_policy   TEXT,
  member_count  INTEGER,
  created_at    TIMESTAMPTZ,
  my_role       TEXT,
  members       JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    c.id, c.tag, c.name, c.description, c.emblem_shape, c.emblem_symbol,
    c.emblem_fg, c.emblem_bg, c.banner, c.join_policy, c.member_count, c.created_at,
    (SELECT cm.role FROM club_members cm WHERE cm.club_id = c.id AND cm.player_id = auth.uid()),
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'player_id', m.player_id,
          'role', m.role,
          'joined_at', m.joined_at,
          'display_name', p.display_name,
          'country', p.country,
          'main_game', r.game,
          'main_lp', r.lp
        )
        -- Owner first, then officers, then members by seniority: the roster reads
        -- as a hierarchy rather than as an arbitrary list.
        ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'officer' THEN 1 ELSE 2 END, m.joined_at
      )
      FROM club_members m
      JOIN profiles p ON p.id = m.player_id
      LEFT JOIN LATERAL (
        SELECT pgr.game, pgr.lp
        FROM player_game_ratings pgr
        WHERE pgr.player_id = m.player_id
          AND pgr.season_id IS NULL
          AND pgr.total_matches > 0
        ORDER BY pgr.total_matches DESC, pgr.last_match_at DESC NULLS LAST
        LIMIT 1
      ) r ON TRUE
      WHERE m.club_id = c.id
    ), '[]'::jsonb)
  FROM clubs c
  WHERE c.id = p_club_id;
$$;

-- ─── Grants ──────────────────────────────────────────────────────────────────
DO $$
DECLARE
  fn TEXT;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'create_club(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)',
    'join_club(UUID)',
    'leave_club(UUID)',
    'remove_club_member(UUID, UUID)',
    'set_club_role(UUID, UUID, TEXT)',
    'transfer_club_ownership(UUID, UUID)',
    'disband_club(UUID)',
    'update_club(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)',
    'list_my_clubs()',
    'browse_clubs(TEXT, INTEGER, INTEGER)',
    'get_club(UUID)'
  ] LOOP
    EXECUTE FORMAT('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE FORMAT('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
  END LOOP;
END;
$$;
