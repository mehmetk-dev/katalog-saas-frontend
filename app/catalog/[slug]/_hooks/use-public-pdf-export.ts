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
    expectedPageCount: number
}

/**
 * Handles client-side PDF generation for the public catalog view.
 * Dynamically imports jsPDF & html-to-image only when the user initiates a download.
 */
export function usePublicPdfExport({ catalogName, expectedPageCount }: UsePublicPdfExportOptions) {
    const [isExporting, setIsExporting] = useState(false)
    const [pdfProgress, setPdfProgress] = useState<PdfProgressState>(PDF_PROGRESS_INITIAL_STATE)
    const cancelledRef = useRef(false)

    const cancelExport = useCallback(() => {
        cancelledRef.current = true
        setPdfProgress(prev => ({ ...prev, phase: "cancelled", percent: prev.percent }))
    }, [])

    const closePdfModal = useCallback(() => {
        setPdfProgress(PDF_PROGRESS_INITIAL_STATE)
    }, [])

    const handleDownload = useCallback(async () => {
        try {
            cancelledRef.current = false
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
                    errorMessage: "PDF oluşturulacak içerik bulunamadı.",
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

            const sanitizedName = catalogName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            pdf.save(`${sanitizedName}.pdf`)

            setPdfProgress({ phase: "done", currentPage: totalPages, totalPages, percent: 100, estimatedTimeLeft: "" })
        } catch (error) {
            if (cancelledRef.current) return
            console.error("PDF Generation Error:", error)
            setPdfProgress({
                phase: "error",
                currentPage: 0,
                totalPages: 0,
                percent: 0,
                estimatedTimeLeft: "",
                errorMessage: error instanceof Error ? error.message : "PDF oluşturulamadı. Lütfen tekrar deneyin.",
            })
        } finally {
            setIsExporting(false)
        }
    }, [catalogName, expectedPageCount])

    return { isExporting, pdfProgress, handleDownload, cancelExport, closePdfModal }
}
