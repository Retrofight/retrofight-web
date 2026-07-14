"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
    Activity,
    ChevronLeft,
    ChevronRight,
    Plus,
    ShieldCheck,
    Trash2,
    UserCog,
    X
} from "lucide-react";
import type { AdminUserRow } from "@/lib/admin/users";
import {
    confirmUserEmail,
    createUser,
    forceDeleteUser,
    resetUserPassword,
    setUserBan,
    setUserRole,
    updateUserCore
} from "@/app/admin/users/actions";

interface UsersTableProps {
    users: AdminUserRow[];
    page: number;
    pageSize: number;
    total: number;
    search: string;
    roleFilter: "all" | "admin" | "user";
    bannedFilter: "all" | "banned" | "active";
    adminId: string;
    notice?: string;
}

const NOTICES: Record<string, { text: string; ok: boolean }> = {
    created: { text: "User created.", ok: true },
    updated: { text: "User updated.", ok: true },
    role_updated: { text: "Role updated.", ok: true },
    password_updated: { text: "Password reset.", ok: true },
    confirmed: { text: "Email confirmed.", ok: true },
    banned: { text: "User banned.", ok: true },
    unbanned: { text: "User unbanned.", ok: true },
    deleted: { text: "User deleted and anonymized.", ok: true },
    create_invalid: { text: "Invalid email or password (min 8 chars).", ok: false },
    create_failed: { text: "Could not create user.", ok: false },
    update_invalid: { text: "Invalid profile data.", ok: false },
    update_failed: { text: "Could not update user.", ok: false },
    role_invalid: { text: "Invalid role.", ok: false },
    role_self: { text: "You cannot demote your own account.", ok: false },
    role_failed: { text: "Could not update role.", ok: false },
    password_invalid: { text: "Password must be at least 8 characters.", ok: false },
    password_failed: { text: "Could not reset password.", ok: false },
    confirm_failed: { text: "Could not confirm email.", ok: false },
    ban_self: { text: "You cannot ban your own account.", ok: false },
    ban_failed: { text: "Could not update ban.", ok: false },
    delete_self: { text: "You cannot delete your own account here.", ok: false },
    delete_email_mismatch: { text: "Confirmation email did not match.", ok: false },
    delete_failed: { text: "Could not delete user.", ok: false }
};

function isBanned(user: AdminUserRow): boolean {
    return user.banned_until != null && new Date(user.banned_until).getTime() > Date.now();
}

function formatDate(value: string | null): string {
    if (!value) return "—";
    return new Date(value).toISOString().slice(0, 10);
}

