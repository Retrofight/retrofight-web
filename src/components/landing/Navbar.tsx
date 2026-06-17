import Link from "next/link";
import Image from "next/image";
import { Code, Download, LogOut, UserRound } from "lucide-react";
import type { Locale, dictionaries } from "@/app/[lang]/dictionaries";
import { signOut } from "@/app/[lang]/profile/actions";

type NavbarProps = {
  lang: Locale;
  dictionary: (typeof dictionaries)[Locale];
  isAuthenticated?: boolean;
};

export default function Navbar({
  lang,
  dictionary,
  isAuthenticated = false,
}: NavbarProps) {
  const alternateLang = lang === "en" ? "it" : "en";

  return (
    <nav className="sticky top-0 z-50 border-b border-dark-border bg-dark-obsidian/88 py-3 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href={`/${lang}`} className="flex items-center space-x-3 group">
            <Image
              src="/retrofight.ico"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9"
              aria-hidden="true"
            />
            <span className="flex flex-col">
              <span className="font-display font-black italic tracking-tighter text-xl text-white">
                RETROFIGHT
              </span>
              <span className="font-pixel text-[8px] tracking-[0.2em] text-brand-purple-400 leading-none">
                FBNEO GGPO
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={dictionary.githubOrg}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-xs font-semibold uppercase text-zinc-300 transition hover:border-brand-purple-500 hover:text-white sm:inline-flex"
            >
              <Code className="h-4 w-4" />
              {dictionary.nav.github}
            </a>
            <Link
              href={`/${lang}/wiki`}
              className="rounded-sm border border-white/10 px-3 py-2 text-xs font-semibold uppercase text-zinc-300 transition hover:border-brand-purple-500 hover:text-white"
            >
              {dictionary.nav.wiki}
            </Link>
            {isAuthenticated ? (
              <details className="group relative">
                <summary
                  className="inline-flex cursor-pointer list-none items-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-xs font-semibold uppercase text-zinc-300 transition hover:border-brand-purple-500 hover:text-white"
                  aria-label={dictionary.nav.userMenu}
                >
                  <UserRound className="h-4 w-4" />
                  {dictionary.nav.profile}
                </summary>
                <div className="absolute right-0 mt-2 grid min-w-40 gap-1 border border-white/10 bg-dark-card p-2 shadow-2xl shadow-black/40">
                  <Link
                    href={`/${lang}/profile`}
                    className="rounded-sm px-3 py-2 text-xs font-semibold uppercase text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    {dictionary.nav.profile}
                  </Link>
                  <form action={signOut.bind(null, lang)}>
                    <button className="inline-flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs font-semibold uppercase text-zinc-300 transition hover:bg-white/[0.05] hover:text-white">
                      <LogOut className="h-4 w-4" />
                      {dictionary.nav.signOut}
                    </button>
                  </form>
                </div>
              </details>
            ) : (
              <Link
                href={`/${lang}/login`}
                className="rounded-sm border border-white/10 px-3 py-2 text-xs font-semibold uppercase text-zinc-300 transition hover:border-brand-purple-500 hover:text-white"
              >
                {dictionary.nav.auth}
              </Link>
            )}
            <Link
              href={`/${alternateLang}`}
              className="rounded-sm border border-white/10 px-3 py-2 text-xs font-semibold uppercase text-zinc-300 transition hover:border-brand-purple-500 hover:text-white"
              aria-label={dictionary.nav.language}
            >
              {alternateLang.toUpperCase()}
            </Link>
            <a
              href={dictionary.installerUrl}
              className="inline-flex items-center gap-2 rounded-sm bg-brand-purple-600 px-3 py-2 text-xs font-black uppercase text-white transition hover:bg-brand-purple-500"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{dictionary.nav.downloads}</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
