import Link from "next/link";
import { ChevronLeft, ChevronRight, Swords } from "lucide-react";
import { GlobalMatchTable } from "@/components/match-history/GlobalMatchTable";
import { getGlobalMatchHistory } from "@/lib/matchHistory/api";

export const metadata = {
  title: "Match History | RetroFight",
};

const GAMES = [
  { driver: "sf2ce",    name: "SF II: Champion Edition" },
  { driver: "sf3",     name: "SF III: New Generation" },
  { driver: "sf33",    name: "SF III: 3rd Strike" },
  { driver: "garou",   name: "Garou: Mark of the Wolves" },
  { driver: "kof98",   name: "KOF '98" },
  { driver: "kof2002", name: "KOF 2002" },
  { driver: "samsho5sp", name: "Samurai Shodown V Special" },
  { driver: "vsav",    name: "Vampire Savior" },
];

interface PageProps {
  searchParams: Promise<{
    page?: string;
    game?: string;
    player?: string;
    type?: string;
    status?: string;
  }>;
}

function buildUrl(base: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return `/matches${qs ? `?${qs}` : ""}`;
}

export default async function MatchesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const game = sp.game?.trim() || undefined;
  const player = sp.player?.trim() || undefined;
  const type = (sp.type === "casual" || sp.type === "ranked") ? sp.type : undefined;
  const status = (sp.status === "confirmed" || sp.status === "forfeit" || sp.status === "disputed")
    ? sp.status : undefined;

  const current = { page: String(page), game, player, type, status };
  const filtersBase = { game, player, type, status };

  const result = await getGlobalMatchHistory({ page, game, playerName: player, matchType: type, status });

  return (
    <main className="min-h-screen bg-dark-obsidian px-4 py-10 text-gray-100 sm:px-6">
      <section className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-purple-400 transition hover:text-white"
        >
          RetroFight
        </Link>

        <div className="mt-8 flex items-center gap-3">
          <Swords className="h-6 w-6 text-brand-purple-400" />
          <div>
            <h1 className="font-display text-3xl font-black tracking-normal text-white">
              Match History
            </h1>
            <p className="text-xs text-zinc-500">
              All public confirmed and forfeit matches
            </p>
          </div>
        </div>

        {/* Filters */}
        <form
          method="GET"
          action="/matches"
          className="mt-6 flex flex-wrap items-end gap-3 rounded-sm border border-white/10 bg-dark-card p-4"
        >
          {/* Game */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
              Game
            </label>
            <select
              name="game"
              defaultValue={game ?? ""}
              className="min-w-[180px] rounded-sm border border-white/10 bg-dark-obsidian px-3 py-2 text-xs text-zinc-200 focus:border-brand-purple-500 focus:outline-none"
            >
              <option value="">All games</option>
              {GAMES.map((g) => (
                <option key={g.driver} value={g.driver}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Player */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
              Player
            </label>
            <input
              name="player"
              type="text"
              defaultValue={player ?? ""}
              placeholder="Search by name…"
              maxLength={64}
              className="min-w-[180px] rounded-sm border border-white/10 bg-dark-obsidian px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:border-brand-purple-500 focus:outline-none"
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
              Type
            </label>
            <select
              name="type"
              defaultValue={type ?? ""}
              className="rounded-sm border border-white/10 bg-dark-obsidian px-3 py-2 text-xs text-zinc-200 focus:border-brand-purple-500 focus:outline-none"
            >
              <option value="">All</option>
              <option value="ranked">Ranked</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
              Status
            </label>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="rounded-sm border border-white/10 bg-dark-obsidian px-3 py-2 text-xs text-zinc-200 focus:border-brand-purple-500 focus:outline-none"
            >
              <option value="">All</option>
              <option value="confirmed">Confirmed</option>
              <option value="forfeit">Forfeit</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-sm bg-brand-purple-600 px-4 py-2 text-xs font-black uppercase text-white transition hover:bg-brand-purple-500"
          >
            Filter
          </button>

          {(game || player || type || status) && (
            <Link
              href="/matches"
              className="rounded-sm border border-white/10 px-4 py-2 text-xs font-semibold uppercase text-zinc-400 transition hover:text-white"
            >
              Clear
            </Link>
          )}
        </form>

        {/* Results count */}
        <p className="mt-4 text-xs text-zinc-500">
          {result.total} match{result.total !== 1 ? "es" : ""} found
          {result.totalPages > 1 && ` — page ${result.page} of ${result.totalPages}`}
        </p>

        {/* Table */}
        <div className="mt-3 rounded-sm border border-white/10 bg-dark-card p-4">
          <GlobalMatchTable matches={result.matches} />
        </div>

        {/* Pagination */}
        {result.totalPages > 1 && (
          <nav className="mt-5 flex items-center justify-center gap-2">
            {result.page > 1 ? (
              <Link
                href={buildUrl(current, { page: String(result.page - 1) })}
                className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-brand-purple-500 hover:text-white"
              >
                <ChevronLeft className="h-3 w-3" /> Prev
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 cursor-not-allowed rounded-sm border border-white/5 px-3 py-2 text-xs font-semibold text-zinc-600">
                <ChevronLeft className="h-3 w-3" /> Prev
              </span>
            )}

            <PageNumbers current={result.page} total={result.totalPages} filters={filtersBase} />

            {result.page < result.totalPages ? (
              <Link
                href={buildUrl(current, { page: String(result.page + 1) })}
                className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-brand-purple-500 hover:text-white"
              >
                Next <ChevronRight className="h-3 w-3" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 cursor-not-allowed rounded-sm border border-white/5 px-3 py-2 text-xs font-semibold text-zinc-600">
                Next <ChevronRight className="h-3 w-3" />
              </span>
            )}
          </nav>
        )}
      </section>
    </main>
  );
}

function PageNumbers({
  current,
  total,
  filters,
}: {
  current: number;
  total: number;
  filters: Record<string, string | undefined>;
}) {
  const pages: (number | "…")[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push("…");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push("…");
    pages.push(total);
  }

  return (
    <>
      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`ellipsis-${idx}`} className="px-1 text-xs text-zinc-600">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildUrl({ ...filters, page: String(p) }, {})}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-sm border text-xs font-semibold transition ${
              p === current
                ? "border-brand-purple-500 bg-brand-purple-900/30 text-brand-purple-300"
                : "border-white/10 text-zinc-400 hover:border-brand-purple-500 hover:text-white"
            }`}
          >
            {p}
          </Link>
        )
      )}
    </>
  );
}
