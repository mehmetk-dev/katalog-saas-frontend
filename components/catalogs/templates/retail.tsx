import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"

/**
 * Retail Template - "The High-Street Gallery"
 * A high-impact, modern retail design inspired by street fashion and boutique storefronts.
 * Features: Massive headers, bold typography, card-based layout with sharp shadows.
 */
export function RetailTemplate({
    catalogName,
    products,
    primaryColor = "#000000",
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
}: TemplateProps) {
    const safeProducts = products || []

    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
            case 4: return "grid-cols-4"
            default: return "grid-cols-2"
        }
    }

    const getLogoHeight = () => {
        switch (logoSize) {
            case 'small': return 24
            case 'large': return 44
            default: return 32
        }
    }

    const isHeaderLogo = logoPosition?.startsWith('header')
    const logoAlignment = logoPosition?.split('-')[1] || 'left'

    return (
        <div className="h-full bg-white flex flex-col relative overflow-hidden selection:bg-black selection:text-white">
            {/* Top Fashion Strip */}
            <div className="h-1.5 w-full bg-black shrink-0" style={{ backgroundColor: primaryColor }} />

            {/* Header - High Impact */}
            <div className="h-32 px-12 flex items-center justify-between shrink-0 bg-white z-10">
                <div className="flex items-center gap-8">
                    {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                        <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                    )}
                    <div>
                        <h1 className="text-4xl font-[900] uppercase tracking-tighter text-black leading-none">
                            {catalogName || "COLLECTION_2026"}
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 tracking-widest uppercase">
                                Season Lookbook
                            </span>
                            <div className="h-[1px] w-12 bg-black/10" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    {logoUrl && isHeaderLogo && (logoAlignment === 'right' || logoAlignment === 'center') && (
                        <div className="mb-2">
                            <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                        </div>
                    )}
                    <div className="text-[11px] font-bold text-black border-2 border-black px-3 py-1 italic">
                        PAGE_{pageNumber.toString().padStart(2, '0')} OF {totalPages.toString().padStart(2, '0')}
                    </div>
                </div>
            </div>

            {/* Retail Grid - Sophisticated Cards */}
            <div className={`flex-1 px-10 pb-10 grid ${getGridCols()} grid-rows-3 gap-8 overflow-hidden z-10`}>
                {safeProducts.map((product) => {
                    const productUrl = product.product_url
                    const _Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const _wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'group flex bg-white border border-zinc-200 hover:border-black transition-all cursor-pointer overflow-hidden p-2'
                    } : {
                        className: 'flex bg-white border border-zinc-200 overflow-hidden p-2'
                    }

                    return (
                        <div key={product.id} className="group flex bg-white border border-zinc-200 hover:border-black transition-all overflow-hidden p-2 relative">
                            {/* Large Image Side */}
                            <div className="w-1/3 bg-zinc-50 relative overflow-hidden shrink-0">
                                <ProductImageGallery
                                    product={product}
                                    imageFit="contain"
                                    className="w-full h-full"
                                    imageClassName="p-2 group-hover:scale-110 transition-transform duration-700"
                                    showNavigation={false}
                                />
                            </div>

                            {/* Info Side */}
                            <div className="flex-1 p-4 flex flex-col justify-between min-w-0 relative">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-black text-xs uppercase tracking-tight text-black line-clamp-2 leading-tight">
                                            {product.name}
                                        </h3>
                                        {showSku && product.sku && (
                                            <span className="text-[7px] font-mono text-zinc-300 shrink-0">#{product.sku}</span>
                                        )}
                                    </div>

                                    {showDescriptions && product.description && (
                                        <p className="text-[10px] text-zinc-500 font-medium italic line-clamp-1 leading-none">
                                            {product.description}
                                        </p>
                                    )}

                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                        <div className="flex flex-col gap-1.5 mt-4">
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 2).map((attr, aidx) => (
                                                <div key={aidx} className="flex justify-between items-center text-[9px] border-b border-zinc-100 pb-1">
                                                    <span className="text-zinc-400 font-bold uppercase tracking-widest text-[7px]">{attr.name}</span>
                                                    <span className="text-black font-black">{attr.value}{attr.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto pt-4 flex items-center justify-between">
                                    {showPrices && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-[900] tracking-tighter" style={{ color: primaryColor }}>
                                                {(() => {
                                                    const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                    return `${symbol}${Number(product.price).toFixed(2)}`
                                                })()}
                                            </span>
                                            <div className="w-12 h-[2px] bg-zinc-100" />
                                        </div>
                                    )}

                                    {/* Buy Button - Fixed to bottom right of info area */}
                                    {showUrls && productUrl && (
                                        <a
                                            href={productUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-8 h-8 flex items-center justify-center bg-black text-white hover:bg-zinc-800 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ShoppingBag className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-16 px-12 border-t border-zinc-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                    <span className="w-12 h-0.5 bg-black" />
                    <span>Archive Edition</span>
                </div>
                <div className="text-[10px] font-bold text-zinc-400">
                    © {new Date().getFullYear()} {catalogName?.toUpperCase()}
                </div>
            </div>
        </div>
    )
}
