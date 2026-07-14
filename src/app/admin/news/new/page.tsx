import { requireAdmin } from "@/lib/admin/auth";
import { fetchNewsCategories } from "@/lib/admin/news";
import { NewsEditor } from "@/components/admin/NewsEditor";

export default async function NewNewsPage({
    searchParams
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    await requireAdmin();
    const { error } = await searchParams;
    const categories = await fetchNewsCategories();

    return <NewsEditor categories={categories} error={error} />;
}