export function UsersTable({
    users,
    page,
    pageSize,
    total,
    search,
    roleFilter,
    bannedFilter,
    adminId,
    notice
}: UsersTableProps) {
    const router = useRouter();
    const [searchInput, setSearchInput] = useState(search);
    const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
    const [creating, setCreating] = useState(false);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const noticeInfo = notice ? NOTICES[notice] : undefined;

    const currentQuery = useMemo(() => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (roleFilter !== "all") params.set("role", roleFilter);
        if (bannedFilter !== "all") params.set("banned", bannedFilter);
        if (page > 1) params.set("page", String(page));
        const qs = params.toString();
        return qs ? `/admin/users?${qs}` : "/admin/users";
    }, [search, roleFilter, bannedFilter, page]);

    function navigate(overrides: Record<string, string | number | undefined>) {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (roleFilter !== "all") params.set("role", roleFilter);
        if (bannedFilter !== "all") params.set("banned", bannedFilter);
        if (page > 1) params.set("page", String(page));
        for (const [key, value] of Object.entries(overrides)) {
            if (value === undefined || value === "" || value === "all") params.delete(key);
            else params.set(key, String(value));
        }
        router.push(`/admin/users?${params.toString()}`);
    }

    return (
        <section className="min-w-0 rounded-sm border border-white/10 bg-dark-card p-4 shadow-2xl shadow-black/30">
            {noticeInfo && (
                <div
                    className={`mb-4 rounded-sm border px-3 py-2 text-xs ${
                        noticeInfo.ok
                            ? "border-green-500/30 bg-green-900/20 text-green-300"
                            : "border-red-500/30 bg-red-900/20 text-red-300"
                    }`}
                >
                    {noticeInfo.text}
                </div>
            )}

            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-brand-purple-400" />
                    <span className="font-display text-sm font-black text-white">Users</span>
                    <span className="text-xs text-zinc-500">{total} total</span>
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            navigate({ search: searchInput.trim() || undefined, page: undefined });
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Search email or name…"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            className="h-8 w-52 rounded-sm border border-white/10 bg-black/40 px-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-brand-purple-500"
                        />
                    </form>

                    <select
                        value={roleFilter}
                        onChange={e => navigate({ role: e.target.value, page: undefined })}
                        className="h-8 rounded-sm border border-white/10 bg-black/40 px-2 text-xs text-white outline-none focus:border-brand-purple-500"
                    >
                        <option value="all">All roles</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                    </select>

                    <select
                        value={bannedFilter}
                        onChange={e => navigate({ banned: e.target.value, page: undefined })}
                        className="h-8 rounded-sm border border-white/10 bg-black/40 px-2 text-xs text-white outline-none focus:border-brand-purple-500"
                    >
                        <option value="all">All status</option>
                        <option value="active">Active</option>
                        <option value="banned">Banned</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => setCreating(true)}
                        className="flex h-8 items-center gap-1 rounded-sm bg-brand-purple-600 px-3 text-xs font-semibold text-white transition hover:bg-brand-purple-500"
                    >
                        <Plus className="h-3 w-3" /> New user
                    </button>
                </div>
            </div>

            {/* Table */}
            {users.length === 0 ? (
                <p className="py-12 text-center text-sm text-zinc-500">No users match the filters.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-white/10 text-zinc-500">
                                <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">Email</th>
                                <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">Display name</th>
                                <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">Role</th>
                                <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">Status</th>
                                <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">Created</th>
                                <th className="pb-2 pr-4 font-semibold uppercase tracking-wider">Last sign-in</th>
                                <th className="pb-2 font-semibold uppercase tracking-wider" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map(user => {
                                const banned = isBanned(user);
                                const confirmed = user.email_confirmed_at != null;
                                return (
                                    <tr key={user.id} className="hover:bg-white/[0.03]">
                                        <td className="py-2 pr-4 text-zinc-200">
                                            {user.email ?? <span className="text-zinc-600">—</span>}
                                        </td>
                                        <td className="py-2 pr-4 text-zinc-300">
                                            {user.display_name ?? <span className="text-zinc-600">—</span>}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {user.role === "admin" ? (
                                                <span className="inline-flex items-center gap-1 rounded border border-brand-purple-500/30 bg-brand-purple-600/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand-purple-300">
                                                    <ShieldCheck className="h-3 w-3" /> Admin
                                                </span>
                                            ) : (
                                                <span className="text-zinc-500">User</span>
                                            )}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {banned ? (
                                                <span className="text-red-400">Banned</span>
                                            ) : confirmed ? (
                                                <span className="text-green-400">Active</span>
                                            ) : (
                                                <span className="text-yellow-400">Unconfirmed</span>
                                            )}
                                        </td>
                                        <td className="py-2 pr-4 tabular-nums text-zinc-400">{formatDate(user.created_at)}</td>
                                        <td className="py-2 pr-4 tabular-nums text-zinc-400">{formatDate(user.last_sign_in_at)}</td>
                                        <td className="py-2 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setEditUser(user)}
                                                className="rounded-sm border border-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-300 transition hover:bg-white/5"
                                            >
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {total > 0 && (
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-zinc-400">
                    <span>Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => navigate({ page: page - 1 })}
                            className="flex items-center gap-1 rounded-sm border border-white/10 px-2 py-1 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft className="h-3 w-3" /> Prev
                        </button>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => navigate({ page: page + 1 })}
                            className="flex items-center gap-1 rounded-sm border border-white/10 px-2 py-1 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            )}

            {creating && <CreateUserModal returnTo={currentQuery} onClose={() => setCreating(false)} />}
            {editUser && (
                <EditUserModal
                    user={editUser}
                    returnTo={currentQuery}
                    isSelf={editUser.id === adminId}
                    onClose={() => setEditUser(null)}
                />
            )}
        </section>
    );
}

function ModalShell({
    title,
    onClose,
    children
}: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8">
            <div className="w-full max-w-lg rounded-sm border border-white/10 bg-dark-card shadow-2xl shadow-black/50">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                    <h3 className="font-display text-sm font-black text-white">{title}</h3>
                    <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="space-y-5 p-5">{children}</div>
            </div>
        </div>
    );
}

const inputClass =
    "h-8 w-full rounded-sm border border-white/10 bg-black/40 px-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-brand-purple-500";
const labelClass = "mb-1 block text-[10px] font-black uppercase tracking-widest text-zinc-500";
const primaryBtn =
    "h-8 rounded-sm bg-brand-purple-600 px-3 text-xs font-semibold text-white transition hover:bg-brand-purple-500";
const subtleBtn =
    "h-8 rounded-sm border border-white/10 px-3 text-xs font-semibold text-zinc-300 transition hover:bg-white/5";

function CreateUserModal({ returnTo, onClose }: { returnTo: string; onClose: () => void }) {
    return (
        <ModalShell title="Create user" onClose={onClose}>
            <form action={createUser} className="space-y-3">
                <input type="hidden" name="returnTo" value={returnTo} />
                <div>
                    <label className={labelClass}>Email</label>
                    <input name="email" type="email" required className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Password (min 8 chars)</label>
                    <input name="password" type="text" required minLength={8} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Display name (optional)</label>
                    <input name="display_name" type="text" className={inputClass} />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onClose} className={subtleBtn}>Cancel</button>
                    <button type="submit" className={primaryBtn}>Create</button>
                </div>
            </form>
        </ModalShell>
    );
}

function EditUserModal({
    user,
    returnTo,
    isSelf,
    onClose
}: {
    user: AdminUserRow;
    returnTo: string;
    isSelf: boolean;
    onClose: () => void;
}) {
    const banned = isBanned(user);
    const confirmed = user.email_confirmed_at != null;

    return (
        <ModalShell title={user.email ?? "User"} onClose={onClose}>
            {/* Core profile + email */}
            <form action={updateUserCore} className="space-y-3">
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <div>
                    <label className={labelClass}>Email</label>
                    <input name="email" type="email" defaultValue={user.email ?? ""} required className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelClass}>Display name</label>
                        <input name="display_name" type="text" defaultValue={user.display_name ?? ""} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Country (ISO-2)</label>
                        <input name="country" type="text" maxLength={2} defaultValue={user.country ?? ""} className={inputClass} />
                    </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-zinc-300">
                    <input type="checkbox" name="is_public" value="true" defaultChecked={user.is_public} />
                    Public profile
                </label>
                <div className="flex justify-end">
                    <button type="submit" className={primaryBtn}>Save profile</button>
                </div>
            </form>

            <div className="grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2">
                {/* Role */}
                <form action={setUserRole} className="space-y-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <label className={labelClass}>Role</label>
                    <div className="flex items-center gap-2">
                        <select name="role" defaultValue={user.role === "admin" ? "admin" : "user"} className={inputClass}>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button type="submit" className={subtleBtn}>Set</button>
                    </div>
                    {isSelf && <p className="text-[10px] text-zinc-600">This is your account.</p>}
                </form>

                {/* Password */}
                <form action={resetUserPassword} className="space-y-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <label className={labelClass}>Reset password</label>
                    <div className="flex items-center gap-2">
                        <input name="password" type="text" minLength={8} placeholder="New password" className={inputClass} />
                        <button type="submit" className={subtleBtn}>Set</button>
                    </div>
                </form>
            </div>

            {/* Status actions */}
            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                <Link
                    href={`/admin/telemetry?user=${encodeURIComponent(user.id)}`}
                    className="flex h-8 items-center gap-1 rounded-sm border border-white/10 px-3 text-xs font-semibold text-zinc-300 transition hover:bg-white/5"
                >
                    <Activity className="h-3 w-3" /> Telemetry
                </Link>
                {!confirmed && (
                    <form action={confirmUserEmail}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button type="submit" className={subtleBtn}>Confirm email</button>
                    </form>
                )}
                <form action={setUserBan}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <input type="hidden" name="ban" value={banned ? "false" : "true"} />
                    <button type="submit" className={subtleBtn}>{banned ? "Unban" : "Ban"}</button>
                </form>
            </div>

            {/* Danger zone: force delete */}
            {!isSelf && (
                <form action={forceDeleteUser} className="space-y-2 rounded-sm border border-red-500/30 bg-red-900/10 p-3">
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <input type="hidden" name="expectedEmail" value={user.email ?? ""} />
                    <label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-400">
                        <Trash2 className="h-3 w-3" /> Force delete (anonymize)
                    </label>
                    <p className="text-[11px] text-zinc-400">
                        Removes the auth user and profile; match history is kept with names stripped. Type the
                        email to confirm.
                    </p>
                    <div className="flex items-center gap-2">
                        <input name="confirmEmail" type="email" placeholder={user.email ?? "email"} className={inputClass} />
                        <button
                            type="submit"
                            className="h-8 shrink-0 rounded-sm bg-red-600 px-3 text-xs font-semibold text-white transition hover:bg-red-500"
                        >
                            Delete
                        </button>
                    </div>
                </form>
            )}
        </ModalShell>
    );
}
