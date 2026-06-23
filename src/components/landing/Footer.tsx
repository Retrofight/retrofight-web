import Link from "next/link";
import Image from "next/image";
import { ArrowUp, Code, Download } from "lucide-react";
import type { Locale, dictionaries } from "@/app/[lang]/dictionaries";

type FooterProps = {
  lang: Locale;
  dictionary: (typeof dictionaries)[Locale];
};

export default function Footer({ lang, dictionary }: FooterProps) {
  return (
    <footer className="border-t border-white/10 bg-black py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 text-sm text-zinc-500 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <Link href={`/${lang}`} className="flex items-center gap-3">
            <Image
              src="/retrofight.ico"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8"
              aria-hidden="true"
            />
            <span>
              <span className="block font-display text-lg font-black uppercase italic text-white">
                RetroFight
              </span>
              <span className="block font-pixel text-[8px] uppercase tracking-widest text-brand-purple-400">
                Beta
              </span>
            </span>
          </Link>

          <div className="flex flex-wrap gap-3">
            <a
              href={dictionary.installerUrl}
              className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 font-semibold text-zinc-300 transition hover:border-brand-purple-500 hover:text-white"
            >
              <Download className="h-4 w-4" />
              Windows
            </a>
            <a
              href={dictionary.linuxAppImageUrl}
              className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 font-semibold text-zinc-300 transition hover:border-brand-purple-500 hover:text-white"
            >
              <Download className="h-4 w-4" />
              Linux
            </a>
            <a
              href={dictionary.releaseUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 font-semibold text-zinc-300 transition hover:border-brand-purple-500 hover:text-white"
            >
              <Code className="h-4 w-4" />
              GitHub
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 font-semibold text-zinc-300 transition hover:border-brand-purple-500 hover:text-white"
              aria-label={dictionary.footer.backToTop}
            >
              <ArrowUp className="h-4 w-4" />
            </a>
          </div>
        </div>

        <p>
          Copyright {new Date().getFullYear()} {dictionary.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
