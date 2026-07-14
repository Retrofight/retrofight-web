import Link from "next/link";
import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react";
import { fetchPublicCategories, fetchPublicNews, formatNewsDate } from "@/lib/news/public";
import type { NewsListItem } from "@/lib/admin/news";

export const metadata = {
    title: "News | RetroFight"
};

interface PageProps {
    searchParams: Promise<{ page?: string; category?: string }>;
}

export default async function NewsPage({ searchParams }: PageProps) {
    const sp = await searchParams;
    const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
    const category = sp.category?.trim() || undefined;

    const [categories, result] = await Promise.all([
        fetchPublicCategories(),
        fetchPublicNews({ page, categorySlug: category })
    ]);

    const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

    function pageHref(p: number): string {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (p > 1) params.set("page", String(p));
        const qs = params.toString();
        return `/news${qs ? `?${qs}` : ""}`;
    }

    return (
        <main className="min-h-screen bg-dark-obsidian px-4 py-10 text-gray-100 sm:px-6">
            <section className="mx-auto max-w-5xl">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-purple-400 transition hover:text-white"
                >
                    RetroFight
                </Link>

                <div className="mt-8 flex items-center gap-3">
                    <Newspaper className="h-6 w-6 text-brand-purple-400" />
                    <div>
                        <h1 className="font-display text-3xl font-black text-white">News</h1>
                        <p className="text-xs text-zinc-500">Updates, events and announcements</p>
                    </div>
                </div>

                {/* Category filter */}
                <div className="mt-6 flex flex-wrap gap-2">
                    <CategoryChip label="All" href="/news" active={!category} />
                    {categories.map(cat => (
                        <CategoryChip
                            key={cat.id}
                            label={cat.label}
                            href={`/news?category=${cat.slug}`}
                            active={category === cat.slug}
                            color={cat.color}
                        />
                    ))}
                </div>

                {/* Grid */}
                {result.items.length === 0 ? (
                    <p className="mt-12 text-center text-sm text-zinc-500">No posts yet. Check back soon.</p>
                ) : (
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {result.items.map(item => (
                            <NewsCard key={item.id} item={item} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <nav className="mt-8 flex items-center justify-center gap-2">
                        {page > 1 ? (
                            <Link
                                href={pageHref(page - 1)}
                                className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-brand-purple-500 hover:text-white"
                            >
                                <ChevronLeft className="h-3 w-3" /> Prev
                            </Link>
                        ) : (
                            <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-sm border border-white/5 px-3 py-2 text-xs font-semibold text-zinc-600">
                                <ChevronLeft className="h-3 w-3" /> Prev
                            </span>
                        )}
                        <span className="px-2 text-xs text-zinc-500">
                            Page {page} of {totalPages}
                        </span>
                        {page < totalPages ? (
                            <Link
                                href={pageHref(page + 1)}
                                className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-brand-purple-500 hover:text-white"
                            >
                                Next <ChevronRight className="h-3 w-3" />
                            </Link>
                        ) : (
                            <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-sm border border-white/5 px-3 py-2 text-xs font-semibold text-zinc-600">
                                Next <ChevronRight className="h-3 w-3" />
                            </span>
                        )}
                    </nav>
                )}
            </section>
        </main>
    );
}

function CategoryChip({
    label,
    href,
    active,
    color
}: {
    label: string;
    href: string;
    active: boolean;
    color?: string | null;
}) {
    return (
        <Link
            href={href}
            className={`rounded-sm border px-3 py-1.5 text-xs font-semibold transition ${
                active
                    ? "border-brand-purple-500 bg-brand-purple-900/30 text-brand-purple-300"
                    : "border-white/10 text-zinc-400 hover:border-brand-purple-500 hover:text-white"
            }`}
            style={!active && color ? { color } : undefined}
        >
            {label}
        </Link>
    );
}

function NewsCard({ item }: { item: NewsListItem }) {
    return (
        <Link
            href={`/news/${item.slug}`}
            className="group flex flex-col overflow-hidden rounded-sm border border-white/10 bg-dark-card transition hover:border-brand-purple-500/40"
        >
            <div className="aspect-[16/9] w-full overflow-hidden bg-black/40">
                {item.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={item.cover_image_url}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-zinc-700">
                        <Newspaper className="h-8 w-8" />
                    </div>
                )}
            </div>
            <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-center gap-2">
                    {item.category && (
                        <span
                            className="inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{
                                color: item.category.color ?? "#a1a1aa",
                                borderColor: `${item.category.color ?? "#a1a1aa"}55`
                            }}
                        >
                            {item.category.label}
                        </span>
                    )}
                    <span className="text-[11px] text-zinc-500">{formatNewsDate(item)}</span>
                </div>
                <h2 className="font-display text-base font-black leading-snug text-white group-hover:text-brand-purple-300">
                    {item.title}
                </h2>
                {item.summary && (
                    <p className="mt-2 line-clamp-3 text-sm text-zinc-400">{item.summary}</p>
                )}
            </div>
        </Link>
    );
}
