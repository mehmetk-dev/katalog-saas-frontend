"use client"

import React, { useState, useEffect } from "react"
import NextImage from "next/image"
import {
    Download,
    Share2,
    BookOpen,
    Sparkles,
    Search
} from "lucide-react"
import Link from "next/link"
import { toast, Toaster } from "sonner"

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
    const [zoom, setZoom] = useState(1)

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

    // Ürünleri sayfalara böl - columns_per_row'a göre dinamik hesapla
    // modern-grid: columnsPerRow * 3 rows = productsPerPage
    // Örnek: 2 sütun -> 2*3=6, 3 sütun -> 3*3=9, 4 sütun -> 4*3=12
    const columnsPerRow = catalog.columns_per_row || 2
    const rowsPerPage = 3 // Her sayfada 3 satır
    const productsPerPage = columnsPerRow * rowsPerPage
    const pages: Product[][] = []
    for (let i = 0; i < filteredProducts.length; i += productsPerPage) {
        pages.push(filteredProducts.slice(i, i + productsPerPage))
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

    const zoomIn = () => setZoom((prev) => Math.min(1.2, Number((prev + 0.1).toFixed(2))))
    const zoomOut = () => setZoom((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))))
    const resetZoom = () => setZoom(1)

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
            productImageFit: (catalog.product_image_fit as 'cover' | 'contain' | 'fill') || 'cover',
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
                                    <div className="hidden sm:flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={zoomOut} className="rounded-full hover:bg-slate-100" aria-label="Zoom out">
                                            -
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={resetZoom} className="rounded-full hover:bg-slate-100 text-xs px-2" aria-label="Reset zoom">
                                            {Math.round(zoom * 100)}%
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={zoomIn} className="rounded-full hover:bg-slate-100" aria-label="Zoom in">
                                            +
                                        </Button>
                                    </div>
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
                            <div className="mt-3 flex flex-wrap items-center gap-2 pb-2 sm:flex-nowrap sm:overflow-x-auto sm:no-scrollbar">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "px-3 py-1 rounded-full text-xs font-medium transition-all sm:px-4 sm:py-1.5 sm:whitespace-nowrap",
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

            {/* Main Content - Vertical Scroll */}
            <main className={cn(
                "flex-1 relative w-full overflow-y-auto",
                isFullscreen ? "bg-black" : ""
            )}>
                <div className="w-full min-h-full flex flex-col gap-6 px-4 sm:px-6">
                    {pages.length > 0 && pages[0].length > 0 ? (
                        pages.map((pageProds, index) => (
                            <div 
                                key={index} 
                                className="w-full shadow-2xl rounded-lg overflow-hidden border border-slate-200 relative bg-white"
                                style={{
                                    width: '794px',
                                    height: '1123px',
                                    margin: '0 auto',
                                    ...getBackgroundStyle()
                                }}
                            >
                                {/* Sayfa İçeriği - Logo template içinde gösteriliyor */}
                                <div className="w-full h-full" style={{ height: '1123px' }}>
                                    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', width: '100%', height: '100%' }}>
                                        {renderTemplate(pageProds, index + 1, pages.length)}
                                    </div>
                                </div>
                                {/* Footer status bar removed to match builder page height */}
                            </div>
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
