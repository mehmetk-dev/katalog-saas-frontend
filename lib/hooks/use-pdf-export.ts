"use client"

import { useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import { type PdfProgressState, type PdfExportPhase, PDF_PROGRESS_INITIAL_STATE } from "@/components/ui/pdf-progress-modal"
import {
    cancelPdfExportJob,
    createPdfExportJob,
    getPdfExportJob,
    getPdfExportShareLink,
} from "@/lib/actions/pdf-exports"

interface UsePdfExportOptions {
    catalogId: string | null
    catalogName: string
    hasUnsavedChanges: boolean
    canExport: () => boolean
    refreshUser: () => void
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
    catalogName,
    hasUnsavedChanges,
    canExport,
    refreshUser,
    onSaveCatalog,
    onShowUpgradeModal,
}: UsePdfExportOptions) {
    const [isExporting, setIsExporting] = useState(false)
    const [pdfProgress, setPdfProgress] = useState<PdfProgressState>(PDF_PROGRESS_INITIAL_STATE)
    const cancelledRef = useRef(false)
    const activeJobIdRef = useRef<string | null>(null)

    const setPhase = useCallback((phase: PdfExportPhase, extra?: Partial<PdfProgressState>) => {
        setPdfProgress(prev => ({ ...prev, phase, ...extra }))
    }, [])

    const resetProgress = useCallback(() => {
        setPdfProgress(PDF_PROGRESS_INITIAL_STATE)
        cancelledRef.current = false
    }, [])

    const cancelExport = useCallback(() => {
        cancelledRef.current = true
        const activeJobId = activeJobIdRef.current
        if (activeJobId) {
            void cancelPdfExportJob(activeJobId).catch(() => undefined)
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

            setPhase("processing", { percent: 12, estimatedTimeLeft: "~1 dk" })
            const { job } = await createPdfExportJob(targetCatalogId, "standard")
            activeJobIdRef.current = job.id

            const startedAt = Date.now()
            let lastPercent = Math.max(15, job.progress || 0)

            while (!cancelledRef.current) {
                const { job: latestJob } = await getPdfExportJob(job.id)
                lastPercent = Math.max(lastPercent, latestJob.progress || 0)

                if (latestJob.status === "completed") {
                    setPhase("saving", { percent: 96, estimatedTimeLeft: "" })
                    const share = await getPdfExportShareLink(job.id)
                    activeJobIdRef.current = null
                    setPhase("done", {
                        percent: 100,
                        estimatedTimeLeft: "",
                        downloadUrl: share.url,
                        shareUrl: share.url,
                    })
                    toast.success("PDF hazırlandı.")
                    window.open(share.url, "_blank", "noopener,noreferrer")
                    refreshUser()
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
                setPdfProgress({
                    phase: "processing",
                    currentPage: latestJob.page_count || 0,
                    totalPages: latestJob.page_count || 0,
                    percent: Math.min(95, Math.max(15, lastPercent)),
                    estimatedTimeLeft: formatTimeLeft(Math.max(5, estimatedTotalSeconds - elapsedSeconds)),
                })

                await new Promise(resolve => setTimeout(resolve, 2000))
            }

        } catch (err) {
            const msg = err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : String(err))
            setPhase("error", { errorMessage: msg, percent: 0, estimatedTimeLeft: "" })
        } finally {
            activeJobIdRef.current = null
            setIsExporting(false)
        }
    }, [catalogId, hasUnsavedChanges, catalogName, canExport, refreshUser, onSaveCatalog, onShowUpgradeModal, setPhase])

    return { isExporting, handleDownloadPDF, pdfProgress, cancelExport, closePdfModal }
}

