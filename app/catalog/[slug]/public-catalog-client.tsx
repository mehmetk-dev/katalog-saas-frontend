"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { Search, X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { Toaster } from "sonner"
import { PdfProgressModal } from "@/components/ui/pdf-progress-modal"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { LightboxProvider, CatalogPreloader } from "@/lib/contexts/lightbox-context"
import { ImageLightbox } from "@/components/ui/image-lightbox"
import { LazyPage } from "@/components/catalogs/lazy-page"
import { ShareModal } from "@/components/catalogs/share-modal"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"

const HTMLFlipBook = dynamic(() => import("react-pageflip"), { ssr: false }) as any;

import type { Product } from "@/lib/actions/products"
import type { Catalog } from "@/lib/actions/catalogs"

import { A4_HEIGHT_PX, A4_WIDTH_PX, MOBILE_BREAKPOINT } from "./_lib/constants"
import { useCatalogPages } from "./_hooks/use-catalog-pages"
import { usePublicPdfExport } from "./_hooks/use-public-pdf-export"
import { CatalogHeader } from "./_components/catalog-header"
import { CatalogFooter } from "./_components/catalog-footer"
import { PageRenderer } from "./_components/page-renderer"

interface PublicCatalogClientProps {
    catalog: Catalog
    products: Product[]
}

