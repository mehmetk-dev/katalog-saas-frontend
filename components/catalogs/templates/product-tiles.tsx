import NextImage from "next/image"
import { TemplateProps } from "./types"
import { cn } from "@/lib/utils"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"

/**
 * Product Tiles Template - Redesigned V2
 * Concept: "Staggered Art Gallery"
 * Features:
 * - Staggered grid layout for artistic rhythm
 * - Serif typography for elegance
 * - Minimalist interface with high focus on visuals
 * - Floating status indicators
 */
export function ProductTilesTemplate({
    catalogName,
    products,
    primaryColor = '#000000',
    headerTextColor = '#000000',
    showPrices,
    showDescriptions,
    showAttributes,
    showSku,
    showUrls = false,
    pageNumber = 1,
    columnsPerRow = 3,
    logoUrl,
    logoPosition,
    productImageFit = 'cover'
}: TemplateProps) {
    const safeProducts = products || []

    const getGridCols = () => {
        return "grid-cols-3"
    }

    return (
        <div className="h-full flex flex-col relative font-serif bg-[#FDFBF7] text-[#1c1917] selection:bg-black selection:text-white">
            {/* Header - Minimalist Editorial - Smaller */}
            <header className="px-12 pt-8 pb-4 flex items-end justify-between border-b border-[#E7E5E4]">
                <div>
                    {logoUrl && logoPosition?.startsWith('header') && (
                        <div className="h-8 w-auto relative mb-4">
                            <NextImage src={logoUrl} alt="Logo" width={120} height={32} className="object-contain h-full w-auto" />
                        </div>
                    )}
                    <h1 className="text-4xl font-light italic tracking-tight" style={{ color: headerTextColor }}>
                        {catalogName}
                    </h1>
                </div>
                <div className="text-right">
                    <span className="block text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">
                        Collection
                    </span>
                    <span className="text-sm font-sans font-bold">
                        {new Date().getFullYear()}
                    </span>
                </div>
            </header>

            {/* Main Grid - Tighter to make cards smaller */}
            <main className={cn(
                "flex-1 px-20 py-8 grid gap-x-12 gap-y-12 content-start",
                `grid-cols-${columnsPerRow}`
            )}>
                {safeProducts.map((product, idx) => {
                    const productUrl = product.product_url
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'

                    // Stagger effect: Push down middle column
                    const isStaggered = columnsPerRow === 3 ? (idx % 3 === 1) : false

                    return (
                        <Wrapper
                            key={product.id}
                            href={productUrl || undefined}
                            target={productUrl ? "_blank" : undefined}
                            className={cn(
                                "group flex flex-col transition-all duration-500",
                                isStaggered ? "translate-y-12" : ""
                            )}
                        >
                            {/* Image Frame - Taller Portrait for 2-Row Layout */}
                            <div className="relative aspect-[3/4] w-full mb-3 overflow-hidden bg-white shadow-sm group-hover:shadow-xl transition-shadow duration-500 border border-[#E7E5E4]">
                                <ProductImageGallery
                                    product={product}
                                    imageFit={productImageFit}
                                    className="w-full h-full"
                                    imageClassName="transition-transform duration-1000 group-hover:scale-105"
                                />

                                {/* Corner Index */}
                                <div className="absolute top-0 left-0 w-8 h-8 flex items-center justify-center bg-white text-xs font-sans font-bold border-r border-b border-[#E7E5E4]">
                                    {(idx + 1).toString().padStart(2, '0')}
                                </div>

                                {/* URL Indicator */}
                                {showUrls && productUrl && (
                                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px]">↗</span>
                                    </div>
                                )}
                            </div>

                            {/* Content Block */}
                            <div className="text-center px-2">
                                <h3 className="font-serif text-2xl italic leading-tight mb-2 group-hover:text-gray-600 transition-colors">
                                    {product.name}
                                </h3>

                                {showDescriptions && product.description && (
                                    <p className="text-xs font-sans text-gray-500 line-clamp-2 max-w-[200px] mx-auto mb-2 leading-relaxed">
                                        {product.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-center gap-4 border-t border-[#E7E5E4] pt-2 mt-2 w-2/3 mx-auto">
                                    {showPrices && (
                                        <span className="font-sans font-bold text-sm">
                                            {(() => {
                                                const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toLocaleString('tr-TR')}`
                                            })()}
                                        </span>
                                    )}
                                </div>

                                {showAttributes && product.custom_attributes && (
                                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                                        {product.custom_attributes.filter(a => a.value && a.name !== 'currency').slice(0, 2).map((attr, i) => (
                                            <span key={i} className="text-[9px] font-sans font-medium uppercase tracking-wider text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">
                                                {attr.value}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Wrapper>
                    )
                })}
            </main>

            {/* Footer - Smaller */}
            <footer className="px-12 py-4 flex items-center justify-between border-t border-[#E7E5E4] mt-auto">
                <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-gray-400">
                    Art Direction
                </span>
                <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-gray-400">
                    {pageNumber}
                </span>
            </footer>
        </div>
    )
}
