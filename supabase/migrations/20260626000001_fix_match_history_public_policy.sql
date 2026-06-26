-- Fix: extend match_history public RLS policy to include forfeit matches.
-- Forfeit is a completed match event; excluding it from public profiles was incorrect.
-- Apply this if the original milestone5 migration was already applied.

DROP POLICY IF EXISTS "match_history_public_select" ON match_history;
CREATE POLICY "match_history_public_select" ON match_history
  FOR SELECT USING (
    status IN ('confirmed', 'forfeit')
    AND EXISTS (SELECT 1 FROM profiles WHERE id = p1_id AND is_public = TRUE)
    AND EXISTS (SELECT 1 FROM profiles WHERE id = p2_id AND is_public = TRUE)
  );
