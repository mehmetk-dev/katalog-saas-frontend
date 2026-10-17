"use client"

import { useState, useCallback, useRef } from "react"
import type { PdfProgressState } from "@/components/ui/pdf-progress-modal"
import { PDF_PROGRESS_INITIAL_STATE } from "@/components/ui/pdf-progress-modal"
import {
    A4_WIDTH_MM,
    A4_HEIGHT_MM,
    A4_WIDTH_PX,
    A4_HEIGHT_PX,
    PDF_CHUNK_SIZE,
} from "../_lib/constants"
import { getPdfExportProgressDisplay, type PdfExportTrackingStage } from "@/lib/pdf-export-progress"
import type { PdfExportPhase } from "@/components/ui/pdf-progress-modal"
import {
    createPublicPdfExport,
    getPublicPdfDownloadUrl,
    getPublicPdfExport,
    PublicPdfExportError,
} from "./public-pdf-export-api"

const POLL_INTERVAL_MS = 3000
const MAX_CONSECUTIVE_POLL_ERRORS = 5
/** Worker bu sürede bitiremezse tarayıcıda üretmeye geçilir */
const MAX_SERVER_WAIT_MS = 15 * 60 * 1000

/** Bu hatalarda sunucu PDF'i üretemiyor demektir; tarayıcıda üretmeye geçilir */
class ServerExportUnavailableError extends Error {}

const STAGE_TO_PHASE: Record<PdfExportTrackingStage, PdfExportPhase> = {
    queued: "queued",
    preparing: "preparing",
    rendering: "rendering",
    generating: "generating",
    uploading: "uploading",
    done: "done",
    error: "error",
    cancelled: "cancelled",
}

function formatTimeLeft(seconds: number): string {
    if (seconds < 60) return `~${Math.ceil(seconds)}s`
    const m = Math.floor(seconds / 60)
    const s = Math.ceil(seconds % 60)
    return `~${m}m ${s}s`
}

/** Yields control to the main thread to prevent UI freezing. */
function yieldToMain(ms: number = 0): Promise<void> {
    return new Promise(resolve => {
        if (ms === 0) {
            const channel = new MessageChannel()
            channel.port1.onmessage = () => resolve()
            channel.port2.postMessage(null)
        } else {
            setTimeout(resolve, ms)
        }
    })
}

interface UsePublicPdfExportOptions {
    catalogName: string
    slug: string | null
    expectedPageCount: number
    t: (key: string) => string
}

/**
 * PDF'i önce backend worker'a ürettirir (büyük kataloglarda tarayıcı yetmiyor); sunucu
 * kullanılamazsa jsPDF + html-to-image ile tarayıcıda üretir.
 *
 * isExporting yalnızca tarayıcıda üretim sırasında true olur: tüm sayfaların DOM'a basılmasını tetikler.
 */
