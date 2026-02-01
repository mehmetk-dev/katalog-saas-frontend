import NextImage from "next/image"
import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"

/**
 * Classic Catalog Template - "The Archive Editorial"
 * A timeless, sophisticated design inspired by archival fashion magazines and art galleries.
 * Features: Minimalist structure, serif typography, heavy use of negative space, and a documentary feel.
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
    totalPages: _totalPages = 1,
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

    const getLogoHeight = () => {
        switch (logoSize) {
            case 'small': return 32
            case 'large': return 64
            default: return 48
        }
    }

    const isHeaderLogo = logoPosition?.startsWith('header')
    const logoAlignment = logoPosition?.split('-')[1] || 'center'

    return (
        <div className="h-full bg-[#fdfdfd] flex flex-col relative overflow-hidden selection:bg-black selection:text-white pb-12">
            {/* Header - Classic & Time-Honored */}
            <div className="h-32 px-16 flex items-center justify-between shrink-0 border-b border-black/5 relative z-10">
                <div className="flex-1">
                    {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                        <NextImage src={logoUrl} alt="Logo" width={160} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                    )}
                    {logoAlignment !== 'left' && (
                        <span className="text-xs font-serif tracking-[0.2em] uppercase text-black/40">Vol. {pageNumber}</span>
                    )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                    {logoUrl && isHeaderLogo && logoAlignment === 'center' ? (
                        <NextImage src={logoUrl} alt="Logo" width={160} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                    ) : (
                        <h1 className="text-4xl font-serif italic tracking-tight text-black text-center">
                            {catalogName || "The Collection"}
                        </h1>
                    )}
                    <div className="w-12 h-[1px] bg-black mt-4" />
                </div>

                <div className="flex-1 flex justify-end">
                    {logoUrl && isHeaderLogo && logoAlignment === 'right' && (
                        <NextImage src={logoUrl} alt="Logo" width={160} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                    )}
                    {logoAlignment !== 'right' && (
                        <span className="text-xs font-serif tracking-[0.2em] uppercase text-black/40 text-right">
                            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                    )}
                </div>
            </div>

            {/* Content - Vertical Flow (Max 3 Items Per Page usually appropriate for this style) */}
            <div className="flex-1 px-16 py-12 flex flex-col gap-12 overflow-hidden items-center">
                {safeProducts.slice(0, 3).map((product, idx) => {
                    const productUrl = product.product_url
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'group w-full flex items-stretch gap-12 cursor-pointer relative py-4 border-b border-black/5 last:border-0'
                    } : {
                        className: 'w-full flex items-stretch gap-12 relative py-4 border-b border-black/5 last:border-0'
                    }

                    // Zig-zag layout
                    const isEven = idx % 2 === 0
                    const orderClass = isEven ? '' : 'flex-row-reverse'
                    const alignClass = isEven ? 'items-start text-left' : 'items-end text-right'

                    return (
                        <div key={product.id} className="flex-1 min-h-0 w-full">
                            <Wrapper {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)} className={`group w-full h-full flex items-center gap-12 cursor-pointer relative ${orderClass}`}>
                                {/* Image Section */}
                                <div className="w-[45%] h-full relative bg-zinc-50 border border-black/5 overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.03)] shrink-0">
                                    <ProductImageGallery
                                        product={product}
                                        imageFit={productImageFit}
                                        className="w-full h-full"
                                        imageClassName="p-4 mix-blend-multiply group-hover:scale-105 transition-all duration-[1.5s] ease-out"
                                    />
                                    {(showUrls && productUrl) && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 z-10">
                                            <div className="w-12 h-12 rounded-full border border-black flex items-center justify-center bg-white">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Details Section */}
                                <div className={`flex-1 flex flex-col justify-center ${alignClass}`}>
                                    <span className="text-4xl font-serif italic text-black/10 absolute -z-10 select-none">
                                        {(idx + 1 + (pageNumber - 1) * 3).toString().padStart(2, '0')}
                                    </span>

                                    <h2 className="text-2xl font-serif text-black mb-4 tracking-tight group-hover:underline decoration-1 underline-offset-4 decoration-black/30">
                                        {product.name}
                                    </h2>

                                    {showDescriptions && product.description && (
                                        <p className="text-xs text-black/60 font-serif leading-relaxed max-w-sm mb-6 line-clamp-4">
                                            {product.description}
                                        </p>
                                    )}

                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                        <div className={`flex flex-wrap gap-4 mb-6 ${isEven ? 'justify-start' : 'justify-end'}`}>
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 3).map((attr, aidx) => (
                                                <div key={aidx} className="flex flex-col">
                                                    <span className="text-[9px] uppercase tracking-widest text-black/40 pb-1 border-b border-black/10 mb-1">{attr.name}</span>
                                                    <span className="text-xs font-serif text-black">{attr.value}{attr.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {showPrices && (
                                        <div className="mt-auto pt-6 border-t border-black/10 w-32">
                                            <span className="text-xl font-serif italic block" style={{ color: primaryColor }}>
                                                {(() => {
                                                    const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                    return `${symbol}${Number(product.price).toFixed(2)}`
                                                })()}
                                            </span>
                                        </div>
                                    )}

                                    {showSku && product.sku && (
                                        <span className="text-[9px] font-mono mt-2 text-black/30 tracking-widest uppercase">
                                            Item No. {product.sku}
                                        </span>
                                    )}
                                </div>
                            </Wrapper>
                        </div>
                    )
                })}
            </div>

            {/* Footer - Minimalist Page Number */}
            <div className="absolute bottom-6 w-full text-center">
                <span className="text-[10px] font-serif tracking-[0.3em] text-black/40">
                    — {pageNumber} —
                </span>
            </div>
        </div>
    )
}
