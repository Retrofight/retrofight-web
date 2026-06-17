import Link from "next/link";
import { Gamepad2, LogIn, UserPlus } from "lucide-react";
import type { Locale } from "@/app/[lang]/dictionaries";
import { signIn, signUp } from "@/app/[lang]/login/actions";

type AuthPanelProps = {
  lang: Locale;
  error?: string;
  notice?: string;
};

const copy = {
  en: {
    eyebrow: "RetroFight account",
    title: "Sign in or create your player profile",
    subtitle:
      "Accounts are the base for future public profiles, match history, and ranking features.",
    signIn: "Sign in",
    signUp: "Register",
    email: "Email",
    password: "Password",
    displayName: "Player name",
    displayNameHint: "Optional",
    back: "Back to home",
    invalid: "Check your email and password, then try again.",
    signupFailed: "Registration did not complete. Try another email or password.",
    checkEmail: "Check your inbox to confirm the account before signing in.",
    signedOut: "You have been signed out.",
  },
  it: {
    eyebrow: "Account RetroFight",
    title: "Accedi o crea il tuo profilo player",
    subtitle:
      "Gli account sono la base per profili pubblici, storico match e ranking futuri.",
    signIn: "Accedi",
    signUp: "Registrati",
    email: "Email",
    password: "Password",
    displayName: "Nome player",
    displayNameHint: "Opzionale",
    back: "Torna alla home",
    invalid: "Controlla email e password, poi riprova.",
    signupFailed:
      "La registrazione non e' riuscita. Prova un'altra email o password.",
    checkEmail: "Controlla la mail e conferma l'account prima di accedere.",
    signedOut: "Logout effettuato.",
  },
} as const;

function Field({
  label,
  name,
  type,
  autoComplete,
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-zinc-200">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        className="h-12 rounded-sm border border-white/10 bg-black/45 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-brand-purple-500"
      />
    </label>
  );
}

export default function AuthPanel({ lang, error, notice }: AuthPanelProps) {
  const text = copy[lang];
  const message =
    error === "invalid"
      ? text.invalid
      : error === "signup_failed"
        ? text.signupFailed
        : notice === "check_email"
          ? text.checkEmail
          : notice === "signed_out"
            ? text.signedOut
            : null;

  return (
    <main className="min-h-screen bg-dark-obsidian px-4 py-10 text-gray-100 sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <section className="pt-8">
          <Link
            href={`/${lang}`}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand-purple-400 transition hover:text-white"
          >
            <Gamepad2 className="h-4 w-4" />
            {text.back}
          </Link>
          <p className="mt-12 font-pixel text-[10px] uppercase tracking-[0.24em] text-brand-purple-400">
            {text.eyebrow}
          </p>
          <h1 className="mt-4 max-w-xl font-display text-4xl font-black tracking-normal text-white sm:text-5xl">
            {text.title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-zinc-300">
            {text.subtitle}
          </p>
          {message ? (
            <p className="mt-6 border-l-2 border-brand-purple-500 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-100">
              {message}
            </p>
          ) : null}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <form
            action={signIn.bind(null, lang)}
            className="rounded-sm border border-white/10 bg-dark-card p-5 shadow-2xl shadow-black/30"
          >
            <div className="mb-6 flex items-center gap-3">
              <LogIn className="h-5 w-5 text-brand-purple-400" />
              <h2 className="font-display text-xl font-black text-white">
                {text.signIn}
              </h2>
            </div>
            <div className="grid gap-4">
              <Field
                label={text.email}
                name="email"
                type="email"
                autoComplete="email"
              />
              <Field
                label={text.password}
                name="password"
                type="password"
                autoComplete="current-password"
              />
              <button className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-brand-purple-600 px-4 text-sm font-black uppercase text-white transition hover:bg-brand-purple-500">
                <LogIn className="h-4 w-4" />
                {text.signIn}
              </button>
            </div>
          </form>

          <form
            action={signUp.bind(null, lang)}
            className="rounded-sm border border-white/10 bg-dark-card p-5 shadow-2xl shadow-black/30"
          >
            <div className="mb-6 flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-brand-purple-400" />
              <h2 className="font-display text-xl font-black text-white">
                {text.signUp}
              </h2>
            </div>
            <div className="grid gap-4">
              <Field
                label={text.email}
                name="email"
                type="email"
                autoComplete="email"
              />
              <Field
                label={text.password}
                name="password"
                type="password"
                autoComplete="new-password"
              />
              <Field
                label={text.displayName}
                name="displayName"
                type="text"
                autoComplete="nickname"
                placeholder={text.displayNameHint}
                required={false}
              />
              <button className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-sm border border-brand-purple-500 bg-white/[0.03] px-4 text-sm font-black uppercase text-white transition hover:bg-brand-purple-600">
                <UserPlus className="h-4 w-4" />
                {text.signUp}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
