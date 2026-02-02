import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"

/**
 * Catalog Pro Template - "The Bauhaus Vanguard"
 * A high-end designer layout inspired by Swiss and Bauhaus movements.
 * Features: Offset frames, high-contrast typography, and a sophisticated brutalist grid.
 */
export function CatalogProTemplate({
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
    columnsPerRow = 3,
    logoUrl,
    logoPosition,
    logoSize,
    productImageFit = 'cover',
}: TemplateProps) {
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
            default: return "grid-cols-3"
        }
    }

    const getLogoHeight = () => {
        switch (logoSize) {
            case 'small': return 24
            case 'large': return 48
            default: return 32
        }
    }

    const isHeaderLogo = logoPosition?.startsWith('header')
    const logoAlignment = logoPosition?.split('-')[1] || 'left'

    return (
        <div className="h-full bg-white text-slate-950 flex flex-col relative overflow-hidden selection:bg-black selection:text-white">
            {/* Bauhaus Side Stripe */}
            <div className="absolute top-0 right-0 w-2 h-full z-50" style={{ backgroundColor: primaryColor }} />

            {/* Header - Designer Impact */}
            <div className="h-32 px-12 flex items-end pb-8 border-b-8 border-black shrink-0 relative z-10">
                <div className="flex-1 flex items-end gap-10">
                    <div>
                        {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                            <div className="mb-4">
                                <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                            </div>
                        )}
                        <h1 className="text-5xl font-black tracking-tighter uppercase leading-[0.8] text-slate-950">
                            {catalogName || "VANGUARD"}
                        </h1>
                    </div>
                    <div className="flex-1 h-[2px] bg-black mb-1 hidden md:block" />
                    <div className="text-right flex flex-col items-end">
                        {logoUrl && isHeaderLogo && (logoAlignment === 'right' || logoAlignment === 'center') && (
                            <div className="mb-4">
                                <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                            </div>
                        )}
                        <span className="text-[10px] font-bold tracking-[0.5em] text-black">
                            PRO_EDITION // {new Date().getFullYear()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Brutalist Grid */}
            <div className={`flex-1 p-8 grid ${getGridCols()} grid-rows-3 gap-8 overflow-hidden relative z-10`}>
                {safeProducts.slice(0, 9).map((product, idx) => {
                    const productUrl = product.product_url
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'group h-full flex flex-col relative cursor-pointer'
                    } : {
                        className: 'h-full flex flex-col relative'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)}>
                            {/* Product Frame with Bauhaus Tint Background */}
                            <div className="relative flex-1 mb-3 group-hover:-translate-y-2 transition-transform duration-500 min-h-0">
                                {/* The Offset Accent - Only shows on hover or subtlely */}
                                <div className="absolute -inset-2 border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 translate-y-1" />

                                <div className="absolute inset-0 bg-[#f0f0f0] border-2 border-black overflow-hidden flex items-center justify-center p-4">
                                    <ProductImageGallery
                                        product={product}
                                        imageFit={productImageFit}
                                        className="w-full h-full"
                                        imageClassName="p-4 mix-blend-multiply transition-all duration-700 group-hover:scale-110"
                                    />
                                </div>

                                {/* Corner Number Badge */}
                                <div className="absolute -top-3 -left-3 w-8 h-8 bg-black text-white flex items-center justify-center text-[10px] font-black italic">
                                    {(idx + 1 + (pageNumber - 1) * 9).toString().padStart(2, '0')}
                                </div>

                                {(showUrls && productUrl) && (
                                    <div className="absolute bottom-2 right-2 p-1 bg-black text-white hover:bg-black/80">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Typography Info */}
                            <div className="flex flex-col">
                                <div className="flex justify-between items-start gap-4 border-b border-black pb-2 mb-2">
                                    <h3 className="text-sm font-black uppercase tracking-tight line-clamp-1 flex-1 text-slate-950">
                                        {product.name}
                                    </h3>
                                    {showPrices && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black font-mono underline decoration-4" style={{ textDecorationColor: primaryColor }}>
                                                {(() => {
                                                    const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                    return `${symbol}${Number(product.price).toFixed(2)}`
                                                })()}
                                            </span>
                                            {showUrls && productUrl && (
                                                <div className="w-6 h-6 border border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                                                    <ShoppingBag className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {showDescriptions && product.description && (
                                    <p className="text-[10px] text-black/60 font-medium line-clamp-1 italic mb-3">
                                        {product.description}
                                    </p>
                                )}

                                {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 2).map((attr, aidx) => (
                                            <div key={aidx} className="flex flex-col">
                                                <span className="text-[6px] font-black uppercase tracking-widest text-black/30">{attr.name}</span>
                                                <span className="text-[9px] font-bold text-black uppercase leading-none">{attr.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {showSku && product.sku && (
                                    <span className="text-[7px] font-mono text-black/20 mt-2">UID__{product.sku}</span>
                                )}
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer - Bauhaus Geometry */}
            <div className="h-16 px-12 border-t-8 border-black bg-white flex items-center justify-between shrink-0 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-10 h-10 border-2 border-black flex items-center justify-center font-black text-xs italic">
                        {pageNumber}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                        {catalogName} // ARCHIVE_V1
                    </span>
                </div>
                <div className="flex gap-1 h-3">
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
                        <div key={i} className={`w-3 h-full border-2 border-black ${i + 1 === pageNumber ? 'bg-black' : ''}`}
                            style={{ backgroundColor: i + 1 === pageNumber ? primaryColor : undefined }} />
                    ))}
                    {totalPages > 10 && <span className="text-[8px] font-bold leading-none self-end ml-1">...</span>}
                </div>
            </div>
        </div>
    )
}
