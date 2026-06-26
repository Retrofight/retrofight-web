import { Globe } from "lucide-react";
import type { Dictionary } from "@/app/dictionary";
import { updateProfile } from "@/app/profile/actions";

type EditProfileDictionary = Dictionary["profile"]["editProfile"];

interface ProfileEditPanelProps {
  avatarUrl: string | null;
  country: string | null;
  isPublic: boolean;
  dictionary: EditProfileDictionary;
}

export function ProfileEditPanel({
  avatarUrl,
  country,
  isPublic,
  dictionary: text,
}: ProfileEditPanelProps) {
  return (
    <section className="rounded-sm border border-white/10 bg-dark-card p-6 shadow-2xl shadow-black/30">
      <div className="flex items-center gap-3">
        <Globe className="h-5 w-5 text-brand-purple-400" />
        <h2 className="font-display text-xl font-black text-white">
          {text.title}
        </h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{text.description}</p>

      <form action={updateProfile} className="mt-6 grid gap-4">
        <label className="flex gap-3 rounded-sm border border-white/10 bg-black/30 p-3 text-sm leading-6 text-zinc-300">
          <input
            name="is_public"
            type="checkbox"
            value="true"
            defaultChecked={isPublic}
            className="mt-1 h-4 w-4 shrink-0 accent-brand-purple-500"
          />
          <span>{text.publicLabel}</span>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-200">
          <span>{text.avatarUrl}</span>
          <input
            name="avatar_url"
            type="url"
            defaultValue={avatarUrl ?? ""}
            placeholder="https://..."
            className="h-12 rounded-sm border border-white/10 bg-black/45 px-3 text-sm text-white outline-none transition focus:border-brand-purple-500"
          />
          <span className="text-xs font-normal text-zinc-500">{text.avatarUrlHint}</span>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-200">
          <span>{text.country}</span>
          <input
            name="country"
            type="text"
            defaultValue={country ?? ""}
            maxLength={2}
            placeholder="IT"
            className="h-12 w-24 rounded-sm border border-white/10 bg-black/45 px-3 text-sm uppercase text-white outline-none transition focus:border-brand-purple-500"
          />
          <span className="text-xs font-normal text-zinc-500">{text.countryHint}</span>
        </label>

        <button className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-brand-purple-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-purple-500">
          <Globe className="h-4 w-4" />
          {text.save}
        </button>
      </form>
    </section>
  );
}
