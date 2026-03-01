"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { LucideIcon } from "lucide-react"
import {
    Activity, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
    LogIn, LogOut, UserPlus, Crown, ArrowDown, BookOpen, Edit, Trash,
    Globe, EyeOff, Package, Upload, Download, Tag, FileDown, User, Key, UserMinus
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { tr, enUS } from "date-fns/locale"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { ActivityLog, ActivityType, ACTIVITY_TYPE_LABELS } from "@/lib/services/activity-logger"
import { cn } from "@/lib/utils"

interface ActivityLogsClientProps {
    initialLogs: ActivityLog[]
    initialTotal: number
}

const ICON_MAP: Record<string, LucideIcon> = {
    LogIn, LogOut, UserPlus, Crown, ArrowDown, BookOpen, Edit, Trash,
    Globe, EyeOff, Package, Upload, Download, Tag, FileDown, User, Key, UserMinus
}

const COLOR_MAP: Record<string, string> = {
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export function ActivityLogsClient({ initialLogs, initialTotal }: ActivityLogsClientProps) {
    const { language, t } = useTranslation()
    const [logs, setLogs] = useState<ActivityLog[]>(initialLogs)
    const [total, setTotal] = useState(initialTotal)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [activityFilter, setActivityFilter] = useState<string>("all")
    const limit = 25

    // Debounce search term — 400ms gecikme ile server'a gönder
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
            setPage(1) // Arama değiştiğinde sayfa 1'e dön
        }, 400)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            })
            if (activityFilter !== "all") {
                params.append("activityType", activityFilter)
            }
            if (debouncedSearch.trim()) {
                params.append("search", debouncedSearch.trim())
            }

            const response = await fetch(`/api/admin/activity-logs?${params}`)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const data = await response.json()
            setLogs(data.logs ?? [])
            setTotal(data.total ?? 0)
        } catch (error) {
            console.error("Failed to fetch logs:", error)
            setLogs([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }, [page, activityFilter, debouncedSearch])

    // İlk render'da initialLogs kullan, filtre/sayfa/arama değişince fetch
    const isInitialRender = useMemo(() => {
        return page === 1 && activityFilter === "all" && debouncedSearch === ""
    }, [page, activityFilter, debouncedSearch])

    useEffect(() => {
        // İlk render'da SSR verisini kullan, tekrar fetch etme
        if (isInitialRender && initialLogs.length > 0) return
        fetchLogs()
    }, [fetchLogs, isInitialRender, initialLogs.length])

    const totalPages = Math.ceil(total / limit)

    const getActivityLabel = (type: ActivityType) => {
        const label = ACTIVITY_TYPE_LABELS[type]
        return language === "tr" ? label.tr : label.en
    }

    const getActivityIcon = (type: ActivityType) => {
        const label = ACTIVITY_TYPE_LABELS[type]
        return ICON_MAP[label.icon] || Activity
    }

    const getActivityColor = (type: ActivityType) => {
        const label = ACTIVITY_TYPE_LABELS[type]
        return COLOR_MAP[label.color] || COLOR_MAP.gray
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Activity className="w-6 h-6 text-primary" />
                        {t("admin.activityLogs")}
                    </h2>
                    <p className="text-muted-foreground">
                        {t("admin.activityLogsDesc")}
                    </p>
                </div>
                <Button variant="outline" onClick={fetchLogs} disabled={loading}>
                    <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                    {t("admin.refresh")}
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder={t("admin.searchLogsPlaceholder")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={activityFilter} onValueChange={setActivityFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder={t("admin.activityType")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("admin.allActivities")}</SelectItem>
                                {Object.entries(ACTIVITY_TYPE_LABELS).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>
                                        {language === "tr" ? value.tr : value.en}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Activity List */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{t("admin.recentActivities")}</CardTitle>
                    <CardDescription>
                        {t("admin.totalLabel")} {total} {t("admin.records")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-lg border">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-48" />
                                            <Skeleton className="h-3 w-72" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>{t("admin.noActivityFound")}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {logs.map((log) => {
                                    const Icon = getActivityIcon(log.activity_type as ActivityType)
                                    const colorClass = getActivityColor(log.activity_type as ActivityType)

                                    return (
                                        <div
                                            key={log.id}
                                            className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                        >
                                            <div className={cn("p-2.5 rounded-full shrink-0", colorClass)}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium truncate">
                                                        {log.user_name || log.user_email || t("admin.unknownUser")}
                                                    </span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {getActivityLabel(log.activity_type as ActivityType)}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {log.description}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span>
                                                        {(() => {
                                                            try {
                                                                const date = new Date(log.created_at)
                                                                if (isNaN(date.getTime())) return t("admin.unknown")
                                                                return formatDistanceToNow(date, {
                                                                    addSuffix: true,
                                                                    locale: language === "tr" ? tr : enUS
                                                                })
                                                            } catch {
                                                                return t("admin.unknown")
                                                            }
                                                        })()}
                                                    </span>
                                                    {log.ip_address && (
                                                        <span className="hidden sm:inline">
                                                            IP: {log.ip_address}
                                                        </span>
                                                    )}
                                                </div>
                                                {log.metadata && Object.keys(log.metadata).length > 0 && (() => {
                                                    const SAFE_METADATA_KEYS = ['action', 'entity', 'entityId', 'entityType', 'changes', 'count', 'plan', 'previousPlan', 'catalogName', 'productName']
                                                    const safeMetadata = Object.fromEntries(
                                                        Object.entries(log.metadata).filter(([key]) => SAFE_METADATA_KEYS.includes(key))
                                                    )
                                                    if (Object.keys(safeMetadata).length === 0) return null
                                                    return (
                                                        <div className="mt-2 text-xs bg-muted/50 rounded p-2">
                                                            <pre className="overflow-x-auto">
                                                                {JSON.stringify(safeMetadata, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                            <div className="text-xs text-muted-foreground shrink-0 hidden md:block">
                                                {(() => {
                                                    try {
                                                        const date = new Date(log.created_at)
                                                        if (isNaN(date.getTime())) return t("admin.unknown")
                                                        return format(date, "dd MMM yyyy HH:mm", {
                                                            locale: language === "tr" ? tr : enUS
                                                        })
                                                    } catch {
                                                        return t("admin.unknown")
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t mt-4">
                            <p className="text-sm text-muted-foreground">
                                {t("admin.pageCol")} {page} / {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1 || loading}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || loading}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
