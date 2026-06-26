import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const RANK_LABELS: Record<number, string> = {
  0: "NR",
  1: "E",
  2: "D",
  3: "C",
  4: "B",
  5: "A",
  6: "S",
};

export interface PlayerGameRating {
  player_id: string;
  game: string;
  season_id: string | null;
  rating: number;
  rd: number;
  volatility: number;
  visible_rank: number;
  wins: number;
  losses: number;
  streak: number;
  best_streak: number;
  total_matches: number;
  last_match_at: string | null;
}

export interface LeaderboardEntry {
  rank_position: number;
  player_id: string;
  display_name: string | null;
  country: string | null;
  visible_rank: number;
  rating: number;
  wins: number;
  losses: number;
  total_matches: number;
  last_match_at: string | null;
}

export interface RankingSeason {
  id: string;
  name: string;
  started_at: string;
  ended_at: string | null;
  active: boolean;
}

export async function getActiveSeasons(): Promise<RankingSeason[]> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return [];
  }

  const { data, error } = await admin
    .from("ranking_seasons")
    .select("id, name, started_at, ended_at, active")
    .order("started_at", { ascending: false });

  if (error || !data) return [];
  return data as RankingSeason[];
}

export async function getLeaderboard(
  game: string,
  seasonId: string | null = null,
  limit = 50
): Promise<LeaderboardEntry[]> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return [];
  }

  let query = admin
    .from("player_game_ratings")
    .select(`
      player_id,
      visible_rank,
      rating,
      wins,
      losses,
      total_matches,
      last_match_at,
      profiles!inner(display_name, country, is_public)
    `)
    .eq("game", game)
    .eq("profiles.is_public", true)
    .gte("total_matches", 1)
    .order("visible_rank", { ascending: false })
    .order("rating", { ascending: false })
    .limit(limit);

  if (seasonId) {
    query = query.eq("season_id", seasonId);
  } else {
    query = query.is("season_id", null);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row, index) => {
    const profile = (row.profiles as Record<string, unknown> | null) ?? {};
    return {
      rank_position: index + 1,
      player_id: row.player_id as string,
      display_name: (profile.display_name as string | null) ?? null,
      country: (profile.country as string | null) ?? null,
      visible_rank: row.visible_rank as number,
      rating: Math.round(row.rating as number),
      wins: row.wins as number,
      losses: row.losses as number,
      total_matches: row.total_matches as number,
      last_match_at: row.last_match_at as string | null,
    };
  });
}

export async function getPlayerGameRatings(
  playerId: string
): Promise<PlayerGameRating[]> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return [];
  }

  const { data, error } = await admin
    .from("player_game_ratings")
    .select("*")
    .eq("player_id", playerId)
    .is("season_id", null)
    .gte("total_matches", 1)
    .order("visible_rank", { ascending: false });

  if (error || !data) return [];
  return data as PlayerGameRating[];
}

// SSR version for authenticated user's own ratings page
export async function getOwnGameRatings(): Promise<PlayerGameRating[]> {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return [];
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  return getPlayerGameRatings(user.id);
}

export function winRate(wins: number, total: number): string {
  if (total === 0) return "—";
  return `${Math.round((wins / total) * 100)}%`;
}
