"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "../dictionaries";

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function getAuthRedirectUrl(lang: Locale) {
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

  return `${siteUrl}/auth/callback?next=/${lang}/profile`;
}

async function getPasswordRecoveryRedirectUrl(lang: Locale) {
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

  return `${siteUrl}/auth/callback?next=/${lang}/reset-password`;
}

function redirectToLogin(lang: Locale, key: "invalid" | "signup_failed") {
  redirect(`/${lang}/login?error=${key}`);
}

export async function signIn(lang: Locale, formData: FormData) {
  const email = cleanText(formData.get("email"));
  const password = cleanText(formData.get("password"));

  if (!email || !password) {
    redirectToLogin(lang, "invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectToLogin(lang, "invalid");
  }

  redirect(`/${lang}/profile`);
}

export async function signUp(lang: Locale, formData: FormData) {
  const email = cleanText(formData.get("email"));
  const password = cleanText(formData.get("password"));
  const displayName = cleanText(formData.get("displayName"));

  if (!email || !password) {
    redirectToLogin(lang, "invalid");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: await getAuthRedirectUrl(lang),
      data: {
        display_name: displayName || email.split("@")[0],
      },
    },
  });

  if (error) {
    redirectToLogin(lang, "signup_failed");
  }

  if (data.session) {
    redirect(`/${lang}/profile`);
  }

  redirect(`/${lang}/login?notice=check_email`);
}

export async function requestPasswordReset(lang: Locale, formData: FormData) {
  const email = cleanText(formData.get("email"));

  if (!email) {
    redirect(`/${lang}/forgot-password?error=missing_email`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await getPasswordRecoveryRedirectUrl(lang),
  });

  if (error) {
    redirect(`/${lang}/forgot-password?error=request_failed`);
  }

  redirect(`/${lang}/forgot-password?notice=reset_sent`);
}