export function usePublicPdfExport({ catalogName, slug, expectedPageCount, t }: UsePublicPdfExportOptions) {
    const [isExporting, setIsExporting] = useState(false)
    const [isBusy, setIsBusy] = useState(false)
    const [pdfProgress, setPdfProgress] = useState<PdfProgressState>(PDF_PROGRESS_INITIAL_STATE)
    const cancelledRef = useRef(false)

    const cancelExport = useCallback(() => {
        cancelledRef.current = true
        setPdfProgress(prev => ({ ...prev, phase: "cancelled", percent: prev.percent }))
    }, [])

    const closePdfModal = useCallback(() => {
        setPdfProgress(PDF_PROGRESS_INITIAL_STATE)
    }, [])

    const exportOnServer = useCallback(async (catalogSlug: string) => {
        setPdfProgress({
            phase: "queued", currentPage: 0, totalPages: 0, percent: 5, estimatedTimeLeft: "",
            stageLabel: t("pdf.stageQueued"), stageDescription: t("pdf.stageQueuedDesc"),
        })

        let created: Awaited<ReturnType<typeof createPublicPdfExport>>
        try {
            created = await createPublicPdfExport(catalogSlug)
        } catch (error) {
            // 400/404 katalogla ilgili; tarayıcıda da üretilemez. Diğerleri (ağ, 429, 5xx) sunucu sorunu.
            if (error instanceof PublicPdfExportError && (error.status === 400 || error.status === 404)) throw error
            throw new ServerExportUnavailableError(error instanceof Error ? error.message : String(error))
        }

        const { token } = created
        let job = created.job
        const startedAt = Date.now()
        let consecutiveErrors = 0

        while (!cancelledRef.current) {
            if (job.status === "completed") {
                const downloadUrl = getPublicPdfDownloadUrl(job.id, token)
                setPdfProgress({
                    phase: "done", currentPage: job.page_count || 0, totalPages: job.page_count || 0, percent: 100,
                    estimatedTimeLeft: "", stageLabel: t("pdf.stageReady"), stageDescription: t("pdf.stageReadyDesc"),
                    downloadUrl,
                })
                window.location.assign(downloadUrl)
                return
            }
            if (job.status !== "queued" && job.status !== "processing") {
                throw new ServerExportUnavailableError(job.error_message || job.status)
            }
            if (Date.now() - startedAt > MAX_SERVER_WAIT_MS) {
                throw new ServerExportUnavailableError("timeout")
            }

            const display = getPdfExportProgressDisplay(job, t)
            setPdfProgress({
                phase: STAGE_TO_PHASE[display.stage],
                currentPage: job.page_count || 0,
                totalPages: job.page_count || 0,
                percent: Math.min(95, Math.max(5, display.percent)),
                estimatedTimeLeft: "",
                stageLabel: display.title,
                stageDescription: display.description,
            })

            await yieldToMain(POLL_INTERVAL_MS)
            if (cancelledRef.current) return
            try {
                job = (await getPublicPdfExport(job.id, token)).job
                consecutiveErrors = 0
            } catch {
                if (++consecutiveErrors >= MAX_CONSECUTIVE_POLL_ERRORS) {
                    throw new ServerExportUnavailableError("poll failed")
                }
            }
        }
    }, [t])

    const exportInBrowser = useCallback(async () => {
        try {
            setIsExporting(true)
            setPdfProgress({ phase: "preparing", currentPage: 0, totalPages: 0, percent: 5, estimatedTimeLeft: "" })

            const [{ jsPDF }, { toJpeg }] = await Promise.all([
                import("jspdf"),
                import("html-to-image"),
            ])

            // Allow LazyPage components to force-render via isExporting=true
            await yieldToMain(1500)

            // Wait for all pages to appear in the DOM (max ~10 s)
            let content = document.querySelectorAll('[data-pdf-page="true"]')
            let retries = 0
            const maxRetries = 20
            while (content.length < expectedPageCount && retries < maxRetries) {
                await yieldToMain(500)
                content = document.querySelectorAll('[data-pdf-page="true"]')
                retries++
            }

            if (content.length === 0) {
                setPdfProgress({
                    phase: "error", currentPage: 0, totalPages: 0, percent: 0,
                    estimatedTimeLeft: "",
                    errorMessage: t("pdf.noPagesToExport"),
                })
                return
            }

            const totalPages = content.length
            setPdfProgress({ phase: "rendering", currentPage: 0, totalPages, percent: 10, estimatedTimeLeft: "" })

            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
            const renderStart = Date.now()

            for (let i = 0; i < totalPages; i++) {
                if (cancelledRef.current) return

                const page = content[i] as HTMLElement

                let dataUrl: string | null = await toJpeg(page, {
                    quality: 0.8,
                    pixelRatio: 1.5,
                    width: A4_WIDTH_PX,
                    height: A4_HEIGHT_PX,
                    cacheBust: true,
                    style: {
                        margin: '0',
                        transform: 'none',
                        boxShadow: 'none',
                        border: 'none',
                        borderRadius: '0',
                        display: 'block',
                    },
                })

                if (cancelledRef.current) return

                if (i > 0) pdf.addPage()
                if (dataUrl) pdf.addImage(dataUrl, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM)
                dataUrl = null

                const rendered = i + 1
                const elapsed = (Date.now() - renderStart) / 1000
                const avgPerPage = elapsed / rendered
                const remaining = (totalPages - rendered) * avgPerPage
                const percent = 10 + Math.round((rendered / totalPages) * 80)

                setPdfProgress({
                    phase: "rendering",
                    currentPage: rendered,
                    totalPages,
                    percent,
                    estimatedTimeLeft: remaining > 2 ? formatTimeLeft(remaining) : "",
                })

                if (rendered % PDF_CHUNK_SIZE === 0 && rendered < totalPages) {
                    await yieldToMain(0)
                }
            }

            if (cancelledRef.current) return

            setPdfProgress({ phase: "saving", currentPage: totalPages, totalPages, percent: 95, estimatedTimeLeft: "" })

            const sanitizedName = catalogName.trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-') || 'katalog'
            pdf.save(`${sanitizedName}.pdf`)

            setPdfProgress({ phase: "done", currentPage: totalPages, totalPages, percent: 100, estimatedTimeLeft: "" })
        } finally {
            setIsExporting(false)
        }
    }, [catalogName, expectedPageCount, t])

    const handleDownload = useCallback(async () => {
        cancelledRef.current = false
        setIsBusy(true)
        try {
            if (slug) {
                try {
                    await exportOnServer(slug)
                    return
                } catch (error) {
                    if (!(error instanceof ServerExportUnavailableError) || cancelledRef.current) throw error
                    console.warn("Server PDF export unavailable, falling back to browser:", error.message)
                }
            }
            await exportInBrowser()
        } catch (error) {
            if (cancelledRef.current) return
            console.error("PDF Generation Error:", error)
            setPdfProgress({
                phase: "error",
                currentPage: 0,
                totalPages: 0,
                percent: 0,
                estimatedTimeLeft: "",
                // html-to-image/jsPDF hata metinleri teknik; kullanıcıya genel mesaj gösterilir
                errorMessage: t("pdf.exportFailed"),
            })
        } finally {
            setIsBusy(false)
        }
    }, [slug, exportOnServer, exportInBrowser, t])

    return { isExporting, isBusy, pdfProgress, handleDownload, cancelExport, closePdfModal }
}
