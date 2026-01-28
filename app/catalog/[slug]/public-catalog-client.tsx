"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-provider"
import { jsPDF } from "jspdf"
import { toPng } from "html-to-image"
import {
    Download,
    Share2,
    Sparkles,
    Search,
    X
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
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
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

        if (layout === 'product-tiles' && columns === 2) return 4

        return columns * 3
    }

    const productsPerPage = getPageSize(catalog.layout, columnsPerRow)

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

    // İndirme işlemi: İstemci tarafında PDF oluşturma (API bağımlılığı kaldırıldı)
    const handleDownload = async () => {
        try {
            toast.loading("PDF oluşturuluyor, lütfen bekleyin... (Sayfa sayısına göre biraz sürebilir)", { id: "pdf-download", duration: 10000 })

            // A4 Boyutu (mm cinsinden)
            const content = document.querySelectorAll('[data-pdf-page="true"]')
            if (!content || content.length === 0) {
                toast.error("PDF oluşturulacak içerik bulunamadı.", { id: "pdf-download" })
                return
            }

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            })

            const imgWidth = 210 // A4 width in mm
            const pageHeight = 297 // A4 height in mm

            for (let i = 0; i < content.length; i++) {
                const page = content[i] as HTMLElement

                // html-to-image için ayarlar
                // Margin, Shadow vb. özellikler PDF çıktısında kaymalara yol açabilir, bunları sıfırlıyoruz.
                const dataUrl = await toPng(page, {
                    quality: 1.0,
                    pixelRatio: 2, // Yüksek çözünürlük
                    width: 794,   // A4 @ 96 DPI Width
                    height: 1123, // A4 @ 96 DPI Height
                    cacheBust: true,
                    style: {
                        margin: '0',
                        transform: 'none',
                        boxShadow: 'none',
                        border: 'none',
                        borderRadius: '0',
                        display: 'block' // Flex/Grid etkilerini izole et
                    }
                })

                // const imgProps = pdf.getImageProperties(dataUrl)

                if (i > 0) {
                    pdf.addPage()
                }

                pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, pageHeight)
            }

            const fileName = `${catalog.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
            pdf.save(fileName)
            toast.success("İndirme işlemi tamamlandı!", { id: "pdf-download" })

        } catch (error) {
            console.error("PDF Generation Error:", error)
            toast.error("PDF oluşturulamadı. Lütfen tekrar deneyin.", { id: "pdf-download" })
        }
    }

    const getBackgroundStyle = () => {
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
    }

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
        <div className={cn(
            "min-h-screen flex flex-col transition-colors duration-500",
            isFullscreen ? "bg-black" : "bg-slate-50"
        )}>
            <Toaster position="top-center" expand={true} richColors />

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
                                        <span className="font-light text-slate-900">Catalog</span>
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
                        wheel={{ disabled: true }}
                        panning={{ velocityDisabled: true }}
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
                                {pages.map((pageProds, index) => (
                                    <div
                                        key={index}
                                        data-pdf-page="true"
                                        className="shadow-2xl rounded-lg overflow-hidden border border-slate-200 relative bg-white shrink-0"
                                        style={{
                                            width: '794px',
                                            height: '1123px',
                                            ...getBackgroundStyle()
                                        }}
                                    >
                                        <div className="w-full h-full" style={{ height: '1123px' }}>
                                            <div style={{ width: '100%', height: '100%' }}>
                                                {renderTemplate(pageProds, index + 1, pages.length)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TransformComponent>
                    </TransformWrapper>
                ) : (
                    <div className="w-full min-h-full flex flex-col gap-6 px-4 sm:px-6 py-6">
                        {pages.length > 0 && pages[0].length > 0 ? (
                            pages.map((pageProds, index) => (
                                <div
                                    key={index}
                                    data-pdf-page="true"
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
                                        <div style={{ width: '100%', height: '100%' }}>
                                            {renderTemplate(pageProds, index + 1, pages.length)}
                                        </div>
                                    </div>
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
                )}
            </main>

            {/* Modern Footer */}
            {!isFullscreen && (
                <footer className="shrink-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/50 py-4">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Link href="/" className="flex items-center group">
                                    <span className="font-montserrat text-lg tracking-tighter flex items-center">
                                        <span className="font-black text-[#cf1414] uppercase">Fog</span>
                                        <span className="font-light text-slate-900">Catalog</span>
                                    </span>
                                </Link>
                                <div className="h-4 w-px bg-slate-200" />
                                <p className="text-slate-500 text-xs font-medium">
                                    {t("catalogs.public.createdWithPrefix")}{" "}
                                    {t("catalogs.public.createdWithSuffix")}
                                </p>
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
