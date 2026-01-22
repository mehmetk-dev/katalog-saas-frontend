"use client"

import React, { useState, useEffect, useRef } from "react"
import NextImage from "next/image"
import {
    ChevronLeft,
    ChevronRight,
    Download,
    Share2,
    BookOpen,
    Sparkles,
    Search
} from "lucide-react"
import Link from "next/link"
import { toast, Toaster } from "sonner"
import HTMLFlipBook from 'react-pageflip'

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
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-provider"
import type { TemplateProps } from "@/components/catalogs/templates/types"

// Tipi bilinmeyen kütüphane bileşeni için temel tip tanımlama
interface PageFlipInstance {
    pageFlip(): {
        flipNext(): void
        flipPrev(): void
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FlipBook = HTMLFlipBook as any;

const Page = React.forwardRef<HTMLDivElement, { children: React.ReactNode, number?: number }>((props, ref) => {
    return (
        <div className="page" ref={ref} data-density="soft">
            <div className="page-content">
                {props.children}
            </div>
        </div>
    )
})
Page.displayName = 'Page'

interface PublicCatalogClientProps {
    catalog: Catalog
    products: Product[]
}

export function PublicCatalogClient({ catalog, products: initialProducts }: PublicCatalogClientProps) {
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")

    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const bookRef = useRef<PageFlipInstance>(null)

    // Detaylı ekran boyutu kontrolü
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const categories = ["all", ...new Set(initialProducts.map(p => p.category).filter((c): c is string => c !== null))]

    const filteredProducts = initialProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    // Ürünleri sayfalara böl
    const productsPerPage = 4 // Her şablona göre değişebilir ama genel bir değer
    const pages: Product[][] = []
    for (let i = 0; i < filteredProducts.length; i += productsPerPage) {
        pages.push(filteredProducts.slice(i, i + productsPerPage))
    }

    const handleNextPage = () => {
        if (bookRef.current) {
            bookRef.current.pageFlip().flipNext()
        }
    }

    const handlePrevPage = () => {
        if (bookRef.current) {
            bookRef.current.pageFlip().flipPrev()
        }
    }

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

    const handleDownload = () => {
        toast.info(t("catalogs.public.downloadStarted"))
        const pdfUrl = `/api/catalogs/${catalog.id}/download`
        window.open(pdfUrl, '_blank')
    }

    const getBackgroundStyle = () => {
        if (catalog.background_image) {
            return {
                backgroundImage: `url(${catalog.background_image})`,
                backgroundSize: catalog.background_image_fit || 'cover',
                backgroundPosition: 'center',
            }
        }
        if (catalog.background_gradient) {
            return { background: catalog.background_gradient }
        }
        return { backgroundColor: catalog.background_color || '#ffffff' }
    }

    const getLogoPositionStyle = (): React.CSSProperties => {
        const pos = catalog.logo_position || 'header-left'
        const style: React.CSSProperties = { position: 'absolute', zIndex: 40, padding: '1rem' }
        if (pos.includes('top')) style.top = 0
        if (pos.includes('bottom')) style.bottom = 0
        if (pos.includes('left')) style.left = 0
        if (pos.includes('right')) style.right = 0
        if (pos.includes('center')) {
            style.left = '50%'
            style.transform = 'translateX(-50%)'
        }
        return style
    }

    const getLogoSizeStyle = (): React.CSSProperties => {
        const size = catalog.logo_size || 'medium'
        const sizes = { small: '40px', medium: '80px', large: '120px' }
        return { maxHeight: sizes[size as keyof typeof sizes], width: 'auto' }
    }

    const renderTemplate = (pageProds: Product[], pageNumber: number, totalPages: number) => {
        const props: TemplateProps = {
            products: pageProds,
            catalogName: catalog.name,
            primaryColor: catalog.primary_color || '#4F46E5',
            headerTextColor: catalog.header_text_color || '#ffffff',
            showPrices: catalog.show_prices !== false,
            showDescriptions: catalog.show_descriptions !== false,
            showAttributes: catalog.show_attributes !== false,
            showSku: catalog.show_sku !== false,
            showUrls: catalog.show_urls || false,
            isFreeUser: false, // Public viewer shouldn't see ads usually unless we track plan
            pageNumber,
            totalPages,
            columnsPerRow: catalog.columns_per_row || 2,
            logoUrl: catalog.logo_url,
            logoPosition: catalog.logo_position || undefined,
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
        <div className={cn(
            "min-h-screen flex flex-col transition-colors duration-500",
            isFullscreen ? "bg-black" : "bg-slate-50"
        )}>
            <Toaster position="top-center" expand={true} richColors />

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
                catalogName={catalog.name}
                catalogDescription={catalog.description}
            />

            {/* Premium Glass Header */}
            {!isFullscreen && (
                <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Link href="/" className="flex items-center gap-2 group">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                        <BookOpen className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">FogCatalog</span>
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
                                    <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="rounded-full hover:bg-slate-100">
                                        <Sparkles className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Category Pills */}
                        {categories.length > 2 && (
                            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
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

            {/* Main Content - Responsive */}
            <main className={cn(
                "flex-1 relative w-full",
                isFullscreen ? "bg-black" : "",
                isMobile ? "overflow-y-auto" : "flex flex-col items-center justify-center overflow-hidden"
            )}>
                {isMobile ? (
                    /* Mobile View - Single Column Vertical Scroll */
                    <div className="w-full min-h-full p-4 flex flex-col gap-4 pb-20">
                        {pages.length > 0 && pages[0].length > 0 ? (
                            pages.map((pageProds, index) => (
                                <div key={index} className="w-full shadow-md rounded-lg overflow-hidden border border-slate-100 relative" style={getBackgroundStyle()}>
                                    {/* Logo Overlay */}
                                    {catalog.logo_url && (
                                        <div style={{ ...getLogoPositionStyle(), transform: catalog.logo_position?.includes('center') ? 'translateX(-50%)' : 'none', scale: '0.8' }}>
                                            <NextImage
                                                src={catalog.logo_url}
                                                alt="Logo"
                                                width={120}
                                                height={120}
                                                unoptimized
                                                style={getLogoSizeStyle()}
                                                className="object-contain"
                                            />
                                        </div>
                                    )}
                                    {/* Sayfa İçeriği */}
                                    <div className="w-full">
                                        {renderTemplate(pageProds, index + 1, pages.length)}
                                    </div>
                                    <div className="bg-slate-50/80 backdrop-blur-sm py-2 border-t px-4 flex justify-between items-center text-xs text-muted-foreground relative z-30">
                                        <span>{t("builder.preparingPage", { current: index + 1, total: pages.length }).replace('hazırlanıyor...', '')}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Search className="w-12 h-12 mb-4 opacity-20" />
                                <p>{t("catalogs.public.noResults")}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Desktop View - FlipBook */
                    <>
                        <div
                            className="relative w-full flex items-center justify-center mx-auto transition-all duration-300"
                            style={{
                                maxWidth: isFullscreen ? '98vw' : '1100px',
                                height: isFullscreen ? 'calc(100vh - 60px)' : 'calc(100vh - 160px)',
                                minHeight: '450px',
                                maxHeight: isFullscreen ? '95vh' : '800px'
                            }}
                        >
                            <div className="relative w-full h-full flex items-center justify-center">
                                {pages.length > 0 && pages[0].length > 0 ? (
                                    <FlipBook
                                        width={595}
                                        height={842}
                                        size="stretch"
                                        minWidth={300}
                                        maxWidth={1000}
                                        minHeight={400}
                                        maxHeight={1414}
                                        maxShadowOpacity={0.5}
                                        showCover={false}
                                        mobileScrollSupport={true}
                                        onFlip={() => { /* Track page change if needed */ }}
                                        className="shadow-2xl"
                                        style={{ margin: '0 auto' }}
                                        usePortrait={false}
                                        startZIndex={0}
                                        autoSize={true}
                                        clickEventForward={true}
                                        useMouseEvents={true}
                                        swipeDistance={30}
                                        showPageCorners={true}
                                        disableFlipByClick={false}
                                        ref={bookRef}
                                    >
                                        {/* All Pages rendered consistently */}
                                        {pages.map((pageProds, index) => (
                                            <Page key={index} number={index + 1}>
                                                <div className="w-full h-full shadow-inner relative" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', ...getBackgroundStyle() }}>
                                                    {/* Paper Texture Overlay */}
                                                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-20 mix-blend-multiply"
                                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                                                    />

                                                    {/* Spine Shadow */}
                                                    <div className={cn(
                                                        "absolute top-0 bottom-0 w-8 md:w-12 pointer-events-none z-10",
                                                        index % 2 === 0
                                                            ? "left-0 bg-gradient-to-r from-black/10 to-transparent"
                                                            : "right-0 bg-gradient-to-l from-black/10 to-transparent"
                                                    )} />

                                                    {/* Glossy Effect for First Page */}
                                                    {index === 0 && (
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 pointer-events-none z-20" />
                                                    )}

                                                    {/* Template Content - Takes full height with flex */}
                                                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                                        {renderTemplate(pageProds, index + 1, pages.length)}
                                                    </div>
                                                </div>
                                            </Page>
                                        ))}

                                        {/* Back Page - treated as regular page for closure */}
                                        <Page key="end" number={pages.length + 1}>
                                            <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 relative border-l border-slate-200">
                                                <div className="absolute top-0 bottom-0 w-4 right-0 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
                                                <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                                                <p className="font-medium tracking-widest text-sm uppercase">{t("catalogs.public.noResults").replace('Aradığınız ürün bulunamadı.', 'Katalog Sonu')}</p>
                                            </div>
                                        </Page>
                                    </FlipBook>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                                        <Search className="w-16 h-16 mb-4 opacity-20" />
                                        <p className="text-xl font-medium">{t("catalogs.public.noResults")}</p>
                                        <Button variant="link" onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }} className="mt-2 text-violet-600">
                                            {t("catalogs.public.resetFilters")}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        {pages.length > 1 && (
                            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-10 px-4 md:px-10">
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={handlePrevPage}
                                    className="h-12 w-12 rounded-full shadow-lg bg-white/90 backdrop-blur-sm hover:bg-white pointer-events-auto transition-transform hover:scale-110 border border-slate-200"
                                >
                                    <ChevronLeft className="h-6 w-6 text-slate-700" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={handleNextPage}
                                    className="h-12 w-12 rounded-full shadow-lg bg-white/90 backdrop-blur-sm hover:bg-white pointer-events-auto transition-transform hover:scale-110 border border-slate-200"
                                >
                                    <ChevronRight className="h-6 w-6 text-slate-700" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Modern Footer */}
            {!isFullscreen && (
                <footer className="shrink-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/50 py-4">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg">
                                    <BookOpen className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-slate-600 text-sm font-medium">
                                        {t("catalogs.public.createdWithPrefix")}{" "}
                                        <Link href="/" className="text-violet-600 hover:text-violet-700 font-bold">
                                            FogCatalog
                                        </Link>{" "}
                                        {t("catalogs.public.createdWithSuffix")}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <p className="text-slate-400 text-xs hidden md:block">
                                    {t("catalogs.public.ctaDesc")}
                                </p>
                                <Link href="/">
                                    <Button size="sm" className="h-9 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white gap-2 text-xs font-semibold">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        {t("catalogs.public.startNow")}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    )
}
