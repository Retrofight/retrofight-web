"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Trash2, Upload, X } from "lucide-react";

interface MediaImage {
    name: string;
    url: string;
}

interface MediaLibraryProps {
    selectedUrl?: string | null;
    onSelect: (url: string) => void;
    onClose: () => void;
}

const MEDIA_ENDPOINT = "/api/admin/news/media";

export function MediaLibrary({ selectedUrl, onSelect, onClose }: MediaLibraryProps) {
    const [images, setImages] = useState<MediaImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let mounted = true;
        fetch(MEDIA_ENDPOINT)
            .then(res => res.json())
            .then((data: { images?: MediaImage[] }) => {
                if (mounted) setImages(data.images ?? []);
            })
            .catch(() => mounted && setError("Could not load the media library."))
            .finally(() => mounted && setLoading(false));
        return () => {
            mounted = false;
        };
    }, []);

    async function handleUpload(file: File) {
        setBusy(true);
        setError(null);
        try {
            const body = new FormData();
            body.set("file", file);
            const res = await fetch(MEDIA_ENDPOINT, { method: "POST", body });
            const data = (await res.json()) as { image?: MediaImage; error?: string };
            if (!res.ok || !data.image) {
                setError(data.error ?? "Upload failed.");
                return;
            }
            setImages(prev => [data.image!, ...prev]);
            onSelect(data.image.url);
        } catch {
            setError("Upload failed.");
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(name: string) {
        if (!confirm("Delete this image from the bucket? Posts using it will lose their cover.")) return;
        setBusy(true);
        setError(null);
        try {
            const res = await fetch(`${MEDIA_ENDPOINT}?name=${encodeURIComponent(name)}`, {
                method: "DELETE"
            });
            if (!res.ok) {
                setError("Could not delete image.");
                return;
            }
            setImages(prev => prev.filter(img => img.name !== name));
        } catch {
            setError("Could not delete image.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8">
            <div className="w-full max-w-2xl rounded-sm border border-white/10 bg-dark-card shadow-2xl shadow-black/50">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                    <h3 className="font-display text-sm font-black text-white">Media library</h3>
                    <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => fileInput.current?.click()}
                            className="flex h-8 items-center gap-1 rounded-sm bg-brand-purple-600 px-3 text-xs font-semibold text-white transition hover:bg-brand-purple-500 disabled:opacity-50"
                        >
                            <Upload className="h-3 w-3" /> Upload image
                        </button>
                        <input
                            ref={fileInput}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) void handleUpload(file);
                                e.target.value = "";
                            }}
                        />
                        <span className="text-[11px] text-zinc-500">
                            Reuse existing images to keep the bucket light.
                        </span>
                    </div>

                    {error && (
                        <div className="rounded-sm border border-red-500/30 bg-red-900/20 px-3 py-2 text-xs text-red-300">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <p className="py-8 text-center text-sm text-zinc-500">Loading…</p>
                    ) : images.length === 0 ? (
                        <p className="py-8 text-center text-sm text-zinc-500">No images yet. Upload one above.</p>
                    ) : (
                        <div className="grid max-h-[50vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
                            {images.map(img => {
                                const active = selectedUrl === img.url;
                                return (
                                    <div
                                        key={img.name}
                                        className={`group relative aspect-square overflow-hidden rounded-sm border ${
                                            active ? "border-brand-purple-500" : "border-white/10"
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => onSelect(img.url)}
                                            className="block h-full w-full"
                                            title="Use this image"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={img.url} alt="" className="h-full w-full object-cover" />
                                        </button>
                                        {active && (
                                            <span className="absolute left-1 top-1 rounded-sm bg-brand-purple-600 p-0.5 text-white">
                                                <Check className="h-3 w-3" />
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => void handleDelete(img.name)}
                                            className="absolute right-1 top-1 rounded-sm bg-black/70 p-1 text-red-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-900/60 disabled:opacity-50"
                                            title="Delete from bucket"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex justify-end border-t border-white/10 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-8 rounded-sm border border-white/10 px-3 text-xs font-semibold text-zinc-300 transition hover:bg-white/5"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
