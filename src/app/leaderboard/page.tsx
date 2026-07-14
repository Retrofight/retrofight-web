import Link from "next/link";
import { Trophy } from "lucide-react";

const SUPPORTED_GAMES: Array<{ driver: string; name: string }> = [
  { driver: "sf2ce", name: "Street Fighter II: Champion Edition" },
  { driver: "sf3", name: "Street Fighter III: New Generation" },
  { driver: "sf33", name: "Street Fighter III: 3rd Strike" },
  { driver: "garou", name: "Garou: Mark of the Wolves" },
  { driver: "kof98", name: "The King of Fighters '98" },
  { driver: "kof2002", name: "The King of Fighters 2002" },
  { driver: "samsho5sp", name: "Samurai Shodown V Special" },
  { driver: "vsav", name: "Vampire Savior" },
];

export const metadata = {
  title: "Leaderboard | RetroFight",
};

export default function LeaderboardIndexPage() {
  return (
    <main className="min-h-screen bg-dark-obsidian px-4 py-10 text-gray-100 sm:px-6">
      <section className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-brand-purple-400" />
          <h1 className="font-display text-4xl font-black tracking-normal text-white">
            Leaderboard
          </h1>
        </div>
        <p className="mt-3 text-zinc-300">
          Select a game to view the global ranked standings.
        </p>

        <ul className="mt-8 grid gap-3">
          {SUPPORTED_GAMES.map(({ driver, name }) => (
            <li key={driver}>
              <Link
                href={`/leaderboard/${encodeURIComponent(driver)}`}
                className="flex items-center justify-between rounded-sm border border-white/10 bg-dark-card px-5 py-4 text-sm font-semibold text-white transition hover:border-brand-purple-500 hover:bg-dark-card/80"
              >
                <span>{name}</span>
                <span className="text-xs text-zinc-500">{driver}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
