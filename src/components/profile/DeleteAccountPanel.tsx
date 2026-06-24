"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import type { Dictionary } from "@/app/dictionary";
import { deleteAccount } from "@/app/profile/actions";

type DeleteAccountPanelProps = {
  email: string;
  dictionary: Dictionary["profile"]["deleteAccount"];
};

export function DeleteAccountPanel({
  email,
  dictionary: text,
}: DeleteAccountPanelProps) {
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const canSubmit = useMemo(
    () => confirmEmail.trim().toLowerCase() === email.toLowerCase(),
    [confirmEmail, email],
  );

  return (
    <>
      <section className="rounded-sm border border-red-500/30 bg-red-950/10 p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-300" />
          <h2 className="font-display text-xl font-black text-white">
            {text.title}
          </h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {text.description}
        </p>
        <button
          type="button"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-red-400/40 px-4 text-sm font-semibold text-red-100 transition hover:border-red-300 hover:bg-red-500/10"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          {text.open}
        </button>
      </section>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 py-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-lg rounded-sm border border-red-500/30 bg-dark-card p-6 shadow-2xl shadow-black/70">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-300" />
                <h2
                  id="delete-account-title"
                  className="font-display text-2xl font-black text-white"
                >
                  {text.modalTitle}
                </h2>
              </div>
              <button
                type="button"
                className="rounded-sm border border-white/10 p-2 text-zinc-400 transition hover:text-white"
                onClick={() => setOpen(false)}
                aria-label={text.cancel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-300">
              {text.disclaimer}
            </p>

            <form
              action={deleteAccount}
              className="mt-6 grid gap-4"
            >
              <label className="grid gap-2 text-sm font-semibold text-zinc-200">
                <span>{text.confirmLabel}</span>
                <input
                  name="confirmEmail"
                  type="email"
                  autoComplete="email"
                  value={confirmEmail}
                  onChange={(event) => setConfirmEmail(event.target.value)}
                  placeholder={email}
                  required
                  className="h-12 rounded-sm border border-white/10 bg-black/45 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-300"
                />
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-sm border border-white/10 px-4 text-sm font-semibold text-zinc-200 transition hover:border-brand-purple-500 hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  {text.cancel}
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-red-500 px-4 text-sm font-semibold text-white transition enabled:hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!canSubmit}
                >
                  <Trash2 className="h-4 w-4" />
                  {text.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
