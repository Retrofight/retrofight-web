import { notFound } from "next/navigation";
import AuthPanel from "@/components/auth/AuthPanel";
import { hasLocale } from "../dictionaries";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { lang } = await params;
  const { error, notice } = await searchParams;

  if (!hasLocale(lang)) {
    notFound();
  }

  return <AuthPanel lang={lang} error={error} notice={notice} />;
}
