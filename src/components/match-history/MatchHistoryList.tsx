import type { MatchHistoryEntry } from "@/lib/matchHistory/api";
import type { Dictionary } from "@/app/dictionary";

type Columns = Dictionary["players"]["columns"];
type Results = Dictionary["players"]["results"];

interface MatchHistoryListProps {
  matches: MatchHistoryEntry[];
  profileUserId: string;
  noMatchesText: string;
  columns: Columns;
  results: Results;
}

function getResult(
  match: MatchHistoryEntry,
  profileUserId: string,
  results: Results
): { label: string; className: string } {
  if (match.status === "forfeit") {
    return { label: results.forfeit, className: "text-amber-400" };
  }
  if (match.status === "disputed") {
    return { label: results.disputed, className: "text-yellow-400" };
  }
  if (match.winner_id === profileUserId) {
    return { label: results.win, className: "text-emerald-400" };
  }
  if (match.winner_id !== null) {
    return { label: results.loss, className: "text-red-400" };
  }
  return { label: results.unknown, className: "text-zinc-500" };
}

function getOpponent(match: MatchHistoryEntry, profileUserId: string): string {
  if (match.p1_id === profileUserId) return match.p2_name ?? "—";
  if (match.p2_id === profileUserId) return match.p1_name ?? "—";
  return match.p1_name ?? "—";
}

function getScore(match: MatchHistoryEntry, profileUserId: string): string {
  const myScore = match.p1_id === profileUserId ? match.p1_score : match.p2_score;
  const oppScore = match.p1_id === profileUserId ? match.p2_score : match.p1_score;
  if (myScore === null && oppScore === null) return "—";
  return `${myScore ?? "?"} – ${oppScore ?? "?"}`;
}

function formatDate(playedAt: string): string {
  const d = new Date(playedAt);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function MatchHistoryList({
  matches,
  profileUserId,
  noMatchesText,
  columns,
  results,
}: MatchHistoryListProps) {
  if (matches.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-500">{noMatchesText}</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs font-black uppercase text-zinc-500">
            <th className="pb-3 pr-4">{columns.game}</th>
            <th className="pb-3 pr-4">{columns.opponent}</th>
            <th className="pb-3 pr-4 text-center">{columns.result}</th>
            <th className="pb-3 pr-4 text-center">{columns.score}</th>
            <th className="pb-3 text-right">{columns.date}</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => {
            const { label, className } = getResult(match, profileUserId, results);
            const opponent = getOpponent(match, profileUserId);
            const score = getScore(match, profileUserId);
            return (
              <tr
                key={match.id}
                className="border-b border-white/5 text-zinc-300 last:border-0"
              >
                <td className="py-3 pr-4 font-mono text-xs text-zinc-400">
                  {match.game}
                </td>
                <td className="py-3 pr-4 font-semibold text-white">
                  {opponent}
                </td>
                <td className={`py-3 pr-4 text-center font-black ${className}`}>
                  {label}
                </td>
                <td className="py-3 pr-4 text-center font-mono text-xs">
                  {score}
                </td>
                <td className="py-3 text-right text-xs text-zinc-500">
                  {formatDate(match.played_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
