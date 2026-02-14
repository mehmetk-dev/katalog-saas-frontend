"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import type { Product } from "@/lib/actions/products"
import { slugify } from "@/components/builder/builder-utils"

interface UsePdfExportOptions {
    catalogName: string
    selectedProducts: Product[]
    canExport: () => boolean
    user: { plan?: string } | null
    t: (key: string, params?: Record<string, unknown>) => string
    refreshUser: () => void
    onShowUpgradeModal: () => void
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

    const handleDownloadPDF = useCallback(async () => {
        try {
            toast.info(t('builder.downloadStarting'), { id: "pdf-process" })

            if (!canExport()) {
                toast.dismiss("pdf-process")
                onShowUpgradeModal()
                return
            }

            // 1. Export Modunu Aktif Et (Hayalet konteynırı render eder)
            setIsExporting(true)

            // Bekle ki React hayalet konteynırı tüm sayfalarla birlikte render etsin
            await new Promise(resolve => setTimeout(resolve, 1500))

            const isPro = user?.plan === "pro"
            const resolutionText = isPro ? " (Yüksek Çözünürlük)" : ""
            toast.loading(`Görseller işleniyor ve PDF hazırlanıyor${resolutionText}...`, { id: "pdf-process" })

            const { jsPDF } = await import("jspdf")

            // HAYALET KONTEYNIRI HEDEFLE
            const container = document.getElementById('catalog-export-container')

            if (!container) {
                setIsExporting(false)
                throw new Error("Export hazırlığı tamamlanamadı. Lütfen tekrar deneyin.")
            }

            // Sayfaları Bul
            const pages = container.querySelectorAll('.catalog-page-wrapper')

            if (pages.length === 0) {
                setIsExporting(false)
                throw new Error("Sayfa yapısı oluşturulamadı. Lütfen tekrar deneyin.")
            }

            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()

            const pageElements = Array.from(pages)

            for (let i = 0; i < pageElements.length; i++) {
                const wrapper = pageElements[i] as HTMLElement
                const page = wrapper.classList.contains('catalog-page') ? wrapper : wrapper.querySelector('.catalog-page') as HTMLElement

                if (!page) continue

                toast.loading(`Sayfa ${i + 1} / ${pageElements.length} hazırlanıyor${resolutionText}...`, { id: "pdf-process" })

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
                    const images = clone.querySelectorAll('img')
                    const imagePromises = Array.from(images).map(async (img) => {
                        try {
                            if (!img.src || img.src.startsWith('data:')) return

                            const controller = new AbortController()
                            const timeoutId = setTimeout(() => controller.abort(), 8000)

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
                    await new Promise(r => setTimeout(r, 500))

                    const { toJpeg } = await import("html-to-image")
                    const imgData = await toJpeg(clone, {
                        quality: 0.85,
                        pixelRatio: 2,
                        backgroundColor: '#ffffff',
                        cacheBust: true,
                    })

                    if (i > 0) pdf.addPage()
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)

                } finally {
                    if (document.body.contains(clone)) {
                        document.body.removeChild(clone)
                    }
                }
            }

            pdf.save(`${slugify(catalogName || "katalog")}.pdf`)

            setIsExporting(false)
            toast.success((t('builder.pdfDownloaded') as string) + resolutionText, { id: "pdf-process" })

            // Arka planda kota/limit işlemlerini yap
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
            toast.error((t('builder.pdfFailed') as string) + ": " + msg, { id: "pdf-process" })
        }
    }, [catalogName, canExport, user?.plan, t, refreshUser, onShowUpgradeModal])

    return { isExporting, handleDownloadPDF }
}
