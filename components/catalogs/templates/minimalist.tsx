import NextImage from "next/image"
import type { CustomAttribute } from "@/lib/actions/products"
import { TemplateProps } from "./types"

/**
 * Minimalist Template - "The Essence"
 * A zen-like design focusing purely on product photography and essential info.
 * Features: High whitespace, hairline borders, and sophisticated light typography.
 */
export function MinimalistTemplate({
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
    const HEADER_HEIGHT = "70px"
    const FOOTER_HEIGHT = "48px"

    const getLogoHeight = () => {
        switch (logoSize) {
            case 'small': return 24
            case 'large': return 40
            default: return 32
        }
    }

    const isHeaderLogo = logoPosition?.startsWith('header')
    const logoAlignment = logoPosition?.split('-')[1] || 'center'

    return (
        <div className="h-full flex flex-col bg-white text-[#1a1a1a] overflow-hidden selection:bg-[#f0f0f0]">
            {/* Header - Delicate and Precise */}
            <div className="shrink-0 px-12" style={{ height: HEADER_HEIGHT }}>
                <div className="h-full flex items-center justify-between border-b border-[#f0f0f0]">
                    <div className="flex-1 flex items-center">
                        {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                            <NextImage src={logoUrl} alt="Logo" width={110} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                        )}
                        {logoAlignment !== 'left' && (
                            <span className="text-[10px] tracking-[0.4em] text-[#a0a0a0] uppercase whitespace-nowrap">
                                {catalogName || "COLLECTION"}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 flex justify-center">
                        {logoUrl && isHeaderLogo && logoAlignment === 'center' ? (
                            <NextImage src={logoUrl} alt="Logo" width={110} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                        ) : (
                            <h1 className="text-sm font-light tracking-[0.5em] uppercase text-black">
                                {catalogName || "MINIMAL"}
                            </h1>
                        )}
                    </div>

                    <div className="flex-1 flex justify-end items-center gap-4">
                        <span className="text-[10px] font-mono text-[#d0d0d0]">P.{pageNumber.toString().padStart(2, '0')}</span>
                        {logoUrl && isHeaderLogo && logoAlignment === 'right' && (
                            <NextImage src={logoUrl} alt="Logo" width={110} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                        )}
                    </div>
                </div>
            </div>

            {/* Grid - Fixed 2x2 Layout to prevent overflow */}
            <div className="flex-1 px-12 grid grid-cols-2 grid-rows-2 gap-x-12 gap-y-12 overflow-hidden py-10">
                {(products || []).slice(0, 4).map((product) => {
                    const productUrl = product.product_url
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'group flex flex-col relative cursor-pointer h-full'
                    } : {
                        className: 'flex flex-col relative h-full'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as any)}>
                            {/* Product Image - Fixed Proportion */}
                            <div className="relative flex-1 mb-6 bg-[#fafafa] flex items-center justify-center transition-all duration-1000 group-hover:bg-[#f2f2f2]">
                                <div className="absolute inset-8">
                                    <NextImage
                                        src={product.image_url || product.images?.[0] || "/placeholder.svg"}
                                        alt={product.name}
                                        fill
                                        unoptimized
                                        className="object-contain mix-blend-multiply opacity-90 group-hover:opacity-100 group-hover:scale-[1.05] transition-all duration-[1.5s]"
                                    />
                                </div>

                                {(showUrls && productUrl) && (
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                                            <svg className="w-3 h-3 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Product Info - Precise Typography */}
                            <div className="shrink-0 pb-4">
                                <div className="flex justify-between items-baseline mb-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#1a1a1a] truncate flex-1">
                                        {product.name}
                                    </h3>
                                    {showPrices && (
                                        <div className="text-xs font-medium text-[#1a1a1a] ml-4">
                                            {(() => {
                                                const currency = product.custom_attributes?.find((a: CustomAttribute) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toFixed(2)}`
                                            })()}
                                        </div>
                                    )}
                                </div>

                                {showDescriptions && product.description && (
                                    <p className="text-[10px] font-medium text-[#777] leading-relaxed line-clamp-2 mb-4">
                                        {product.description}
                                    </p>
                                )}

                                {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                    <div className="flex flex-wrap gap-4 pt-4 border-t border-[#f0f0f0]">
                                        {product.custom_attributes.filter((a: CustomAttribute) => a.name !== 'currency' && a.value).slice(0, 3).map((attr: CustomAttribute, idx: number) => (
                                            <div key={idx} className="flex flex-col gap-0.5">
                                                <span className="text-[7px] font-black uppercase tracking-tighter text-[#bbb]">{attr.name}</span>
                                                <span className="text-[9px] font-bold text-[#444] whitespace-nowrap">{attr.value}{attr.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer - Minimal */}
            <div className="shrink-0 flex items-center justify-center" style={{ height: FOOTER_HEIGHT }}>
                <div className="flex items-center gap-10">
                    <div className="w-12 h-[1px] bg-[#f0f0f0]" />
                    <span className="text-[9px] tracking-[0.5em] text-[#d0d0d0] uppercase">
                        {pageNumber} / {totalPages}
                    </span>
                    <div className="w-12 h-[1px] bg-[#f0f0f0]" />
                </div>
            </div>
        </div>
    )
}
