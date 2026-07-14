import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { fetchNewsById, fetchNewsCategories } from "@/lib/admin/news";
import { NewsEditor } from "@/components/admin/NewsEditor";

export default async function EditNewsPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ error?: string }>;
}) {
    await requireAdmin();
    const { id } = await params;
    const { error } = await searchParams;

    const [news, categories] = await Promise.all([fetchNewsById(id), fetchNewsCategories()]);
    if (!news) notFound();

    return <NewsEditor categories={categories} news={news} error={error} />;
}
