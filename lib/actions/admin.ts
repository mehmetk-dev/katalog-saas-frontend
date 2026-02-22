"use server"

import { createClient } from "@/lib/supabase/server"
import { apiFetch } from "@/lib/api"

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

export async function getAdminStats() {
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) throw new Error("Unauthorized")

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
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) throw new Error("Unauthorized")

    try {
        return await apiFetch<unknown[]>("/admin/users")
    } catch (error) {
        console.error("Failed to fetch admin users:", error)
        return []
    }
}

export async function getDeletedUsers() {
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) throw new Error("Unauthorized")

    try {
        return await apiFetch<unknown[]>("/admin/deleted-users")
    } catch (error) {
        console.error("Failed to fetch deleted users:", error)
        return []
    }
}

export async function updateUserPlan(userId: string, plan: 'free' | 'plus' | 'pro') {
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) throw new Error("Unauthorized")

    await apiFetch(`/admin/users/${userId}/plan`, {
        method: "PUT",
        body: JSON.stringify({ plan })
    })
    return { success: true }
}
