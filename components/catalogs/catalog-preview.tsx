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
    name: string
    products: any[]
}

export function CatalogPreview({ layout, name, products }: CatalogPreviewProps) {
    // Use appropriate number of products for preview based on template
    const getPreviewCount = () => {
        switch (layout) {
            case 'showcase': return 3
            case 'elegant-cards':
            case 'tech-modern':
            case 'fashion-lookbook':
            case 'luxury':
            case 'minimalist': return 4
            case 'magazine': return 5
            case 'retail':
            case 'modern-grid':
            case 'bold':
            case 'clean-white': return 6
            case 'industrial': return 7
            case 'classic-catalog': return 8
            case 'catalog-pro': return 9
            case 'compact-list': return 10
            case 'product-tiles': return 12
            default: return 6
        }
    }

    const previewProducts = products.length > 0 ? products.slice(0, getPreviewCount()) : []

    // Default props for preview
    const templateProps = {
        catalogName: name,
        products: previewProducts,
        primaryColor: "#7c3aed", // Purple for preview
        showPrices: true,
        showDescriptions: true,
        isFreeUser: false
    }

    // Map layout string to component
    const getTemplate = () => {
        switch (layout) {
            case "modern-grid":
                return <ModernGridTemplate {...templateProps} />
            case "compact-list":
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
        <div className="w-[794px] h-[1123px] bg-white overflow-hidden shadow-sm relative">
            <div className="pointer-events-none select-none h-full">
                {getTemplate()}
            </div>
        </div>
    )
}
