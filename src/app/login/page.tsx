import { redirect } from "next/navigation";
import AuthPanel from "@/components/auth/AuthPanel";
import { dictionary } from "../dictionary";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/profile");
  }

  return (
    <AuthPanel
      dictionary={dictionary.auth}
      error={error}
      notice={notice}
    />
  );
}
