-- Ranked games: the pool of drivers that may be played in ranked mode, mirrored
-- from the SAME published catalog the client reads.
-- Apply this migration against the RetroFight Supabase project.
--
-- Why this table exists: ranked eligibility used to be a hardcoded Set in the
-- server (`RANKED_ELIGIBLE_GAMES` in server.ts). It had drifted badly from the
-- catalog -- listing drivers the catalog does not publish, and MISSING most of the
-- drivers the catalog advertises as ranked -- so players saw a RANKED badge and a
-- ranked toggle on games the server then silently downgraded to casual.
--
-- Source of truth: `list.json` in the retrofight-available-games repository, the
-- exact file the client fetches. A game is ranked-capable when it is published
-- with `ranked: true` AND a `detector` (the RAM map that reads the 1v1 score --
-- without it the runtime cannot score a ranked set at all). This table is a MIRROR
-- of that file, refreshed by the server through sync_ranked_games(); it exists
-- because SQL needs the pool too (the season picker draws from it), not as a
-- second place to curate the list by hand.
--
-- `enabled` is the one manual lever: it lets a game be withheld from ranked/seasons
-- without editing the published catalog. The sync never touches it.

CREATE TABLE IF NOT EXISTS ranked_games (
  game           TEXT        PRIMARY KEY,
  name           TEXT        NOT NULL,
  detector       TEXT,
  category       TEXT,
  group_label    TEXT,
  -- Mirrors the catalog's `ranked` flag at the last sync.
  ranked         BOOLEAN     NOT NULL DEFAULT TRUE,
  -- FALSE once a game disappears from the published catalog. Rows are kept rather
  -- than deleted so past seasons and ranking history still resolve their game.
  in_catalog     BOOLEAN     NOT NULL DEFAULT TRUE,
  -- Manual veto; the catalog sync never writes it.
  enabled        BOOLEAN     NOT NULL DEFAULT TRUE,
  first_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The only question anything asks this table: "which games can be played ranked
-- right now?"
CREATE INDEX IF NOT EXISTS ranked_games_eligible_idx
  ON ranked_games (game)
  WHERE ranked = TRUE AND in_catalog = TRUE AND enabled = TRUE;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- The pool is public information (it is published in the catalog anyway); writes
-- happen only through the service role / the sync RPC.
ALTER TABLE ranked_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ranked_games_public_select" ON ranked_games;
CREATE POLICY "ranked_games_public_select" ON ranked_games
  FOR SELECT USING (TRUE);

-- ─── Sync ────────────────────────────────────────────────────────────────────
-- Mirrors the published catalog into this table and returns what changed, so the
-- caller can log a real diff instead of "sync ok". Idempotent: running it twice
-- with the same catalog reports zero added/removed.
--
-- p_games is the catalog as JSONB, already filtered by the caller to entries that
-- are ranked-capable: [{ "game": "...", "name": "...", "detector": "...",
-- "category": "...", "group_label": "..." }, ...]
--
-- Games absent from the payload are marked in_catalog = FALSE rather than deleted:
-- a season or a ranking_history row may still reference them.
CREATE OR REPLACE FUNCTION sync_ranked_games(p_games JSONB)
RETURNS TABLE (added INTEGER, restored INTEGER, removed INTEGER, total INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_added    INTEGER := 0;
  v_restored INTEGER := 0;
  v_removed  INTEGER := 0;
BEGIN
  IF p_games IS NULL OR jsonb_typeof(p_games) <> 'array' THEN
    RAISE EXCEPTION 'invalid_catalog_payload';
  END IF;
  -- An empty catalog is always a fetch/parse failure upstream, never a real state:
  -- refuse it instead of wiping the pool (which would silently kill ranked play).
  IF jsonb_array_length(p_games) = 0 THEN
    RAISE EXCEPTION 'empty_catalog_payload';
  END IF;

  CREATE TEMP TABLE incoming_games ON COMMIT DROP AS
  SELECT
    entry->>'game'        AS game,
    entry->>'name'        AS name,
    entry->>'detector'    AS detector,
    entry->>'category'    AS category,
    entry->>'group_label' AS group_label
  FROM jsonb_array_elements(p_games) AS entry
  WHERE COALESCE(entry->>'game', '') <> '';

  SELECT COUNT(*) INTO v_added
  FROM incoming_games i
  WHERE NOT EXISTS (SELECT 1 FROM ranked_games r WHERE r.game = i.game);

  SELECT COUNT(*) INTO v_restored
  FROM incoming_games i
  JOIN ranked_games r ON r.game = i.game
  WHERE r.in_catalog = FALSE;

  SELECT COUNT(*) INTO v_removed
  FROM ranked_games r
  WHERE r.in_catalog = TRUE
    AND NOT EXISTS (SELECT 1 FROM incoming_games i WHERE i.game = r.game);

  INSERT INTO ranked_games (game, name, detector, category, group_label, ranked, in_catalog, last_synced_at)
  SELECT i.game, COALESCE(i.name, i.game), i.detector, i.category, i.group_label, TRUE, TRUE, NOW()
  FROM incoming_games i
  ON CONFLICT (game) DO UPDATE SET
    name           = EXCLUDED.name,
    detector       = EXCLUDED.detector,
    category       = EXCLUDED.category,
    group_label    = EXCLUDED.group_label,
    ranked         = TRUE,
    in_catalog     = TRUE,
    last_synced_at = NOW();
    -- `enabled` is deliberately NOT touched: it is the manual veto.

  UPDATE ranked_games r
  SET in_catalog = FALSE, last_synced_at = NOW()
  WHERE r.in_catalog = TRUE
    AND NOT EXISTS (SELECT 1 FROM incoming_games i WHERE i.game = r.game);

  RETURN QUERY
  SELECT v_added, v_restored, v_removed,
         (SELECT COUNT(*)::INTEGER FROM ranked_games WHERE in_catalog AND enabled AND ranked);
END;
$$;

-- The pool, for anything that needs to know what can be played ranked.
CREATE OR REPLACE FUNCTION list_ranked_games()
RETURNS TABLE (
  game        TEXT,
  name        TEXT,
  category    TEXT,
  group_label TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT game, name, category, group_label
  FROM ranked_games
  WHERE ranked = TRUE AND in_catalog = TRUE AND enabled = TRUE
  ORDER BY name;
$$;

-- ─── Grants ──────────────────────────────────────────────────────────────────
-- sync_ranked_games is machinery: only the server (service role) may rewrite the
-- pool. Reading it is public.
REVOKE ALL ON FUNCTION sync_ranked_games(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION list_ranked_games()      FROM PUBLIC;

GRANT EXECUTE ON FUNCTION sync_ranked_games(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION list_ranked_games()      TO anon, authenticated, service_role;
