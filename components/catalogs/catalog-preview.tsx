import type { Catalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"
import { cn } from "@/lib/utils"
import { safeBackgroundImageUrl } from "./templates/utils"

import { ModernGridTemplate } from "./templates/modern-grid"
import { CompactListTemplate } from "./templates/compact-list"
import { MagazineTemplate } from "./templates/magazine"
import { MinimalistTemplate } from "./templates/minimalist"
import { BoldTemplate } from "./templates/bold"
import { ElegantCardsTemplate } from "./templates/elegant-cards"
import { ClassicCatalogTemplate } from "./templates/classic-catalog"
import { ShowcaseTemplate } from "./templates/showcase"
import { CatalogProTemplate } from "./templates/catalog-pro"
import { RetailTemplate } from "./templates/retail"
import { TechModernTemplate } from "./templates/tech-modern"
import { FashionLookbookTemplate } from "./templates/fashion-lookbook"
import { IndustrialTemplate } from "./templates/industrial"
import { LuxuryTemplate } from "./templates/luxury"
import { CleanWhiteTemplate } from "./templates/clean-white"
import { ProductTilesTemplate } from "./templates/product-tiles"
import type { TemplateProps } from "./templates/types"

// Static template map — eager imports required for PDF export reliability
const TEMPLATE_MAP: Record<string, React.ComponentType<TemplateProps>> = {
    'modern-grid': ModernGridTemplate,
    'compact-list': CompactListTemplate,
    'list': CompactListTemplate,
    'magazine': MagazineTemplate,
    'minimalist': MinimalistTemplate,
    'bold': BoldTemplate,
    'elegant-cards': ElegantCardsTemplate,
    'classic-catalog': ClassicCatalogTemplate,
    'showcase': ShowcaseTemplate,
    'catalog-pro': CatalogProTemplate,
    'retail': RetailTemplate,
    'tech-modern': TechModernTemplate,
    'fashion-lookbook': FashionLookbookTemplate,
    'industrial': IndustrialTemplate,
    'luxury': LuxuryTemplate,
    'clean-white': CleanWhiteTemplate,
    'product-tiles': ProductTilesTemplate,
}

interface CatalogPreviewProps {
    layout: string
    catalogName: string
    products: Product[]
    primaryColor?: string
    headerTextColor?: string
    showPrices?: boolean
    showDescriptions?: boolean
    showAttributes?: boolean
    showSku?: boolean
    showUrls?: boolean
    columnsPerRow?: number
    backgroundColor?: string
    backgroundImage?: string | null
    backgroundImageFit?: Catalog['background_image_fit']
    backgroundGradient?: string | null
    logoUrl?: string | null
    logoPosition?: Catalog['logo_position']
    logoSize?: Catalog['logo_size']
    titlePosition?: Catalog['title_position']
    productImageFit?: Catalog['product_image_fit']
    catalog?: Catalog
    isExporting?: boolean
}

export function CatalogPreview({
    layout,
    catalogName,
    products,
    primaryColor = "#7c3aed",
    headerTextColor,
    catalog,
    showPrices = true,
    showDescriptions = true,
    showAttributes = true,
    showSku = true,
    showUrls = false,
    columnsPerRow = 3,
    backgroundColor = "#ffffff",
    backgroundImage,
    backgroundImageFit = "cover",
    backgroundGradient,
    logoUrl,
    logoPosition = "header-left",
    logoSize = "medium",
    titlePosition = "left",
    productImageFit = "cover",
    isExporting = false
}: CatalogPreviewProps) {
    // Layout normalization
    const normalizedLayout = layout?.toLowerCase().trim() || 'modern-grid'

    // Use appropriate number of products for preview based on template
    const getPreviewCount = () => {
        // PDF export sırasında veya Minimalist şablonda tüm ürünleri göster
        if (isExporting || normalizedLayout === 'minimalist') return products?.length || 0;

        switch (normalizedLayout) {
            case 'magazine': return 1 + (columnsPerRow * 2)
            case 'showcase': return 5
            case 'fashion-lookbook': return 5
            case 'industrial': return 8
            case 'luxury': return 6
            case 'compact-list': return 10
            case 'classic-catalog': return 3
            case 'retail': return columnsPerRow * 5
            case 'catalog-pro': return 4
            case 'product-tiles': return 6
            default:
                if (columnsPerRow === 2) return 6
                if (columnsPerRow === 3) return 9
                if (columnsPerRow === 4) return 12
                return 9
        }
    }

    // Minimalist için tüm ürünleri gönder, diğerleri için sınırlı
    // Minimalist için tüm ürünleri gönder, diğerleri için sınırlı
    const safeProducts = products || []
    const previewProducts = (isExporting || normalizedLayout === 'minimalist' || normalizedLayout === 'product-tiles')
        ? safeProducts
        : (safeProducts.length > 0 ? safeProducts.slice(0, getPreviewCount()) : [])

    // Arka plan stili hesaplama
    // Arka plan stili hesaplama (Öncelik: Görsel > Gradyan > Renk)
    const getBackgroundStyle = (): React.CSSProperties => {
        // Temel stil (Her zaman bir background color olsun)
        const baseStyle: React.CSSProperties = {
            backgroundColor: backgroundColor,
        }

        // 1. Öncelik: Görsel varsa onu kullan (Gradyanı ez)
        if (backgroundImage) {
            return {
                ...baseStyle,
                backgroundImage: safeBackgroundImageUrl(backgroundImage),
                backgroundSize: backgroundImageFit === 'fill' ? '100% 100%' : backgroundImageFit,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }
        }

        // 2. Öncelik: Görsel yoksa ve Gradyan varsa onu kullan
        if (backgroundGradient && backgroundGradient !== 'none') {
            return {
                ...baseStyle,
                backgroundImage: backgroundGradient
            }
        }

        // 3. Öncelik: Hiçbiri yoksa sadece renk (baseStyle)
        return baseStyle
    }

    // Default props for preview
    const templateProps = {
        catalogName: catalogName,
        products: previewProducts,
        primaryColor,
        headerTextColor: headerTextColor || catalog?.header_text_color || '#ffffff',
        showPrices,
        showDescriptions,
        showAttributes,
        showSku,
        showUrls,
        columnsPerRow,
        isFreeUser: false,
        // Logo props - template handles rendering
        logoUrl: logoUrl || undefined,
        logoPosition: logoPosition || undefined,
        logoSize: logoSize || undefined,
        titlePosition: titlePosition || undefined,
        productImageFit
    }

    // Map layout string to component
    const getTemplate = () => {
        // product-tiles has special multi-page rendering
        if (normalizedLayout === 'product-tiles') {
            const forcedSize = 6;
            const derivedTotalPages = Math.ceil((templateProps.products?.length || 0) / forcedSize) || 1;
            return (
                <div className="flex flex-col gap-8 bg-slate-100 p-4 -m-4">
                    {Array.from({ length: derivedTotalPages }).map((_, i) => (
                        <div
                            key={`page-${i}-${derivedTotalPages}`}
                            className="w-[794px] h-[1123px] relative overflow-hidden shadow-md mx-auto bg-white"
                            style={getBackgroundStyle()}
                        >
                            <ProductTilesTemplate
                                {...templateProps}
                                products={templateProps.products?.slice(i * forcedSize, (i + 1) * forcedSize) || []}
                                pageNumber={i + 1}
                                totalPages={derivedTotalPages}
                            />
                        </div>
                    ))}
                </div>
            );
        }

        const TemplateComponent = TEMPLATE_MAP[normalizedLayout] || ModernGridTemplate
        return <TemplateComponent {...templateProps} />
    }

    // Minimalist şablonu veya Export modu veya tek sayfa sınırı olanlar için dinamik yükseklik
    const isMultiPage = normalizedLayout === 'minimalist' || normalizedLayout === 'product-tiles' || isExporting;

    return (
        <div
            className={cn(
                "w-[794px] shadow-sm relative shrink-0 transition-all duration-300",
                isMultiPage ? "h-auto overflow-visible flex flex-col gap-8" : "h-[1123px] overflow-hidden"
            )}
            style={isMultiPage ? { ...getBackgroundStyle(), height: 'auto', minHeight: '1123px' } : getBackgroundStyle()}
        >
            <div className={cn("pointer-events-none select-none", isMultiPage ? "" : "h-full", "catalog-light")}>
                {getTemplate()}
            </div>
        </div>
    )
}
