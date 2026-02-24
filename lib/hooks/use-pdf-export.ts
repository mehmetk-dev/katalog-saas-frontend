"use client"

import { useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import type { Product } from "@/lib/actions/products"
import { slugify } from "@/components/builder/builder-utils"
import { type PdfProgressState, type PdfExportPhase, PDF_PROGRESS_INITIAL_STATE } from "@/components/ui/pdf-progress-modal"

interface UsePdfExportOptions {
    catalogName: string
    selectedProducts: Product[]
    canExport: () => boolean
    user: { plan?: string } | null
    t: (key: string, params?: Record<string, unknown>) => string
    refreshUser: () => void
    onShowUpgradeModal: () => void
}

function formatTimeLeft(seconds: number): string {
    if (seconds < 60) return `~${Math.ceil(seconds)} sn`
    const mins = Math.floor(seconds / 60)
    const secs = Math.ceil(seconds % 60)
    return secs > 0 ? `~${mins} dk ${secs} sn` : `~${mins} dk`
}

/**
 * Sayfa sayısına göre PDF kalite ayarlarını dinamik belirler.
 * Büyük kataloglarda bellek tükenmesini önlemek için kalite düşürülür.
 */
function getPdfQualitySettings(totalPages: number) {
    if (totalPages > 200) {
        // Çok büyük katalog (200+ sayfa): minimum kalite, maksimum stabilite
        return { pixelRatio: 1, quality: 0.4, chunkSize: 3, chunkDelay: 800, imageTimeout: 5000 }
    }
    if (totalPages > 100) {
        // Büyük katalog (100-200 sayfa): düşük kalite
        return { pixelRatio: 1.2, quality: 0.5, chunkSize: 3, chunkDelay: 500, imageTimeout: 6000 }
    }
    if (totalPages > 50) {
        // Orta katalog (50-100 sayfa): orta kalite
        return { pixelRatio: 1.5, quality: 0.65, chunkSize: 4, chunkDelay: 300, imageTimeout: 7000 }
    }
    // Normal katalog (<50 sayfa): yüksek kalite
    return { pixelRatio: 2, quality: 0.85, chunkSize: 5, chunkDelay: 100, imageTimeout: 8000 }
}

export function usePdfExport({
    catalogName,
    selectedProducts,
    canExport,
    user,
    t,
    refreshUser,
    onShowUpgradeModal,
}: UsePdfExportOptions) {
    const [isExporting, setIsExporting] = useState(false)
    const [pdfProgress, setPdfProgress] = useState<PdfProgressState>(PDF_PROGRESS_INITIAL_STATE)
    const cancelledRef = useRef(false)

    const setPhase = useCallback((phase: PdfExportPhase, extra?: Partial<PdfProgressState>) => {
        setPdfProgress(prev => ({ ...prev, phase, ...extra }))
    }, [])

    const resetProgress = useCallback(() => {
        setPdfProgress(PDF_PROGRESS_INITIAL_STATE)
        cancelledRef.current = false
    }, [])

    const cancelExport = useCallback(() => {
        cancelledRef.current = true
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

            // Wait for React to render ghost container with all pages
            await new Promise(resolve => setTimeout(resolve, 1500))
            if (cancelledRef.current) return

            const { jsPDF } = await import("jspdf")

            const container = document.getElementById('catalog-export-container')
            if (!container) {
                setIsExporting(false)
                setPhase("error", { errorMessage: "Export hazırlığı tamamlanamadı. Lütfen tekrar deneyin." })
                return
            }

            const pages = container.querySelectorAll('.catalog-page-wrapper')
            if (pages.length === 0) {
                setIsExporting(false)
                setPhase("error", { errorMessage: "Sayfa yapısı oluşturulamadı. Lütfen tekrar deneyin." })
                return
            }

            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()

            const pageElements = Array.from(pages)
            const totalPages = pageElements.length

            // Sayfa sayısına göre kalite ayarlarını belirle
            const settings = getPdfQualitySettings(totalPages)

            setPhase("rendering", { percent: 10, totalPages, currentPage: 0 })

            // Track timing for ETA estimation
            const startTime = Date.now()

            // Process pages in chunks to avoid memory pressure
            let processedCount = 0

            for (let chunkStart = 0; chunkStart < pageElements.length; chunkStart += settings.chunkSize) {
                const chunkEnd = Math.min(chunkStart + settings.chunkSize, pageElements.length)

                for (let i = chunkStart; i < chunkEnd; i++) {
                    if (cancelledRef.current) {
                        setIsExporting(false)
                        return
                    }

                    const wrapper = pageElements[i] as HTMLElement
                    const page = wrapper.classList.contains('catalog-page') ? wrapper : wrapper.querySelector('.catalog-page') as HTMLElement
                    if (!page) continue

                    processedCount++

                    // Calculate progress & ETA
                    const elapsed = (Date.now() - startTime) / 1000
                    const avgPerPage = processedCount > 1 ? elapsed / (processedCount - 1) : 3
                    const remaining = (totalPages - processedCount) * avgPerPage
                    const percent = 10 + Math.round((processedCount / totalPages) * 80) // 10-90% range for rendering

                    setPdfProgress({
                        phase: "rendering",
                        currentPage: processedCount,
                        totalPages,
                        percent,
                        estimatedTimeLeft: formatTimeLeft(remaining),
                    })

                    const clone = page.cloneNode(true) as HTMLElement
                    document.body.appendChild(clone)

                    clone.style.position = 'fixed'
                    clone.style.top = '0'
                    clone.style.left = '0'
                    clone.style.zIndex = '-9999'
                    clone.style.transform = 'none'
                    clone.style.margin = '0'
                    clone.style.boxShadow = 'none'
                    clone.style.width = '794px'
                    clone.style.height = '1123px'

                    try {
                        // Convert images to base64 (CORS fix)
                        const images = clone.querySelectorAll('img')
                        const imagePromises = Array.from(images).map(async (img) => {
                            try {
                                if (!img.src || img.src.startsWith('data:')) return

                                const controller = new AbortController()
                                const timeoutId = setTimeout(() => controller.abort(), settings.imageTimeout)

                                const response = await fetch(img.src, {
                                    signal: controller.signal,
                                    mode: 'cors',
                                    credentials: 'omit'
                                })
                                clearTimeout(timeoutId)

                                if (!response.ok) throw new Error('Network error')

                                const blob = await response.blob()
                                const base64 = await new Promise<string>((resolve, reject) => {
                                    const reader = new FileReader()
                                    reader.onloadend = () => resolve(reader.result as string)
                                    reader.onerror = reject
                                    reader.readAsDataURL(blob)
                                })

                                img.src = base64
                                img.style.display = 'block'
                                img.removeAttribute('crossOrigin')
                                img.removeAttribute('srcset')
                                img.removeAttribute('loading')

                            } catch {
                                console.warn("Image skipped:", img.src)
                                img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                                img.style.objectFit = 'contain'
                            }
                        })

                        await Promise.allSettled(imagePromises)
                        await new Promise(r => setTimeout(r, 200))

                        const { toJpeg } = await import("html-to-image")
                        let imgData: string | null = await toJpeg(clone, {
                            quality: settings.quality,
                            pixelRatio: settings.pixelRatio,
                            backgroundColor: '#ffffff',
                            cacheBust: true,
                        })

                        if (i > 0) pdf.addPage()
                        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)

                        // Bellek serbest bırak — büyük base64 string'leri temizle
                        imgData = null

                    } finally {
                        if (document.body.contains(clone)) {
                            document.body.removeChild(clone)
                        }
                    }
                }

                // Between chunks: yield to browser & GC
                if (chunkEnd < pageElements.length) {
                    await new Promise(r => setTimeout(r, settings.chunkDelay))
                }
            }

            if (cancelledRef.current) {
                setIsExporting(false)
                return
            }

            // Phase: SAVING
            setPhase("saving", { percent: 95, currentPage: totalPages, totalPages, estimatedTimeLeft: "" })

            pdf.save(`${slugify(catalogName || "katalog")}.pdf`)

            setIsExporting(false)
            setPhase("done", { percent: 100, estimatedTimeLeft: "" })

            // Background: increment export quota
            import("@/lib/actions/user").then(async ({ incrementUserExports }) => {
                const result = await incrementUserExports(catalogName)
                if (!result.error) {
                    refreshUser()
                }
            }).catch(err => console.error("Export limit update failed:", err))

        } catch (err) {
            console.error("PDF Fail:", err)
            setIsExporting(false)
            const msg = err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : String(err))
            setPhase("error", { errorMessage: msg, percent: 0, estimatedTimeLeft: "" })
        }
    }, [catalogName, canExport, user?.plan, t, refreshUser, onShowUpgradeModal, setPhase])

    return { isExporting, handleDownloadPDF, pdfProgress, cancelExport, closePdfModal }
}

