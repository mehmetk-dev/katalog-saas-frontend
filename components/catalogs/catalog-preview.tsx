import type { Catalog } from "@/lib/actions/catalogs"
import type { Product } from "@/lib/actions/products"
import { cn } from "@/lib/utils"

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
            case 'catalog-pro': return columnsPerRow * 3
            case 'product-tiles': return columnsPerRow === 2 ? 4 : 9
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
    const previewProducts = (isExporting || normalizedLayout === 'minimalist')
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
                backgroundImage: `url(${backgroundImage})`,
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
        switch (normalizedLayout) {
            case "modern-grid":
                return <ModernGridTemplate {...templateProps} />
            case "compact-list":
            case "list":
                return <CompactListTemplate {...templateProps} />
            case "magazine":
                return <MagazineTemplate {...templateProps} />
            case "minimalist":
                return <MinimalistTemplate {...templateProps} />
            case "bold":
                return <BoldTemplate {...templateProps} />
            case "elegant-cards":
                return <ElegantCardsTemplate {...templateProps} />
            case "classic-catalog":
                return <ClassicCatalogTemplate {...templateProps} />
            case "showcase":
                return <ShowcaseTemplate {...templateProps} />
            case "catalog-pro":
                return <CatalogProTemplate {...templateProps} />
            case "retail":
                return <RetailTemplate {...templateProps} />
            case "tech-modern":
                return <TechModernTemplate {...templateProps} />
            case "fashion-lookbook":
                return <FashionLookbookTemplate {...templateProps} />
            case "industrial":
                return <IndustrialTemplate {...templateProps} />
            case "luxury":
                return <LuxuryTemplate {...templateProps} />
            case "clean-white":
                return <CleanWhiteTemplate {...templateProps} />
            case "product-tiles":
                return <ProductTilesTemplate {...templateProps} />
            default:
                return <ModernGridTemplate {...templateProps} />
        }
    }

    // Minimalist şablonu veya Export modu için dinamik yükseklik
    const isMultiPage = normalizedLayout === 'minimalist' || isExporting;

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
