"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

import { getAdminActivityLogs } from "@/lib/actions/admin"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import type { ActivityLog } from "@/components/admin/admin-dashboard/types"

const LOGS_PER_PAGE = 20

export function useAdminLogs() {
    const { t } = useTranslation()
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
    const [loadingLogs, setLoadingLogs] = useState(false)
    const [logsPage, setLogsPage] = useState(0)
    const [logsTotalCount, setLogsTotalCount] = useState(0)

    const totalLogsPages = Math.ceil(logsTotalCount / LOGS_PER_PAGE)

    const fetchActivityLogs = useCallback(async (page: number = 0) => {
        setLoadingLogs(true)
        try {
            const { logs, total } = await getAdminActivityLogs(page)
            setActivityLogs(logs)
            setLogsTotalCount(total)
        } catch (error) {
            console.error("Error fetching activity logs:", error)
            toast.error(t("admin.activityLogsError"))
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

    const resetLogsPage = useCallback(() => {
        setLogsPage(0)
    }, [])

    return {
        activityLogs,
        loadingLogs,
        logsPage,
        logsTotalCount,
        totalLogsPages,
        fetchActivityLogs,
        handleLogsPageChange,
        resetLogsPage,
    }
}
