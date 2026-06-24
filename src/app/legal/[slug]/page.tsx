import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MarkdownDocument } from "@/components/legal/MarkdownDocument";
import { getLegalDocument, getLegalDocumentSlugs } from "@/lib/legal/documents";
import { dictionary } from "../../dictionary";

export function generateStaticParams() {
  return getLegalDocumentSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const document = getLegalDocument(slug);

  return {
    title: document ? `${document.title} | RetroFight` : "RetroFight Legal"
  };
}

export default async function LegalPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const document = getLegalDocument(slug);
  if (!document) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-dark-obsidian text-gray-100">
      <article className="mx-auto flex max-w-4xl flex-col gap-8 px-5 py-10 sm:px-8 lg:py-14">
        <Link
          href="/"
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
