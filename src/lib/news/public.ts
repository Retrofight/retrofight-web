import { createClient } from "@/lib/supabase/server";
import type { NewsCategory, NewsListItem, NewsRow } from "@/lib/admin/news";

export const PUBLIC_NEWS_PAGE_SIZE = 12;

// Public reads rely on the RLS "news_public_select" policy (status = 'published')
// and the public categories policy, so the anon SSR client is sufficient.

export async function fetchPublicCategories(): Promise<NewsCategory[]> {
    const supabase = await createClient();
    const { data } = await supabase
        .from("news_categories")
        .select("*")
        .order("sort", { ascending: true });
    return (data ?? []) as NewsCategory[];
}

export async function fetchPublicNews(options: {
    page?: number;
    categorySlug?: string;
}): Promise<{ items: NewsListItem[]; total: number; page: number; pageSize: number }> {
    const supabase = await createClient();
    const page = Math.max(1, options.page ?? 1);
    const from = (page - 1) * PUBLIC_NEWS_PAGE_SIZE;
    const to = from + PUBLIC_NEWS_PAGE_SIZE - 1;

    // Inner-join filter by category slug when provided; otherwise use a left join
    // so posts without a category still show in the "all" listing.
    const base = options.categorySlug
        ? supabase
              .from("news")
              .select("*, category:news_categories!inner(*)", { count: "exact" })
              // PostgREST filters an embedded resource by its select alias ("category").
              .eq("category.slug", options.categorySlug)
        : supabase.from("news").select("*, category:news_categories(*)", { count: "exact" });

    const { data, count } = await base
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .range(from, to);

    return {
        items: (data ?? []) as NewsListItem[],
        total: count ?? 0,
        page,
        pageSize: PUBLIC_NEWS_PAGE_SIZE
    };
}

export async function fetchPublicNewsBySlug(slug: string): Promise<NewsListItem | null> {
    const supabase = await createClient();
    const { data } = await supabase
        .from("news")
        .select("*, category:news_categories(*)")
        .eq("status", "published")
        .eq("slug", slug)
        .maybeSingle();
    return (data as NewsListItem) ?? null;
}

export function formatNewsDate(row: Pick<NewsRow, "published_at" | "created_at">): string {
    const value = row.published_at ?? row.created_at;
    return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}
