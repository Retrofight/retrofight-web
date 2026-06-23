import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MarkdownDocument } from "@/components/legal/MarkdownDocument";
import { getLegalDocument, getLegalDocumentSlugs } from "@/lib/legal/documents";
import { getDictionary, hasLocale, locales } from "../../dictionaries";

export function generateStaticParams() {
  return locales.flatMap((lang) =>
    getLegalDocumentSlugs().map((slug) => ({
      lang,
      slug
    }))
  );
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const document = getLegalDocument(hasLocale(lang) ? lang : "en", slug);

  return {
    title: document ? `${document.title} | RetroFight` : "RetroFight Legal"
  };
}

export default async function LegalPage({
  params
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const document = getLegalDocument(lang, slug);
  if (!document) {
    notFound();
  }

  const dictionary = getDictionary(lang);

  return (
    <main className="min-h-screen bg-dark-obsidian text-gray-100">
      <article className="mx-auto flex max-w-4xl flex-col gap-8 px-5 py-10 sm:px-8 lg:py-14">
        <Link
          href={`/${lang}`}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-purple-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {dictionary.legal.back}
        </Link>

        <div className="border-t border-white/10 pt-8">
          <MarkdownDocument markdown={document.markdown} />
        </div>
      </article>
    </main>
  );
}
