import Link from "next/link";
import { Clapperboard } from "lucide-react";
import type { MatchHistoryEntry } from "@/lib/matchHistory/api";

const GAME_NAMES: Record<string, string> = {
  sf2ce: "SF II CE",
  sf3: "SF III",
  sf33: "SF III 3rd",
  garou: "Garou",
  kof98: "KOF '98",
  kof2002: "KOF 2002",
  samsho5sp: "Samsho V Sp.",
  vsav: "Vampire Savior",
};

function formatDate(playedAt: string): string {
  return new Date(playedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: MatchHistoryEntry["status"] }) {
  if (status === "disputed") {
    return (
      <span className="inline-block rounded-sm border border-yellow-500/30 bg-yellow-900/20 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-yellow-400">
        Disputed
      </span>
    );
  }
  if (status === "forfeit") {
    return (
      <span className="inline-block rounded-sm border border-amber-500/30 bg-amber-900/20 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400">
        Forfeit
      </span>
    );
  }
  return null;
}

function TypeBadge({ type }: { type: MatchHistoryEntry["match_type"] }) {
  if (type === "ranked") {
    return (
      <span className="inline-block rounded-sm border border-brand-purple-500/40 bg-brand-purple-900/40 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-purple-300">
        Ranked
      </span>
    );
  }
  return (
    <span className="inline-block rounded-sm border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-zinc-500">
      Casual
    </span>
  );
}

function PlayerCell({ name, isWinner }: { name: string | null; isWinner: boolean }) {
  const display = name ?? "—";
  const href = name ? `/players/${encodeURIComponent(name)}` : null;
  const className = `font-semibold whitespace-nowrap ${isWinner ? "text-emerald-400" : "text-zinc-300"}`;

  if (!href) return <span className={className}>{display}</span>;
  return (
    <Link href={href} className={`${className} transition hover:text-white`}>
      {display}
    </Link>
  );
}

interface GlobalMatchTableProps {
  matches: MatchHistoryEntry[];
}

export function GlobalMatchTable({ matches }: GlobalMatchTableProps) {
  if (matches.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">
        No matches found. Try adjusting the filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs font-black uppercase text-zinc-500">
            <th className="pb-3 pr-4">Date</th>
            <th className="pb-3 pr-4">Game</th>
            <th className="pb-3 pr-4">Type</th>
            <th className="pb-3 pr-4">Player 1</th>
            <th className="pb-3 pr-4 text-center text-zinc-600">vs</th>
            <th className="pb-3 pr-4">Player 2</th>
            <th className="pb-3 pr-4 text-center">Score</th>
            <th className="pb-3 pr-4 text-center">Status</th>
            <th className="pb-3 text-center">Replay</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => {
            const score =
              match.p1_score !== null && match.p2_score !== null
                ? `${match.p1_score} – ${match.p2_score}`
                : "—";
            const p1Won = match.winner_id === match.p1_id;
            const p2Won = match.winner_id === match.p2_id;

            return (
              <tr
                key={match.id}
                className="border-b border-white/5 text-zinc-300 last:border-0 hover:bg-white/[0.02]"
              >
                <td className="py-3 pr-4 text-xs text-zinc-500 whitespace-nowrap">
                  {formatDate(match.played_at)}
                </td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  <Link
                    href={`/leaderboard/${encodeURIComponent(match.game)}`}
                    className="font-mono text-xs text-zinc-400 transition hover:text-white"
                  >
                    {GAME_NAMES[match.game] ?? match.game}
                  </Link>
                </td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  <TypeBadge type={match.match_type} />
                </td>
                <td className="py-3 pr-4">
                  <PlayerCell name={match.p1_name} isWinner={p1Won} />
                </td>
                <td className="py-3 pr-4 text-center text-xs font-black text-zinc-600">
                  vs
                </td>
                <td className="py-3 pr-4">
                  <PlayerCell name={match.p2_name} isWinner={p2Won} />
                </td>
                <td className="py-3 pr-4 text-center font-mono text-xs whitespace-nowrap">
                  {score}
                </td>
                <td className="py-3 pr-4 text-center">
                  <StatusBadge status={match.status} />
                </td>
                <td className="py-3 text-center">
                  <span
                    title={`Audit ID: ${match.audit_id}\nRoom: ${match.room_id}`}
                    className="inline-flex cursor-not-allowed items-center gap-1 rounded-sm border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase text-zinc-600"
                  >
                    <Clapperboard className="h-3 w-3" />
                    Soon
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
