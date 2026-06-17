import { notFound, redirect } from "next/navigation";
import AuthPanel from "@/components/auth/AuthPanel";
import { getDictionary, hasLocale } from "../dictionaries";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect(`/${lang}/profile`);
  }

  return (
    <AuthPanel
      lang={lang}
      dictionary={getDictionary(lang).auth}
      error={error}
      notice={notice}
    />
  );
}
