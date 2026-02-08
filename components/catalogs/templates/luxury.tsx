import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import { useTranslation } from "@/lib/i18n-provider"
import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"

/**
 * Luxury Template - "The Royal Essence"
 * A high-end, premium design optimized for luxury brands, perfumes, jewelry, or high-end real estate.
 * Features: Dark mode by default, gold accents, serif typography, and sophisticated spacing.
 */
export function LuxuryTemplate({
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
    productImageFit = 'cover',
}: TemplateProps) {
    const { t } = useTranslation()
    const safeProducts = products || []

    const _getImageFitClass = () => {
        switch (productImageFit) {
            case 'contain': return 'object-contain'
            case 'fill': return 'object-fill'
            case 'cover':
            default: return 'object-cover'
        }
    }

    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
            case 4: return "grid-cols-4"
            default: return "grid-cols-2"
        }
    }

    const getGridRows = () => "grid-rows-3"

    const getLogoHeight = () => {
        switch (logoSize) {
            case 'small': return 28
            case 'large': return 48
            default: return 36
        }
    }

    const isHeaderLogo = logoPosition?.startsWith('header')
    const _logoAlignment = logoPosition?.split('-')[1] || 'center'

    return (
        <div className="h-full flex flex-col overflow-hidden bg-[#0a0a0a] text-[#d4af37] relative selection:bg-[#d4af37] selection:text-black">
            {/* Subtle Texture Overlay - Removed external dependency for stability */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.4] mix-blend-soft-light transition-opacity bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Top Ornate Border */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent shrink-0 opacity-70" />

            {/* Header */}
            <div className="h-24 px-12 flex flex-col justify-center shrink-0 z-10">
                <div className="flex items-center justify-between w-full">
                    <div className="flex-1 flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#d4af37]/30" />
                    </div>

                    <div className="px-8 text-center flex flex-col items-center">
                        {logoUrl && isHeaderLogo && (
                            <div className="mb-2">
                                <NextImage
                                    src={logoUrl}
                                    alt="Logo"
                                    width={140}
                                    height={getLogoHeight()}
                                    unoptimized
                                    className="object-contain filter brightness-125 transition-all"
                                    style={{ height: getLogoHeight() }}
                                />
                            </div>
                        )}
                        <h1 className="font-serif text-2xl tracking-[0.2em] uppercase text-[#f3eacb] drop-shadow-sm truncate max-w-[400px]">
                            {catalogName || (t('catalogs.luxury') as string)}
                        </h1>
                        <div className="text-[9px] uppercase tracking-[0.5em] text-[#d4af37]/60 mt-1">
                            {(t('catalogs.premiumCollection') as string) || "ESTABLISHED QUALITY"}
                        </div>
                    </div>

                    <div className="flex-1 flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#d4af37]/30" />
                    </div>
                </div>
            </div>

            {/* Grid - Products */}
            <div className={`flex-1 px-12 pb-8 grid ${getGridCols()} ${getGridRows()} gap-x-12 gap-y-10 overflow-hidden z-10`}>
                {safeProducts.map((product) => {
                    const productUrl = product.product_url

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
                                <h3 className="font-serif text-[13px] tracking-[0.2em] text-white uppercase line-clamp-1 mb-1 group-hover:text-[#d4af37] transition-colors duration-500">
                                    {product.name}
                                </h3>

                                {showDescriptions && product.description && (
                                    <p className="text-[10px] text-white italic line-clamp-2 mb-2 font-serif font-light tracking-wide max-w-[200px] leading-relaxed">
                                        {product.description}
                                    </p>
                                )}

                                <div className="w-8 h-[1px] bg-[#d4af37]/60 my-2 group-hover:w-16 transition-all duration-700" />

                                {showPrices && (
                                    <div className="text-base font-serif text-[#d4af37] font-medium tracking-[0.1em]">
                                        {(() => {
                                            const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                            const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                            return `${symbol}${Number(product.price).toFixed(2)}`
                                        })()}
                                    </div>
                                )}

                                {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 opacity-80 group-hover:opacity-100 transition-opacity duration-500 pb-8">
                                        {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 2).map((attr, aidx) => (
                                            <div key={aidx} className="flex items-center text-[8px] tracking-[0.15em] uppercase text-white font-medium">
                                                <span className="text-white/60 mr-1">{attr.name}:</span>
                                                <span className="text-white">{attr.value}{attr.unit}</span>
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
}
