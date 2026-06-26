import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Flag, Trophy } from "lucide-react";
import { MatchHistoryList } from "@/components/match-history/MatchHistoryList";
import { getPublicProfileBySlug } from "@/lib/profiles/api";
import { getPublicMatchHistory } from "@/lib/matchHistory/api";
import { dictionary } from "../../dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(decodeURIComponent(slug));
  if (!profile) {
    return { title: "Player not found | RetroFight" };
  }
  return { title: `${profile.display_name} | RetroFight` };
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const text = dictionary.players;

  const profile = await getPublicProfileBySlug(decodedSlug);
  if (!profile) {
    notFound();
  }

  const matchHistory = await getPublicMatchHistory(profile.id, 20);

  const joinedDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-dark-obsidian px-4 py-10 text-gray-100 sm:px-6">
      <section className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-purple-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {text.home}
        </Link>

        <div className="mt-10 grid gap-5 lg:grid-cols-[auto_1fr]">
          {/* Profile card */}
          <section className="rounded-sm border border-white/10 bg-dark-card p-6 shadow-2xl shadow-black/30 lg:w-64">
            <p className="font-pixel text-[10px] tracking-[0.24em] text-brand-purple-400">
              RetroFight
            </p>

            <div className="mt-6 flex flex-col items-center gap-3">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="h-20 w-20 rounded-full border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-brand-purple-900/40 text-3xl font-black text-brand-purple-300">
                  {profile.display_name[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <h1 className="font-display text-2xl font-black text-white">
                {profile.display_name}
              </h1>
            </div>

            <dl className="mt-6 grid gap-3">
              {profile.country ? (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Flag className="h-4 w-4 shrink-0 text-brand-purple-400" />
                  <span className="font-mono font-semibold text-white">
                    {profile.country}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Calendar className="h-4 w-4 shrink-0 text-brand-purple-400" />
                <span>
                  {text.joined}{" "}
                  <span className="text-zinc-200">{joinedDate}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Trophy className="h-4 w-4 shrink-0 text-brand-purple-400" />
                <span>
                  <span className="font-black text-white">
                    {matchHistory.filter((m) => m.winner_id === profile.id).length}
                  </span>{" "}
                  wins in{" "}
                  <span className="font-black text-white">{matchHistory.length}</span>{" "}
                  matches
                </span>
              </div>
            </dl>
          </section>

          {/* Match history */}
          <section className="rounded-sm border border-white/10 bg-dark-card p-6 shadow-2xl shadow-black/30">
            <h2 className="font-display text-xl font-black text-white">
              {text.matchHistory}
            </h2>
            <div className="mt-5">
              <MatchHistoryList
                matches={matchHistory}
                profileUserId={profile.id}
                noMatchesText={text.noMatches}
                columns={text.columns}
                results={text.results}
              />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
