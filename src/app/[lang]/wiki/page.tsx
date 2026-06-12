import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getDictionary, hasLocale } from "../dictionaries";
import { notFound } from "next/navigation";

export default async function WikiPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dictionary = getDictionary(lang);
  const wiki = dictionary.wiki;

  return (
    <main className="min-h-screen bg-dark-obsidian text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-5 py-10 sm:px-8 lg:py-14">
        <Link
          href={`/${lang}`}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-purple-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {wiki.back}
        </Link>

        <header className="border-b border-white/10 pb-8">
          <div className="mb-4 flex items-center gap-3">
            <Image
              src="/retrofight.ico"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10"
              aria-hidden="true"
            />
            <span className="font-pixel text-[9px] uppercase tracking-widest text-brand-purple-400">
              RetroFight Wiki
            </span>
          </div>
          <h1 className="font-display text-4xl font-black uppercase italic tracking-normal text-white sm:text-5xl">
            {wiki.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
            {wiki.subtitle}
          </p>
        </header>

        <div className="space-y-10">
          {wiki.sections.map((section) => (
            <section key={section.title} className="space-y-4">
              <h2 className="font-display text-2xl font-extrabold uppercase italic tracking-normal text-white">
                {section.title}
              </h2>

              {"paragraphs" in section &&
                section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="leading-relaxed text-zinc-300">
                    {paragraph}
                  </p>
                ))}

              {"items" in section && section.items && (
                <ul className="space-y-2 text-zinc-300">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-brand-purple-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {"ordered" in section && section.ordered && (
                <ol className="list-decimal space-y-2 pl-5 text-zinc-300">
                  {section.ordered.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              )}

              {"groups" in section && section.groups && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {section.groups.map((group) => (
                    <div
                      key={group.title}
                      className="rounded-sm border border-white/10 bg-dark-card p-5"
                    >
                      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-normal text-white">
                        {group.title}
                      </h3>
                      <ul className="space-y-2 text-sm text-zinc-400">
                        {group.items.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-2 h-1 w-1 shrink-0 bg-brand-purple-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {"note" in section && section.note && (
                <p className="border-l-2 border-brand-purple-500 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-zinc-300">
                  {section.note}
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
