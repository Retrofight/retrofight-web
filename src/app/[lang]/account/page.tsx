import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasLocale } from "../dictionaries";
import { signOut } from "./actions";

const copy = {
  en: {
    title: "Account",
    subtitle: "Your RetroFight web session is active.",
    email: "Email",
    player: "Player name",
    userId: "Supabase user ID",
    home: "Back to home",
    signOut: "Sign out",
  },
  it: {
    title: "Account",
    subtitle: "La sessione web RetroFight e' attiva.",
    email: "Email",
    player: "Nome player",
    userId: "ID utente Supabase",
    home: "Torna alla home",
    signOut: "Esci",
  },
} as const;

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect(`/${lang}/login`);
  }

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const text = copy[lang];
  const displayName =
    typeof user?.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : "-";

  return (
    <main className="min-h-screen bg-dark-obsidian px-4 py-10 text-gray-100 sm:px-6">
      <section className="mx-auto max-w-3xl">
        <Link
          href={`/${lang}`}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand-purple-400 transition hover:text-white"
        >
          <ShieldCheck className="h-4 w-4" />
          {text.home}
        </Link>

        <div className="mt-10 rounded-sm border border-white/10 bg-dark-card p-6 shadow-2xl shadow-black/30">
          <p className="font-pixel text-[10px] uppercase tracking-[0.24em] text-brand-purple-400">
            RetroFight
          </p>
          <h1 className="mt-4 font-display text-4xl font-black tracking-normal text-white">
            {text.title}
          </h1>
          <p className="mt-3 text-zinc-300">{text.subtitle}</p>

          <dl className="mt-8 grid gap-4">
            <div className="border-t border-white/10 pt-4">
              <dt className="text-xs font-black uppercase text-zinc-500">
                {text.email}
              </dt>
              <dd className="mt-1 text-sm text-white">
                {user?.email || claimsData.claims.email || "-"}
              </dd>
            </div>
            <div className="border-t border-white/10 pt-4">
              <dt className="text-xs font-black uppercase text-zinc-500">
                {text.player}
              </dt>
              <dd className="mt-1 text-sm text-white">{displayName}</dd>
            </div>
            <div className="border-t border-white/10 pt-4">
              <dt className="text-xs font-black uppercase text-zinc-500">
                {text.userId}
              </dt>
              <dd className="mt-1 break-all text-sm text-white">
                {claimsData.claims.sub}
              </dd>
            </div>
          </dl>

          <form action={signOut.bind(null, lang)} className="mt-8">
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-brand-purple-600 px-4 text-sm font-black uppercase text-white transition hover:bg-brand-purple-500">
              <LogOut className="h-4 w-4" />
              {text.signOut}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
