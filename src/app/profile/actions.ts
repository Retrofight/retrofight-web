"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getPrivacyConsentMetadata,
  getPrivacyConsentRevocationMetadata,
} from "@/lib/privacy/consent";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const COUNTRY_REGEX = /^[A-Z]{2}$/;

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

export async function updateProfile(formData: FormData) {
  const rawAvatarUrl = cleanText(formData.get("avatar_url"));
  const rawCountry = cleanText(formData.get("country")).toUpperCase().slice(0, 2) || null;
  const isPublic = formData.get("is_public") === "true";

  let avatarUrl: string | null = null;
  if (rawAvatarUrl) {
    try {
      const url = new URL(rawAvatarUrl);
      if (url.protocol === "http:" || url.protocol === "https:") {
        avatarUrl = rawAvatarUrl.slice(0, 512);
      } else {
        redirect("/profile?profile=update_failed");
      }
    } catch {
      redirect("/profile?profile=update_failed");
    }
  }

  if (rawCountry && !COUNTRY_REGEX.test(rawCountry)) {
    redirect("/profile?profile=update_failed");
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect("/login");
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    redirect("/profile?profile=update_failed");
  }

  const { error } = await admin
    .from("profiles")
    .update({ avatar_url: avatarUrl, country: rawCountry, is_public: isPublic })
    .eq("id", userData.user.id);

  if (error) {
    redirect("/profile?profile=update_failed");
  }

  revalidatePath("/profile");
  redirect("/profile?profile=updated");
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

  // Anonymize stored display names in match history before deleting the auth user.
  // The player ID FK uses ON DELETE SET NULL, so the UUID link is severed on deletion.
  await admin.from("match_history").update({ p1_name: null }).eq("p1_id", user.id);
  await admin.from("match_history").update({ p2_name: null }).eq("p2_id", user.id);

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    redirect("/profile?account=delete_failed");
  }

  await supabase.auth.signOut();
  redirect("/login?notice=account_deleted");
}
