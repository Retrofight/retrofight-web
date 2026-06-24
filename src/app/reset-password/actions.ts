"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function resetPassword(formData: FormData) {
  const password = cleanText(formData.get("password"));
  const confirmPassword = cleanText(formData.get("confirmPassword"));

  if (!password || !confirmPassword) {
    redirect("/reset-password?error=missing");
  }

  if (password !== confirmPassword) {
    redirect("/reset-password?error=mismatch");
  }

  if (password.length < 8) {
    redirect("/reset-password?error=weak");
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect("/login?error=auth_link_expired");
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect("/reset-password?error=policy");
  }

  await supabase.auth.signOut();
  redirect("/login?notice=password_reset");
}