export function PublicCatalogClient({ catalog, products }: PublicCatalogClientProps) {
    const { t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])

    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [zoomScale, setZoomScale] = useState(0.85) // Başlangıçta biraz küçük (0.85)
    const [viewMode, setViewMode] = useState<"list" | "book">("list")
    const flipBookRef = useRef<any>(null)

    const {
        searchQuery, setSearchQuery,
        selectedCategory, setSelectedCategory,
        categories, filteredProducts, catalogPages,
    } = useCatalogPages({ catalog, products })

    const {
        isExporting, pdfProgress,
        handleDownload, cancelExport, closePdfModal,
    } = usePublicPdfExport({ catalogName: catalog.name, expectedPageCount: catalogPages.length })

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }, [])

    const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.1, 1.5))
    const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.1, 0.4))
    const handleZoomReset = () => setZoomScale(0.85)

    // -- Background style derived from catalog settings ----------------------

    const backgroundStyle = useMemo((): React.CSSProperties => {
        const base: React.CSSProperties = { backgroundColor: catalog.background_color || '#ffffff' }

        if (catalog.background_image) {
            return {
                ...base,
                backgroundImage: `url(${catalog.background_image})`,
                backgroundSize: catalog.background_image_fit || 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }
        }
        if (catalog.background_gradient && catalog.background_gradient !== 'none') {
            return { ...base, background: catalog.background_gradient }
        }
        return base
    }, [catalog.background_color, catalog.background_image, catalog.background_image_fit, catalog.background_gradient])

    const pageStyle = useMemo(
        () => ({ width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px`, ...backgroundStyle }),
        [backgroundStyle],
    )

    // -- Shared page renderer used by both mobile & desktop ------------------

    const renderPage = useCallback((page: typeof catalogPages[number], index: number) => (
        <LazyPage key={index} index={index} isExporting={isExporting}>
            <div
                data-pdf-page="true"
                className={cn(
                    "shadow-2xl rounded-lg overflow-hidden border border-slate-200 relative bg-white shrink-0",
                    !isMobile && "mx-auto",
                )}
                style={pageStyle}
            >
                <div className="w-full h-full" style={{ height: `${A4_HEIGHT_PX}px` }}>
                    <div style={{ width: '100%', height: '100%' }}>
                        <PageRenderer
                            page={page}
                            catalog={catalog}
                            filteredProductCount={filteredProducts.length}
                            isExporting={isExporting}
                        />
                    </div>
                </div>
            </div>
        </LazyPage>
    ), [catalog, filteredProducts.length, isExporting, isMobile, pageStyle])

    // -- Determine PDF modal action (close vs cancel) ------------------------

    const isPdfTerminal =
        pdfProgress.phase === "done" ||
        pdfProgress.phase === "error" ||
        pdfProgress.phase === "cancelled"

    const preloaderProducts = useMemo(
        () => products.map(p => ({ image_url: p.image_url ?? undefined, images: p.images })),
        [products],
    )

    return (
        <LightboxProvider>
            <CatalogPreloader products={preloaderProducts} />
            <div className={cn(
                "min-h-screen flex flex-col transition-colors duration-500",
                isFullscreen ? "bg-black" : "bg-slate-50",
            )}>
                <ImageLightbox />
                <Toaster position="top-center" expand={true} richColors />

                <PdfProgressModal
                    state={pdfProgress}
                    onCancel={isPdfTerminal ? closePdfModal : cancelExport}
                    t={t}
                />

                <ShareModal
                    open={isShareModalOpen}
                    onOpenChange={setIsShareModalOpen}
                    shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
                    catalog={catalog}
                    isPublished={true}
                    onDownloadPdf={handleDownload}
                />

                {/* Fullscreen exit overlay */}
                {isFullscreen && (
                    <button
                        onClick={toggleFullscreen}
                        className="fixed top-6 right-6 z-[100] bg-white/10 backdrop-blur-md border border-white/20 text-white p-3 rounded-full hover:bg-white/20 transition-all shadow-xl group"
                    >
                        <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="sr-only">Exit Fullscreen</span>
                    </button>
                )}

                {!isFullscreen && (
                    <CatalogHeader
                        catalogName={catalog.name}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        categories={categories}
                        onShare={() => setIsShareModalOpen(true)}
                        onDownload={handleDownload}
                        onToggleFullscreen={toggleFullscreen}
                        zoomScale={zoomScale}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onZoomReset={handleZoomReset}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        isMobile={isMobile}
                        t={t}
                    />
                )}

                <main className={cn(
                    "flex-1 relative w-full",
                    isFullscreen ? "bg-black" : "bg-slate-50",
                    !isMobile && "overflow-y-auto",
                )}>
                    {isMobile ? (
                        <TransformWrapper
                            initialScale={Math.min(1, (typeof window !== 'undefined' ? window.innerWidth : 390) / 820)}
                            minScale={0.2}
                            maxScale={3}
                            centerOnInit={false}
                            initialPositionX={0}
                            initialPositionY={0}
                            wheel={{ step: 0.1 }}
                            panning={{ velocityDisabled: false }}
                            alignmentAnimation={{ animationTime: 200, animationType: 'easeOut' }}
                        >
                            <TransformComponent
                                wrapperStyle={{ width: "100%", height: "calc(100vh - 80px)", overflow: "hidden" }}
                                contentStyle={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px", padding: "12px 0 60px 0", alignItems: "center" }}
                            >
                                <div className="w-full flex flex-col gap-6 items-center">
                                    {catalogPages.map(renderPage)}
                                </div>
                            </TransformComponent>
                        </TransformWrapper>
                    ) : (
                        <div className="flex flex-col items-center w-full min-h-full py-12">
                            {viewMode === "list" ? (
                                <div className="flex flex-col items-center gap-12 transition-transform duration-300 origin-top"
                                    style={{
                                        transform: `scale(${zoomScale})`,
                                        marginBottom: `calc(-100% * (1 - ${zoomScale}))`
                                    }}>
                                    {catalogPages.length > 0 ? (
                                        catalogPages.map(renderPage)
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                            <Search className="w-12 h-12 mb-4 opacity-20" />
                                            <p>{t("catalogs.public.noResults")}</p>
                                            <Button
                                                variant="link"
                                                onClick={() => { setSelectedCategory("all"); setSearchQuery("") }}
                                                className="mt-2 text-violet-600"
                                            >
                                                {t("catalogs.public.resetFilters")}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center p-4 sm:p-10 w-full relative group">
                                    {/* Prev Button */}
                                    <button
                                        onClick={() => flipBookRef.current?.pageFlip().flipPrev()}
                                        className="absolute left-4 z-10 p-3 bg-white/20 hover:bg-white/40 border border-white/20 shadow-2xl backdrop-blur-md rounded-full text-slate-700 hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center"
                                        title="Önceki Sayfa"
                                    >
                                        <ChevronLeft className="w-8 h-8" />
                                    </button>

                                    <HTMLFlipBook
                                        ref={flipBookRef}
                                        width={A4_WIDTH_PX / 1.1}
                                        height={A4_HEIGHT_PX / 1.1}
                                        size="fixed"
                                        minWidth={300}
                                        maxWidth={A4_WIDTH_PX}
                                        minHeight={424}
                                        maxHeight={A4_HEIGHT_PX}
                                        maxShadowOpacity={0.2}
                                        showCover={true}
                                        mobileScrollSupport={true}
                                        useMouseEvents={true}
                                        flippingTime={600}
                                        swipeDistance={30}
                                        className="shadow-2xl"
                                    >
                                        {catalogPages.map((page, index) => (
                                            <div key={index} className="bg-white overflow-hidden shadow-lg border border-slate-100">
                                                <div style={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX, transform: 'scale(0.9)', transformOrigin: 'top left' }}>
                                                    <PageRenderer
                                                        page={page}
                                                        catalog={catalog}
                                                        filteredProductCount={filteredProducts.length}
                                                        isExporting={isExporting}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </HTMLFlipBook>

                                    {/* Next Button */}
                                    <button
                                        onClick={() => flipBookRef.current?.pageFlip().flipNext()}
                                        className="absolute right-4 z-10 p-3 bg-white/20 hover:bg-white/40 border border-white/20 shadow-2xl backdrop-blur-md rounded-full text-slate-700 hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center"
                                        title="Sonraki Sayfa"
                                    >
                                        <ChevronRight className="w-8 h-8" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                {!isFullscreen && <CatalogFooter t={t} />}
            </div>
        </LightboxProvider>
    )
}
