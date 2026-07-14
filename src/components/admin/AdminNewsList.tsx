"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NewsListItem } from "@/lib/admin/news";
import { deleteNews } from "@/app/admin/news/actions";

interface AdminNewsListProps {
    items: NewsListItem[];
    page: number;
    pageSize: number;
    total: number;
    notice?: string;
}

const NOTICES: Record<string, { text: string; ok: boolean }> = {
    saved: { text: "Post saved.", ok: true },
    deleted: { text: "Post deleted.", ok: true },
    delete_failed: { text: "Could not delete post.", ok: false }
};

function formatDate(value: string | null): string {
    return value ? new Date(value).toISOString().slice(0, 10) : "—";
}

export function AdminNewsList({ items, page, pageSize, total, notice }: AdminNewsListProps) {
    const router = useRouter();
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const noticeInfo = notice ? NOTICES[notice] : undefined;

    return (
        <section className="rounded-sm border border-white/10 bg-dark-card p-4 shadow-2xl shadow-black/30">
            {noticeInfo && (
                <div
                    className={`mb-4 rounded-sm border px-3 py-2 text-xs ${
                        noticeInfo.ok
                            ? "border-green-500/30 bg-green-900/20 text-green-300"
                            : "border-red-500/30 bg-red-900/20 text-red-300"
                    }`}
                >
                    {noticeInfo.text}
                </div>
            )}

            {items.length === 0 ? (
                <p className="py-12 text-center text-sm text-zinc-500">No posts yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-white/10 text-zinc-500">
                                <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">Title</th>
                                <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">Category</th>
                                <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">Status</th>
                                <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">Published</th>
                                <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">Updated</th>
                                <th className="pb-2 font-semibold uppercase tracking-wider" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-white/[0.03]">
                                    <td className="py-2 pr-4">
                                        <Link
                                            href={`/admin/news/${item.id}`}
                                            className="font-semibold text-zinc-100 hover:text-brand-purple-300"
                                        >
                                            {item.title}
                                        </Link>
                                        <span className="block text-[11px] text-zinc-600">/{item.slug}</span>
                                    </td>
                                    <td className="py-2 pr-4">
                                        {item.category ? (
                                            <span
                                                className="inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold"
                                                style={{
                                                    color: item.category.color ?? "#a1a1aa",
                                                    borderColor: `${item.category.color ?? "#a1a1aa"}55`
                                                }}
                                            >
                                                {item.category.label}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">—</span>
                                        )}
                                    </td>
                                    <td className="py-2 pr-4">
                                        {item.status === "published" ? (
                                            <span className="text-green-400">Published</span>
                                        ) : (
                                            <span className="text-yellow-400">Draft</span>
                                        )}
                                    </td>
                                    <td className="py-2 pr-4 tabular-nums text-zinc-400">
                                        {formatDate(item.published_at)}
                                    </td>
                                    <td className="py-2 pr-4 tabular-nums text-zinc-400">
                                        {formatDate(item.updated_at)}
                                    </td>
                                    <td className="py-2 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/news/${item.id}`}
                                                className="rounded-sm border border-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-300 transition hover:bg-white/5"
                                            >
                                                Edit
                                            </Link>
                                            <form
                                                action={deleteNews}
                                                onSubmit={e => {
                                                    if (!confirm(`Delete "${item.title}"?`)) e.preventDefault();
                                                }}
                                            >
                                                <input type="hidden" name="id" value={item.id} />
                                                <button
                                                    type="submit"
                                                    className="rounded-sm border border-red-500/30 px-2 py-1 text-[11px] font-semibold text-red-300 transition hover:bg-red-900/20"
                                                >
                                                    Delete
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {total > 0 && (
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-zinc-400">
                    <span>Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => router.push(`/admin/news?page=${page - 1}`)}
                            className="flex items-center gap-1 rounded-sm border border-white/10 px-2 py-1 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft className="h-3 w-3" /> Prev
                        </button>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => router.push(`/admin/news?page=${page + 1}`)}
                            className="flex items-center gap-1 rounded-sm border border-white/10 px-2 py-1 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
