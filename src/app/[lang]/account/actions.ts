"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "../dictionaries";

export async function signOut(lang: Locale) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${lang}/login?notice=signed_out`);
}
