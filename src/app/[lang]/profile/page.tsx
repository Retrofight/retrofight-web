import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { KeyRound, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasLocale } from "../dictionaries";
import { signOut, updatePassword } from "./actions";

const copy = {
  en: {
    title: "Profile",
    subtitle: "Your RetroFight profile is active.",
    email: "Email",
    player: "Player name",
    home: "Back to home",
    signOut: "Sign out",
    readOnly: "Locked",
    identityTitle: "Identity",
    passwordTitle: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    passwordHint:
      "Use at least 8 characters. Additional security rules are enforced automatically.",
    updatePassword: "Update password",
    passwordMessages: {
      missing: "Complete every password field.",
      mismatch: "The new password and confirmation do not match.",
      weak: "Use at least 8 characters for the new password.",
      current_invalid: "The current password is not correct.",
      policy: "The new password does not match the configured security policy.",
      updated: "Password updated.",
    },
  },
  it: {
    title: "Profilo",
    subtitle: "Il tuo profilo RetroFight e' attivo.",
    email: "Email",
    player: "Nome player",
    home: "Torna alla home",
    signOut: "Esci",
    readOnly: "Bloccato",
    identityTitle: "Identita'",
    passwordTitle: "Modifica password",
    currentPassword: "Password attuale",
    newPassword: "Nuova password",
    confirmPassword: "Conferma nuova password",
    passwordHint:
      "Usa almeno 8 caratteri. Le regole di sicurezza aggiuntive sono applicate automaticamente.",
    updatePassword: "Aggiorna password",
    passwordMessages: {
      missing: "Completa tutti i campi password.",
      mismatch: "La nuova password e la conferma non coincidono.",
      weak: "Usa almeno 8 caratteri per la nuova password.",
      current_invalid: "La password attuale non e' corretta.",
      policy: "La nuova password non rispetta la policy di sicurezza configurata.",
      updated: "Password aggiornata.",
    },
  },
} as const;

type PasswordStatus = keyof (typeof copy)["en"]["passwordMessages"];

function isPasswordStatus(value: string | undefined): value is PasswordStatus {
  return (
    value === "missing" ||
    value === "mismatch" ||
    value === "weak" ||
    value === "current_invalid" ||
    value === "policy" ||
    value === "updated"
  );
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ password?: string }>;
}) {
  const { lang } = await params;
  const { password } = await searchParams;

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
  const passwordMessage = isPasswordStatus(password)
    ? text.passwordMessages[password]
    : null;

  return (
    <main className="min-h-screen bg-dark-obsidian px-4 py-10 text-gray-100 sm:px-6">
      <section className="mx-auto max-w-4xl">
        <Link
          href={`/${lang}`}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand-purple-400 transition hover:text-white"
        >
          <ShieldCheck className="h-4 w-4" />
          {text.home}
        </Link>

        <div className="mt-10 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-sm border border-white/10 bg-dark-card p-6 shadow-2xl shadow-black/30">
            <p className="font-pixel text-[10px] uppercase tracking-[0.24em] text-brand-purple-400">
              RetroFight
            </p>
            <h1 className="mt-4 font-display text-4xl font-black tracking-normal text-white">
              {text.title}
            </h1>
            <p className="mt-3 text-zinc-300">{text.subtitle}</p>

            <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5">
              <UserRound className="h-5 w-5 text-brand-purple-400" />
              <h2 className="font-display text-xl font-black text-white">
                {text.identityTitle}
              </h2>
            </div>

            <dl className="mt-5 grid gap-4">
              <div className="border-t border-white/10 pt-4">
                <dt className="flex items-center justify-between gap-3 text-xs font-black uppercase text-zinc-500">
                  {text.email}
                  <span className="text-[10px] text-zinc-600">{text.readOnly}</span>
                </dt>
                <dd className="mt-1 text-sm text-white">
                  {user?.email || claimsData.claims.email || "-"}
                </dd>
              </div>
              <div className="border-t border-white/10 pt-4">
                <dt className="flex items-center justify-between gap-3 text-xs font-black uppercase text-zinc-500">
                  {text.player}
                  <span className="text-[10px] text-zinc-600">{text.readOnly}</span>
                </dt>
                <dd className="mt-1 text-sm text-white">{displayName}</dd>
              </div>
            </dl>

            <form action={signOut.bind(null, lang)} className="mt-8">
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-white/10 px-4 text-sm font-black uppercase text-white transition hover:border-brand-purple-500">
                <LogOut className="h-4 w-4" />
                {text.signOut}
              </button>
            </form>
          </section>

          <section className="rounded-sm border border-white/10 bg-dark-card p-6 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-brand-purple-400" />
              <h2 className="font-display text-xl font-black text-white">
                {text.passwordTitle}
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {text.passwordHint}
            </p>

            {passwordMessage ? (
              <p className="mt-5 border-l-2 border-brand-purple-500 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-100">
                {passwordMessage}
              </p>
            ) : null}

            <form action={updatePassword.bind(null, lang)} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-zinc-200">
                <span>{text.currentPassword}</span>
                <input
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-12 rounded-sm border border-white/10 bg-black/45 px-3 text-sm text-white outline-none transition focus:border-brand-purple-500"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-zinc-200">
                <span>{text.newPassword}</span>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="h-12 rounded-sm border border-white/10 bg-black/45 px-3 text-sm text-white outline-none transition focus:border-brand-purple-500"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-zinc-200">
                <span>{text.confirmPassword}</span>
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="h-12 rounded-sm border border-white/10 bg-black/45 px-3 text-sm text-white outline-none transition focus:border-brand-purple-500"
                />
              </label>
              <button className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-brand-purple-600 px-4 text-sm font-black uppercase text-white transition hover:bg-brand-purple-500">
                <KeyRound className="h-4 w-4" />
                {text.updatePassword}
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
