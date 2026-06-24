"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrivacyConsentMetadata } from "@/lib/privacy/consent";

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function getAuthRedirectUrl() {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    origin ||
    "http://localhost:3001";

  return `${siteUrl}/auth/callback?next=/profile`;
}

async function getPasswordRecoveryRedirectUrl() {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    origin ||
    "http://localhost:3001";

  return `${siteUrl}/auth/callback?next=/reset-password`;
}

function redirectToLogin(
  key: "invalid" | "signup_failed" | "consent_required",
) {
  redirect(`/login?error=${key}`);
}

export async function signIn(formData: FormData) {
  const email = cleanText(formData.get("email"));
  const password = cleanText(formData.get("password"));

  if (!email || !password) {
    redirectToLogin("invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectToLogin("invalid");
  }

  redirect("/profile");
}

export async function signUp(formData: FormData) {
  const email = cleanText(formData.get("email"));
  const password = cleanText(formData.get("password"));
  const displayName = cleanText(formData.get("displayName"));
  const legalConsent = formData.get("legalConsent") === "accepted";

  if (!email || !password) {
    redirectToLogin("invalid");
  }

  if (!legalConsent) {
    redirectToLogin("consent_required");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: await getAuthRedirectUrl(),
      data: {
        display_name: displayName || email.split("@")[0],
        ...getPrivacyConsentMetadata(),
      },
    },
  });

  if (error) {
    redirectToLogin("signup_failed");
  }

  if (data.session) {
    redirect("/profile");
  }

  redirect("/login?notice=check_email");
}

export async function requestPasswordReset(formData: FormData) {
  const email = cleanText(formData.get("email"));

  if (!email) {
    redirect("/forgot-password?error=missing_email");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await getPasswordRecoveryRedirectUrl(),
  });

  if (error) {
    redirect("/forgot-password?error=request_failed");
  }

  redirect("/forgot-password?notice=reset_sent");
}
