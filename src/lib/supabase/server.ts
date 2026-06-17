import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { assertSupabaseEnv } from "./env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = assertSupabaseEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies. The request proxy refreshes
          // auth cookies before render, so this path is safe to ignore here.
        }
      },
    },
  });
}
