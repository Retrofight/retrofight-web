import { requireAdmin } from "@/lib/admin/auth";
import { DEFAULT_USERS_PAGE_SIZE, fetchAdminUsers } from "@/lib/admin/users";
import { UsersTable } from "@/components/admin/UsersTable";

export default async function UsersPage({
    searchParams
}: {
    searchParams: Promise<{
        search?: string;
        role?: string;
        banned?: string;
        page?: string;
        notice?: string;
    }>;
}) {
    const { userId: adminId } = await requireAdmin();
    const { search, role, banned, page: rawPage, notice } = await searchParams;

    const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
    const roleFilter = role === "admin" || role === "user" ? role : undefined;
    const bannedFilter = banned === "banned" ? true : banned === "active" ? false : undefined;

    const result = await fetchAdminUsers({
        search: search?.trim() || undefined,
        role: roleFilter,
        banned: bannedFilter,
        page,
        pageSize: DEFAULT_USERS_PAGE_SIZE
    });

    return (
        <UsersTable
            users={result.users}
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            search={search ?? ""}
            roleFilter={roleFilter ?? "all"}
            bannedFilter={banned === "banned" || banned === "active" ? banned : "all"}
            adminId={adminId}
            notice={notice}
        />
    );
}
