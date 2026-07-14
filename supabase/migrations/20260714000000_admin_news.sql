-- Admin overhaul: News/Blog system + Users admin RPC
-- Apply this migration against the RetroFight Supabase project.

-- ─── News categories ─────────────────────────────────────────────────────────
-- Dynamic labels for the news ticker/blog (e.g. news, event, update, ranked).
-- Managed from /admin/news/categories. `slug` doubles as the client ticker "type".
CREATE TABLE IF NOT EXISTS news_categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT        NOT NULL UNIQUE,
  label      TEXT        NOT NULL,
  color      TEXT,
  sort       INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the default categories the client ticker historically used.
INSERT INTO news_categories (slug, label, color, sort) VALUES
  ('news',   'News',    '#a78bfa', 0),
  ('event',  'Event',   '#f59e0b', 1),
  ('update', 'Update',  '#38bdf8', 2),
  ('ranked', 'Ranked',  '#34d399', 3)
ON CONFLICT (slug) DO NOTHING;

-- ─── News ────────────────────────────────────────────────────────────────────
-- Blog posts / announcements. Published rows are public; drafts are admin-only.
CREATE TABLE IF NOT EXISTS news (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        NOT NULL UNIQUE,
  title           TEXT        NOT NULL,
  summary         TEXT,
  body            TEXT,
  cover_image_url TEXT,
  category_id     UUID        REFERENCES news_categories(id) ON DELETE SET NULL,
  status          TEXT        NOT NULL DEFAULT 'draft',
  published_at    TIMESTAMPTZ,
  author_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT news_status_check CHECK (status IN ('draft', 'published'))
);

CREATE INDEX IF NOT EXISTS news_published_idx
  ON news (published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS news_category_idx ON news (category_id);

-- Reuse the shared trigger defined in the milestone5 migration.
DROP TRIGGER IF EXISTS news_updated_at ON news;
CREATE TRIGGER news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── RLS: news_categories ─────────────────────────────────────────────────────
-- Categories are readable by everyone (public blog + client ticker).
-- Writes happen only through the service role, which bypasses RLS.
ALTER TABLE news_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_categories_public_select" ON news_categories;
CREATE POLICY "news_categories_public_select" ON news_categories
  FOR SELECT USING (TRUE);

-- ─── RLS: news ────────────────────────────────────────────────────────────────
-- Only published posts are publicly readable. Drafts and all writes go through
-- the service-role admin client (bypasses RLS).
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_public_select" ON news;
CREATE POLICY "news_public_select" ON news
  FOR SELECT USING (status = 'published');

-- ─── Storage bucket: news cover images ────────────────────────────────────────
-- Public-read bucket. Uploads are performed by the service role (admin authoring).
INSERT INTO storage.buckets (id, name, public)
VALUES ('news', 'news', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

DROP POLICY IF EXISTS "news_covers_public_read" ON storage.objects;
CREATE POLICY "news_covers_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'news');

-- ─── Users admin RPC ──────────────────────────────────────────────────────────
-- Server-side paginated listing joining auth.users + profiles, with email /
-- display_name search and role / banned filters. GoTrue's listUsers has no
-- email filter and returns no total, so a SECURITY DEFINER RPC is used instead.
-- Only the service role is granted EXECUTE; anon/authenticated are revoked.
CREATE OR REPLACE FUNCTION admin_list_users(
  p_search    TEXT DEFAULT NULL,
  p_role      TEXT DEFAULT NULL,
  p_banned    BOOLEAN DEFAULT NULL,
  p_page      INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 25
)
RETURNS TABLE (
  id                UUID,
  email             TEXT,
  display_name      TEXT,
  country           CHAR(2),
  is_public         BOOLEAN,
  role              TEXT,
  banned_until      TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ,
  last_sign_in_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ,
  total_count       BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH filtered AS (
    SELECT
      u.id,
      u.email::TEXT                                    AS email,
      p.display_name,
      p.country,
      COALESCE(p.is_public, TRUE)                      AS is_public,
      COALESCE(u.raw_app_meta_data ->> 'role', 'user') AS role,
      u.banned_until,
      u.email_confirmed_at,
      u.last_sign_in_at,
      u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE
      (p_search IS NULL OR p_search = '' OR
        u.email ILIKE '%' || p_search || '%' OR
        p.display_name ILIKE '%' || p_search || '%')
      AND (p_role IS NULL OR p_role = '' OR
        COALESCE(u.raw_app_meta_data ->> 'role', 'user') = p_role)
      AND (p_banned IS NULL OR
        (p_banned = TRUE  AND u.banned_until IS NOT NULL AND u.banned_until > NOW()) OR
        (p_banned = FALSE AND (u.banned_until IS NULL OR u.banned_until <= NOW())))
  )
  SELECT
    f.*,
    COUNT(*) OVER () AS total_count
  FROM filtered f
  ORDER BY f.created_at DESC
  LIMIT GREATEST(p_page_size, 1)
  OFFSET GREATEST(p_page - 1, 0) * GREATEST(p_page_size, 1);
$$;

REVOKE ALL ON FUNCTION admin_list_users(TEXT, TEXT, BOOLEAN, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_list_users(TEXT, TEXT, BOOLEAN, INTEGER, INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_list_users(TEXT, TEXT, BOOLEAN, INTEGER, INTEGER) TO service_role;
