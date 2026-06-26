import { createAdminClient } from "@/lib/supabase/admin";

export interface PublicProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  country: string | null;
  is_public: boolean;
  created_at: string;
}

export async function getPublicProfileBySlug(slug: string): Promise<PublicProfile | null> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return null;
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id, display_name, avatar_url, country, is_public, created_at")
    .ilike("display_name", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as PublicProfile;
}

export async function getOwnProfile(userId: string): Promise<Pick<PublicProfile, "avatar_url" | "country" | "is_public"> | null> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return null;
  }

  const { data, error } = await admin
    .from("profiles")
    .select("avatar_url, country, is_public")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Pick<PublicProfile, "avatar_url" | "country" | "is_public">;
}
