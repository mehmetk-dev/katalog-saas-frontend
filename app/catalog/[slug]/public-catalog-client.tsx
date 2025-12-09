"use client"

import { useState } from "react"
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
import { ChevronLeft, ChevronRight, Download, Share2, Home } from "lucide-react"
import Link from "next/link"

interface PublicCatalogClientProps {
    catalog: Catalog
    products: Product[]
}

export function PublicCatalogClient({ catalog, products }: PublicCatalogClientProps) {
    const [currentPage, setCurrentPage] = useState(0)

    // Sayfa başına ürün sayısı
    const getItemsPerPage = (layout: string) => {
        switch (layout) {
            case 'modern-grid': return 6
            case 'minimalist': return 4
            case 'compact-list': return 10
            case 'bold': return 6
            case 'magazine': return 5
            case 'elegant-cards': return 4
            case 'classic-catalog': return 8
            case 'showcase': return 3
            case 'catalog-pro': return 9
            case 'retail': return 6
            case 'tech-modern': return 4
            case 'fashion-lookbook': return 4
            case 'industrial': return 7
            case 'luxury': return 4
            case 'clean-white': return 6
            case 'product-tiles': return 12
            default: return 6
        }
    }

    const itemsPerPage = getItemsPerPage(catalog.layout)
    const pages = products.length > 0
        ? Array.from({ length: Math.ceil(products.length / itemsPerPage) }, (_, i) =>
            products.slice(i * itemsPerPage, (i + 1) * itemsPerPage)
        )
        : [[]]

    const renderTemplate = (pageProducts: Product[], pageNum: number, total: number) => {
        const pageProps = {
            catalogName: catalog.name,
            products: pageProducts,
            primaryColor: catalog.primary_color,
            showPrices: catalog.show_prices,
            showDescriptions: catalog.show_descriptions,
            pageNumber: pageNum,
            totalPages: total,
            isFreeUser: false
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
            alert("Link kopyalandı!")
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
                            <Home className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="font-semibold text-gray-900">{catalog.name}</h1>
                            {catalog.description && (
                                <p className="text-sm text-gray-500 line-clamp-1">{catalog.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleShare}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Paylaş
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <a href={`/api/catalog/${catalog.share_slug}/pdf`} target="_blank">
                                <Download className="w-4 h-4 mr-2" />
                                PDF İndir
                            </a>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Catalog Content */}
            <main className="flex-1 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Page Navigation */}
                    {pages.length > 1 && (
                        <div className="flex items-center justify-center gap-4 mb-6 bg-white rounded-full px-6 py-3 shadow-md w-fit mx-auto">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 0}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>

                            <div className="flex items-center gap-2">
                                {pages.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => goToPage(idx)}
                                        className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentPage
                                            ? "bg-primary scale-125"
                                            : "bg-gray-300 hover:bg-gray-400"
                                            }`}
                                    />
                                ))}
                            </div>

                            <span className="text-sm text-gray-500 min-w-[80px] text-center">
                                Sayfa {currentPage + 1} / {pages.length}
                            </span>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === pages.length - 1}
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    )}

                    {/* Catalog Page */}
                    <div className="flex justify-center">
                        <div
                            className="bg-white shadow-2xl rounded-lg overflow-hidden"
                            style={{
                                width: '794px',
                                height: '1123px',
                                maxWidth: '100%',
                            }}
                        >
                            {renderTemplate(pages[currentPage] || [], currentPage + 1, pages.length)}
                        </div>
                    </div>

                    {/* Mobile Page Navigation */}
                    {pages.length > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-6 md:hidden">
                            <Button
                                variant="outline"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 0}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Önceki
                            </Button>
                            <span className="text-sm text-gray-600">
                                {currentPage + 1} / {pages.length}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === pages.length - 1}
                            >
                                Sonraki
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t py-4">
                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        Bu katalog{" "}
                        <Link href="/" className="text-primary hover:underline font-medium">
                            CatalogPro
                        </Link>
                        {" "}ile oluşturuldu
                    </p>
                </div>
            </footer>
        </div>
    )
}
