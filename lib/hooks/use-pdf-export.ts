"use client"

import { useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import { type PdfProgressState, type PdfExportPhase, PDF_PROGRESS_INITIAL_STATE } from "@/components/ui/pdf-progress-modal"
import {
    clientCancelPdfExportJob,
    clientCreatePdfExportJob,
    clientGetPdfExportJob,
    clientGetPdfExportShareLink,
} from "@/lib/hooks/pdf-export-client-api"
import { getPdfExportProgressDisplay, type PdfExportTrackingStage } from "@/lib/pdf-export-progress"

interface UsePdfExportOptions {
    catalogId: string | null
    catalogName: string
    hasUnsavedChanges: boolean
    canExport: () => boolean
    refreshUser: () => Promise<void>
    onSaveCatalog: () => Promise<string | null | void>
    onShowUpgradeModal: () => void
}

function formatTimeLeft(seconds: number): string {
    if (seconds < 60) return `~${Math.ceil(seconds)} sn`
    const mins = Math.floor(seconds / 60)
    const secs = Math.ceil(seconds % 60)
    return secs > 0 ? `~${mins} dk ${secs} sn` : `~${mins} dk`
}

export function usePdfExport({
    catalogId,
    hasUnsavedChanges,
    canExport,
    refreshUser,
    onSaveCatalog,
    onShowUpgradeModal,
}: UsePdfExportOptions) {
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
        toast.info("PDF arka planda hazırlanıyor.")
    }, [])

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
                setPhase("error", { errorMessage: "PDF için önce katalog kaydedilmeli.", percent: 0 })
                return
            }

            setPhase("queued", {
                percent: 0,
                estimatedTimeLeft: "~1 dk",
                stageLabel: "Sırada",
                stageDescription: "PDF işi worker kuyruğuna alınıyor.",
            })
            const { job } = await clientCreatePdfExportJob(targetCatalogId, "standard")
            activeJobIdRef.current = job.id

            const startedAt = Date.now()
            let lastPercent = Math.max(15, job.progress || 0)

            while (!cancelledRef.current) {
                const { job: latestJob } = await clientGetPdfExportJob(job.id)
                lastPercent = Math.max(lastPercent, latestJob.progress || 0)
                const display = getPdfExportProgressDisplay(latestJob)

                if (latestJob.status === "completed") {
                    if (!dismissedRef.current) {
                        setPhase("uploading", { percent: 96, estimatedTimeLeft: "", stageLabel: "Yükleniyor" })
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
                        throw shareError || new Error("PDF indirme linki alınamadı. Lütfen bildirimler üzerinden tekrar deneyin.")
                    }
                    const wasDismissed = dismissedRef.current
                    activeJobIdRef.current = null
                    dismissedRef.current = false
                    if (wasDismissed) {
                        setPdfProgress(PDF_PROGRESS_INITIAL_STATE)
                    } else {
                        setPhase("done", {
                            percent: 100,
                            estimatedTimeLeft: "",
                            stageLabel: "Hazır",
                            stageDescription: "PDF hazır, indirebilirsin.",
                            downloadUrl: share.url,
                            shareUrl: share.url,
                        })
                    }
                    toast.success("PDF hazırlandı.")
                    if (!wasDismissed) {
                        window.open(share.url, "_blank", "noopener,noreferrer")
                    }
                    refreshUser().catch(() => undefined)
                    return
                }

                if (latestJob.status === "failed") {
                    throw new Error(latestJob.error_message || "PDF export başarısız oldu.")
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
                        estimatedTimeLeft: formatTimeLeft(Math.max(5, estimatedTotalSeconds - elapsedSeconds)),
                        stageLabel: display.title,
                        stageDescription: display.description,
                    })
                }

                await new Promise(resolve => setTimeout(resolve, 2000))
            }

        } catch (err) {
            if (cancelledRef.current) return
            const msg = err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : String(err))
            setPhase("error", { errorMessage: msg, percent: 0, estimatedTimeLeft: "" })
        } finally {
            activeJobIdRef.current = null
            setIsExporting(false)
        }
    }, [catalogId, hasUnsavedChanges, canExport, refreshUser, onSaveCatalog, onShowUpgradeModal, setPhase])

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
