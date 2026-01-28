import NextImage from "next/image"
import { useTranslation } from "@/lib/i18n-provider"
import { TemplateProps } from "./types"

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

    const getImageFitClass = () => {
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
            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] grayscale transition-opacity"
                style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/dark-leather.png")` }} />

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
                        <h1 className="font-serif text-2xl tracking-[0.2em] uppercase text-[#f3eacb] drop-shadow-sm">
                            {catalogName || t('catalogs.luxury')}
                        </h1>
                        <div className="text-[9px] uppercase tracking-[0.5em] text-[#d4af37]/60 mt-1">
                            {t('catalogs.premiumCollection') || "ESTABLISHED QUALITY"}
                        </div>
                    </div>

                    <div className="flex-1 flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#d4af37]/30" />
                    </div>
                </div>
            </div>

            {/* Grid - Products */}
            <div className={`flex-1 px-12 pb-8 grid ${getGridCols()} ${getGridRows()} gap-8 overflow-hidden z-10`}>
                {safeProducts.map((product) => {
                    const productUrl = product.product_url
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'group h-full flex flex-col relative focus:outline-none'
                    } : {
                        className: 'h-full flex flex-col relative'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)}>
                            {/* Product Frame */}
                            <div className="relative aspect-[10/12] bg-[#111] border border-[#d4af37]/20 group-hover:border-[#d4af37]/50 transition-all duration-700 overflow-hidden shadow-2xl">
                                {/* Image */}
                                <NextImage
                                    src={product.image_url || product.images?.[0] || "/placeholder.svg"}
                                    alt={product.name}
                                    fill
                                    unoptimized
                                    className={`opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-[1.5s] ease-out ${getImageFitClass()}`}
                                />

                                {/* Overlay Shadow */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60" />

                                {/* Link Icon */}
                                {(showUrls && productUrl) && (
                                    <div className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md border border-[#d4af37]/30 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                        <svg className="w-3 h-3 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}

                                {/* SKU Overlay */}
                                {showSku && product.sku && (
                                    <div className="absolute top-3 left-3">
                                        <span className="text-[8px] font-serif tracking-widest text-[#d4af37]/40 uppercase">NO. {product.sku}</span>
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="mt-3 flex flex-col items-center text-center px-2">
                                <h3 className="font-serif text-sm tracking-widest text-[#f3eacb] uppercase line-clamp-1 mb-1 group-hover:text-[#d4af37] transition-colors">
                                    {product.name}
                                </h3>

                                {showDescriptions && product.description && (
                                    <p className="text-[10px] text-[#ffffff]/40 italic line-clamp-1 mb-2 font-serif font-light">
                                        {product.description}
                                    </p>
                                )}

                                <div className="w-8 h-[1px] bg-[#d4af37]/20 mb-2 group-hover:w-16 transition-all duration-500" />

                                {showPrices && (
                                    <div className="text-sm font-serif text-[#d4af37] font-medium tracking-widest">
                                        {(() => {
                                            const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                            const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                            return `${symbol}${Number(product.price).toFixed(2)}`
                                        })()}
                                    </div>
                                )}

                                {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                    <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 2).map((attr, aidx) => (
                                            <div key={aidx} className="flex items-center text-[8px] tracking-widest uppercase">
                                                <span className="text-[#d4af37]/50 mr-1">{attr.name}:</span>
                                                <span className="text-[#f3eacb]">{attr.value}{attr.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Wrapper>
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
                    <span className="text-[9px] uppercase tracking-[0.4em] text-[#d4af37]/40 font-serif">
                        {catalogName}
                    </span>
                </div>
            </div>

            {/* Bottom Accent */}
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#8a6d3b] via-[#f3eacb] to-[#8a6d3b] shrink-0" />
        </div>
    )
}
