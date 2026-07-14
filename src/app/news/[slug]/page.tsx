import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { fetchPublicNewsBySlug, formatNewsDate } from "@/lib/news/public";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const news = await fetchPublicNewsBySlug(slug);
    if (!news) return { title: "News | RetroFight" };

    return {
        title: `${news.title} | RetroFight`,
        description: news.summary ?? undefined,
        openGraph: {
            title: news.title,
            description: news.summary ?? undefined,
            images: news.cover_image_url ? [{ url: news.cover_image_url }] : undefined,
            type: "article"
        }
    };
}

export default async function NewsArticlePage({ params }: PageProps) {
    const { slug } = await params;
    const news = await fetchPublicNewsBySlug(slug);
    if (!news) notFound();

    return (
        <main className="min-h-screen bg-dark-obsidian px-4 py-10 text-gray-100 sm:px-6">
            <article className="mx-auto max-w-3xl">
                <Link
                    href="/news"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-purple-400 transition hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to News
                </Link>

                {news.cover_image_url && (
                    <div className="mt-8">
                        <div className="inline-flex max-w-[160px] overflow-hidden rounded-sm border border-white/10 bg-black/40 p-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={news.cover_image_url}
                                alt=""
                                className="max-h-24 w-auto object-contain"
                            />
                        </div>
                    </div>
                )}

                <div className="mt-6 flex items-center gap-2">
                    {news.category && (
                        <span
                            className="inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{
                                color: news.category.color ?? "#a1a1aa",
                                borderColor: `${news.category.color ?? "#a1a1aa"}55`
                            }}
                        >
                            {news.category.label}
                        </span>
                    )}
                    <span className="text-xs text-zinc-500">{formatNewsDate(news)}</span>
                </div>

                <h1 className="mt-3 font-display text-3xl font-black leading-tight text-white sm:text-4xl">
                    {news.title}
                </h1>

                {news.summary && <p className="mt-4 text-lg text-zinc-400">{news.summary}</p>}

                {news.body && (
                    <div className="mt-8 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-200">
                        {news.body}
                    </div>
                )}
            </article>
        </main>
    );
}
