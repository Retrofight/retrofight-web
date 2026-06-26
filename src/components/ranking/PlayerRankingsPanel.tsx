import Link from "next/link";
import { Trophy } from "lucide-react";
import type { PlayerGameRating } from "@/lib/ranking/api";
import { RANK_LABELS, winRate } from "@/lib/ranking/api";

const RANK_COLORS: Record<number, string> = {
  0: "text-zinc-500",
  1: "text-green-400",
  2: "text-cyan-400",
  3: "text-yellow-400",
  4: "text-orange-400",
  5: "text-red-400",
  6: "text-purple-400",
};

const GAME_NAMES: Record<string, string> = {
  sf2ce: "SF II CE",
  sf3: "SF III",
  sf33: "SF III 3rd Strike",
  garou: "Garou: MOTW",
  kof98: "KOF '98",
  kof2002: "KOF 2002",
  samsho5sp: "Samsho V Sp.",
  vsav: "Vampire Savior",
};

interface PlayerRankingsPanelProps {
  ratings: PlayerGameRating[];
}

export function PlayerRankingsPanel({ ratings }: PlayerRankingsPanelProps) {
  if (ratings.length === 0) {
    return (
      <div className="rounded-sm border border-white/10 bg-dark-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-4 w-4 text-brand-purple-400" />
          <h2 className="font-display text-lg font-black text-white">
            Ranked Stats
          </h2>
        </div>
        <p className="text-sm text-zinc-400">
          No ranked matches yet. Challenge opponents in ranked mode to earn a
          rank badge.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-white/10 bg-dark-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="h-4 w-4 text-brand-purple-400" />
        <h2 className="font-display text-lg font-black text-white">
          Ranked Stats
        </h2>
      </div>

      <ul className="grid gap-3">
        {ratings.map((r) => {
          const label = RANK_LABELS[r.visible_rank] ?? "NR";
          const color = RANK_COLORS[r.visible_rank] ?? "text-zinc-500";
          const gameName = GAME_NAMES[r.game] ?? r.game;

          return (
            <li
              key={r.game}
              className="flex items-center justify-between border-t border-white/10 pt-3 text-sm"
            >
              <div className="flex flex-col gap-0.5">
                <Link
                  href={`/leaderboard/${encodeURIComponent(r.game)}`}
                  className="font-semibold text-white transition hover:text-brand-purple-400"
                >
                  {gameName}
                </Link>
                <span className="text-xs text-zinc-500">
                  {r.wins}W / {r.losses}L &middot;{" "}
                  {winRate(r.wins, r.total_matches)}
                </span>
              </div>
              <span className={`font-pixel text-base font-black ${color}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
