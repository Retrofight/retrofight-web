"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ImageIcon, X } from "lucide-react";
import type { NewsCategory, NewsRow } from "@/lib/admin/news";
import { slugify } from "@/lib/admin/slug";
import { saveNews } from "@/app/admin/news/actions";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

interface NewsEditorProps {
    categories: NewsCategory[];
    news?: NewsRow | null;
    error?: string;
}

const ERRORS: Record<string, string> = {
    title: "A title is required.",
    save: "Could not save the post. Check the fields and try again."
};

const inputClass =
    "h-9 w-full rounded-sm border border-white/10 bg-black/40 px-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-brand-purple-500";
const labelClass = "mb-1 block text-[10px] font-black uppercase tracking-widest text-zinc-500";

export function NewsEditor({ categories, news, error }: NewsEditorProps) {
    const [title, setTitle] = useState(news?.title ?? "");
    const [slug, setSlug] = useState(news?.slug ?? "");
    const [slugTouched, setSlugTouched] = useState(Boolean(news?.slug));
    const [coverUrl, setCoverUrl] = useState(news?.cover_image_url ?? "");
    const [libraryOpen, setLibraryOpen] = useState(false);

    function onTitleChange(value: string) {
        setTitle(value);
        if (!slugTouched) setSlug(slugify(value));
    }

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
                <Link href="/admin/news" className="text-zinc-500 hover:text-white">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <h2 className="font-display text-lg font-black text-white">
                    {news ? "Edit post" : "New post"}
                </h2>
            </div>

            {error && ERRORS[error] && (
                <div className="rounded-sm border border-red-500/30 bg-red-900/20 px-3 py-2 text-xs text-red-300">
                    {ERRORS[error]}
                </div>
            )}

            <form
                action={saveNews}
                className="space-y-4 rounded-sm border border-white/10 bg-dark-card p-5 shadow-2xl shadow-black/30"
            >
                {news && <input type="hidden" name="id" value={news.id} />}

                <div>
                    <label className={labelClass}>Title</label>
                    <input
                        name="title"
                        value={title}
                        onChange={e => onTitleChange(e.target.value)}
                        required
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className={labelClass}>Slug</label>
                    <input
                        name="slug"
                        value={slug}
                        onChange={e => {
                            setSlug(e.target.value);
                            setSlugTouched(true);
                        }}
                        placeholder="auto-generated-from-title"
                        className={`${inputClass} font-mono`}
                    />
                    <p className="mt-1 text-[11px] text-zinc-600">Public URL: /news/{slug || "…"}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Category</label>
                        <select
                            name="category_id"
                            defaultValue={news?.category_id ?? ""}
                            className={`${inputClass} appearance-none`}
                        >
                            <option value="">— none —</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Status</label>
                        <select
                            name="status"
                            defaultValue={news?.status ?? "draft"}
                            className={`${inputClass} appearance-none`}
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Summary / description</label>
                    <textarea
                        name="summary"
                        defaultValue={news?.summary ?? ""}
                        rows={2}
                        className="w-full rounded-sm border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-brand-purple-500"
                    />
                </div>

                <div>
                    <label className={labelClass}>Body</label>
                    <textarea
                        name="body"
                        defaultValue={news?.body ?? ""}
                        rows={12}
                        className="w-full rounded-sm border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-brand-purple-500"
                    />
                </div>

                <div className="space-y-2 rounded-sm border border-white/10 bg-black/20 p-3">
                    <label className={labelClass}>Cover image</label>
                    {/* Cover URL is driven by state: the media library sets it, the
                        Remove button clears it (empty submits as null → no cover). */}
                    <input type="hidden" name="cover_image_url" value={coverUrl} />

                    {coverUrl ? (
                        <div className="flex items-start gap-3">
                            <div className="inline-flex max-w-[160px] overflow-hidden rounded-sm border border-white/10 bg-black/40 p-1">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={coverUrl} alt="Cover" className="max-h-24 w-auto object-contain" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLibraryOpen(true)}
                                    className="flex h-8 items-center gap-1 rounded-sm border border-white/10 px-3 text-xs font-semibold text-zinc-300 transition hover:bg-white/5"
                                >
                                    <ImageIcon className="h-3 w-3" /> Change
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCoverUrl("")}
                                    className="flex h-8 items-center gap-1 rounded-sm border border-red-500/30 px-3 text-xs font-semibold text-red-300 transition hover:bg-red-900/20"
                                >
                                    <X className="h-3 w-3" /> Remove
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setLibraryOpen(true)}
                            className="flex h-8 items-center gap-1 rounded-sm bg-brand-purple-600 px-3 text-xs font-semibold text-white transition hover:bg-brand-purple-500"
                        >
                            <ImageIcon className="h-3 w-3" /> Choose / upload image
                        </button>
                    )}
                    <p className="text-[11px] text-zinc-600">
                        Pick from the library or upload a new image. Images are reusable across posts.
                    </p>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                    <Link
                        href="/admin/news"
                        className="h-9 rounded-sm border border-white/10 px-4 text-sm font-semibold leading-9 text-zinc-300 transition hover:bg-white/5"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="h-9 rounded-sm bg-brand-purple-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-purple-500"
                    >
                        Save
                    </button>
                </div>
            </form>

            {libraryOpen && (
                <MediaLibrary
                    selectedUrl={coverUrl || null}
                    onSelect={url => {
                        setCoverUrl(url);
                        setLibraryOpen(false);
                    }}
                    onClose={() => setLibraryOpen(false)}
                />
            )}
        </div>
    );
}
