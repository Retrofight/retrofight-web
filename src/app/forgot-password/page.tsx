import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { dictionary } from "../dictionary";
import { requestPasswordReset } from "../login/actions";

type ForgotPasswordStatus = "missing_email" | "request_failed";
type ForgotPasswordNotice = "reset_sent";

function isError(value: string | undefined): value is ForgotPasswordStatus {
  return value === "missing_email" || value === "request_failed";
}

function isNotice(value: string | undefined): value is ForgotPasswordNotice {
  return value === "reset_sent";
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/profile");
  }

  const text = dictionary.forgotPassword;
  const message = isError(error)
    ? error === "missing_email"
      ? text.missingEmail
      : text.requestFailed
    : isNotice(notice)
      ? text.resetSent
      : null;

  return (
    <main className="min-h-screen bg-dark-obsidian px-4 py-10 text-gray-100 sm:px-6">
      <section className="mx-auto max-w-xl">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand-purple-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {text.back}
        </Link>

        <form
          action={requestPasswordReset}
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
              <span>{text.email}</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
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
