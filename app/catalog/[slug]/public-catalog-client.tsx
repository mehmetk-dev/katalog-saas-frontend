"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-provider"
import {
    Download,
    Share2,
    Sparkles,
    Search,
    X
} from "lucide-react"
import Link from "next/link"
import { toast, Toaster } from "sonner"
import { PdfProgressModal, PDF_PROGRESS_INITIAL_STATE } from "@/components/ui/pdf-progress-modal"
import type { PdfProgressState } from "@/components/ui/pdf-progress-modal"

import type { Product } from "@/lib/actions/products"
import type { Catalog } from "@/lib/actions/catalogs"
import { ModernGridTemplate } from "@/components/catalogs/templates/modern-grid"
import { CompactListTemplate } from "@/components/catalogs/templates/compact-list"
import { MagazineTemplate } from "@/components/catalogs/templates/magazine"
import { MinimalistTemplate } from "@/components/catalogs/templates/minimalist"
import { BoldTemplate } from "@/components/catalogs/templates/bold"
import { ElegantCardsTemplate } from "@/components/catalogs/templates/elegant-cards"
import { ClassicCatalogTemplate } from "@/components/catalogs/templates/classic-catalog"
import { ShowcaseTemplate } from "@/components/catalogs/templates/showcase"
import { CatalogProTemplate } from "@/components/catalogs/templates/catalog-pro"
import { RetailTemplate } from "@/components/catalogs/templates/retail"
import { TechModernTemplate } from "@/components/catalogs/templates/tech-modern"
import { FashionLookbookTemplate } from "@/components/catalogs/templates/fashion-lookbook"
import { IndustrialTemplate } from "@/components/catalogs/templates/industrial"
import { LuxuryTemplate } from "@/components/catalogs/templates/luxury"
import { CleanWhiteTemplate } from "@/components/catalogs/templates/clean-white"
import { ProductTilesTemplate } from "@/components/catalogs/templates/product-tiles"
import { ShareModal } from "@/components/catalogs/share-modal"
import { Button } from "@/components/ui/button"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import type { TemplateProps } from "@/components/catalogs/templates/types"
// Storytelling Catalog Components
import { CoverPage } from "@/components/catalogs/cover-page"
import { CategoryDivider } from "@/components/catalogs/category-divider"
// Image Gallery & Lightbox
import { LightboxProvider, CatalogPreloader } from "@/lib/lightbox-context"
import { ImageLightbox } from "@/components/ui/image-lightbox"

interface PublicCatalogClientProps {
    catalog: Catalog
    products: Product[]
}

