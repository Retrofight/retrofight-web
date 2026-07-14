import { createAdminClient } from "@/lib/supabase/admin";

export interface NewsCategory {
    id: string;
    slug: string;
    label: string;
    color: string | null;
    sort: number;
}

export interface NewsRow {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    body: string | null;
    cover_image_url: string | null;
    category_id: string | null;
    status: "draft" | "published";
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface NewsListItem extends NewsRow {
    category: NewsCategory | null;
}

export const DEFAULT_NEWS_PAGE_SIZE = 20;

export async function fetchNewsCategories(): Promise<NewsCategory[]> {
    const admin = createAdminClient();
    const { data, error } = await admin
        .from("news_categories")
        .select("*")
        .order("sort", { ascending: true });
    if (error) throw new Error(`fetchNewsCategories failed: ${error.message}`);
    return (data ?? []) as NewsCategory[];
}

export async function fetchAdminNews(
    page = 1,
    pageSize = DEFAULT_NEWS_PAGE_SIZE
): Promise<{ items: NewsListItem[]; total: number; page: number; pageSize: number }> {
    const admin = createAdminClient();
    const from = (Math.max(1, page) - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await admin
        .from("news")
        .select("*, category:news_categories(*)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) throw new Error(`fetchAdminNews failed: ${error.message}`);

    return {
        items: (data ?? []) as NewsListItem[],
        total: count ?? 0,
        page: Math.max(1, page),
        pageSize
    };
}

export async function fetchNewsById(id: string): Promise<NewsRow | null> {
    const admin = createAdminClient();
    const { data, error } = await admin.from("news").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`fetchNewsById failed: ${error.message}`);
    return (data as NewsRow) ?? null;
}
