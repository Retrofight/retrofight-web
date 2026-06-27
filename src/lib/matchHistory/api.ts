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
  status: "played" | "confirmed" | "disputed" | "forfeit";
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

export interface GlobalMatchFilter {
  game?: string;
  playerName?: string;
  matchType?: "casual" | "ranked";
  status?: "confirmed" | "forfeit" | "disputed";
  page?: number;
  pageSize?: number;
}

export interface GlobalMatchHistoryPage {
  matches: MatchHistoryEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Global public match feed — confirmed and forfeit matches between players with public profiles.
// Disputed included only when explicitly filtered. Casual (played) excluded from public feed.
export async function getGlobalMatchHistory(filter: GlobalMatchFilter = {}): Promise<GlobalMatchHistoryPage> {
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, filter.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { matches: [], total: 0, page, pageSize, totalPages: 0 };
  }

  // Join profiles to restrict to players with public profiles.
  // We use a raw select and filter manually because Supabase JS doesn't
  // support AND-joined foreign key conditions directly.
  let query = admin
    .from("match_history")
    .select(
      `*, p1_profile:profiles!match_history_p1_id_fkey(is_public),
           p2_profile:profiles!match_history_p2_id_fkey(is_public)`,
      { count: "exact" }
    )
    .in("status", filter.status ? [filter.status] : ["confirmed", "forfeit", "disputed"])
    .order("played_at", { ascending: false })
    .range(from, to);

  if (filter.game) {
    query = query.eq("game", filter.game);
  }
  if (filter.matchType) {
    query = query.eq("match_type", filter.matchType);
  }
  if (filter.playerName) {
    const safe = filter.playerName.replace(/[%_]/g, "\\$&").slice(0, 64);
    query = query.or(`p1_name.ilike.%${safe}%,p2_name.ilike.%${safe}%`);
  }

  const { data, error, count } = await query;
  if (error || !data) return { matches: [], total: 0, page, pageSize, totalPages: 0 };

  // Filter client-side for public profiles (both players must be public or null).
  const publicMatches = (data as Array<Record<string, unknown>>).filter((row) => {
    const p1pub = (row.p1_profile as { is_public?: boolean } | null)?.is_public;
    const p2pub = (row.p2_profile as { is_public?: boolean } | null)?.is_public;
    return (p1pub !== false) && (p2pub !== false);
  }).map((row) => {
    const { p1_profile: _p1, p2_profile: _p2, ...rest } = row;
    return rest as unknown as MatchHistoryEntry;
  });

  const total = count ?? 0;
  return {
    matches: publicMatches,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
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
    .in("status", ["played", "confirmed", "forfeit"])
    .order("played_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as MatchHistoryEntry[];
}
