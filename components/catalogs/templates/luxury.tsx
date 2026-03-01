import React from "react"
import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"
import { buildBackgroundStyle, sanitizeHref, formatProductPrice, getStandardLogoHeight, getHeaderLayout } from "./utils"

/**
 * Luxury Template - "The Royal Essence"
 * A high-end, premium design optimized for luxury brands, perfumes, jewelry, or high-end real estate.
 * Features: Dark mode by default, gold accents, serif typography, and sophisticated spacing.
 */
export const LuxuryTemplate = React.memo(function LuxuryTemplate({
    catalogName,
    products,
    primaryColor: _primaryColor, // We use a set luxury palette but could integrate primaryColor
    showPrices,
    showDescriptions,
    showAttributes,
    showSku,
    showUrls = false,
    pageNumber = 1,
    totalPages = 1,
    columnsPerRow = 2,
    logoUrl,
    logoPosition,
    logoSize,
    titlePosition = 'center',
    productImageFit = 'cover',
    // New Props for Customization
    backgroundColor,
    backgroundImage,
    backgroundImageFit,
    backgroundGradient,
    headerTextColor, // Optional override, defaults to gold/white theme
}: TemplateProps) {
    const { t } = useTranslation()
    const safeProducts = products || []

    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
            case 4: return "grid-cols-4"
            default: return "grid-cols-2"
        }
    }

    const getGridRows = () => "grid-rows-3"

    const {
        isHeaderLogo,
        logoAlignment,
        isCollisionLeft,
        isCollisionCenter,
        isCollisionRight
    } = getHeaderLayout(logoPosition, titlePosition)

    const logoHeight = getStandardLogoHeight(logoSize)

    // Arka plan stili oluştur
    const containerStyle: React.CSSProperties = {
        ...buildBackgroundStyle({ backgroundColor, backgroundImage, backgroundImageFit, backgroundGradient }),
        backgroundColor: backgroundColor || '#0A0A0A', // default dark background
        color: '#d4af37' // Default gold text base
    }

    // Koyu arka plan → koyu headerTextColor kullanılamaz, açık renge zorla
    const isDarkColor = (color?: string) => {
        if (!color) return false
        const hex = color.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        return (r + g + b) / 3 < 100 // Ortalama < 100 ise çok koyu
    }

    const safeHeaderTextColor = isDarkColor(headerTextColor) ? undefined : headerTextColor
    const primaryTextColor = safeHeaderTextColor || '#f3eacb' // Cream/Gold or user override
    const accentColor = '#d4af37' // Gold accent

    return (
        <div className="h-full flex flex-col overflow-hidden relative selection:bg-[#d4af37] selection:text-black transition-colors" style={containerStyle}>
            {/* Subtle Texture Overlay - Removed external dependency for stability */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.4] mix-blend-soft-light transition-opacity bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Top Ornate Border */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent shrink-0 opacity-70" />

            {/* Header */}
            <header className="h-24 px-12 flex items-center justify-between shrink-0 z-10 transition-colors" style={{ color: primaryTextColor }}>
                <div className="flex-1 flex items-center justify-between relative w-full h-full">
                    {/* Sol Alan */}
                    <div className="flex-1 flex items-center justify-start min-w-0 z-10 gap-6">
                        {isCollisionLeft ? (
                            <div className="flex flex-col gap-2 items-start">
                                {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain filter brightness-125" style={{ maxHeight: logoHeight }} />
                                )}
                                <h1 className="font-serif text-2xl tracking-[0.2em] uppercase drop-shadow-sm truncate">{catalogName || (t('catalogs.luxury') as string)}</h1>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6">
                                {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain filter brightness-125" style={{ maxHeight: logoHeight }} />
                                )}
                                {titlePosition === 'left' && (
                                    <h1 className="font-serif text-2xl tracking-[0.2em] uppercase drop-shadow-sm truncate">{catalogName || (t('catalogs.luxury') as string)}</h1>
                                )}
                            </div>
                        )}
                        {!isHeaderLogo && titlePosition !== 'left' && (
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#d4af37]/30 max-w-[100px]" />
                        )}
                    </div>

                    {/* Orta Alan */}
                    <div className="flex-1 flex flex-col items-center justify-center min-w-0 z-10 gap-2">
                        {isCollisionCenter ? (
                            <div className="flex flex-col gap-2 items-center text-center">
                                {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain filter brightness-125" style={{ maxHeight: logoHeight }} />
                                )}
                                <div className="flex flex-col items-center">
                                    <h1 className="font-serif text-2xl tracking-[0.2em] uppercase drop-shadow-sm truncate">{catalogName || (t('catalogs.luxury') as string)}</h1>
                                    <div className="text-[9px] uppercase tracking-[0.5em] mt-1" style={{ color: `${accentColor}99` }}>{(t('catalogs.premiumCollection') as string) || "ESTABLISHED QUALITY"}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6 text-center">
                                {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain filter brightness-125" style={{ maxHeight: logoHeight }} />
                                )}
                                {titlePosition === 'center' && (
                                    <div className="flex flex-col items-center">
                                        <h1 className="font-serif text-2xl tracking-[0.2em] uppercase drop-shadow-sm truncate">{catalogName || (t('catalogs.luxury') as string)}</h1>
                                        <div className="text-[9px] uppercase tracking-[0.5em] mt-1" style={{ color: `${accentColor}99` }}>{(t('catalogs.premiumCollection') as string) || "ESTABLISHED QUALITY"}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sağ Alan */}
                    <div className="flex-1 flex items-center justify-end min-w-0 z-10 gap-6 text-right">
                        {isCollisionRight ? (
                            <div className="flex flex-col gap-2 items-end">
                                {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain filter brightness-125" style={{ maxHeight: logoHeight }} />
                                )}
                                <h1 className="font-serif text-2xl tracking-[0.2em] uppercase drop-shadow-sm truncate">{catalogName || (t('catalogs.luxury') as string)}</h1>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6 flex-row-reverse text-right">
                                {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain filter brightness-125" style={{ maxHeight: logoHeight }} />
                                )}
                                {titlePosition === 'right' && (
                                    <h1 className="font-serif text-2xl tracking-[0.2em] uppercase drop-shadow-sm truncate">{catalogName || (t('catalogs.luxury') as string)}</h1>
                                )}
                            </div>
                        )}
                        {!isHeaderLogo && titlePosition !== 'right' && (
                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#d4af37]/30 max-w-[100px]" />
                        )}
                    </div>
                </div>
            </header>

            {/* Grid - Products */}
            <div className={`flex-1 px-12 pb-8 grid ${getGridCols()} ${getGridRows()} gap-x-12 gap-y-10 overflow-hidden z-10`}>
                {safeProducts.map((product) => {
                    const productUrl = sanitizeHref(product.product_url)

                    return (
                        <div key={product.id} className="h-full flex flex-col relative group">
                            {/* Product Image Frame - The "Classic Luxury" Look */}
                            <div className="relative aspect-[10/12] bg-[#0c0c0c] border border-white/10 group-hover:border-[#d4af37]/40 transition-all duration-700 overflow-hidden shadow-2xl shadow-black">
                                <ProductImageGallery
                                    product={product}
                                    imageFit={productImageFit}
                                    className="w-full h-full"
                                    imageClassName="opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-[2s] ease-out"
                                />

                                {/* SKU Overlay - Now Pure White for visibility */}
                                {showSku && product.sku && (
                                    <div className="absolute top-4 left-4 z-20">
                                        <span className="text-[8px] font-sans font-black tracking-widest text-white uppercase bg-black/40 px-1.5 py-0.5 rounded-sm">#{product.sku}</span>
                                    </div>
                                )}
                            </div>

                            {/* Product Info - All Text Made Pure White as Requested */}
                            <div className="mt-5 flex flex-col items-center text-center relative px-2">
                                <h3 className="font-serif text-[13px] tracking-[0.2em] uppercase line-clamp-1 mb-1 transition-colors duration-500" style={{ color: primaryTextColor }}>
                                    {product.name}
                                </h3>

                                {showDescriptions && product.description && (
                                    <p className="text-[10px] italic line-clamp-2 mb-2 font-serif font-light tracking-wide max-w-[200px] leading-relaxed" style={{ color: `${primaryTextColor}CC` }}>
                                        {product.description}
                                    </p>
                                )}

                                <div className="w-8 h-[1px] my-2 group-hover:w-16 transition-all duration-700" style={{ backgroundColor: `${accentColor}99` }} />

                                {showPrices && (
                                    <div className="text-base font-serif font-medium tracking-[0.1em]" style={{ color: accentColor }}>
                                        {formatProductPrice(product)}
                                    </div>
                                )}

                                {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 opacity-80 group-hover:opacity-100 transition-opacity duration-500 pb-8">
                                        {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 2).map((attr, aidx) => (
                                            <div key={aidx} className="flex items-center text-[8px] tracking-[0.15em] uppercase font-medium" style={{ color: primaryTextColor }}>
                                                <span className="mr-1" style={{ color: `${primaryTextColor}99` }}>{attr.name}:</span>
                                                <span>{attr.value}{attr.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Floating Buy Button - Bottom Right of the card */}
                                {(showUrls && productUrl) && (
                                    <a
                                        href={productUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full border border-[#d4af37]/30 flex items-center justify-center bg-black/40 backdrop-blur-sm hover:bg-[#d4af37] hover:text-black transition-all duration-300 z-30 group/btn"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ShoppingBag className="w-3.5 h-3.5 text-[#d4af37] group-hover/btn:text-black" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-16 flex flex-col items-center justify-center shrink-0 z-10">
                <div className="w-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent mb-2" />
                <div className="flex items-center gap-6">
                    <span className="text-[9px] uppercase tracking-[0.6em] text-[#d4af37]/40 font-serif">
                        PAGE {pageNumber} OF {totalPages}
                    </span>
                    <div className="h-4 w-[1px] bg-[#d4af37]/20" />
                    <span className="text-[9px] uppercase tracking-[0.4em] text-[#d4af37]/40 font-serif truncate max-w-[150px]">
                        {catalogName}
                    </span>
                </div>
            </div>

            {/* Bottom Accent */}
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#8a6d3b] via-[#f3eacb] to-[#8a6d3b] shrink-0" />
        </div>
    )
})
