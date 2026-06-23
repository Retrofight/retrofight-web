"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "../dictionaries";

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function signOut(lang: Locale) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${lang}/login?notice=signed_out`);
}

export async function updatePassword(lang: Locale, formData: FormData) {
  const currentPassword = cleanText(formData.get("currentPassword"));
  const password = cleanText(formData.get("password"));
  const confirmPassword = cleanText(formData.get("confirmPassword"));

  if (!currentPassword || !password || !confirmPassword) {
    redirect(`/${lang}/profile?password=missing`);
  }

  if (password !== confirmPassword) {
    redirect(`/${lang}/profile?password=mismatch`);
  }

  if (password.length < 8) {
    redirect(`/${lang}/profile?password=weak`);
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const email = userData.user?.email;

  if (userError || !email) {
    redirect(`/${lang}/login`);
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (signInError) {
    redirect(`/${lang}/profile?password=current_invalid`);
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect(`/${lang}/profile?password=policy`);
  }

  revalidatePath(`/${lang}/profile`);
  redirect(`/${lang}/profile?password=updated`);
}

export async function deleteAccount(lang: Locale, formData: FormData) {
  const confirmEmail = cleanText(formData.get("confirmEmail")).toLowerCase();
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  const email = user?.email?.toLowerCase();

  if (userError || !user || !email) {
    redirect(`/${lang}/login`);
  }

  if (confirmEmail !== email) {
    redirect(`/${lang}/profile?account=email_mismatch`);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    redirect(`/${lang}/profile?account=admin_unavailable`);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    redirect(`/${lang}/profile?account=delete_failed`);
  }

  await supabase.auth.signOut();
  redirect(`/${lang}/login?notice=account_deleted`);
}
