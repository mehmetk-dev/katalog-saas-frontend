"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { SearchX, X } from "lucide-react"
import { Toaster } from "sonner"
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch"

import { LazyPage } from "@/components/catalogs/lazy-page"
import { ShareModal } from "@/components/catalogs/share-modal"
import { Button } from "@/components/ui/button"
import { ImageLightbox } from "@/components/ui/image-lightbox"
import { PdfProgressModal } from "@/components/ui/pdf-progress-modal"
import type { Catalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"
import { getCatalogShareUrl } from "@/lib/catalog-url"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { CatalogPreloader, LightboxProvider } from "@/lib/contexts/lightbox-context"
import { cn } from "@/lib/utils"

import { CatalogFooter } from "./_components/catalog-footer"
import { CatalogHeader } from "./_components/catalog-header"
import { PageRenderer } from "./_components/page-renderer"
import { usePublicPdfExport } from "./_hooks/use-public-pdf-export"
import { useCatalogPages } from "./_hooks/use-catalog-pages"
import { A4_HEIGHT_PX, A4_WIDTH_PX, MOBILE_BREAKPOINT } from "./_lib/constants"

const DEFAULT_ZOOM = 0.85
const MIN_ZOOM = 0.4
const MAX_ZOOM = 1.5
const ZOOM_STEP = 0.1

interface PublicCatalogClientProps {
    catalog: Catalog
    products: Product[]
}

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
        const update = () => setIsMobile(query.matches)
        update()
        query.addEventListener("change", update)
        return () => query.removeEventListener("change", update)
    }, [])
    return isMobile
}

/** Tarayıcının tam ekran durumunu izler (Esc ile çıkış dahil). */
function useFullscreen() {
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isSupported, setIsSupported] = useState(false)

    useEffect(() => {
        setIsSupported(Boolean(document.fullscreenEnabled))
        const update = () => setIsFullscreen(Boolean(document.fullscreenElement))
        document.addEventListener("fullscreenchange", update)
        return () => document.removeEventListener("fullscreenchange", update)
    }, [])

    const toggle = useCallback(() => {
        const request = document.fullscreenElement
            ? document.exitFullscreen()
            : document.documentElement.requestFullscreen()
        // iOS Safari vb. desteklemeyen tarayıcılarda sessizce yok say
        request?.catch(() => undefined)
    }, [])

    return { isFullscreen, isSupported, toggle }
}

