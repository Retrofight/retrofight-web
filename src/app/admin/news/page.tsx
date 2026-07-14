import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { DEFAULT_NEWS_PAGE_SIZE, fetchAdminNews } from "@/lib/admin/news";
import { AdminNewsList } from "@/components/admin/AdminNewsList";

export default async function AdminNewsPage({
    searchParams
}: {
    searchParams: Promise<{ page?: string; notice?: string }>;
}) {
    await requireAdmin();
    const { page: rawPage, notice } = await searchParams;
    const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);

    const { items, total, pageSize } = await fetchAdminNews(page, DEFAULT_NEWS_PAGE_SIZE);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-black text-white">News</h2>
                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/news/categories"
                        className="h-8 rounded-sm border border-white/10 px-3 text-xs font-semibold leading-8 text-zinc-300 transition hover:bg-white/5"
                    >
                        Categories
                    </Link>
                    <Link
                        href="/admin/news/new"
                        className="flex h-8 items-center gap-1 rounded-sm bg-brand-purple-600 px-3 text-xs font-semibold text-white transition hover:bg-brand-purple-500"
                    >
                        <Plus className="h-3 w-3" /> New post
                    </Link>
                </div>
            </div>

            <AdminNewsList items={items} page={page} pageSize={pageSize} total={total} notice={notice} />
        </div>
    );
}
