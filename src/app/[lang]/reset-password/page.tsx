import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../dictionaries";
import { resetPassword } from "./actions";

type ResetPasswordStatus = "missing" | "mismatch" | "weak" | "policy";

function isResetPasswordStatus(
  value: string | undefined,
): value is ResetPasswordStatus {
  return (
    value === "missing" ||
    value === "mismatch" ||
    value === "weak" ||
    value === "policy"
  );
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { lang } = await params;
  const { error } = await searchParams;

  if (!hasLocale(lang)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect(`/${lang}/login?error=auth_link_expired`);
  }

  const text = getDictionary(lang).resetPassword;
  const message = isResetPasswordStatus(error) ? text[error] : null;

  return (
    <main className="min-h-screen bg-dark-obsidian px-4 py-10 text-gray-100 sm:px-6">
      <section className="mx-auto max-w-xl">
        <Link
          href={`/${lang}/login`}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand-purple-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {text.back}
        </Link>

        <form
          action={resetPassword.bind(null, lang)}
          className="mt-10 rounded-sm border border-white/10 bg-dark-card p-6 shadow-2xl shadow-black/30"
        >
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-brand-purple-400" />
            <p className="font-pixel text-[10px] uppercase tracking-[0.24em] text-brand-purple-400">
              {text.eyebrow}
            </p>
          </div>
          <h1 className="mt-4 font-display text-4xl font-black tracking-normal text-white">
            {text.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {text.subtitle}
          </p>

          {message ? (
            <p className="mt-5 border-l-2 border-brand-purple-500 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-100">
              {message}
            </p>
          ) : null}

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-zinc-200">
              <span>{text.password}</span>
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
            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-brand-purple-600 px-4 text-sm font-black uppercase text-white transition hover:bg-brand-purple-500">
              <KeyRound className="h-4 w-4" />
              {text.submit}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
