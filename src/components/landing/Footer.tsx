import Link from "next/link";
import type { Locale, dictionaries } from "@/app/[lang]/dictionaries";
import { getLegalDocuments } from "@/lib/legal/documents";

type FooterProps = {
  lang: Locale;
  dictionary: (typeof dictionaries)[Locale];
};

export default function Footer({ lang, dictionary }: FooterProps) {
  const legalDocuments = getLegalDocuments(lang);

  return (
    <footer className="border-t border-white/10 bg-black py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-5 text-center text-sm text-zinc-500 sm:px-8">
        <nav
          className="flex flex-wrap justify-center gap-x-5 gap-y-2"
          aria-label={dictionary.legal.navLabel}
        >
          {legalDocuments.map((document) => (
            <Link
              key={document.slug}
              href={`/${lang}/legal/${document.slug}`}
              className="font-semibold text-zinc-300 transition hover:text-white"
            >
              {document.footerLabel}
            </Link>
          ))}
        </nav>
        <p className="max-w-3xl leading-relaxed">
          Copyright {new Date().getFullYear()} {dictionary.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
