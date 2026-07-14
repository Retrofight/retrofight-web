"use client";

import type { NewsCategory } from "@/lib/admin/news";
import { deleteCategory, saveCategory } from "@/app/admin/news/actions";

interface Props {
    categories: NewsCategory[];
    notice?: string;
}

const NOTICES: Record<string, { text: string; ok: boolean }> = {
    saved: { text: "Category saved.", ok: true },
    deleted: { text: "Category deleted.", ok: true },
    invalid: { text: "A label is required.", ok: false },
    save_failed: { text: "Could not save category.", ok: false },
    delete_failed: { text: "Could not delete category.", ok: false }
};

const inputClass =
    "h-8 w-full rounded-sm border border-white/10 bg-black/40 px-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-brand-purple-500";

export function NewsCategoriesManager({ categories, notice }: Props) {
    const noticeInfo = notice ? NOTICES[notice] : undefined;

    return (
        <section className="space-y-4 rounded-sm border border-white/10 bg-dark-card p-4 shadow-2xl shadow-black/30">
            {noticeInfo && (
                <div
                    className={`rounded-sm border px-3 py-2 text-xs ${
                        noticeInfo.ok
                            ? "border-green-500/30 bg-green-900/20 text-green-300"
                            : "border-red-500/30 bg-red-900/20 text-red-300"
                    }`}
                >
                    {noticeInfo.text}
                </div>
            )}

            <ul className="divide-y divide-white/5">
                {categories.map(cat => (
                    <li key={cat.id} className="py-2">
                        <form action={saveCategory} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="id" value={cat.id} />
                            <span
                                className="inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold"
                                style={{
                                    color: cat.color ?? "#a1a1aa",
                                    borderColor: `${cat.color ?? "#a1a1aa"}55`
                                }}
                            >
                                {cat.slug}
                            </span>
                            <input name="label" defaultValue={cat.label} className={`${inputClass} w-32`} />
                            <input name="slug" defaultValue={cat.slug} className={`${inputClass} w-28 font-mono`} />
                            <input
                                name="color"
                                type="color"
                                defaultValue={cat.color ?? "#a1a1aa"}
                                className="h-8 w-10 rounded-sm border border-white/10 bg-black/40"
                            />
                            <input
                                name="sort"
                                type="number"
                                defaultValue={cat.sort}
                                className={`${inputClass} w-16`}
                            />
                            <button
                                type="submit"
                                className="h-8 rounded-sm border border-white/10 px-3 text-xs font-semibold text-zinc-300 transition hover:bg-white/5"
                            >
                                Save
                            </button>
                            <button
                                type="submit"
                                formAction={deleteCategory}
                                className="h-8 rounded-sm border border-red-500/30 px-3 text-xs font-semibold text-red-300 transition hover:bg-red-900/20"
                            >
                                Delete
                            </button>
                        </form>
                    </li>
                ))}
            </ul>

            {/* New category */}
            <form
                action={saveCategory}
                className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4"
            >
                <input name="label" placeholder="Label" required className={`${inputClass} w-32`} />
                <input name="slug" placeholder="slug (auto)" className={`${inputClass} w-28 font-mono`} />
                <input
                    name="color"
                    type="color"
                    defaultValue="#a78bfa"
                    className="h-8 w-10 rounded-sm border border-white/10 bg-black/40"
                />
                <input name="sort" type="number" defaultValue={0} className={`${inputClass} w-16`} />
                <button
                    type="submit"
                    className="h-8 rounded-sm bg-brand-purple-600 px-3 text-xs font-semibold text-white transition hover:bg-brand-purple-500"
                >
                    Add
                </button>
            </form>
        </section>
    );
}
