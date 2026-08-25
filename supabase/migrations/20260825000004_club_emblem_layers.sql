-- Club emblems: more to compose with.
-- Apply after 20260825000003_clubs.sql.
--
-- The first pass gave a badge a shape, a symbol and two colours. That is enough to
-- be unique and not enough to be yours. This adds the layers that make a badge look
-- designed rather than generated:
--
--   emblem_size       how big the symbol is drawn, including a size that
--                     deliberately overflows the shape
--   emblem_backdrop   a layer BEHIND the shape, in the shape's own colour, so it
--                     adds depth without asking for a third colour
--   emblem_gloss      a highlight over everything
--   badge_text*       the club TAG on the badge -- top, middle or bottom, with an
--                     optional ribbon behind it, both colourable
--
-- Same rule as before: these are preset KEYS validated by shape, never by an
-- enumerated list. Enumerating them would mean a migration every time a designer
-- adds a backdrop, and an unknown key already falls back to the client's default
-- for that slot -- a plainer badge, never a broken one.
--
-- Every column has a default that reproduces the CURRENT rendering, so clubs
-- created before this migration keep looking exactly as they did.

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS emblem_size       TEXT NOT NULL DEFAULT 'md',
  ADD COLUMN IF NOT EXISTS emblem_backdrop   TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS emblem_gloss      TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS badge_text        TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS badge_text_color  TEXT NOT NULL DEFAULT 'bone',
  ADD COLUMN IF NOT EXISTS badge_ribbon      TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS badge_ribbon_color TEXT NOT NULL DEFAULT 'ink';

ALTER TABLE clubs DROP CONSTRAINT IF EXISTS clubs_emblem_layer_keys;
ALTER TABLE clubs
  ADD CONSTRAINT clubs_emblem_layer_keys CHECK (
    emblem_size        ~ '^[a-z0-9-]{1,24}$' AND
    emblem_backdrop    ~ '^[a-z0-9-]{1,24}$' AND
    emblem_gloss       ~ '^[a-z0-9-]{1,24}$' AND
    badge_text         ~ '^[a-z0-9-]{1,24}$' AND
    badge_text_color   ~ '^[a-z0-9-]{1,24}$' AND
    badge_ribbon       ~ '^[a-z0-9-]{1,24}$' AND
    badge_ribbon_color ~ '^[a-z0-9-]{1,24}$'
  );

