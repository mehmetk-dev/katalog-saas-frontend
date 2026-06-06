"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, FileDown, Loader2, CheckCircle2, XCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export type PdfExportPhase =
    | "idle"
    | "queued"
    | "preparing"
    | "rendering"
    | "generating"
    | "uploading"
    | "processing"
    | "saving"
    | "done"
    | "error"
    | "cancelled"

export interface PdfProgressState {
    phase: PdfExportPhase
    currentPage: number
    totalPages: number
    percent: number
    estimatedTimeLeft: string
    stageLabel?: string
    stageDescription?: string
    errorMessage?: string
    downloadUrl?: string
    shareUrl?: string
}

const INITIAL_STATE: PdfProgressState = {
    phase: "idle",
    currentPage: 0,
    totalPages: 0,
    percent: 0,
    estimatedTimeLeft: "",
}

interface PdfProgressModalProps {
    state: PdfProgressState
    onCancel?: () => void
    onDismiss?: () => void
    /** i18n translation function – fallback strings embedded */
    t?: (key: string, params?: Record<string, unknown>) => string
}

function tr(t: PdfProgressModalProps["t"], key: string, fallback: string, params?: Record<string, unknown>) {
    if (t) {
        const v = t(key, params)
        if (v && v !== key) return v
    }
    if (params) {
        let result = fallback
        for (const [k, v] of Object.entries(params)) {
            result = result.replace(`{${k}}`, String(v))
        }
        return result
    }
    return fallback
}

/** Static phase icons — safe to define at module scope (no props dependency) */
const PHASE_ICONS: Record<PdfExportPhase, React.ReactNode> = {
    idle: null,
    queued: <Loader2 className="h-6 w-6 animate-spin text-violet-500" />,
    preparing: <Loader2 className="h-6 w-6 animate-spin text-violet-500" />,
    rendering: <FileDown className="h-6 w-6 text-violet-500 animate-pulse" />,
    generating: <Loader2 className="h-6 w-6 animate-spin text-violet-500" />,
    uploading: <Loader2 className="h-6 w-6 animate-spin text-green-500" />,
    processing: <Loader2 className="h-6 w-6 animate-spin text-violet-500" />,
    saving: <Loader2 className="h-6 w-6 animate-spin text-green-500" />,
    done: <CheckCircle2 className="h-6 w-6 text-green-500" />,
    error: <XCircle className="h-6 w-6 text-red-500" />,
    cancelled: <X className="h-6 w-6 text-orange-500" />,
}

export function PdfProgressModal({ state, onCancel, onDismiss, t }: PdfProgressModalProps) {
    const open = state.phase !== "idle"
    const canClose = state.phase === "done" || state.phase === "error" || state.phase === "cancelled"
    const canCancel = state.phase === "queued" || state.phase === "preparing" || state.phase === "rendering" || state.phase === "generating" || state.phase === "uploading" || state.phase === "processing"

    const phaseLabels: Record<PdfExportPhase, string> = {
        idle: "",
        queued: tr(t, "pdf.phraseQueued", "Sırada"),
        generating: tr(t, "pdf.phraseGenerating", "PDF oluşturuluyor"),
        uploading: tr(t, "pdf.phraseUploading", "Yükleniyor"),
        preparing: tr(t, "pdf.phrasePreparing", "Katalog hazırlanıyor..."),
        rendering: tr(t, "pdf.phraseRendering", "Sayfa {current} / {total} işleniyor...", { current: state.currentPage, total: state.totalPages }),
        processing: tr(t, "pdf.phraseProcessing", "PDF dosyası oluşturuluyor..."),
        saving: tr(t, "pdf.phraseSaving", "PDF kaydediliyor..."),
        done: tr(t, "pdf.phraseDone", "PDF hazır!"),
        error: tr(t, "pdf.phraseError", "PDF oluşturulamadı"),
        cancelled: tr(t, "pdf.phraseCancelled", "PDF indirme iptal edildi"),
    }
    const activePhase = state.phase === "queued" || state.phase === "preparing" || state.phase === "rendering" || state.phase === "generating" || state.phase === "uploading" || state.phase === "processing" || state.phase === "saving"

    return (
        <Dialog open={open} onOpenChange={() => { /* controlled externally */ }}>
            <DialogContent
                className="sm:max-w-md"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => { if (!canClose) e.preventDefault() }}
                showCloseButton={canClose}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-lg">
                        {PHASE_ICONS[state.phase]}
                        {tr(t, "pdf.modalTitle", "PDF İndirme")}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {tr(t, "pdf.modalDesc", "Katalog PDF olarak hazırlanıyor")}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Phase label */}
                    <p className={cn(
                        "text-sm font-medium text-center",
                        state.phase === "done" && "text-green-600",
                        state.phase === "error" && "text-red-600",
                        state.phase === "cancelled" && "text-orange-600",
                    )}>
                        {state.stageLabel || phaseLabels[state.phase]}
                    </p>
                    {state.stageDescription && (
                        <p className="text-center text-xs text-muted-foreground">{state.stageDescription}</p>
                    )}

                    {/* Progress bar */}
                    {activePhase && (
                        <div className="space-y-2">
                            <Progress
                                value={state.percent}
                                className="h-3 bg-gray-100 dark:bg-gray-800 [&>div]:bg-violet-600 [&>div]:transition-all [&>div]:duration-300"
                            />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    {state.phase === "rendering" && state.totalPages > 0
                                        ? `${state.currentPage} / ${state.totalPages}`
                                        : ""}
                                </span>
                                <div className="flex items-center gap-2">
                                    {state.estimatedTimeLeft && (
                                        <span>{tr(t, "pdf.estimated", "Tahmini: {time}", { time: state.estimatedTimeLeft })}</span>
                                    )}
                                    <span className="font-semibold text-violet-600">{Math.round(state.percent)}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error message */}
                    {state.phase === "error" && state.errorMessage && (
                        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg p-3">{state.errorMessage}</p>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 pt-2">
                        {canCancel && onCancel && (
                            <Button variant="outline" size="sm" onClick={onCancel}>
                                {tr(t, "common.cancel", "İptal")}
                            </Button>
                        )}
                        {canCancel && onDismiss && (
                            <Button variant="secondary" size="sm" onClick={onDismiss}>
                                {tr(t, "pdf.continueInBackground", "Arka planda sürdür")}
                            </Button>
                        )}
                        {canClose && onCancel && (
                            <Button variant="outline" size="sm" onClick={onCancel}>
                                {tr(t, "common.close", "Kapat")}
                            </Button>
                        )}
                        {state.phase === "done" && state.shareUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    void navigator.clipboard.writeText(state.shareUrl || "")
                                    toast.success("PDF linki kopyalandı.")
                                }}
                            >
                                <Copy className="h-3.5 w-3.5 mr-1.5" />
                                Linki Kopyala
                            </Button>
                        )}
                        {state.phase === "done" && state.downloadUrl && (
                            <Button
                                variant="default"
                                size="sm"
                                asChild
                            >
                                <a
                                    href={state.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                >
                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                    PDF İndir
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export { INITIAL_STATE as PDF_PROGRESS_INITIAL_STATE }
