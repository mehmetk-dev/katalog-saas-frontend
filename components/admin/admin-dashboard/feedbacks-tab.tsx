import NextImage from "next/image"
import { CheckSquare, FileText, Film, Trash2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Feedback } from "@/lib/actions/feedback"

interface FeedbacksTabProps {
    feedbacks: Feedback[]
    selectedFeedbackIds: string[]
    onStatusUpdate: (id: string, status: Feedback["status"]) => void
    onDelete: (id: string) => void
    onBulkStatusUpdate: (status: Feedback["status"]) => void
    onBulkDelete: () => void
    onClearSelection: () => void
    onToggleSelect: (id: string) => void
    onToggleSelectAll: () => void
    t: (key: string) => string
}

export function FeedbacksTab({
    feedbacks,
    selectedFeedbackIds,
    onStatusUpdate,
    onDelete,
    onBulkStatusUpdate,
    onBulkDelete,
    onClearSelection,
    onToggleSelect,
    onToggleSelectAll,
    t,
}: FeedbacksTabProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-violet-600" />
                            {t("admin.feedbacksTitle")}
                        </CardTitle>
                        <CardDescription>
                            {t("admin.feedbacksDesc")}
                        </CardDescription>
                    </div>
                    {selectedFeedbackIds.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{selectedFeedbackIds.length} {t("admin.selected")}</span>
                            <Button variant="outline" size="sm" onClick={onClearSelection}>
                                <X className="w-4 h-4 mr-1" />
                                {t("admin.clear")}
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {feedbacks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>{t("admin.noFeedbacks")}</p>
                    </div>
                ) : (
                    <>
                        {selectedFeedbackIds.length > 0 && (
                            <div className="mb-4 p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/50 rounded-lg flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-violet-900 dark:text-violet-100">
                                    <CheckSquare className="w-4 h-4" />
                                    {selectedFeedbackIds.length} {t("admin.feedbacksSelected")}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onBulkStatusUpdate("pending")}
                                        className="text-xs"
                                    >
                                        {t("admin.setPending")}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onBulkStatusUpdate("resolved")}
                                        className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                    >
                                        {t("admin.setResolved")}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onBulkStatusUpdate("closed")}
                                        className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                                    >
                                        {t("admin.closeStatus")}
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                            >
                                                <Trash2 className="w-3 h-3 mr-1" />
                                                {t("admin.bulkDelete")}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t("admin.bulkDeleteTitle")}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {selectedFeedbackIds.length} {t("admin.bulkDeleteConfirm")}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                                <AlertDialogAction onClick={onBulkDelete} className="bg-red-600 hover:bg-red-700">
                                                    {selectedFeedbackIds.length} {t("admin.deleteFeedbacksAction")}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        )}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedFeedbackIds.length === feedbacks.length && feedbacks.length > 0}
                                            onCheckedChange={onToggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>{t("admin.date")}</TableHead>
                                    <TableHead>{t("admin.user")}</TableHead>
                                    <TableHead>{t("admin.subject")}</TableHead>
                                    <TableHead>{t("admin.message")}</TableHead>
                                    <TableHead>{t("admin.attachments")}</TableHead>
                                    <TableHead>{t("admin.pageCol")}</TableHead>
                                    <TableHead>{t("admin.status")}</TableHead>
                                    <TableHead className="text-right">{t("admin.action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {feedbacks.map((feedback) => (
                                    <TableRow
                                        key={feedback.id}
                                        className={selectedFeedbackIds.includes(feedback.id) ? "bg-violet-50 dark:bg-violet-950/20" : ""}
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedFeedbackIds.includes(feedback.id)}
                                                onCheckedChange={() => onToggleSelect(feedback.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(feedback.created_at).toLocaleString("tr-TR")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-xs">{feedback.user_name}</span>
                                                <span className="text-[10px] text-muted-foreground">{feedback.user_email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-xs">{feedback.subject}</TableCell>
                                        <TableCell className="text-xs max-w-[200px] break-words">{feedback.message}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 max-w-[120px]">
                                                {feedback.attachments?.map((url, idx) => {
                                                    // URL güvenlik kontrolü — sadece http/https kabul et
                                                    let isSafeUrl = false
                                                    try {
                                                        const parsed = new URL(url)
                                                        isSafeUrl = ['http:', 'https:'].includes(parsed.protocol)
                                                    } catch { /* invalid URL */ }

                                                    if (!isSafeUrl) return null

                                                    const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes("/video")
                                                    return (
                                                        <a
                                                            key={idx}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="relative w-8 h-8 rounded border overflow-hidden bg-slate-100 flex items-center justify-center hover:opacity-80 transition-opacity"
                                                        >
                                                            {isVideo ? (
                                                                <Film className="w-4 h-4 text-slate-500" />
                                                            ) : (
                                                                <NextImage src={url} alt="" fill className="object-cover" unoptimized />
                                                            )}
                                                        </a>
                                                    )
                                                })}
                                                {(!feedback.attachments || feedback.attachments.length === 0) && (
                                                    <span className="text-[10px] text-muted-foreground">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[10px] text-violet-600 font-mono">
                                            {feedback.page_url || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={feedback.status === "pending" ? "outline" : feedback.status === "resolved" ? "default" : "secondary"}
                                                className={cn(
                                                    "text-[10px] whitespace-nowrap",
                                                    feedback.status === "pending" && "bg-amber-50 text-amber-700 border-amber-200",
                                                    feedback.status === "resolved" && "bg-green-50 text-green-700 border-green-200"
                                                )}
                                            >
                                                {feedback.status === "pending" ? t("admin.pending") : feedback.status === "resolved" ? t("admin.resolved") : t("admin.closed")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <Select
                                                    value={feedback.status}
                                                    onValueChange={(value) => onStatusUpdate(feedback.id, value as Feedback["status"])}
                                                >
                                                    <SelectTrigger className="w-[110px] h-7 text-[10px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">{t("admin.pending")}</SelectItem>
                                                        <SelectItem value="resolved">{t("admin.resolved")}</SelectItem>
                                                        <SelectItem value="closed">{t("admin.closed")}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t("admin.deleteFeedback")}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t("admin.deleteFeedbackConfirm")}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => onDelete(feedback.id)} className="bg-red-600 hover:bg-red-700">
                                                                {t("common.delete")}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
