"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import type { Dictionary } from "@/app/dictionary";
import { updatePrivacyConsent } from "@/app/profile/actions";

type PrivacyConsentPanelProps = {
  accepted: boolean;
  dictionary: Dictionary["profile"]["privacyConsent"];
};

export function PrivacyConsentPanel({
  accepted,
  dictionary: text,
}: PrivacyConsentPanelProps) {
  const [checked, setChecked] = useState(accepted);

  return (
    <section className="rounded-sm border border-white/10 bg-dark-card p-6 shadow-2xl shadow-black/30">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-brand-purple-400" />
        <h2 className="font-display text-xl font-black text-white">
          {text.title}
        </h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-400">
        {text.description}
      </p>

      <form
        action={updatePrivacyConsent}
        className="mt-5 grid gap-4"
      >
        <label className="flex gap-3 rounded-sm border border-white/10 bg-black/30 p-3 text-sm leading-6 text-zinc-300">
          <input
            name="privacyConsent"
            type="checkbox"
            value="accepted"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-brand-purple-500"
          />
          <span>{text.checkbox}</span>
        </label>

        {!checked ? (
          <p className="border-l-2 border-amber-300 bg-amber-950/20 px-4 py-3 text-sm leading-6 text-amber-100">
            {text.revocationWarning}
          </p>
        ) : null}

        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-brand-purple-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-purple-500">
          <ShieldCheck className="h-4 w-4" />
          {text.save}
        </button>
      </form>
    </section>
  );
}
