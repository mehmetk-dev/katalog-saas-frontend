"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { getAdminStats, getAdminUsers, getDeletedUsers, updateUserPlan } from "@/lib/actions/admin"
import {
    bulkDeleteFeedbacks,
    bulkUpdateFeedbackStatus,
    deleteFeedback,
    getFeedbacks,
    type Feedback,
    updateFeedbackStatus,
} from "@/lib/actions/feedback"
import { useTranslation } from "@/lib/i18n-provider"
import { createClient } from "@/lib/supabase/client"
import type { ActivityLog, AdminStats, AdminUser, DeletedUser } from "@/components/admin/admin-dashboard/types"

const LOGS_PER_PAGE = 20

export function useAdminDashboard() {
    const { t } = useTranslation()

    const [stats, setStats] = useState<AdminStats>({
        usersCount: 0,
        productsCount: 0,
        catalogsCount: 0,
        totalExports: 0,
        deletedUsersCount: 0,
    })
    const [users, setUsers] = useState<AdminUser[]>([])
    const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([])
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
    const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
    const [loadingLogs, setLoadingLogs] = useState(false)
    const [logsPage, setLogsPage] = useState(0)
    const [logsTotalCount, setLogsTotalCount] = useState(0)

    const totalLogsPages = Math.ceil(logsTotalCount / LOGS_PER_PAGE)

    const fetchActivityLogs = useCallback(async (page: number = 0) => {
        setLoadingLogs(true)
        try {
            const client = createClient()

            const { count, error: countError } = await client
                .from("activity_logs")
                .select("*", { count: "exact", head: true })

            if (countError) {
                console.error("Error fetching logs count:", countError)
                toast.error(`Log sayısı alınamadı: ${countError.message}`)
                setLogsTotalCount(0)
            } else {
                setLogsTotalCount(count || 0)
            }

            const from = page * LOGS_PER_PAGE
            const to = from + LOGS_PER_PAGE - 1

            const { data, error } = await client
                .from("activity_logs")
                .select("*")
                .order("created_at", { ascending: false })
                .range(from, to)

            if (error) {
                console.error("Error fetching logs:", error)
                toast.error(`Loglar yüklenemedi: ${error.message}`)
                setActivityLogs([])
            } else {
                setActivityLogs(data || [])
            }
        } catch (error) {
            console.error("Error fetching activity logs:", error)
            const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata"
            toast.error(`Beklenmeyen hata: ${errorMessage}`)
            setActivityLogs([])
            setLogsTotalCount(0)
        } finally {
            setLoadingLogs(false)
        }
    }, [])

    const handleLogsPageChange = useCallback(
        (newPage: number) => {
            setLogsPage(newPage)
            fetchActivityLogs(newPage)
        },
        [fetchActivityLogs]
    )

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            setLogsPage(0)
            fetchActivityLogs(0).catch((err) => console.error("Failed to load activity logs:", err))

            const statsData = await getAdminStats()
            setStats(statsData)

            const [usersData, deletedUsersData, feedbacksData] = await Promise.all([
                getAdminUsers(),
                getDeletedUsers(),
                getFeedbacks(),
            ])
            setUsers(usersData as AdminUser[])
            setDeletedUsers(deletedUsersData as DeletedUser[])
            setFeedbacks(feedbacksData)
        } catch (error: unknown) {
            console.error("Failed to load admin data:", error)
            toast.error(t("toasts.errorOccurred"))
        } finally {
            setLoading(false)
        }
    }, [fetchActivityLogs, t])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handlePlanUpdate = async (userId: string, newPlan: "free" | "plus" | "pro") => {
        try {
            await updateUserPlan(userId, newPlan)
            setUsers(users.map((user) => (user.id === userId ? { ...user, plan: newPlan } : user)))
            toast.success(`${t("toasts.profileUpdated")} (${newPlan.toUpperCase()})`)
        } catch {
            toast.error(t("toasts.profileUpdateFailed"))
        }
    }

    const handleFeedbackStatusUpdate = async (id: string, status: Feedback["status"]) => {
        try {
            await updateFeedbackStatus(id, status)
            setFeedbacks(feedbacks.map((feedback) => (feedback.id === id ? { ...feedback, status } : feedback)))
            toast.success("Geri bildirim durumu güncellendi")
        } catch {
            toast.error("İşlem başarısız oldu")
        }
    }

    const handleFeedbackDelete = async (id: string) => {
        try {
            await deleteFeedback(id)
            setFeedbacks(feedbacks.filter((feedback) => feedback.id !== id))
            setSelectedFeedbackIds(selectedFeedbackIds.filter((feedbackId) => feedbackId !== id))
            toast.success("Geri bildirim ve ekli dosyalar silindi")
        } catch (error) {
            console.error("Error deleting feedback:", error)
            toast.error("Geri bildirim silinirken bir hata oluştu")
        }
    }

    const handleBulkStatusUpdate = async (status: Feedback["status"]) => {
        if (selectedFeedbackIds.length === 0) {
            toast.error("Lütfen en az bir geri bildirim seçin")
            return
        }

        try {
            await bulkUpdateFeedbackStatus(selectedFeedbackIds, status)
            setFeedbacks(
                feedbacks.map((feedback) =>
                    selectedFeedbackIds.includes(feedback.id) ? { ...feedback, status } : feedback
                )
            )
            setSelectedFeedbackIds([])
            toast.success(
                `${selectedFeedbackIds.length} geri bildirim ${status === "pending" ? "beklemeye" : status === "resolved" ? "çözüldüye" : "kapatıldı"
                } alındı`
            )
        } catch (error) {
            console.error("Error updating feedbacks:", error)
            toast.error("Toplu güncelleme başarısız oldu")
        }
    }

    const handleBulkDelete = async () => {
        if (selectedFeedbackIds.length === 0) {
            toast.error("Lütfen en az bir geri bildirim seçin")
            return
        }

        try {
            const result = await bulkDeleteFeedbacks(selectedFeedbackIds)
            setFeedbacks(feedbacks.filter((feedback) => !selectedFeedbackIds.includes(feedback.id)))
            setSelectedFeedbackIds([])
            toast.success(
                `${result.deletedCount} geri bildirim ve ekli dosyalar silindi${result.errorCount > 0 ? ` (${result.errorCount} hata)` : ""
                }`
            )
        } catch (error) {
            console.error("Error deleting feedbacks:", error)
            toast.error("Toplu silme başarısız oldu")
        }
    }

    const toggleSelectFeedback = (id: string) => {
        if (selectedFeedbackIds.includes(id)) {
            setSelectedFeedbackIds(selectedFeedbackIds.filter((feedbackId) => feedbackId !== id))
        } else {
            setSelectedFeedbackIds([...selectedFeedbackIds, id])
        }
    }

    const toggleSelectAllFeedbacks = () => {
        if (selectedFeedbackIds.length === feedbacks.length) {
            setSelectedFeedbackIds([])
        } else {
            setSelectedFeedbackIds(feedbacks.map((feedback) => feedback.id))
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

    const clearSelectedFeedbacks = () => setSelectedFeedbackIds([])

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
