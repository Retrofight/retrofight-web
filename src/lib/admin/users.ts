import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminUserRow {
    id: string;
    email: string | null;
    display_name: string | null;
    country: string | null;
    is_public: boolean;
    role: string;
    banned_until: string | null;
    email_confirmed_at: string | null;
    last_sign_in_at: string | null;
    created_at: string;
}

export interface AdminUsersQuery {
    search?: string;
    role?: string;
    banned?: boolean;
    page?: number;
    pageSize?: number;
}

export interface AdminUsersPage {
    users: AdminUserRow[];
    page: number;
    pageSize: number;
    total: number;
}

export const DEFAULT_USERS_PAGE_SIZE = 25;

// Lists users through the admin_list_users SECURITY DEFINER RPC (service role only).
// The RPC joins auth.users + profiles and returns a windowed total_count on each row.
export async function fetchAdminUsers(query: AdminUsersQuery = {}): Promise<AdminUsersPage> {
    const admin = createAdminClient();
    const page = Math.max(1, query.page ?? 1);
    const pageSize = query.pageSize ?? DEFAULT_USERS_PAGE_SIZE;

    const { data, error } = await admin.rpc("admin_list_users", {
        p_search: query.search ?? null,
        p_role: query.role ?? null,
        p_banned: query.banned ?? null,
        p_page: page,
        p_page_size: pageSize
    });

    if (error) {
        throw new Error(`admin_list_users failed: ${error.message}`);
    }

    const rows = (data ?? []) as (AdminUserRow & { total_count: number })[];
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

    return {
        users: rows.map(({ total_count: _ignored, ...row }) => row),
        page,
        pageSize,
        total
    };
}
