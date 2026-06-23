import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { assertSupabaseEnv } from "./env";

function isMissingRefreshTokenError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "refresh_token_not_found"
  );
}

function clearSupabaseAuthCookies(request: NextRequest) {
  const namesToClear = request.cookies
    .getAll()
    .map(({ name }) => name)
    .filter((name) => name.startsWith("sb-") || name.includes("auth-token"));

  namesToClear.forEach((name) => {
    request.cookies.delete(name);
  });

  const response = NextResponse.next({
    request,
  });

  namesToClear.forEach((name) => {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
    });
  });

  return response;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });
  const { url, publishableKey } = assertSupabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    await supabase.auth.getClaims();
  } catch (error) {
    if (!isMissingRefreshTokenError(error)) {
      throw error;
    }

    response = clearSupabaseAuthCookies(request);
  }

  return response;
}
