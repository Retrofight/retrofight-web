import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/en/account";
  }

  return value;
}

function getLocaleFromPath(path: string) {
  return path.startsWith("/it/") || path === "/it" ? "it" : "en";
}

function getLoginRedirectUrl(
  requestUrl: URL,
  next: string,
  error: "auth_callback_failed" | "auth_link_expired" | "auth_verifier_missing",
) {
  const locale = getLocaleFromPath(next);
  return new URL(`/${locale}/login?error=${error}`, requestUrl.origin);
}

const emailOtpTypes = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const providerError = requestUrl.searchParams.get("error");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (providerError) {
    return NextResponse.redirect(
      getLoginRedirectUrl(requestUrl, next, "auth_link_expired"),
    );
  }

  if (tokenHash && type && emailOtpTypes.has(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    return NextResponse.redirect(
      getLoginRedirectUrl(requestUrl, next, "auth_link_expired"),
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    return NextResponse.redirect(
      getLoginRedirectUrl(requestUrl, next, "auth_verifier_missing"),
    );
  }

  return NextResponse.redirect(
    getLoginRedirectUrl(requestUrl, next, "auth_callback_failed"),
  );
}
