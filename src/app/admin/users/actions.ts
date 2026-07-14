"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRY_REGEX = /^[A-Z]{2}$/;
// Supabase GoTrue ban duration: a large window effectively bans indefinitely.
const BAN_DURATION = "876000h"; // ~100 years

function clean(value: FormDataEntryValue | null): string {
    return typeof value === "string" ? value.trim() : "";
}

function returnPath(formData: FormData, notice: string): string {
    const raw = clean(formData.get("returnTo"));
    const base = raw.startsWith("/admin/users") ? raw : "/admin/users";
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}notice=${encodeURIComponent(notice)}`;
}

function finish(formData: FormData, notice: string): never {
    revalidatePath("/admin/users");
    redirect(returnPath(formData, notice));
}

export async function createUser(formData: FormData): Promise<void> {
    await requireAdmin();
    const email = clean(formData.get("email")).toLowerCase();
    const password = clean(formData.get("password"));
    const displayName = clean(formData.get("display_name"));

    if (!EMAIL_REGEX.test(email) || password.length < 8) {
        finish(formData, "create_invalid");
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (error || !data.user) {
        finish(formData, "create_failed");
    }

    if (displayName) {
        await admin.from("profiles").update({ display_name: displayName }).eq("id", data!.user.id);
    }

    finish(formData, "created");
}

export async function updateUserCore(formData: FormData): Promise<void> {
    await requireAdmin();
    const userId = clean(formData.get("userId"));
    const email = clean(formData.get("email")).toLowerCase();
    const displayName = clean(formData.get("display_name")) || null;
    const country = clean(formData.get("country")).toUpperCase().slice(0, 2) || null;
    const isPublic = formData.get("is_public") === "true";

    if (!userId || !EMAIL_REGEX.test(email) || (country && !COUNTRY_REGEX.test(country))) {
        finish(formData, "update_invalid");
    }

    const admin = createAdminClient();

    const { error: authError } = await admin.auth.admin.updateUserById(userId, { email });
    if (authError) {
        finish(formData, "update_failed");
    }

    const { error: profileError } = await admin
        .from("profiles")
        .update({ display_name: displayName, country, is_public: isPublic })
        .eq("id", userId);

    if (profileError) {
        finish(formData, "update_failed");
    }

    finish(formData, "updated");
}

export async function setUserRole(formData: FormData): Promise<void> {
    const { userId: adminId } = await requireAdmin();
    const userId = clean(formData.get("userId"));
    const role = clean(formData.get("role"));

    if (!userId || (role !== "admin" && role !== "user")) {
        finish(formData, "role_invalid");
    }

    // Prevent an admin from demoting their own account by accident.
    if (userId === adminId && role !== "admin") {
        finish(formData, "role_self");
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
        app_metadata: { role: role === "admin" ? "admin" : null }
    });

    if (error) {
        finish(formData, "role_failed");
    }

    finish(formData, "role_updated");
}

export async function resetUserPassword(formData: FormData): Promise<void> {
    await requireAdmin();
    const userId = clean(formData.get("userId"));
    const password = clean(formData.get("password"));

    if (!userId || password.length < 8) {
        finish(formData, "password_invalid");
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, { password });

    if (error) {
        finish(formData, "password_failed");
    }

    finish(formData, "password_updated");
}

export async function confirmUserEmail(formData: FormData): Promise<void> {
    await requireAdmin();
    const userId = clean(formData.get("userId"));
    if (!userId) {
        finish(formData, "confirm_invalid");
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });

    if (error) {
        finish(formData, "confirm_failed");
    }

    finish(formData, "confirmed");
}

export async function setUserBan(formData: FormData): Promise<void> {
    const { userId: adminId } = await requireAdmin();
    const userId = clean(formData.get("userId"));
    const ban = clean(formData.get("ban")) === "true";

    if (!userId) {
        finish(formData, "ban_invalid");
    }

    if (userId === adminId && ban) {
        finish(formData, "ban_self");
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: ban ? BAN_DURATION : "none"
    });

    if (error) {
        finish(formData, "ban_failed");
    }

    finish(formData, ban ? "banned" : "unbanned");
}

// Force-delete with anonymization: strip stored display names from match history
// (the p*_id FK is ON DELETE SET NULL, so stats rows survive without identity),
// then remove the auth user. Mirrors src/app/profile/actions.ts::deleteAccount.
export async function forceDeleteUser(formData: FormData): Promise<void> {
    const { userId: adminId } = await requireAdmin();
    const userId = clean(formData.get("userId"));
    const confirmEmail = clean(formData.get("confirmEmail")).toLowerCase();
    const expectedEmail = clean(formData.get("expectedEmail")).toLowerCase();

    if (!userId) {
        finish(formData, "delete_invalid");
    }

    if (userId === adminId) {
        finish(formData, "delete_self");
    }

    if (!confirmEmail || confirmEmail !== expectedEmail) {
        finish(formData, "delete_email_mismatch");
    }

    const admin = createAdminClient();

    await admin.from("match_history").update({ p1_name: null }).eq("p1_id", userId);
    await admin.from("match_history").update({ p2_name: null }).eq("p2_id", userId);

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
        finish(formData, "delete_failed");
    }

    finish(formData, "deleted");
}
