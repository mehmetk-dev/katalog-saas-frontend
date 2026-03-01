import { Activity, ChevronLeft, ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ActivityLog } from "@/components/admin/admin-dashboard/types"

interface ActivityLogsTabProps {
    activityLogs: ActivityLog[]
    loadingLogs: boolean
    logsPage: number
    totalLogsPages: number
    logsTotalCount: number
    onPageChange: (page: number) => void
    t: (key: string) => string
}

export function ActivityLogsTab({
    activityLogs,
    loadingLogs,
    logsPage,
    totalLogsPages,
    logsTotalCount,
    onPageChange,
    t,
}: ActivityLogsTabProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            {t("admin.activityLogs")}
                        </CardTitle>
                        <CardDescription>{t("admin.activityLogsDesc")}</CardDescription>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {t("admin.totalLabel")} <span className="font-semibold text-foreground">{logsTotalCount}</span> {t("admin.records")}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loadingLogs ? (
                    <div className="text-center py-8">{t("common.loading")}</div>
                ) : activityLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>{t("admin.noActivityLogs")}</p>
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("admin.date")}</TableHead>
                                    <TableHead>{t("admin.user")}</TableHead>
                                    <TableHead>{t("admin.action")}</TableHead>
                                    <TableHead>{t("admin.detail")}</TableHead>
                                    <TableHead>IP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activityLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                            {new Date(log.created_at).toLocaleString("tr-TR")}
                                        </TableCell>
                                        <TableCell className="font-medium text-xs">
                                            {log.user_email || log.user_name || t("admin.anonymous")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {log.activity_type || "-"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs max-w-[200px] truncate" title={log.description}>
                                            {log.description || "-"}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{log.ip_address || "-"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {totalLogsPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    {t("admin.pageCol")} {logsPage + 1} / {totalLogsPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onPageChange(logsPage - 1)}
                                        disabled={logsPage === 0 || loadingLogs}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        {t("admin.previous")}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onPageChange(logsPage + 1)}
                                        disabled={logsPage >= totalLogsPages - 1 || loadingLogs}
                                    >
                                        {t("admin.next")}
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
