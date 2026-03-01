"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { getAdminStats, getDeletedUsers } from "@/lib/actions/admin"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import type { AdminStats, DeletedUser } from "@/components/admin/admin-dashboard/types"
import { useAdminUsers } from "@/components/admin/admin-dashboard/use-admin-users"
import { useAdminFeedbacks } from "@/components/admin/admin-dashboard/use-admin-feedbacks"
import { useAdminLogs } from "@/components/admin/admin-dashboard/use-admin-logs"

export function useAdminDashboard() {
    const { t } = useTranslation()

    // --- Orchestrated domain state ---
    const [stats, setStats] = useState<AdminStats>({
        usersCount: 0,
        productsCount: 0,
        catalogsCount: 0,
        totalExports: 0,
        deletedUsersCount: 0,
    })
    const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([])
    const [loading, setLoading] = useState(true)

    // --- Delegated sub-hooks ---
    const {
        users,
        searchTerm,
        setSearchTerm,
        filteredUsers,
        loadUsers,
        setUsersData,
        handlePlanUpdate,
    } = useAdminUsers()

    const {
        feedbacks,
        selectedFeedbackIds,
        loadFeedbacks,
        setFeedbacksData,
        handleFeedbackStatusUpdate,
        handleFeedbackDelete,
        handleBulkStatusUpdate,
        handleBulkDelete,
        toggleSelectFeedback,
        toggleSelectAllFeedbacks,
        clearSelectedFeedbacks,
    } = useAdminFeedbacks()

    const {
        activityLogs,
        loadingLogs,
        logsPage,
        logsTotalCount,
        totalLogsPages,
        fetchActivityLogs,
        handleLogsPageChange,
        resetLogsPage,
    } = useAdminLogs()

    // --- Central data loader ---
    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            resetLogsPage()

            const [statsData, usersData, deletedUsersData, feedbacksData] = await Promise.all([
                getAdminStats(),
                loadUsers(),
                getDeletedUsers(),
                loadFeedbacks(),
            ])

            setStats(statsData)
            setUsersData(usersData)
            setDeletedUsers(deletedUsersData as DeletedUser[])
            setFeedbacksData(feedbacksData)

            // Activity logs — bağımsız hata yönetimi
            fetchActivityLogs(0).catch((err) => console.error("Failed to load activity logs:", err))
        } catch (error: unknown) {
            console.error("Failed to load admin data:", error)
            toast.error(t("admin.dataLoadError"))
        } finally {
            setLoading(false)
        }
    }, [fetchActivityLogs, resetLogsPage, loadUsers, loadFeedbacks, setUsersData, setFeedbacksData])

    useEffect(() => {
        loadData()
    }, [loadData])

    return {
        t,
        stats,
        users,
        deletedUsers,
        feedbacks,
        selectedFeedbackIds,
        loading,
        searchTerm,
        activityLogs,
        loadingLogs,
        logsPage,
        logsTotalCount,
        totalLogsPages,
        filteredUsers,
        setSearchTerm,
        loadData,
        handlePlanUpdate,
        handleFeedbackStatusUpdate,
        handleFeedbackDelete,
        handleBulkStatusUpdate,
        handleBulkDelete,
        toggleSelectFeedback,
        toggleSelectAllFeedbacks,
        handleLogsPageChange,
        clearSelectedFeedbacks,
    }
}
