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
import { cn } from "@/lib/utils"

interface CatalogPreviewProps {
    layout: string
    name: string
    products: any[]
    primaryColor?: string
    showPrices?: boolean
    showDescriptions?: boolean
    showAttributes?: boolean
    columnsPerRow?: number
    backgroundColor?: string
    backgroundImage?: string | null
    backgroundImageFit?: 'cover' | 'contain' | 'fill'
    backgroundGradient?: string | null
    logoUrl?: string | null
    logoPosition?: string
    logoSize?: string
}

export function CatalogPreview({
    layout,
    name,
    products,
    primaryColor = "#7c3aed",
    showPrices = true,
    showDescriptions = true,
    showAttributes = true,
    columnsPerRow = 3,
    backgroundColor = "#ffffff",
    backgroundImage,
    backgroundImageFit = "cover",
    backgroundGradient,
    logoUrl,
    logoPosition = "top-left",
    logoSize = "medium"
}: CatalogPreviewProps) {
    // Use appropriate number of products for preview based on template
    const getPreviewCount = () => {
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

    const previewProducts = products.length > 0 ? products.slice(0, getPreviewCount()) : []

    // Arka plan stili hesaplama
    const getBackgroundStyle = (): React.CSSProperties => {
        const style: React.CSSProperties = {
            backgroundColor: backgroundColor,
        }

        if (backgroundGradient && backgroundGradient !== 'none') {
            style.background = backgroundGradient
        }

        if (backgroundImage) {
            style.backgroundImage = `url(${backgroundImage})`
            style.backgroundSize = backgroundImageFit === 'fill' ? '100% 100%' : backgroundImageFit
            style.backgroundPosition = 'center'
            style.backgroundRepeat = 'no-repeat'
        }

        return style
    }

    // Logo boyut hesaplama
    const getLogoSizeStyle = () => {
        switch (logoSize) {
            case 'small': return { width: '60px', height: 'auto' }
            case 'medium': return { width: '100px', height: 'auto' }
            case 'large': return { width: '150px', height: 'auto' }
            default: return { width: '100px', height: 'auto' }
        }
    }

    // Logo pozisyon hesaplama
    const getLogoPositionStyle = (): React.CSSProperties => {
        const base: React.CSSProperties = { position: 'absolute', zIndex: 40 }
        switch (logoPosition) {
            case 'top-left': return { ...base, top: '20px', left: '20px' }
            case 'top-center': return { ...base, top: '20px', left: '50%', transform: 'translateX(-50%)' }
            case 'top-right': return { ...base, top: '20px', right: '20px' }
            case 'bottom-left': return { ...base, bottom: '20px', left: '20px' }
            case 'bottom-center': return { ...base, bottom: '20px', left: '50%', transform: 'translateX(-50%)' }
            case 'bottom-right': return { ...base, bottom: '20px', right: '20px' }
            default: return { ...base, top: '20px', left: '20px' }
        }
    }

    // Default props for preview
    const templateProps = {
        catalogName: name,
        products: previewProducts,
        primaryColor,
        showPrices,
        showDescriptions,
        showAttributes,
        columnsPerRow,
        isFreeUser: false
    }

    // Map layout string to component
    const getTemplate = () => {
        switch (layout) {
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

    return (
        <div
            className="w-[794px] h-[1123px] overflow-hidden shadow-sm relative shrink-0"
            style={getBackgroundStyle()}
        >
            {/* Logo Overlay */}
            {logoUrl && (
                <div style={getLogoPositionStyle()}>
                    <img
                        src={logoUrl}
                        alt="Logo"
                        style={getLogoSizeStyle()}
                        className="object-contain"
                    />
                </div>
            )}
            <div className="pointer-events-none select-none h-full">
                {getTemplate()}
            </div>
        </div>
    )
}
