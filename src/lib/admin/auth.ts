import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AdminSession {
    userId: string;
    email: string;
    accessToken: string;
}

// Validates that the current session belongs to a user with app_metadata.role === "admin".
// Redirects to /login if unauthenticated, to / if authenticated but not admin.
// Returns the userId and access token for downstream server API calls.
export async function requireAdmin(): Promise<AdminSession> {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        redirect("/login");
    }

    if (user.app_metadata?.role !== "admin") {
        redirect("/");
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect("/login");
    }

    return {
        userId: user.id,
        email: user.email ?? "",
        accessToken: session.access_token
    };
}
