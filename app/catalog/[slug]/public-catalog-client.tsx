"use client"

import React, { useState, useEffect, useRef } from "react"
import {
    ChevronLeft,
    ChevronRight,
    Download,
    Share2,
    ExternalLink,
    BookOpen,
    Sparkles,
    Copy,
    Check,
    X,
    Maximize2,
    Minimize2,
    Search,
    Filter,
    Layers
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Toaster } from "sonner"
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
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-provider"



const PageCover = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>((props, ref) => {
    return (
        <div className="page page-cover" ref={ref} data-density="soft">
            <div className="page-content">
                {props.children}
            </div>
        </div>
    );
});
PageCover.displayName = 'PageCover';

const Page = React.forwardRef<HTMLDivElement, { children: React.ReactNode, number?: number }>((props, ref) => {
    return (
        <div className="page" ref={ref} data-density="soft">
            <div className="page-content">
                {props.children}
            </div>
        </div>
    );
});
Page.displayName = 'Page';

interface PublicCatalogClientProps {
    catalog: Catalog
    products: Product[]
}

export function PublicCatalogClient({ catalog, products }: PublicCatalogClientProps) {
    const { t } = useTranslation()
    const [currentPage, setCurrentPage] = useState(0)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [copied, setCopied] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const bookRef = useRef<any>(null)

    // Kategorileri çıkar
    const categories = ["all", ...new Set(products.map(p => p.category).filter(Boolean))] as string[]

    // Filtrelenmiş Ürünler
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesCategory = selectedCategory === "all" || product.category === selectedCategory

        return matchesSearch && matchesCategory
    })

    // Reset page on filter
    useEffect(() => {
        const pageFlip = getPageFlip()
        if (pageFlip) {
            pageFlip.turnToPage(0)
        }
    }, [searchTerm, selectedCategory])

    // Helper to access pageFlip instance
    const getPageFlip = () => {
        if (bookRef.current && bookRef.current.pageFlip) {
            return bookRef.current.pageFlip()
        }
        return null
    }

    const handleNextPage = () => {
        const pageFlip = getPageFlip()
        if (pageFlip) pageFlip.flipNext()
    }

    const handlePrevPage = () => {
        const pageFlip = getPageFlip()
        if (pageFlip) pageFlip.flipPrev()
    }

    // Sayfa başına ürün sayısı
    const getItemsPerPage = (layout: string) => {
        const columnsPerRow = catalog.columns_per_row || 3
        switch (layout) {
            case 'magazine': return 1 + (columnsPerRow * 2)
            case 'showcase': return columnsPerRow === 2 ? 4 : 7
            case 'fashion-lookbook': return 4
            case 'industrial': return columnsPerRow * 4
            case 'compact-list': return 12
            case 'classic-catalog': return 10
            case 'retail': return columnsPerRow * 5
            case 'catalog-pro': return columnsPerRow * 3
            case 'product-tiles': return columnsPerRow === 2 ? 8 : columnsPerRow * 3
            default:
                if (columnsPerRow === 2) return 6
                if (columnsPerRow === 3) return 9
                if (columnsPerRow === 4) return 12
                return 9
        }
    }

    const itemsPerPage = getItemsPerPage(catalog.layout)
    const pages = filteredProducts.length > 0
        ? Array.from({ length: Math.ceil(filteredProducts.length / itemsPerPage) }, (_, i) =>
            filteredProducts.slice(i * itemsPerPage, (i + 1) * itemsPerPage)
        )
        : [[]]

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') handlePrevPage()
            if (e.key === 'ArrowRight') handleNextPage()
            if (e.key === 'f' || e.key === 'F') setIsFullscreen(!isFullscreen)
            if (e.key === 'Escape') setIsFullscreen(false)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isFullscreen])

    const renderTemplate = (pageProducts: Product[], pageNum: number, total: number) => {
        const pageProps = {
            catalogName: catalog.name,
            products: pageProducts,
            primaryColor: catalog.primary_color,
            showPrices: catalog.show_prices,
            showDescriptions: catalog.show_descriptions,
            showAttributes: catalog.show_attributes,
            columnsPerRow: catalog.columns_per_row || 3,
            pageNumber: pageNum,
            totalPages: total,
            isFreeUser: false,
            // Logo ve başlık konumu
            logoUrl: catalog.logo_url || undefined,
            logoPosition: catalog.logo_position || undefined,
            logoSize: catalog.logo_size || undefined,
            titlePosition: (catalog as any).title_position || 'left',
        }

        switch (catalog.layout) {
            case "compact-list":
            case "list":
                return <CompactListTemplate {...pageProps} />
            case "magazine":
                return <MagazineTemplate {...pageProps} />
            case "minimalist":
                return <MinimalistTemplate {...pageProps} />
            case "bold":
                return <BoldTemplate {...pageProps} />
            case "elegant-cards":
                return <ElegantCardsTemplate {...pageProps} />
            case "classic-catalog":
                return <ClassicCatalogTemplate {...pageProps} />
            case "showcase":
                return <ShowcaseTemplate {...pageProps} />
            case "catalog-pro":
                return <CatalogProTemplate {...pageProps} />
            case "retail":
                return <RetailTemplate {...pageProps} />
            case "tech-modern":
                return <TechModernTemplate {...pageProps} />
            case "fashion-lookbook":
                return <FashionLookbookTemplate {...pageProps} />
            case "industrial":
                return <IndustrialTemplate {...pageProps} />
            case "luxury":
                return <LuxuryTemplate {...pageProps} />
            case "clean-white":
                return <CleanWhiteTemplate {...pageProps} />
            case "product-tiles":
                return <ProductTilesTemplate {...pageProps} />
            case "modern-grid":
            default:
                return <ModernGridTemplate {...pageProps} />
        }
    }

    const goToPage = (page: number) => {
        if (page >= 0 && page < pages.length) {
            setCurrentPage(page)
        }
    }

    const handleShare = async () => {
        const url = window.location.href
        if (navigator.share) {
            await navigator.share({
                title: catalog.name,
                text: catalog.description || `${catalog.name} kataloğunu görüntüle`,
                url: url,
            })
        } else {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            toast.success(t("catalogs.copyLink"))
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        toast.success(t("catalogs.copyLink"))
        setTimeout(() => setCopied(false), 2000)
    }

    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Arka plan stili hesaplama
    const getBackgroundStyle = (): React.CSSProperties => {
        const style: React.CSSProperties = {
            backgroundColor: catalog.background_color || '#ffffff',
        }

        if (catalog.background_gradient && catalog.background_gradient !== 'none') {
            style.background = catalog.background_gradient
        }

        if (catalog.background_image) {
            style.backgroundImage = `url(${catalog.background_image})`
            style.backgroundSize = catalog.background_image_fit === 'fill' ? '100% 100%' : (catalog.background_image_fit || 'cover')
            style.backgroundPosition = 'center'
            style.backgroundRepeat = 'no-repeat'
        }

        return style
    }

    // Logo boyut hesaplama
    const getLogoSizeStyle = () => {
        switch (catalog.logo_size) {
            case 'small': return { width: '60px', height: 'auto' }
            case 'medium': return { width: '100px', height: 'auto' }
            case 'large': return { width: '150px', height: 'auto' }
            default: return { width: '100px', height: 'auto' }
        }
    }

    // Logo pozisyon hesaplama (eski kod - artık template içinde handle ediliyor)
    const getLogoPositionStyle = (): React.CSSProperties => {
        const base: React.CSSProperties = { position: 'absolute', zIndex: 40 }
        switch (catalog.logo_position) {
            case 'header-left': return { ...base, top: '20px', left: '20px' }
            case 'header-center': return { ...base, top: '20px', left: '50%', transform: 'translateX(-50%)' }
            case 'header-right': return { ...base, top: '20px', right: '20px' }
            case 'footer-left': return { ...base, bottom: '20px', left: '20px' }
            case 'footer-center': return { ...base, bottom: '20px', left: '50%', transform: 'translateX(-50%)' }
            case 'footer-right': return { ...base, bottom: '20px', right: '20px' }
            default: return { ...base, top: '20px', left: '20px' }
        }
    }

    return (
        <>
            <Toaster position="top-center" />
            <div className={cn(
                "h-screen flex flex-col overflow-hidden transition-all duration-300",
                isFullscreen
                    ? "bg-black fixed inset-0 z-[100]"
                    : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
            )}>
                {/* Animated Background Pattern */}
                {!isFullscreen && (
                    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-violet-200/30 to-indigo-200/30 rounded-full blur-3xl opacity-50" />
                        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-rose-200/30 to-orange-200/30 rounded-full blur-3xl opacity-50" />
                    </div>
                )}

                {/* Modern Header */}
                {!isFullscreen && (
                    <header className="shrink-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/50">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center justify-between h-16">
                                {/* Left: Logo & Title */}
                                <div className="flex items-center gap-4">
                                    <Link
                                        href="/"
                                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
                                            <BookOpen className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="hidden sm:inline font-semibold text-sm">CatalogPro</span>
                                    </Link>

                                    <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                                    <div className="min-w-0">
                                        <h1 className="font-bold text-slate-900 truncate text-sm sm:text-base">
                                            {catalog.name}
                                        </h1>
                                        {catalog.description && (
                                            <p className="text-xs text-slate-500 truncate hidden sm:block max-w-md">
                                                {catalog.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-2">
                                    {/* Product Count Badge */}
                                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full">
                                        <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                                        <span className="text-xs font-medium text-slate-700">
                                            {products.length} {t("catalogs.products")}
                                        </span>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopyLink}
                                        className="hidden sm:flex gap-2"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                        <span className="hidden md:inline">{copied ? t("common.copied") : t("catalogs.copyLink")}</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleShare}
                                        className="gap-2"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        <span className="hidden sm:inline">{t("catalogs.share")}</span>
                                    </Button>

                                    <Button
                                        size="sm"
                                        asChild
                                        className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20"
                                    >
                                        <a href={`/api/catalog/${catalog.share_slug}/pdf`} target="_blank">
                                            <Download className="w-4 h-4" />
                                            <span className="hidden sm:inline">{t("builder.download")}</span>
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            {/* Search & Filter Bar */}
                            <div className="bg-slate-50/50 border-t border-slate-200/50 px-4 sm:px-6 lg:px-8 py-2">
                                <div className="max-w-7xl mx-auto flex items-center gap-4">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder={t("catalogs.public.search")}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {categories.length > 1 && (
                                            <div className="flex bg-white border border-slate-200 rounded-lg p-1 overflow-x-auto max-w-[300px] no-scrollbar">
                                                {categories.slice(0, 4).map(cat => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setSelectedCategory(cat)}
                                                        className={cn(
                                                            "px-3 py-1 text-xs rounded-md transition-all whitespace-nowrap",
                                                            selectedCategory === cat
                                                                ? "bg-violet-100 text-violet-700 font-medium"
                                                                : "text-slate-500 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {cat === "all" ? t("catalogs.public.all") : cat}
                                                    </button>
                                                ))}
                                                {categories.length > 4 && (
                                                    <div className="flex items-center px-1">
                                                        <Filter className="w-3 h-3 text-slate-300" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
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
                                                <img
                                                    src={catalog.logo_url}
                                                    alt="Logo"
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
                                        // @ts-expect-error
                                        <HTMLFlipBook
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
                                            onFlip={(e) => setCurrentPage(e.data)}
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
                                                        {/* Logo artık template içinde render ediliyor */}

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
                                            {/* @ts-ignore */}
                                            <Page key="end" number={pages.length + 1}>
                                                <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 relative border-l border-slate-200">
                                                    <div className="absolute top-0 bottom-0 w-4 right-0 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
                                                    <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                                                    <p className="font-medium tracking-widest text-sm uppercase">{t("catalogs.public.noResults").replace('Aradığınız ürün bulunamadı.', 'Katalog Sonu')}</p>
                                                </div>
                                            </Page>
                                        </HTMLFlipBook>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/50 backdrop-blur-sm rounded-3xl p-12 border border-dashed border-slate-200">
                                            <Search className="w-16 h-16 mb-4 opacity-10" />
                                            <h3 className="text-xl font-semibold text-slate-900 mb-2">{t("catalogs.public.noResults")}</h3>
                                            <p>{t("catalogs.public.noResults")}</p>
                                            <Button variant="link" onClick={() => { setSearchTerm(""); setSelectedCategory("all") }} className="mt-4 text-violet-600">
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
                {
                    !isFullscreen && (
                        <footer className="shrink-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/50 py-4">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg">
                                            <BookOpen className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-slate-600 text-sm font-medium">
                                                {t("catalogs.public.createdWithPrefix")}{" "}
                                                <Link href="/" className="text-violet-600 hover:text-violet-700 font-bold">
                                                    CatalogPro
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
                    )
                }
            </div >
        </>
    )
}