-- ─── create_club ─────────────────────────────────────────────────────────────
-- Adding parameters to a function with defaults would leave the old 9-argument
-- signature callable and resolvable, so an older client and a newer one could pick
-- different overloads. Drop it first: one signature, no ambiguity.
DROP FUNCTION IF EXISTS create_club(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION create_club(
  p_tag          TEXT,
  p_name         TEXT,
  p_description  TEXT DEFAULT '',
  p_shape        TEXT DEFAULT 'shield',
  p_symbol       TEXT DEFAULT 'bolt',
  p_fg           TEXT DEFAULT 'gold',
  p_bg           TEXT DEFAULT 'crimson',
  p_banner       TEXT DEFAULT 'grid',
  p_join_policy  TEXT DEFAULT 'open',
  p_size         TEXT DEFAULT 'md',
  p_backdrop     TEXT DEFAULT 'none',
  p_gloss        TEXT DEFAULT 'none',
  p_text         TEXT DEFAULT 'none',
  p_text_color   TEXT DEFAULT 'bone',
  p_ribbon       TEXT DEFAULT 'none',
  p_ribbon_color TEXT DEFAULT 'ink'
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

  INSERT INTO clubs (
    tag, name, description,
    emblem_shape, emblem_symbol, emblem_fg, emblem_bg, banner,
    emblem_size, emblem_backdrop, emblem_gloss,
    badge_text, badge_text_color, badge_ribbon, badge_ribbon_color,
    join_policy, owner_id
  )
  VALUES (
    UPPER(TRIM(COALESCE(p_tag, ''))),
    REGEXP_REPLACE(TRIM(COALESCE(p_name, '')), '\s+', ' ', 'g'),
    TRIM(COALESCE(p_description, '')),
    COALESCE(p_shape, 'shield'), COALESCE(p_symbol, 'bolt'),
    COALESCE(p_fg, 'gold'), COALESCE(p_bg, 'crimson'), COALESCE(p_banner, 'grid'),
    COALESCE(p_size, 'md'), COALESCE(p_backdrop, 'none'), COALESCE(p_gloss, 'none'),
    COALESCE(p_text, 'none'), COALESCE(p_text_color, 'bone'),
    COALESCE(p_ribbon, 'none'), COALESCE(p_ribbon_color, 'ink'),
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

-- ─── update_club ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS update_club(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION update_club(
  p_club_id      UUID,
  p_name         TEXT DEFAULT NULL,
  p_description  TEXT DEFAULT NULL,
  p_shape        TEXT DEFAULT NULL,
  p_symbol       TEXT DEFAULT NULL,
  p_fg           TEXT DEFAULT NULL,
  p_bg           TEXT DEFAULT NULL,
  p_banner       TEXT DEFAULT NULL,
  p_join_policy  TEXT DEFAULT NULL,
  p_size         TEXT DEFAULT NULL,
  p_backdrop     TEXT DEFAULT NULL,
  p_gloss        TEXT DEFAULT NULL,
  p_text         TEXT DEFAULT NULL,
  p_text_color   TEXT DEFAULT NULL,
  p_ribbon       TEXT DEFAULT NULL,
  p_ribbon_color TEXT DEFAULT NULL
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
    name               = COALESCE(REGEXP_REPLACE(TRIM(p_name), '\s+', ' ', 'g'), name),
    description        = COALESCE(TRIM(p_description), description),
    emblem_shape       = COALESCE(p_shape, emblem_shape),
    emblem_symbol      = COALESCE(p_symbol, emblem_symbol),
    emblem_fg          = COALESCE(p_fg, emblem_fg),
    emblem_bg          = COALESCE(p_bg, emblem_bg),
    banner             = COALESCE(p_banner, banner),
    emblem_size        = COALESCE(p_size, emblem_size),
    emblem_backdrop    = COALESCE(p_backdrop, emblem_backdrop),
    emblem_gloss       = COALESCE(p_gloss, emblem_gloss),
    badge_text         = COALESCE(p_text, badge_text),
    badge_text_color   = COALESCE(p_text_color, badge_text_color),
    badge_ribbon       = COALESCE(p_ribbon, badge_ribbon),
    badge_ribbon_color = COALESCE(p_ribbon_color, badge_ribbon_color),
    join_policy        = COALESCE(p_join_policy, join_policy)
  WHERE id = p_club_id;
END;
$$;

-- ─── Reads ───────────────────────────────────────────────────────────────────
-- Both list functions and get_club change their return type, so they have to be
-- dropped and recreated: CREATE OR REPLACE cannot change OUT columns.

DROP FUNCTION IF EXISTS list_my_clubs();
CREATE OR REPLACE FUNCTION list_my_clubs()
RETURNS TABLE (
  id                 UUID,
  tag                TEXT,
  name               TEXT,
  emblem_shape       TEXT,
  emblem_symbol      TEXT,
  emblem_fg          TEXT,
  emblem_bg          TEXT,
  banner             TEXT,
  emblem_size        TEXT,
  emblem_backdrop    TEXT,
  emblem_gloss       TEXT,
  badge_text         TEXT,
  badge_text_color   TEXT,
  badge_ribbon       TEXT,
  badge_ribbon_color TEXT,
  member_count       INTEGER,
  my_role            TEXT,
  joined_at          TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT c.id, c.tag, c.name, c.emblem_shape, c.emblem_symbol, c.emblem_fg,
         c.emblem_bg, c.banner, c.emblem_size, c.emblem_backdrop, c.emblem_gloss,
         c.badge_text, c.badge_text_color, c.badge_ribbon, c.badge_ribbon_color,
         c.member_count, m.role, m.joined_at
  FROM club_members m
  JOIN clubs c ON c.id = m.club_id
  WHERE m.player_id = auth.uid()
  ORDER BY m.joined_at;
$$;

DROP FUNCTION IF EXISTS browse_clubs(TEXT, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION browse_clubs(
  p_query  TEXT    DEFAULT NULL,
  p_limit  INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id                 UUID,
  tag                TEXT,
  name               TEXT,
  description        TEXT,
  emblem_shape       TEXT,
  emblem_symbol      TEXT,
  emblem_fg          TEXT,
  emblem_bg          TEXT,
  banner             TEXT,
  emblem_size        TEXT,
  emblem_backdrop    TEXT,
  emblem_gloss       TEXT,
  badge_text         TEXT,
  badge_text_color   TEXT,
  badge_ribbon       TEXT,
  badge_ribbon_color TEXT,
  join_policy        TEXT,
  member_count       INTEGER,
  is_member          BOOLEAN,
  total_count        BIGINT
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
    m.emblem_fg, m.emblem_bg, m.banner, m.emblem_size, m.emblem_backdrop,
    m.emblem_gloss, m.badge_text, m.badge_text_color, m.badge_ribbon,
    m.badge_ribbon_color, m.join_policy, m.member_count,
    EXISTS (SELECT 1 FROM club_members cm WHERE cm.club_id = m.id AND cm.player_id = auth.uid()),
    COUNT(*) OVER()
  FROM matched m
  ORDER BY m.member_count DESC, m.created_at DESC
  LIMIT  LEAST(GREATEST(COALESCE(p_limit, 25), 1), 50)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

DROP FUNCTION IF EXISTS get_club(UUID);
CREATE OR REPLACE FUNCTION get_club(p_club_id UUID)
RETURNS TABLE (
  id                 UUID,
  tag                TEXT,
  name               TEXT,
  description        TEXT,
  emblem_shape       TEXT,
  emblem_symbol      TEXT,
  emblem_fg          TEXT,
  emblem_bg          TEXT,
  banner             TEXT,
  emblem_size        TEXT,
  emblem_backdrop    TEXT,
  emblem_gloss       TEXT,
  badge_text         TEXT,
  badge_text_color   TEXT,
  badge_ribbon       TEXT,
  badge_ribbon_color TEXT,
  join_policy        TEXT,
  member_count       INTEGER,
  created_at         TIMESTAMPTZ,
  my_role            TEXT,
  members            JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    c.id, c.tag, c.name, c.description, c.emblem_shape, c.emblem_symbol,
    c.emblem_fg, c.emblem_bg, c.banner, c.emblem_size, c.emblem_backdrop,
    c.emblem_gloss, c.badge_text, c.badge_text_color, c.badge_ribbon,
    c.badge_ribbon_color, c.join_policy, c.member_count, c.created_at,
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

-- ─── Grants (re-applied: DROP removed the previous ACLs) ─────────────────────
DO $$
DECLARE
  fn TEXT;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'create_club(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)',
    'update_club(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)',
    'list_my_clubs()',
    'browse_clubs(TEXT, INTEGER, INTEGER)',
    'get_club(UUID)'
  ] LOOP
    EXECUTE FORMAT('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE FORMAT('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
  END LOOP;
END;
$$;
