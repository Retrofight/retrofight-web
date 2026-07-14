import { createAdminClient } from "@/lib/supabase/admin";

// Cover images live under this prefix in the public "news" bucket.
export const NEWS_BUCKET = "news";
export const COVERS_PREFIX = "covers";
export const MAX_COVER_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif"
]);

export interface MediaImage {
    name: string; // path relative to the bucket, e.g. "covers/123.png"
    url: string;
}

function publicUrl(path: string): string {
    return createAdminClient().storage.from(NEWS_BUCKET).getPublicUrl(path).data.publicUrl;
}

// Lists cover images newest-first. Reusable across news posts so the same asset
// can be selected multiple times without re-uploading.
export async function listNewsImages(): Promise<MediaImage[]> {
    const admin = createAdminClient();
    const { data, error } = await admin.storage.from(NEWS_BUCKET).list(COVERS_PREFIX, {
        limit: 200,
        sortBy: { column: "created_at", order: "desc" }
    });
    if (error || !data) return [];

    return data
        .filter(entry => entry.id !== null && !entry.name.startsWith(".")) // skip folder placeholders
        .map(entry => {
            const path = `${COVERS_PREFIX}/${entry.name}`;
            return { name: path, url: publicUrl(path) };
        });
}

export async function uploadNewsImage(file: File): Promise<MediaImage | null> {
    if (!ALLOWED_IMAGE_TYPES.has(file.type) || file.size === 0 || file.size > MAX_COVER_BYTES) {
        return null;
    }
    const admin = createAdminClient();
    const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
    const path = `${COVERS_PREFIX}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error } = await admin.storage.from(NEWS_BUCKET).upload(path, bytes, {
        contentType: file.type,
        upsert: false
    });
    if (error) return null;

    return { name: path, url: publicUrl(path) };
}

// Deletes an object by its bucket-relative path. Guards against escaping the
// covers prefix (only paths under COVERS_PREFIX are accepted).
export async function deleteNewsImage(name: string): Promise<boolean> {
    if (!name.startsWith(`${COVERS_PREFIX}/`) || name.includes("..")) {
        return false;
    }
    const admin = createAdminClient();
    const { error } = await admin.storage.from(NEWS_BUCKET).remove([name]);
    return !error;
}
