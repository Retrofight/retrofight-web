import { createAdminClient } from "@/lib/supabase/admin";

export interface MatchHistoryEntry {
  id: string;
  room_id: string;
  p1_id: string | null;
  p1_name: string | null;
  p2_id: string | null;
  p2_name: string | null;
  game: string;
  match_type: "casual" | "ranked" | null;
  winner_id: string | null;
  p1_score: number | null;
  p2_score: number | null;
  p1_char: number | null;
  p2_char: number | null;
  status: "confirmed" | "disputed" | "forfeit";
  turbo_detected: boolean;
  runtime_version: string | null;
  protocol_version: string | null;
  audit_id: string;
  played_at: string;
}

// Used for the current user's own profile page — includes all statuses
export async function getOwnMatchHistory(userId: string, limit = 20): Promise<MatchHistoryEntry[]> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return [];
  }

  const { data, error } = await admin
    .from("match_history")
    .select("*")
    .or(`p1_id.eq.${userId},p2_id.eq.${userId}`)
    .order("played_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as MatchHistoryEntry[];
}

// Used for public player profile pages — confirmed and forfeit matches
// Disputed matches are excluded because they have no verified outcome.
export async function getPublicMatchHistory(userId: string, limit = 20): Promise<MatchHistoryEntry[]> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return [];
  }

  const { data, error } = await admin
    .from("match_history")
    .select("*")
    .or(`p1_id.eq.${userId},p2_id.eq.${userId}`)
    .in("status", ["confirmed", "forfeit"])
    .order("played_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as MatchHistoryEntry[];
}
