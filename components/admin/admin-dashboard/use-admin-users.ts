"use client"

import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

import { getAdminUsers, updateUserPlan } from "@/lib/actions/admin"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import type { AdminUser } from "@/components/admin/admin-dashboard/types"

export function useAdminUsers() {
    const { t } = useTranslation()
    const [users, setUsers] = useState<AdminUser[]>([])
    const [searchTerm, setSearchTerm] = useState("")

    const loadUsers = useCallback(async () => {
        return await getAdminUsers() as AdminUser[]
    }, [])

    const setUsersData = useCallback((data: AdminUser[]) => {
        setUsers(data)
    }, [])

    const handlePlanUpdate = async (userId: string, newPlan: "free" | "plus" | "pro") => {
        try {
            await updateUserPlan(userId, newPlan)
            setUsers(prev => prev.map((user) => (user.id === userId ? { ...user, plan: newPlan } : user)))
            toast.success(`${t("toasts.profileUpdated")} (${newPlan.toUpperCase()})`)
        } catch {
            toast.error(t("toasts.profileUpdateFailed"))
        }
    }

    const filteredUsers = useMemo(
        () =>
            users.filter(
                (user) =>
                    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [users, searchTerm]
    )

    return {
        users,
        searchTerm,
        setSearchTerm,
        filteredUsers,
        loadUsers,
        setUsersData,
        handlePlanUpdate,
    }
}
