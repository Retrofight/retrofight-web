"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/admin/slug";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

function clean(value: FormDataEntryValue | null): string {
    return typeof value === "string" ? value.trim() : "";
}

// Ensures the slug is unique in the news table, appending -2, -3… on collision.
async function ensureUniqueSlug(
    admin: SupabaseClient,
    base: string,
    excludeId: string | null
): Promise<string> {
    const root = base || "post";
    let candidate = root;
    for (let i = 2; i < 100; i++) {
        let query = admin.from("news").select("id").eq("slug", candidate).limit(1);
        if (excludeId) query = query.neq("id", excludeId);
        const { data } = await query;
        if (!data || data.length === 0) return candidate;
        candidate = `${root}-${i}`;
    }
    return `${root}-${Date.now()}`;
}

async function uploadCover(admin: SupabaseClient, file: File): Promise<string | null> {
    if (!ALLOWED_IMAGE_TYPES.has(file.type) || file.size === 0 || file.size > MAX_COVER_BYTES) {
        return null;
    }
    const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
    const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error } = await admin.storage.from("news").upload(path, bytes, {
        contentType: file.type,
        upsert: false
    });
    if (error) return null;

    return admin.storage.from("news").getPublicUrl(path).data.publicUrl;
}

export async function saveNews(formData: FormData): Promise<void> {
    const { userId } = await requireAdmin();
    const admin = createAdminClient();

    const id = clean(formData.get("id")) || null;
    const title = clean(formData.get("title"));
    if (!title) {
        redirect(id ? `/admin/news/${id}?error=title` : "/admin/news/new?error=title");
    }

    const rawSlug = clean(formData.get("slug"));
    const slug = await ensureUniqueSlug(admin, slugify(rawSlug || title), id);

    const summary = clean(formData.get("summary")) || null;
    const body = clean(formData.get("body")) || null;
    const categoryId = clean(formData.get("category_id")) || null;
    const status = clean(formData.get("status")) === "published" ? "published" : "draft";

    // Cover: uploaded file wins over the manual URL fallback.
    let coverUrl: string | null = clean(formData.get("cover_image_url")) || null;
    const file = formData.get("cover_file");
    if (file instanceof File && file.size > 0) {
        const uploaded = await uploadCover(admin, file);
        if (uploaded) coverUrl = uploaded;
    }

    const record: Record<string, unknown> = {
        slug,
        title,
        summary,
        body,
        cover_image_url: coverUrl,
        category_id: categoryId,
        status
    };

    if (id) {
        // Set published_at the first time a post goes live.
        if (status === "published") {
            const { data: existing } = await admin
                .from("news")
                .select("published_at")
                .eq("id", id)
                .maybeSingle();
            if (!existing?.published_at) record.published_at = new Date().toISOString();
        }
        const { error } = await admin.from("news").update(record).eq("id", id);
        if (error) redirect(`/admin/news/${id}?error=save`);
    } else {
        record.author_id = userId;
        if (status === "published") record.published_at = new Date().toISOString();
        const { error } = await admin.from("news").insert(record);
        if (error) redirect("/admin/news/new?error=save");
    }

    revalidatePath("/admin/news");
    revalidatePath("/news");
    redirect("/admin/news?notice=saved");
}

export async function deleteNews(formData: FormData): Promise<void> {
    await requireAdmin();
    const id = clean(formData.get("id"));
    if (!id) redirect("/admin/news?notice=delete_failed");

    const admin = createAdminClient();
    const { error } = await admin.from("news").delete().eq("id", id);
    if (error) redirect("/admin/news?notice=delete_failed");

    revalidatePath("/admin/news");
    revalidatePath("/news");
    redirect("/admin/news?notice=deleted");
}

export async function saveCategory(formData: FormData): Promise<void> {
    await requireAdmin();
    const admin = createAdminClient();

    const id = clean(formData.get("id")) || null;
    const label = clean(formData.get("label"));
    if (!label) redirect("/admin/news/categories?notice=invalid");

    const slug = slugify(clean(formData.get("slug")) || label);
    const color = clean(formData.get("color")) || null;
    const sort = Number.parseInt(clean(formData.get("sort")) || "0", 10) || 0;

    const record = { label, slug, color, sort };

    if (id) {
        const { error } = await admin.from("news_categories").update(record).eq("id", id);
        if (error) redirect("/admin/news/categories?notice=save_failed");
    } else {
        const { error } = await admin.from("news_categories").insert(record);
        if (error) redirect("/admin/news/categories?notice=save_failed");
    }

    revalidatePath("/admin/news/categories");
    revalidatePath("/admin/news");
    redirect("/admin/news/categories?notice=saved");
}

export async function deleteCategory(formData: FormData): Promise<void> {
    await requireAdmin();
    const id = clean(formData.get("id"));
    if (!id) redirect("/admin/news/categories?notice=delete_failed");

    const admin = createAdminClient();
    const { error } = await admin.from("news_categories").delete().eq("id", id);
    if (error) redirect("/admin/news/categories?notice=delete_failed");

    revalidatePath("/admin/news/categories");
    redirect("/admin/news/categories?notice=deleted");
}