export function PublicCatalogClient({ catalog, products }: PublicCatalogClientProps) {
    const [initialProducts] = useState<Product[]>(products || [])
    const { t: baseT } = useTranslation()
    const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")

    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [pdfProgress, setPdfProgress] = useState<PdfProgressState>(PDF_PROGRESS_INITIAL_STATE)
    const cancelledRef = useRef(false)

    // Detaylı ekran boyutu kontrolü
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const categories = useMemo(
        () => ["all", ...new Set(initialProducts.map(p => p.category).filter((c): c is string => c !== null))],
        [initialProducts]
    )

    const filteredProducts = useMemo(() => {
        const lowerSearch = searchQuery.toLowerCase()
        return initialProducts.filter(product => {
            const matchesSearch = !searchQuery ||
                product.name.toLowerCase().includes(lowerSearch) ||
                product.description?.toLowerCase().includes(lowerSearch) ||
                product.sku?.toLowerCase().includes(lowerSearch)
            const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
            return matchesSearch && matchesCategory
        })
    }, [initialProducts, searchQuery, selectedCategory])

    // Ürünleri sayfalara böl - layout'a ve columns_per_row'a göre dinamik hesapla
    const columnsPerRow = catalog.columns_per_row || 3

    const getPageSize = (layout: string, columns: number) => {
        if (layout === 'classic-catalog') return 3 // Vertical Editorial uses 3 pillars
        if (layout === 'compact-list') return 10
        if (layout === 'retail') return 12
        if (layout === 'minimalist') return 4 // Requested 4 products per page (2x2)
        if (layout === 'magazine') return columns === 2 ? 5 : 7
        if (layout === 'fashion-lookbook') return 5 // 1 Hero + 4 Grid
        if (layout === 'industrial') return 8 // 8 items per page (List View)
        if (layout === 'showcase') return 5 // 1 Hero + 4 Sidebar
        if (layout === 'luxury') return 6 // 2x3 Grid

        if (layout === 'product-tiles') return 6
        if (layout === 'catalog-pro') return 4

        return columns * 3
    }

    const productsPerPage = getPageSize(catalog.layout, columnsPerRow)

    // === STORYTELLING CATALOG LOGIC ===
    // Build pages array with cover, category dividers, and product pages
    type CatalogPage =
        | { type: 'cover' }
        | { type: 'divider'; categoryName: string; firstProductImage: string | null }
        | { type: 'products'; products: Product[]; pageNumber: number; totalPages: number }

    const catalogPages = useMemo(() => {
        const pages: CatalogPage[] = []

        // 1. Add Cover Page (if enabled)
        if (catalog.enable_cover_page) {
            pages.push({ type: 'cover' })
        }

        // 2. Group products by category and create pages
        if (catalog.enable_category_dividers && filteredProducts.length > 0) {
            const productsByCategory = new Map<string, Product[]>()
            filteredProducts.forEach(product => {
                const category = product.category || 'Kategorisiz'
                if (!productsByCategory.has(category)) {
                    productsByCategory.set(category, [])
                }
                productsByCategory.get(category)!.push(product)
            })

            productsByCategory.forEach((prods, categoryName) => {
                const firstProductImage = prods[0]?.image_url || null
                pages.push({ type: 'divider', categoryName, firstProductImage })

                for (let i = 0; i < prods.length; i += productsPerPage) {
                    pages.push({
                        type: 'products',
                        products: prods.slice(i, i + productsPerPage),
                        pageNumber: 0,
                        totalPages: 0
                    })
                }
            })
        } else {
            for (let i = 0; i < filteredProducts.length; i += productsPerPage) {
                pages.push({
                    type: 'products',
                    products: filteredProducts.slice(i, i + productsPerPage),
                    pageNumber: 0,
                    totalPages: 0
                })
            }
        }

        // 3. Update page numbers
        let counter = 1
        const totalProductPages = pages.filter(p => p.type === 'products').length
        pages.forEach(page => {
            if (page.type === 'products') {
                page.pageNumber = counter
                page.totalPages = totalProductPages
                counter++
            }
        })

        return pages
    }, [filteredProducts, productsPerPage, catalog.enable_cover_page, catalog.enable_category_dividers])

    // === LAZY PAGE COMPONENT ===
    // Only render pages near the viewport to avoid 150+ DOM pages at once
    const LazyPage = useCallback(({ children, index }: { children: React.ReactNode; index: number }) => {
        const ref = useRef<HTMLDivElement>(null)
        const [isVisible, setIsVisible] = useState(index < 3) // First 3 pages always visible

        useEffect(() => {
            // During PDF export, render everything
            if (isExporting) { setIsVisible(true); return; }
            if (index < 3) return; // First 3 always visible

            const el = ref.current
            if (!el) return

            const observer = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
                { rootMargin: '2000px 0px' } // Start rendering 2000px before visible
            )
            observer.observe(el)
            return () => observer.disconnect()
        }, [index])

        return (
            <div ref={ref}>
                {isVisible ? children : (
                    <div
                        className="bg-slate-100 rounded-lg animate-pulse"
                        style={{ width: '794px', height: '1123px', margin: '0 auto' }}
                    />
                )}
            </div>
        )
    }, [isExporting])


    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setIsFullscreen(true)
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
                setIsFullscreen(false)
            }
        }
    }

    // İndirme işlemi: İstemci tarafında PDF oluşturma (progress + cancel destekli)
    const CHUNK_SIZE = 5

    const formatTimeLeft = (seconds: number): string => {
        if (seconds < 60) return `~${Math.ceil(seconds)}s`
        const m = Math.floor(seconds / 60)
        const s = Math.ceil(seconds % 60)
        return `~${m}m ${s}s`
    }

    const cancelPdfExport = useCallback(() => {
        cancelledRef.current = true
        setPdfProgress(prev => ({ ...prev, phase: "cancelled", percent: prev.percent }))
    }, [])

    const closePdfModal = useCallback(() => {
        setPdfProgress(PDF_PROGRESS_INITIAL_STATE)
    }, [])

    const handleDownload = async () => {
        try {
            cancelledRef.current = false
            setIsExporting(true)
            setPdfProgress({ phase: "preparing", currentPage: 0, totalPages: 0, percent: 5, estimatedTimeLeft: "" })

            // Dinamik Import: Sadece indirme butona basıldığında kütüphaneleri yükle
            const { jsPDF } = await import("jspdf")
            const { toPng } = await import("html-to-image")

            // LazyPage'lerin isExporting=true ile render olması için yeterli süre bekle
            // İlk bekle, sonra DOM'da sayfa elemanlarının hazır olduğunu doğrula
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Sayfaların DOM'da hazır olmasını bekle (maksimum 10 saniye)
            let content = document.querySelectorAll('[data-pdf-page="true"]')
            const expectedPages = catalogPages.length
            let retries = 0
            const maxRetries = 20 // 20 x 500ms = 10 saniye
            while (content.length < expectedPages && retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 500))
                content = document.querySelectorAll('[data-pdf-page="true"]')
                retries++
            }

            if (!content || content.length === 0) {
                setPdfProgress({ phase: "error", currentPage: 0, totalPages: 0, percent: 0, estimatedTimeLeft: "", errorMessage: "PDF oluşturulacak içerik bulunamadı." })
                return
            }

            const totalPages = content.length
            setPdfProgress({ phase: "rendering", currentPage: 0, totalPages, percent: 10, estimatedTimeLeft: "" })

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            })

            const imgWidth = 210  // A4 width in mm
            const pageHeight = 297 // A4 height in mm
            const renderStart = Date.now()

            for (let i = 0; i < totalPages; i++) {
                if (cancelledRef.current) return

                const page = content[i] as HTMLElement

                const dataUrl = await toPng(page, {
                    quality: 1.0,
                    pixelRatio: 2,
                    width: 794,
                    height: 1123,
                    cacheBust: true,
                    style: {
                        margin: '0',
                        transform: 'none',
                        boxShadow: 'none',
                        border: 'none',
                        borderRadius: '0',
                        display: 'block'
                    }
                })

                if (cancelledRef.current) return

                if (i > 0) pdf.addPage()
                pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, pageHeight)

                // Progress + ETA hesaplama
                const rendered = i + 1
                const elapsed = (Date.now() - renderStart) / 1000
                const avgPerPage = elapsed / rendered
                const remaining = (totalPages - rendered) * avgPerPage
                const percent = 10 + Math.round((rendered / totalPages) * 80) // 10-90 arası

                setPdfProgress({
                    phase: "rendering",
                    currentPage: rendered,
                    totalPages,
                    percent,
                    estimatedTimeLeft: remaining > 2 ? formatTimeLeft(remaining) : ""
                })

                // Her CHUNK_SIZE sayfada bir tarayıcıya nefes aldır
                if (rendered % CHUNK_SIZE === 0 && rendered < totalPages) {
                    await new Promise(resolve => setTimeout(resolve, 50))
                }
            }

            if (cancelledRef.current) return

            setPdfProgress({ phase: "saving", currentPage: totalPages, totalPages, percent: 95, estimatedTimeLeft: "" })

            const fileName = `${catalog.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
            pdf.save(fileName)

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
                errorMessage: error instanceof Error ? error.message : "PDF oluşturulamadı. Lütfen tekrar deneyin."
            })
        } finally {
            setIsExporting(false)
        }
    }

    const backgroundStyle = useMemo((): React.CSSProperties => {
        const baseStyle: React.CSSProperties = {
            backgroundColor: catalog.background_color || '#ffffff'
        }

        if (catalog.background_image) {
            return {
                ...baseStyle,
                backgroundImage: `url(${catalog.background_image})`,
                backgroundSize: catalog.background_image_fit || 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }
        }
        if (catalog.background_gradient && catalog.background_gradient !== 'none') {
            return {
                ...baseStyle,
                background: catalog.background_gradient
            }
        }
        return baseStyle
    }, [catalog.background_color, catalog.background_image, catalog.background_image_fit, catalog.background_gradient])

    const renderTemplate = (pageProds: Product[], pageNumber: number, totalPages: number) => {
        const props: TemplateProps = {
            products: pageProds,
            catalogName: catalog.name,
            primaryColor: catalog.primary_color || 'rgba(124, 58, 237, 1)',
            headerTextColor: catalog.header_text_color || undefined,
            showPrices: catalog.show_prices !== false,
            showDescriptions: catalog.show_descriptions !== false,
            showAttributes: catalog.show_attributes !== false,
            showSku: catalog.show_sku !== false,
            showUrls: catalog.show_urls || false,
            productImageFit: (catalog.product_image_fit as 'cover' | 'contain' | 'fill') || 'cover',
            isFreeUser: false, // Public viewer shouldn't see ads usually unless we track plan
            pageNumber,
            totalPages,
            columnsPerRow: catalog.columns_per_row || 3,
            logoUrl: catalog.logo_url,
            logoPosition: catalog.logo_position || 'header-left',
            logoSize: catalog.logo_size,
            titlePosition: catalog.title_position || 'left'
        }

        switch (catalog.layout) {
            case 'modern-grid': return <ModernGridTemplate {...props} />
            case 'compact-list': return <CompactListTemplate {...props} />
            case 'magazine': return <MagazineTemplate {...props} />
            case 'minimalist': return <MinimalistTemplate {...props} />
            case 'bold': return <BoldTemplate {...props} />
            case 'elegant-cards': return <ElegantCardsTemplate {...props} />
            case 'classic-catalog': return <ClassicCatalogTemplate {...props} />
            case 'showcase': return <ShowcaseTemplate {...props} />
            case 'catalog-pro': return <CatalogProTemplate {...props} />
            case 'retail': return <RetailTemplate {...props} />
            case 'tech-modern': return <TechModernTemplate {...props} />
            case 'fashion-lookbook': return <FashionLookbookTemplate {...props} />
            case 'industrial': return <IndustrialTemplate {...props} />
            case 'luxury': return <LuxuryTemplate {...props} />
            case 'clean-white': return <CleanWhiteTemplate {...props} />
            case 'product-tiles': return <ProductTilesTemplate {...props} />
            default: return <ModernGridTemplate {...props} />
        }
    }

    return (
        <LightboxProvider>
            <CatalogPreloader products={initialProducts} />
            <div className={cn(
                "min-h-screen flex flex-col transition-colors duration-500",
                isFullscreen ? "bg-black" : "bg-slate-50"
            )}>
                {/* Global Lightbox */}
                <ImageLightbox />

                <Toaster position="top-center" expand={true} richColors />

                <PdfProgressModal
                    state={pdfProgress}
                    onCancel={pdfProgress.phase === "done" || pdfProgress.phase === "error" || pdfProgress.phase === "cancelled" ? closePdfModal : cancelPdfExport}
                    t={t}
                />

                <ShareModal
                    open={isShareModalOpen}
                    onOpenChange={setIsShareModalOpen}
                    shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
                    catalog={catalog}
                    isPublished={true} // Public view is always published
                    onDownloadPdf={async () => handleDownload()}
                />

                {/* Fullscreen Exit Button (Floating) */}
                {isFullscreen && (
                    <button
                        onClick={toggleFullscreen}
                        className="fixed top-6 right-6 z-[100] bg-white/10 backdrop-blur-md border border-white/20 text-white p-3 rounded-full hover:bg-white/20 transition-all shadow-xl group"
                    >
                        <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="sr-only">Exit Fullscreen</span>
                    </button>
                )}

                {/* Premium Glass Header */}
                {!isFullscreen && (
                    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Link href="/" className="flex items-center group">
                                        <span className="font-montserrat text-xl tracking-tighter flex items-center">
                                            <span className="font-black text-[#cf1414] uppercase">Fog</span>
                                            {/* Eğer katalog ismi zaten "Fog Catalog" veya benzeri ise platform ismini gizle veya sadeleştir */}
                                            {!(catalog.name.toLowerCase().includes('fog') && catalog.name.toLowerCase().includes('catalog')) && (
                                                <span className="font-light text-slate-900">Catalog</span>
                                            )}
                                        </span>
                                    </Link>
                                    <div className="h-6 w-px bg-slate-200" />
                                    <h1 className="text-sm font-semibold text-slate-600 truncate max-w-[200px]">{catalog.name}</h1>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1 md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder={t("catalogs.public.searchPlaceholder")}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border-none rounded-full text-sm focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => setIsShareModalOpen(true)} className="rounded-full hover:bg-violet-50 hover:text-violet-600">
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={handleDownload} className="rounded-full hover:bg-violet-50 hover:text-violet-600">
                                            <Download className="w-4 h-4" />
                                        </Button>

                                        {!isMobile && (
                                            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="rounded-full hover:bg-slate-100">
                                                <Sparkles className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Category Pills */}
                            {categories.length > 2 && (
                                <div className="mt-3 flex flex-nowrap items-center gap-2 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0",
                                                selectedCategory === cat
                                                    ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                                                    : "bg-white text-slate-600 border border-slate-200 hover:border-violet-300 hover:text-violet-600"
                                            )}
                                        >
                                            {cat === "all" ? t("catalogs.public.all") : cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </header>
                )}

                {/* Main Content - Vertical Scroll with Pinch Zoom for Mobile */}
                <main className={cn(
                    "flex-1 relative w-full",
                    isFullscreen ? "bg-black" : "bg-slate-50",
                    // Masaüstünde dikey kaydırma, mobilde ZoomWrapper kontrolünde
                    !isMobile && "overflow-y-auto"
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
                                wrapperStyle={{
                                    width: "100%",
                                    height: "calc(100vh - 80px)", // Footer alanını hesaba kat
                                    overflow: "hidden"
                                }}
                                contentStyle={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                    padding: "12px 0 60px 0", // Alt tarafa scroll payı
                                    alignItems: "center"
                                }}
                            >
                                <div className="w-full flex flex-col gap-6 items-center">
                                    {catalogPages.map((page, index) => (
                                        <LazyPage key={index} index={index}>
                                            <div
                                                data-pdf-page="true"
                                                className="shadow-2xl rounded-lg overflow-hidden border border-slate-200 relative bg-white shrink-0"
                                                style={{
                                                    width: '794px',
                                                    height: '1123px',
                                                    ...backgroundStyle
                                                }}
                                            >
                                                <div className="w-full h-full" style={{ height: '1123px' }}>
                                                    <div style={{ width: '100%', height: '100%' }}>
                                                        {page.type === 'cover' ? (
                                                            <CoverPage
                                                                catalogName={catalog.name}
                                                                coverImageUrl={catalog.cover_image_url}
                                                                coverDescription={catalog.cover_description}
                                                                logoUrl={catalog.logo_url}
                                                                primaryColor={catalog.primary_color || 'rgba(124, 58, 237, 1)'}
                                                                isExporting={isExporting}
                                                                theme={catalog.cover_theme}
                                                            />
                                                        ) : page.type === 'divider' ? (
                                                            <CategoryDivider
                                                                categoryName={page.categoryName}
                                                                firstProductImage={page.firstProductImage}
                                                                primaryColor={catalog.primary_color || 'rgba(124, 58, 237, 1)'}
                                                                theme={catalog.cover_theme}
                                                            />
                                                        ) : (
                                                            renderTemplate(page.products, page.pageNumber, page.totalPages)
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </LazyPage>
                                    ))}
                                </div>
                            </TransformComponent>
                        </TransformWrapper>
                    ) : (
                        <div className="w-full min-h-full flex flex-col gap-6 px-4 sm:px-6 py-6">
                            {catalogPages.length > 0 ? (
                                catalogPages.map((page, index) => (
                                    <LazyPage key={index} index={index}>
                                        <div
                                            data-pdf-page="true"
                                            className="w-full shadow-2xl rounded-lg overflow-hidden border border-slate-200 relative bg-white"
                                            style={{
                                                width: '794px',
                                                height: '1123px',
                                                margin: '0 auto',
                                                ...backgroundStyle
                                            }}
                                        >
                                            <div className="w-full h-full" style={{ height: '1123px' }}>
                                                <div style={{ width: '100%', height: '100%' }}>
                                                    {page.type === 'cover' ? (
                                                        <CoverPage
                                                            catalogName={catalog.name}
                                                            coverImageUrl={catalog.cover_image_url}
                                                            coverDescription={catalog.cover_description}
                                                            logoUrl={catalog.logo_url}
                                                            primaryColor={catalog.primary_color || 'rgba(124, 58, 237, 1)'}
                                                            productCount={filteredProducts.length}
                                                            isExporting={isExporting}
                                                            theme={catalog.cover_theme}
                                                        />
                                                    ) : page.type === 'divider' ? (
                                                        <CategoryDivider
                                                            categoryName={page.categoryName}
                                                            firstProductImage={page.firstProductImage}
                                                            primaryColor={catalog.primary_color || 'rgba(124, 58, 237, 1)'}
                                                            theme={catalog.cover_theme}
                                                        />
                                                    ) : (
                                                        renderTemplate(page.products, page.pageNumber, page.totalPages)
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </LazyPage>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                    <Search className="w-12 h-12 mb-4 opacity-20" />
                                    <p>{t("catalogs.public.noResults")}</p>
                                    <Button variant="link" onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }} className="mt-2 text-violet-600">
                                        {t("catalogs.public.resetFilters")}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                {/* Modern Footer */}
                {!isFullscreen && (
                    <footer className="shrink-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/50 py-4">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex flex-row items-center justify-between gap-2 overflow-hidden">
                                <div className="flex items-center gap-2 shrink-0">
                                    <Link href="/" className="flex items-center group">
                                        <span className="font-montserrat text-base sm:text-lg tracking-tighter flex items-center">
                                            <span className="font-black text-[#cf1414] uppercase">Fog</span>
                                            <span className="font-light text-slate-900 hidden xs:inline">Catalog</span>
                                        </span>
                                    </Link>
                                    <div className="h-4 w-px bg-slate-200" />
                                    <p className="text-slate-500 text-[10px] sm:text-xs font-medium truncate max-w-[120px] sm:max-w-none">
                                        {t("catalogs.public.createdWithPrefix")}{" "}
                                        {t("catalogs.public.createdWithSuffix")}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <p className="text-slate-400 text-xs hidden md:block">
                                        {t("catalogs.public.ctaDesc")}
                                    </p>
                                    <Link href="/">
                                        <Button size="sm" className="h-8 sm:h-9 px-3 sm:px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white gap-1 sm:gap-2 text-[10px] sm:text-xs font-semibold">
                                            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                            {t("catalogs.public.startNow")}
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </footer>
                )}
            </div>
        </LightboxProvider>
    )
}
