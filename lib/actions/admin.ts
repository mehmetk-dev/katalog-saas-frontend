"use server"

import { createClient } from "@/lib/supabase/server"
import { apiFetch } from "@/lib/api"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function checkIsAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Security: Don't log sensitive environment variables
    if (user?.email !== ADMIN_EMAIL) {
        console.warn("Admin access denied for user")
    }

    return user?.email === ADMIN_EMAIL
}

export async function getAdminStats() {
    const supabase = await createClient()

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
        throw new Error("Unauthorized")
    }

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
    const supabase = await createClient()

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
        throw new Error("Unauthorized")
    }

    try {
        return await apiFetch<unknown[]>("/admin/users")
    } catch (error) {
        console.error("Failed to fetch admin users:", error)
        return []
    }
}

export async function getDeletedUsers() {
    const supabase = await createClient()

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
        throw new Error("Unauthorized")
    }

    try {
        return await apiFetch<unknown[]>("/admin/deleted-users")
    } catch (error) {
        console.error("Failed to fetch deleted users:", error)
        return []
    }
}

export async function updateUserPlan(userId: string, plan: 'free' | 'plus' | 'pro') {
    const supabase = await createClient()

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
        throw new Error("Unauthorized")
    }

    await apiFetch(`/admin/users/${userId}/plan`, {
        method: "PUT",
        body: JSON.stringify({ plan })
    })
    return { success: true }
}

