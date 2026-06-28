import type { MatchHistoryEntry } from "@/lib/matchHistory/api";
import type { Dictionary } from "@/app/dictionary";

type Columns = Dictionary["players"]["columns"];
type Results = Dictionary["players"]["results"];

type MatchTypes = Dictionary["players"]["matchTypes"];

interface MatchHistoryListProps {
  matches: MatchHistoryEntry[];
  profileUserId: string;
  noMatchesText: string;
  columns: Columns;
  results: Results;
  matchTypes: MatchTypes;
}

function getResult(
  match: MatchHistoryEntry,
  profileUserId: string,
  results: Results
): { label: string; className: string } {
  if (match.status === "played") {
    return { label: results.played, className: "text-zinc-500" };
  }
  if (match.status === "forfeit") {
    if (match.winner_id === profileUserId) {
      return { label: results.win, className: "text-emerald-400" };
    }
    if (match.winner_id !== null) {
      return { label: results.loss, className: "text-red-400" };
    }
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

// Score is always shown as p1_score – p2_score to match the P1/P2 column order.
function getScore(match: MatchHistoryEntry): string {
  if (match.p1_score === null && match.p2_score === null) return "—";
  return `${match.p1_score ?? "?"} – ${match.p2_score ?? "?"}`;
}

function formatDate(playedAt: string): string {
  const d = new Date(playedAt);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function MatchTypeBadge({ type, matchTypes }: { type: MatchHistoryEntry["match_type"]; matchTypes: MatchTypes }) {
  if (type === "ranked") {
    return (
      <span className="inline-block rounded-sm border border-brand-purple-500/40 bg-brand-purple-900/40 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-purple-300">
        {matchTypes.ranked}
      </span>
    );
  }
  return (
    <span className="inline-block rounded-sm border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-zinc-500">
      {matchTypes.casual}
    </span>
  );
}

export function MatchHistoryList({
  matches,
  profileUserId,
  noMatchesText,
  columns,
  results,
  matchTypes,
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
            <th className="pb-3 pr-3">{columns.date}</th>
            <th className="pb-3 pr-3">{columns.game}</th>
            <th className="pb-3 pr-3">{columns.type}</th>
            <th className="pb-3 pr-3">{columns.p1}</th>
            <th className="pb-3 pr-3 text-center text-zinc-600">vs</th>
            <th className="pb-3 pr-3">{columns.p2}</th>
            <th className="pb-3 pr-3 text-center">{columns.score}</th>
            <th className="pb-3 text-center">{columns.result}</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => {
            const { label, className } = getResult(match, profileUserId, results);
            const score = getScore(match);
            const p1IsProfile = match.p1_id === profileUserId;
            return (
              <tr
                key={match.id}
                className="border-b border-white/5 text-zinc-300 last:border-0"
              >
                <td className="py-3 pr-3 text-xs text-zinc-500 whitespace-nowrap">
                  {formatDate(match.played_at)}
                </td>
                <td className="py-3 pr-3 font-mono text-xs text-zinc-400 whitespace-nowrap">
                  {match.game}
                </td>
                <td className="py-3 pr-3 whitespace-nowrap">
                  <MatchTypeBadge type={match.match_type} matchTypes={matchTypes} />
                </td>
                <td className={`py-3 pr-3 font-semibold whitespace-nowrap ${p1IsProfile ? "text-white" : "text-zinc-400"}`}>
                  {match.p1_name ?? "—"}
                </td>
                <td className="py-3 pr-3 text-center text-zinc-600 text-xs font-black">
                  vs
                </td>
                <td className={`py-3 pr-3 font-semibold whitespace-nowrap ${!p1IsProfile ? "text-white" : "text-zinc-400"}`}>
                  {match.p2_name ?? "—"}
                </td>
                <td className="py-3 pr-3 text-center font-mono text-xs whitespace-nowrap">
                  {score}
                </td>
                <td className={`py-3 text-center font-black whitespace-nowrap ${className}`}>
                  {label}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
