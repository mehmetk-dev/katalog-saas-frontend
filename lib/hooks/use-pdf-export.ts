"use client"

import { useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { type PdfProgressState, type PdfExportPhase, PDF_PROGRESS_INITIAL_STATE } from "@/components/ui/pdf-progress-modal"
import {
    clientCancelPdfExportJob,
    clientCreatePdfExportJob,
    clientGetPdfExportJob,
    clientGetPdfExportShareLink,
    PdfExportApiError,
} from "@/lib/hooks/pdf-export-client-api"
import type { PdfExportJob } from "@/lib/actions/pdf-export-types"
import {
    getPdfExportProgressDisplay,
    resolvePdfExportErrorMessage,
    type PdfExportTrackingStage,
} from "@/lib/pdf-export-progress"

const POLL_INTERVAL_MS = 2000
/** Art arda bu kadar anket hatası (≈ ağ kesintisi) olmadan pes edilmez */
const MAX_CONSECUTIVE_POLL_ERRORS = 6
/** Worker işi bu sürede almazsa servis yanıt vermiyor sayılır */
const QUEUE_PICKUP_TIMEOUT_MS = 10 * 60 * 1000
/** Hiçbir iş bu kadar sürmemeli; backend 40 dk sonra takılmış iş olarak işaretler */
const MAX_TRACKING_MS = 45 * 60 * 1000

interface UsePdfExportOptions {
    catalogId: string | null
    catalogName: string
    hasUnsavedChanges: boolean
    canExport: () => boolean
    refreshUser: () => Promise<void>
    onSaveCatalog: () => Promise<string | null | void>
    onShowUpgradeModal: () => void
}

type Translate = (key: string, params?: Record<string, unknown>) => string

function formatTimeLeft(seconds: number, t: Translate): string {
    if (seconds < 60) return t("pdf.timeSeconds", { s: Math.ceil(seconds) })
    const mins = Math.floor(seconds / 60)
    const secs = Math.ceil(seconds % 60)
    return secs > 0 ? t("pdf.timeMinutesSeconds", { m: mins, s: secs }) : t("pdf.timeMinutes", { m: mins })
}

export function usePdfExport({
    catalogId,
    hasUnsavedChanges,
    canExport,
    refreshUser,
    onSaveCatalog,
    onShowUpgradeModal,
}: UsePdfExportOptions) {
    const { t: baseT } = useTranslation()
    const t = useCallback<Translate>((key, params) => baseT(key, params) as string, [baseT])
    const [isExporting, setIsExporting] = useState(false)
    const [pdfProgress, setPdfProgress] = useState<PdfProgressState>(PDF_PROGRESS_INITIAL_STATE)
    const cancelledRef = useRef(false)
    const dismissedRef = useRef(false)
    const activeJobIdRef = useRef<string | null>(null)

    const setPhase = useCallback((phase: PdfExportPhase, extra?: Partial<PdfProgressState>) => {
        if (dismissedRef.current && phase !== "done" && phase !== "error" && phase !== "cancelled") {
            return
        }
        setPdfProgress(prev => ({ ...prev, phase, ...extra }))
    }, [])

    const resetProgress = useCallback(() => {
        setPdfProgress(PDF_PROGRESS_INITIAL_STATE)
        cancelledRef.current = false
        dismissedRef.current = false
    }, [])

    const dismissPdfModal = useCallback(() => {
        dismissedRef.current = true
        setPdfProgress(PDF_PROGRESS_INITIAL_STATE)
        toast.info(t("pdf.backgroundToast"))
    }, [t])

    const cancelExport = useCallback(() => {
        cancelledRef.current = true
        const activeJobId = activeJobIdRef.current
        if (activeJobId) {
            void clientCancelPdfExportJob(activeJobId).catch(() => undefined)
        }
        activeJobIdRef.current = null
        setIsExporting(false)
        setPdfProgress({
            phase: "cancelled",
            currentPage: 0,
            totalPages: 0,
            percent: 0,
            estimatedTimeLeft: "",
        })
        toast.dismiss("pdf-process")
    }, [])

    const closePdfModal = useCallback(() => {
        resetProgress()
    }, [resetProgress])

    const handleDownloadPDF = useCallback(async () => {
        try {
            cancelledRef.current = false
            dismissedRef.current = false

            if (!canExport()) {
                onShowUpgradeModal()
                return
            }

            // Phase: PREPARING
            setPhase("preparing", { percent: 5, currentPage: 0, totalPages: 0, estimatedTimeLeft: "" })
            setIsExporting(true)

            let targetCatalogId = catalogId
            if (!targetCatalogId || hasUnsavedChanges) {
                const savedCatalogId = await onSaveCatalog()
                targetCatalogId = typeof savedCatalogId === "string" ? savedCatalogId : catalogId
            }

            if (!targetCatalogId) {
                setPhase("error", { errorMessage: t("pdf.saveFirst"), percent: 0 })
                return
            }

            setPhase("queued", {
                percent: 0,
                estimatedTimeLeft: t("pdf.timeMinutes", { m: 1 }),
                stageLabel: t("pdf.stageQueued"),
                stageDescription: t("pdf.stageQueuedDesc"),
            })
            let job: PdfExportJob
            try {
                job = (await clientCreatePdfExportJob(targetCatalogId, "standard")).job
            } catch (createError) {
                if (createError instanceof PdfExportApiError && createError.code === "quota_exceeded") {
                    resetProgress()
                    onShowUpgradeModal()
                    return
                }
                throw createError
            }
            activeJobIdRef.current = job.id

            const startedAt = Date.now()
            let lastPercent = Math.max(15, job.progress || 0)
            let consecutivePollErrors = 0

            while (!cancelledRef.current) {
                let latestJob: PdfExportJob
                try {
                    latestJob = (await clientGetPdfExportJob(job.id)).job
                    consecutivePollErrors = 0
                } catch (pollError) {
                    // 404: iş silinmiş; diğer hatalar (ağ kesintisi, 5xx) geçici olabilir
                    if (pollError instanceof PdfExportApiError && pollError.status === 404) throw pollError
                    consecutivePollErrors++
                    if (consecutivePollErrors >= MAX_CONSECUTIVE_POLL_ERRORS) {
                        throw new Error(t("pdf.connectionLost"))
                    }
                    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS * consecutivePollErrors))
                    continue
                }

                const trackedFor = Date.now() - startedAt
                const notPickedUp = latestJob.status === "queued" && !latestJob.started_at && trackedFor > QUEUE_PICKUP_TIMEOUT_MS
                if (notPickedUp || trackedFor > MAX_TRACKING_MS) {
                    void clientCancelPdfExportJob(job.id).catch(() => undefined)
                    throw new Error(t("pdf.stuckInQueue"))
                }

                lastPercent = Math.max(lastPercent, latestJob.progress || 0)
                const display = getPdfExportProgressDisplay(latestJob, t)

                if (latestJob.status === "completed") {
                    if (!dismissedRef.current) {
                        setPhase("uploading", { percent: 96, estimatedTimeLeft: "", stageLabel: t("pdf.stageUploading") })
                    }
                    let share: { url: string; expiresAt: string } | null = null
                    let shareError: Error | null = null
                    for (let attempt = 0; attempt < 3; attempt++) {
                        try {
                            share = await clientGetPdfExportShareLink(job.id)
                            break
                        } catch (err) {
                            shareError = err instanceof Error ? err : new Error(String(err))
                            if (attempt < 2) {
                                await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)))
                            }
                        }
                    }
                    if (!share) {
                        throw shareError || new Error(t("pdf.shareLinkFailed"))
                    }
                    const wasDismissed = dismissedRef.current
                    activeJobIdRef.current = null
                    dismissedRef.current = false
                    if (wasDismissed) {
                        setPdfProgress(PDF_PROGRESS_INITIAL_STATE)
                        toast.success(t("pdf.readyInNotifications"))
                    } else {
                        setPhase("done", {
                            percent: 100,
                            estimatedTimeLeft: "",
                            stageLabel: t("pdf.stageReady"),
                            stageDescription: t("pdf.stageReadyDesc"),
                            downloadUrl: share.url,
                            shareUrl: share.url,
                        })
                    }
                    toast.success(t("pdf.readyToast"))
                    refreshUser().catch(() => undefined)
                    return
                }

                if (latestJob.status === "failed") {
                    throw new Error(resolvePdfExportErrorMessage(latestJob.error_message, t))
                }

                if (latestJob.status === "cancelled" || latestJob.status === "expired") {
                    setPhase("cancelled", { percent: 0, estimatedTimeLeft: "" })
                    return
                }

                const elapsedSeconds = Math.max(1, (Date.now() - startedAt) / 1000)
                const estimatedTotalSeconds = lastPercent > 15 ? elapsedSeconds / (lastPercent / 100) : 90
                if (!dismissedRef.current) {
                    setPdfProgress({
                        phase: mapPdfStageToModalPhase(display.stage),
                        currentPage: latestJob.page_count || 0,
                        totalPages: latestJob.page_count || 0,
                        percent: Math.min(95, Math.max(15, display.percent || lastPercent)),
                        estimatedTimeLeft: formatTimeLeft(Math.max(5, estimatedTotalSeconds - elapsedSeconds), t),
                        stageLabel: display.title,
                        stageDescription: display.description,
                    })
                }

                await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
            }

        } catch (err) {
            if (cancelledRef.current) return
            const msg = err instanceof Error && err.message ? err.message : t("pdf.exportFailed")
            setPhase("error", { errorMessage: msg, percent: 0, estimatedTimeLeft: "" })
        } finally {
            activeJobIdRef.current = null
            setIsExporting(false)
        }
    }, [catalogId, hasUnsavedChanges, canExport, refreshUser, onSaveCatalog, onShowUpgradeModal, resetProgress, setPhase, t])

    return { isExporting, handleDownloadPDF, pdfProgress, cancelExport, closePdfModal, dismissPdfModal }
}

function mapPdfStageToModalPhase(stage: PdfExportTrackingStage): PdfExportPhase {
    switch (stage) {
        case "queued":
            return "queued"
        case "preparing":
            return "preparing"
        case "rendering":
            return "rendering"
        case "generating":
            return "generating"
        case "uploading":
            return "uploading"
        case "done":
            return "done"
        case "error":
            return "error"
        case "cancelled":
            return "cancelled"
    }
}
