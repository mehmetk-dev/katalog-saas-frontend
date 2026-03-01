"use server"

import { createClient } from "@/lib/supabase/server"
import { apiFetch } from "@/lib/api"
import type { ActivityLog, AdminUser, DeletedUser } from "@/components/admin/admin-dashboard/types"

const LOGS_PER_PAGE = 20

/**
 * Admin check — DB'deki is_admin alanını kontrol eder.
 * ADMIN_EMAIL env variable artık kullanılmıyor.
 */
export async function checkIsAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { data: profile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    return profile?.is_admin === true
}

/**
 * Admin guard — throws Unauthorized if caller is not admin.
 * Shared by admin.ts and feedback.ts actions.
 */
export async function requireAdmin() {
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) throw new Error("Unauthorized")
}

export async function getAdminStats() {
    await requireAdmin()

    try {
        return await apiFetch<{
            usersCount: number
            productsCount: number
            catalogsCount: number
            totalExports: number
            deletedUsersCount: number
        }>("/admin/stats")
    } catch (error) {
        console.error("Failed to fetch admin stats:", error)
        return {
            usersCount: 0,
            productsCount: 0,
            catalogsCount: 0,
            totalExports: 0,
            deletedUsersCount: 0
        }
    }
}

export async function getAdminUsers() {
    await requireAdmin()

    try {
        return await apiFetch<AdminUser[]>("/admin/users")
    } catch (error) {
        console.error("Failed to fetch admin users:", error)
        return [] as AdminUser[]
    }
}

export async function getDeletedUsers() {
    await requireAdmin()

    try {
        return await apiFetch<DeletedUser[]>("/admin/deleted-users")
    } catch (error) {
        console.error("Failed to fetch deleted users:", error)
        return [] as DeletedUser[]
    }
}

export async function updateUserPlan(userId: string, plan: 'free' | 'plus' | 'pro') {
    await requireAdmin()

    // UUID format validation to prevent path injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
        throw new Error("Invalid user ID format")
    }

    await apiFetch(`/admin/users/${userId}/plan`, {
        method: "PUT",
        body: JSON.stringify({ plan })
    })
    return { success: true }
}

/**
 * Activity logs — server-side Supabase ile güvenli erişim.
 * Client-side Supabase yerine bu action kullanılmalı.
 */
export async function getAdminActivityLogs(page: number = 0): Promise<{ logs: ActivityLog[]; total: number }> {
    await requireAdmin()

    try {
        const supabase = await createClient()

        const from = page * LOGS_PER_PAGE
        const to = from + LOGS_PER_PAGE - 1

        const { data, count, error } = await supabase
            .from("activity_logs")
            .select("id, created_at, user_email, user_name, activity_type, description, ip_address", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(from, to)

        if (error) {
            console.error("Error fetching activity logs:", error)
            return { logs: [], total: 0 }
        }

        return {
            logs: (data ?? []) as ActivityLog[],
            total: count ?? 0,
        }
    } catch (error) {
        console.error("Failed to fetch activity logs:", error)
        return { logs: [], total: 0 }
    }
}