export function PublicCatalogClient({ catalog, products }: PublicCatalogClientProps) {
    const { t: baseT, language } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
    const locale = language === "en" ? "en-US" : "tr-TR"

    const isMobile = useIsMobile()
    const { isFullscreen, isSupported: canFullscreen, toggle: toggleFullscreen } = useFullscreen()
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [zoomScale, setZoomScale] = useState(DEFAULT_ZOOM)

    const {
        design,
        searchQuery, setSearchQuery,
        selectedCategory, setSelectedCategory,
        categories, catalogPages, isFiltering, resetFilters,
    } = useCatalogPages({
        catalog,
        products,
        uncategorizedLabel: t("preview.uncategorized"),
        locale,
    })

    const {
        isExporting, pdfProgress,
        handleDownload, cancelExport, closePdfModal,
    } = usePublicPdfExport({ catalogName: catalog.name, expectedPageCount: catalogPages.length, t })

    const handleZoomIn = useCallback(() => setZoomScale((prev) => Math.min(+(prev + ZOOM_STEP).toFixed(2), MAX_ZOOM)), [])
    const handleZoomOut = useCallback(() => setZoomScale((prev) => Math.max(+(prev - ZOOM_STEP).toFixed(2), MIN_ZOOM)), [])
    const handleZoomReset = useCallback(() => setZoomScale(DEFAULT_ZOOM), [])
    const openShare = useCallback(() => setIsShareModalOpen(true), [])

    const totalPages = catalogPages.length

    const renderPage = useCallback((page: typeof catalogPages[number], index: number) => (
        <LazyPage key={index} index={index} isExporting={isExporting}>
            <div
                data-pdf-page="true"
                // Builder önizlemesiyle aynı: şablonlar her zaman açık temada çizilir
                className="catalog-page catalog-light relative mx-auto shrink-0 overflow-hidden rounded-sm bg-white shadow-xl ring-1 ring-black/5"
                style={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX }}
            >
                <PageRenderer
                    page={page}
                    design={design}
                    pageNumber={index + 1}
                    totalPages={totalPages}
                    productCount={products.length}
                    isExporting={isExporting}
                />
            </div>
        </LazyPage>
    ), [design, isExporting, products.length, totalPages])

    const isPdfTerminal =
        pdfProgress.phase === "done" ||
        pdfProgress.phase === "error" ||
        pdfProgress.phase === "cancelled"

    const preloaderProducts = useMemo(
        () => products.map((p) => ({ image_url: p.image_url ?? undefined, images: p.images })),
        [products],
    )

    const emptyState = (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center text-muted-foreground">
            <SearchX className="mb-4 size-10 opacity-40" />
            <p className="font-medium text-foreground">
                {isFiltering ? t("catalogs.public.noResults") : t("catalogs.public.noProducts")}
            </p>
            {isFiltering && (
                <Button variant="outline" onClick={resetFilters} className="mt-4 bg-card">
                    {t("catalogs.public.resetFilters")}
                </Button>
            )}
        </div>
    )

    return (
        <LightboxProvider>
            <CatalogPreloader products={preloaderProducts} />
            {/* Mobilde sayfa kaydırması yerine yakınlaştırılabilir alan ekranı doldurur */}
            <div className={cn("flex flex-col", isMobile ? "h-dvh overflow-hidden" : "min-h-dvh", isFullscreen ? "bg-black" : "bg-muted/50")}>
                <ImageLightbox />
                <Toaster position="top-center" richColors />

                <PdfProgressModal
                    state={pdfProgress}
                    onCancel={isPdfTerminal ? closePdfModal : cancelExport}
                    t={t}
                />

                <ShareModal
                    open={isShareModalOpen}
                    onOpenChange={setIsShareModalOpen}
                    shareUrl={catalog.share_slug ? getCatalogShareUrl(catalog.share_slug) : ""}
                    catalog={catalog}
                    isPublished={true}
                    onDownloadPdf={handleDownload}
                />

                {isFullscreen ? (
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        aria-label={t("catalogs.public.exitFullscreen")}
                        className="fixed right-6 top-6 z-[100] rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                    >
                        <X className="size-6" />
                    </button>
                ) : (
                    <CatalogHeader
                        catalogName={catalog.name}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        categories={categories}
                        onShare={openShare}
                        onDownload={handleDownload}
                        isDownloading={isExporting}
                        onToggleFullscreen={canFullscreen ? toggleFullscreen : undefined}
                        zoomScale={zoomScale}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onZoomReset={handleZoomReset}
                        isMobile={isMobile}
                        t={t}
                    />
                )}

                <main className="relative min-h-0 w-full flex-1">
                    {catalogPages.length === 0 ? (
                        emptyState
                    ) : isMobile ? (
                        <TransformWrapper
                            initialScale={Math.min(1, (window.innerWidth - 16) / A4_WIDTH_PX)}
                            minScale={0.2}
                            maxScale={3}
                            centerOnInit={false}
                            wheel={{ step: 0.1 }}
                            doubleClick={{ mode: "toggle" }}
                            alignmentAnimation={{ animationTime: 200, animationType: "easeOut" }}
                        >
                            <TransformComponent
                                wrapperStyle={{ width: "100%", height: "100%", overflow: "hidden" }}
                                contentStyle={{ width: "100%" }}
                            >
                                <div className="flex w-full flex-col items-center gap-6 px-2 pb-16 pt-3">
                                    {catalogPages.map(renderPage)}
                                </div>
                            </TransformComponent>
                        </TransformWrapper>
                    ) : (
                        <div className="flex w-full justify-center py-10">
                            {/* `zoom` yerleşimi de ölçekler; transform + negatif margin boşluk/üst üste binme yapıyordu */}
                            <div
                                className="flex flex-col items-center gap-10"
                                style={{ zoom: isExporting ? 1 : zoomScale }}
                            >
                                {catalogPages.map(renderPage)}
                            </div>
                        </div>
                    )}
                </main>

                {!isFullscreen && <CatalogFooter t={t} />}
            </div>
        </LightboxProvider>
    )
}
