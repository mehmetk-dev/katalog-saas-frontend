"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2, CheckCircle2, XCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type PdfExportPhase = "idle" | "preparing" | "rendering" | "processing" | "saving" | "done" | "error" | "cancelled"

export interface PdfProgressState {
    phase: PdfExportPhase
    currentPage: number
    totalPages: number
    percent: number
    estimatedTimeLeft: string
    errorMessage?: string
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
    preparing: <Loader2 className="h-6 w-6 animate-spin text-violet-500" />,
    rendering: <FileDown className="h-6 w-6 text-violet-500 animate-pulse" />,
    processing: <Loader2 className="h-6 w-6 animate-spin text-violet-500" />,
    saving: <Loader2 className="h-6 w-6 animate-spin text-green-500" />,
    done: <CheckCircle2 className="h-6 w-6 text-green-500" />,
    error: <XCircle className="h-6 w-6 text-red-500" />,
    cancelled: <X className="h-6 w-6 text-orange-500" />,
}

export function PdfProgressModal({ state, onCancel, t }: PdfProgressModalProps) {
    const open = state.phase !== "idle"
    const canClose = state.phase === "done" || state.phase === "error" || state.phase === "cancelled"
    const canCancel = state.phase === "preparing" || state.phase === "rendering" || state.phase === "processing"

    const phaseLabels: Record<PdfExportPhase, string> = {
        idle: "",
        preparing: tr(t, "pdf.phrasePreparing", "Katalog hazırlanıyor..."),
        rendering: tr(t, "pdf.phraseRendering", "Sayfa {current} / {total} işleniyor...", { current: state.currentPage, total: state.totalPages }),
        processing: tr(t, "pdf.phraseProcessing", "PDF dosyası oluşturuluyor..."),
        saving: tr(t, "pdf.phraseSaving", "PDF kaydediliyor..."),
        done: tr(t, "pdf.phraseDone", "PDF başarıyla indirildi!"),
        error: tr(t, "pdf.phraseError", "PDF oluşturulamadı"),
        cancelled: tr(t, "pdf.phraseCancelled", "PDF indirme iptal edildi"),
    }

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
                        {phaseLabels[state.phase]}
                    </p>

                    {/* Progress bar */}
                    {(state.phase === "preparing" || state.phase === "rendering" || state.phase === "processing" || state.phase === "saving") && (
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
                        {canClose && onCancel && (
                            <Button variant="default" size="sm" onClick={onCancel}>
                                {tr(t, "common.close", "Kapat")}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export { INITIAL_STATE as PDF_PROGRESS_INITIAL_STATE }
