import Link from "next/link";
import { Gamepad2, LogIn, UserPlus } from "lucide-react";
import type { Locale, dictionaries } from "@/app/[lang]/dictionaries";
import { signIn, signUp } from "@/app/[lang]/login/actions";

type AuthPanelProps = {
  lang: Locale;
  dictionary: (typeof dictionaries)[Locale]["auth"];
  error?: string;
  notice?: string;
};

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

export default function AuthPanel({
  lang,
  dictionary: text,
  error,
  notice,
}: AuthPanelProps) {
  const message =
    error === "invalid"
      ? text.invalid
      : error === "signup_failed"
        ? text.signupFailed
        : error === "consent_required"
          ? text.consentRequired
          : error === "auth_callback_failed"
            ? text.callbackFailed
            : error === "auth_link_expired"
              ? text.linkExpired
              : error === "auth_verifier_missing"
                ? text.verifierMissing
                : notice === "check_email"
                  ? text.checkEmail
                  : notice === "signed_out"
                    ? text.signedOut
                    : notice === "password_reset"
                      ? text.passwordReset
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
              <Link
                href={`/${lang}/forgot-password`}
                className="text-xs font-semibold uppercase text-zinc-400 transition hover:text-white"
              >
                {text.forgotPassword}
              </Link>
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
              <label className="flex gap-3 rounded-sm border border-white/10 bg-black/30 p-3 text-sm leading-6 text-zinc-300">
                <input
                  name="legalConsent"
                  type="checkbox"
                  value="accepted"
                  required
                  className="mt-1 h-4 w-4 shrink-0 accent-brand-purple-500"
                />
                <span>
                  {text.acceptLegalPrefix}{" "}
                  <Link
                    href={`/${lang}/legal/terms-of-use`}
                    className="font-semibold text-brand-purple-300 underline-offset-4 transition hover:text-white hover:underline"
                  >
                    {text.termsOfUse}
                  </Link>{" "}
                  {text.acceptLegalMiddle}{" "}
                  <Link
                    href={`/${lang}/legal/privacy-policy`}
                    className="font-semibold text-brand-purple-300 underline-offset-4 transition hover:text-white hover:underline"
                  >
                    {text.privacyPolicy}
                  </Link>
                  {text.acceptLegalSuffix}
                </span>
              </label>
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
