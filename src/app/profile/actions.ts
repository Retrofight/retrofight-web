"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getPrivacyConsentMetadata,
  getPrivacyConsentRevocationMetadata,
} from "@/lib/privacy/consent";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?notice=signed_out");
}

export async function updatePassword(formData: FormData) {
  const currentPassword = cleanText(formData.get("currentPassword"));
  const password = cleanText(formData.get("password"));
  const confirmPassword = cleanText(formData.get("confirmPassword"));

  if (!currentPassword || !password || !confirmPassword) {
    redirect("/profile?password=missing");
  }

  if (password !== confirmPassword) {
    redirect("/profile?password=mismatch");
  }

  if (password.length < 8) {
    redirect("/profile?password=weak");
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const email = userData.user?.email;

  if (userError || !email) {
    redirect("/login");
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (signInError) {
    redirect("/profile?password=current_invalid");
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect("/profile?password=policy");
  }

  revalidatePath("/profile");
  redirect("/profile?password=updated");
}

export async function updatePrivacyConsent(formData: FormData) {
  const accepted = formData.get("privacyConsent") === "accepted";
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/login");
  }

  const currentMetadata =
    userData.user.user_metadata &&
    typeof userData.user.user_metadata === "object"
      ? userData.user.user_metadata
      : {};
  const consentMetadata = accepted
    ? getPrivacyConsentMetadata()
    : getPrivacyConsentRevocationMetadata();

  const { error } = await supabase.auth.updateUser({
    data: {
      ...currentMetadata,
      ...consentMetadata,
    },
  });

  if (error) {
    redirect("/profile?privacy=update_failed");
  }

  revalidatePath("/profile");
  redirect(`/profile?privacy=${accepted ? "accepted" : "revoked"}`);
}

export async function deleteAccount(formData: FormData) {
  const confirmEmail = cleanText(formData.get("confirmEmail")).toLowerCase();
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  const email = user?.email?.toLowerCase();

  if (userError || !user || !email) {
    redirect("/login");
  }

  if (confirmEmail !== email) {
    redirect("/profile?account=email_mismatch");
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    redirect("/profile?account=admin_unavailable");
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    redirect("/profile?account=delete_failed");
  }

  await supabase.auth.signOut();
  redirect("/login?notice=account_deleted");
}
