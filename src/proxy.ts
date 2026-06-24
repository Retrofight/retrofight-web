import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const legacyLocaleMatch = pathname.match(/^\/(?:en|it)(?=\/|$)/);

  if (legacyLocaleMatch) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/(?:en|it)(?=\/|$)/, "") || "/";
    url.search = search;
    return NextResponse.redirect(url);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|retrofight.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
