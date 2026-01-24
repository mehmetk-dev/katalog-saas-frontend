import NextImage from "next/image"
import { TemplateProps } from "./types"

/**
 * Classic Catalog Template - "The Vertical Editorial"
 * A bold, structural design that emphasizes vertical lines and high-fashion editorial layouts.
 * Features: Tall product pillars, large index numbers, and generous whitespace.
 */
export function ClassicCatalogTemplate({
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
    logoUrl,
    logoPosition,
    logoSize,
}: TemplateProps) {
    const safeProducts = products || []

    const getLogoHeight = () => {
        switch (logoSize) {
            case 'small': return 28
            case 'large': return 48
            default: return 36
        }
    }

    const isHeaderLogo = logoPosition?.startsWith('header')
    const logoAlignment = logoPosition?.split('-')[1] || 'left'

    return (
        <div className="h-full bg-white flex flex-col relative overflow-hidden selection:bg-black selection:text-white">
            {/* Background Structural Lines */}
            <div className="absolute inset-0 flex justify-between px-12 pointer-events-none opacity-[0.03]">
                <div className="w-[1px] h-full bg-black" />
                <div className="w-[1px] h-full bg-black" />
                <div className="w-[1px] h-full bg-black" />
                <div className="w-[1px] h-full bg-black" />
            </div>

            {/* Header - Minimalist & Elegant */}
            <div className="h-40 px-12 flex items-center justify-between shrink-0 bg-white z-10 border-b border-zinc-100">
                <div className="flex items-center gap-12">
                    {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                        <div className="pr-12 border-r border-zinc-200">
                            <NextImage src={logoUrl} alt="Logo" width={140} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-300 mb-2">Editorial Series</span>
                        <h1 className="text-4xl font-serif italic text-black leading-none tracking-tight">
                            {catalogName || "Summer Archive"}
                        </h1>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    {logoUrl && isHeaderLogo && logoAlignment === 'right' && (
                        <div className="mb-4">
                            <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <span className="text-[11px] font-bold text-black border-b-2 border-black pb-1">VOL_{pageNumber.toString().padStart(2, '0')}</span>
                        <span className="text-[11px] font-bold text-zinc-300 uppercase">Collection</span>
                    </div>
                </div>
            </div>

            {/* Vertical Pillars - 3 Large Items */}
            <div className="flex-1 flex px-12 z-10">
                {safeProducts.map((product, idx) => {
                    const productUrl = product.product_url
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'flex-1 group flex flex-col border-r border-zinc-100 last:border-r-0 hover:bg-zinc-50 transition-all duration-700 cursor-pointer overflow-hidden p-8'
                    } : {
                        className: 'flex-1 flex flex-col border-r border-zinc-100 last:border-r-0 overflow-hidden p-8'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as any)}>
                            {/* Vertical Index & SKU */}
                            <div className="flex justify-between items-start mb-8">
                                <span className="text-6xl font-serif italic text-zinc-100 group-hover:text-zinc-200 transition-colors leading-none">
                                    {(idx + 1 + (pageNumber - 1) * 3).toString().padStart(2, '0')}
                                </span>
                                {showSku && product.sku && (
                                    <span className="text-[9px] font-mono font-bold text-zinc-300 uppercase tracking-widest vertical-text transform rotate-180" style={{ writingMode: 'vertical-rl' }}>
                                        ITEM_ID_{product.sku}
                                    </span>
                                )}
                            </div>

                            {/* Large Vertical Image */}
                            <div className="relative flex-1 mb-8 overflow-hidden bg-white shadow-sm border border-zinc-50">
                                <NextImage
                                    src={product.image_url || product.images?.[0] || "/placeholder.svg"}
                                    alt={product.name}
                                    fill
                                    unoptimized
                                    className="object-contain p-6 group-hover:scale-110 transition-transform duration-[2s] ease-out"
                                />
                                {(showUrls && productUrl) && (
                                    <div className="absolute top-4 right-4 bg-black text-white p-2 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Pillar Info */}
                            <div className="shrink-0 flex flex-col gap-4">
                                <h3 className="text-xl font-bold uppercase tracking-tighter text-black leading-tight line-clamp-2">
                                    {product.name}
                                </h3>

                                {showDescriptions && product.description && (
                                    <p className="text-xs text-zinc-400 font-medium italic leading-relaxed line-clamp-3">
                                        {product.description}
                                    </p>
                                )}

                                {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 2).map((attr, aidx) => (
                                            <div key={aidx} className="flex flex-col border-l-2 border-zinc-100 pl-3">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300 mb-1">{attr.name}</span>
                                                <span className="text-xs font-bold text-black">{attr.value}{attr.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {showPrices && (
                                    <div className="mt-4 pt-6 border-t border-zinc-100 flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-300">Reference Price</span>
                                        <span className="text-2xl font-black tracking-tighter" style={{ color: primaryColor }}>
                                            {(() => {
                                                const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toFixed(2)}`
                                            })()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer - Cinematic & Minimal */}
            <div className="h-20 px-12 flex items-center justify-between shrink-0 bg-white border-t border-zinc-100 relative z-20">
                <div className="flex items-center gap-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-black">
                        {catalogName?.toUpperCase() || "ARCHIVE"}
                    </span>
                    <div className="h-1 w-12 bg-black" />
                </div>

                <div className="flex items-center gap-6">
                    <span className="text-[10px] font-mono text-zinc-400">INDEX::{pageNumber.toString().padStart(2, '0')}</span>
                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <div key={i} className={`h-1 w-4 transition-all duration-700 ${i + 1 === pageNumber ? 'bg-black' : 'bg-zinc-100'}`} />
                        ))}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">OF::{totalPages.toString().padStart(2, '0')}</span>
                </div>
            </div>
        </div>
    )
}
