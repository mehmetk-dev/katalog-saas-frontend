"use client"

import { useState, useCallback, useMemo } from "react"
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Package, Download, CreditCard, Sparkles, X, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
    useNotifications,
    useMarkNotificationAsRead,
    useMarkAllNotificationsAsRead,
    useDeleteNotification,
    useDeleteAllNotifications,
} from "@/lib/hooks/use-notifications"
import { useCancelPdfExportJob, usePdfExportJobs, usePdfExportShareLink } from "@/lib/hooks/use-pdf-export-jobs"
import { getPdfExportProgressDisplay } from "@/lib/pdf-export-progress"
import type { PdfExportJob } from "@/lib/actions/pdf-export-types"

import { useTranslation } from "@/lib/contexts/i18n-provider"

export function NotificationDropdown() {
    const { t: baseT, language } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
    const [isOpen, setIsOpen] = useState(false)

    // React Query hooks — auto-refetch, dedup, optimistic updates hepsi built-in
    const { data, isLoading } = useNotifications()
    const notifications = data?.notifications ?? []
    const unreadCount = data?.unreadCount ?? 0

    const markAsRead = useMarkNotificationAsRead()
    const markAllAsRead = useMarkAllNotificationsAsRead()
    const deleteOne = useDeleteNotification()
    const deleteAll = useDeleteAllNotifications()
    const { data: pdfExportData } = usePdfExportJobs()
    const pdfExportJob = useMemo(() => selectVisiblePdfExportJob(pdfExportData?.jobs ?? []), [pdfExportData?.jobs])
    const pdfExportDisplay = pdfExportJob ? getPdfExportProgressDisplay(pdfExportJob) : null
    const pdfShareLink = usePdfExportShareLink(pdfExportJob?.status === "completed" ? pdfExportJob.id : null)
    const cancelPdfExport = useCancelPdfExportJob()

    const handleMarkAsRead = (id: string) => markAsRead.mutate(id)
    const handleMarkAllAsRead = () => markAllAsRead.mutate()
    const handleDelete = (id: string) => deleteOne.mutate(id)
    const handleDeleteAll = () => deleteAll.mutate()

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "catalog_created":
                return <Package className="w-4 h-4 text-blue-500" />
            case "catalog_downloaded":
                return <Download className="w-4 h-4 text-green-500" />
            case "subscription_started":
            case "subscription_cancelled":
            case "subscription_expiring":
            case "subscription_expired":
                return <CreditCard className="w-4 h-4 text-violet-500" />
            case "welcome":
                return <Sparkles className="w-4 h-4 text-amber-500" />
            default:
                return <Bell className="w-4 h-4 text-gray-500" />
        }
    }

    // Validate action_url is safe (relative or same-origin only)
    const isSafeUrl = useCallback((url: string): boolean => {
        if (!url) return false
        if (url.startsWith('/')) return true
        try {
            const parsed = new URL(url, window.location.origin)
            return parsed.origin === window.location.origin
        } catch {
            return false
        }
    }, [])

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return t("settings.notifications.time.now")
        if (diffMins < 60) return t("settings.notifications.time.minsAgo", { count: diffMins })
        if (diffHours < 24) return t("settings.notifications.time.hoursAgo", { count: diffHours })
        if (diffDays < 7) return t("settings.notifications.time.daysAgo", { count: diffDays })
        return date.toLocaleDateString(language === 'tr' ? "tr-TR" : "en-US")
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b">
                    <h3 className="font-semibold text-sm">{t("settings.notifications.title")}</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            onClick={handleMarkAllAsRead}
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            {t("settings.notifications.markAllRead")}
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                <ScrollArea className="h-[320px]">
                    {pdfExportJob && pdfExportDisplay && (
                        <PdfExportStatusCard
                            job={pdfExportJob}
                            title={pdfExportDisplay.title}
                            description={pdfExportDisplay.description}
                            percent={pdfExportDisplay.percent}
                            isActive={pdfExportDisplay.isActive}
                            downloadUrl={pdfShareLink.data?.url}
                            isLoadingLink={pdfShareLink.isFetching}
                            onCancel={() => cancelPdfExport.mutate(pdfExportJob.id)}
                        />
                    )}

                    {isLoading && notifications.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                            {t("settings.notifications.loading")}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-sm text-muted-foreground">
                            <Bell className="w-8 h-8 mb-2 opacity-30" />
                            <p>{t("settings.notifications.noNotifications")}</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-3 hover:bg-muted/50 transition-colors relative group",
                                        !notification.is_read && "bg-blue-50/50 dark:bg-blue-950/20"
                                    )}
                                >
                                    <div className="flex gap-3 pr-14">
                                        <div className="shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    "text-sm break-words line-clamp-2",
                                                    !notification.is_read && "font-medium"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                {!notification.is_read && (
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 break-words">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatTime(notification.created_at)}
                                                </span>
                                                {notification.action_url && isSafeUrl(notification.action_url) && (
                                                    <Link
                                                        href={notification.action_url}
                                                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                                                        onClick={() => {
                                                            handleMarkAsRead(notification.id)
                                                            setIsOpen(false)
                                                        }}
                                                    >
                                                        {t("settings.notifications.view")}
                                                        <ExternalLink className="w-2.5 h-2.5" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons on hover */}
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        {!notification.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                            >
                                                <Check className="w-3 h-3" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(notification.id)}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="p-2 border-t flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-xs text-destructive hover:text-destructive"
                            onClick={handleDeleteAll}
                        >
                            <Trash2 className="w-3 h-3 mr-1" />
                            {t("settings.notifications.clearAll")}
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function selectVisiblePdfExportJob(jobs: PdfExportJob[]): PdfExportJob | null {
    const active = jobs.find((job) => job.status === "queued" || job.status === "processing")
    if (active) return active

    const recentCutoff = Date.now() - 2 * 60 * 60 * 1000
    return jobs.find((job) => {
        if (!["completed", "failed", "cancelled"].includes(job.status)) return false
        return new Date(job.updated_at || job.created_at).getTime() >= recentCutoff
    }) ?? null
}

function PdfExportStatusCard({
    job,
    title,
    description,
    percent,
    isActive,
    downloadUrl,
    isLoadingLink,
    onCancel,
}: {
    job: PdfExportJob
    title: string
    description: string
    percent: number
    isActive: boolean
    downloadUrl?: string
    isLoadingLink: boolean
    onCancel: () => void
}) {
    const { t } = useTranslation()
    const isFailed = job.status === "failed"
    const isCompleted = job.status === "completed"

    const translate = useCallback((key: string, fallback: string) => {
        const result = t(key)
        return result === key ? fallback : result
    }, [t])

    return (
        <div className="border-b bg-violet-50/60 p-3 dark:bg-violet-950/20">
            <div className="flex gap-3">
                <div className="mt-0.5 shrink-0">
                    {isActive ? (
                        <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                    ) : isFailed ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                        <Download className="h-4 w-4 text-green-600" />
                    )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{translate("common.pdf.pdfExportTitle", "PDF Export")}</p>
                            <p className="text-xs font-medium text-violet-700 dark:text-violet-300">{title}</p>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-violet-700 dark:text-violet-300">
                            {Math.round(percent)}%
                        </span>
                    </div>
                    <Progress value={percent} className="h-2 bg-white/70 dark:bg-slate-900/60" />
                    <p className="text-xs text-muted-foreground">{description}</p>
                    <div className="flex items-center justify-end gap-2">
                        {isActive && (
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onCancel}>
                                {t("common.cancel")}
                            </Button>
                        )}
                        {isCompleted && (
                            <Button
                                variant="default"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={!downloadUrl || isLoadingLink}
                                onClick={() => downloadUrl && window.open(downloadUrl, "_blank", "noopener,noreferrer")}
                            >
                                {isLoadingLink ? translate("common.pdf.preparingLink", "Hazırlanıyor") : translate("common.pdf.downloadButton", "İndir")}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
