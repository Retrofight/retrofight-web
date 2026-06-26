import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { getLeaderboard, RANK_LABELS, winRate } from "@/lib/ranking/api";

const GAME_NAMES: Record<string, string> = {
  sf2ce: "Street Fighter II: Champion Edition",
  sf3: "Street Fighter III: New Generation",
  sf33: "Street Fighter III: 3rd Strike",
  garou: "Garou: Mark of the Wolves",
  kof98: "The King of Fighters '98",
  kof2002: "The King of Fighters 2002",
  samsho5sp: "Samurai Shodown V Special",
  vsav: "Vampire Savior",
};

const RANK_COLORS: Record<number, string> = {
  0: "text-zinc-500",
  1: "text-green-400",
  2: "text-cyan-400",
  3: "text-yellow-400",
  4: "text-orange-400",
  5: "text-red-400",
  6: "text-purple-400",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;
  const decodedGame = decodeURIComponent(game);
  const gameName = GAME_NAMES[decodedGame] ?? decodedGame;
  return { title: `${gameName} Leaderboard | RetroFight` };
}

export default async function GameLeaderboardPage({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;
  const decodedGame = decodeURIComponent(game);

  if (!/^[a-z0-9_.-]{1,64}$/.test(decodedGame)) {
    notFound();
  }

  const gameName = GAME_NAMES[decodedGame] ?? decodedGame;
  const entries = await getLeaderboard(decodedGame, null, 50);

  return (
    <main className="min-h-screen bg-dark-obsidian px-4 py-10 text-gray-100 sm:px-6">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-purple-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          All games
        </Link>

        <div className="mt-8 flex items-center gap-3">
          <Trophy className="h-6 w-6 text-brand-purple-400" />
          <div>
            <h1 className="font-display text-3xl font-black tracking-normal text-white">
              {gameName}
            </h1>
            <p className="text-xs text-zinc-500">Ranked — All-time standings</p>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="mt-10 rounded-sm border border-white/10 bg-dark-card p-8 text-center text-zinc-400">
            No ranked matches recorded yet. Be the first to reach rank E!
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                  <th className="pb-3 pl-2 text-left">#</th>
                  <th className="pb-3 text-left">Player</th>
                  <th className="pb-3 text-center">Rank</th>
                  <th className="pb-3 text-right">W</th>
                  <th className="pb-3 text-right">L</th>
                  <th className="pb-3 text-right pr-2">W%</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.player_id}
                    className="border-b border-white/5 transition hover:bg-white/5"
                  >
                    <td className="py-3 pl-2 text-zinc-500">
                      {entry.rank_position}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/players/${encodeURIComponent(entry.display_name ?? entry.player_id)}`}
                        className="font-semibold text-white transition hover:text-brand-purple-400"
                      >
                        {entry.display_name ?? "—"}
                      </Link>
                      {entry.country && (
                        <span className="ml-2 text-xs text-zinc-500 uppercase">
                          {entry.country}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`font-pixel text-xs font-black ${RANK_COLORS[entry.visible_rank] ?? "text-zinc-400"}`}
                      >
                        {RANK_LABELS[entry.visible_rank] ?? "NR"}
                      </span>
                    </td>
                    <td className="py-3 text-right text-green-400">
                      {entry.wins}
                    </td>
                    <td className="py-3 text-right text-red-400">
                      {entry.losses}
                    </td>
                    <td className="py-3 pr-2 text-right text-zinc-300">
                      {winRate(entry.wins, entry.total_matches)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs text-zinc-600">
          Rankings update after each confirmed or forfeit ranked match. Only
          players with at least one completed ranked match appear here.
        </p>
      </section>
    </main>
  );
}
