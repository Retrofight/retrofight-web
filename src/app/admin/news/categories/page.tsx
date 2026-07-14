import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { fetchNewsCategories } from "@/lib/admin/news";
import { NewsCategoriesManager } from "@/components/admin/NewsCategoriesManager";

export default async function NewsCategoriesPage({
    searchParams
}: {
    searchParams: Promise<{ notice?: string }>;
}) {
    await requireAdmin();
    const { notice } = await searchParams;
    const categories = await fetchNewsCategories();

    return (
        <div className="mx-auto max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
                <Link href="/admin/news" className="text-zinc-500 hover:text-white">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <h2 className="font-display text-lg font-black text-white">News categories</h2>
            </div>
            <NewsCategoriesManager categories={categories} notice={notice} />
        </div>
    );
}
