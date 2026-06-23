import Link from "next/link";
import { notFound } from "next/navigation";
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
    <main className="min-h-screen bg-dark-obsidian px-4 py-10 text-gray-100 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl">
        <Link
          href={`/${lang}`}
          className="mb-8 inline-flex rounded-sm border border-white/10 px-4 py-3 text-sm font-semibold uppercase text-zinc-300 transition hover:border-brand-purple-500 hover:text-white"
        >
          {dictionary.legal.back}
        </Link>

        <div className="rounded-sm border border-white/10 bg-dark-card p-6 shadow-2xl shadow-black/40 sm:p-8">
          <MarkdownDocument markdown={document.markdown} />
        </div>
      </article>
    </main>
  );
}
