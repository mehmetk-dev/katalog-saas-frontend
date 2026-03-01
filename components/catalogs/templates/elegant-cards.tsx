import React from "react"
import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"
import { cn } from "@/lib/utils"
import { buildBackgroundStyle, sanitizeHref, formatProductPrice, getStandardLogoHeight, getHeaderLayout } from "./utils"

/**
 * Elegant Cards Template - "The Floating Glass"
 * A sophisticated design using glassmorphism and soft depth.
 * Features: Background gradients, backdrop filters, floating cards, and serif typography.
 */
export const ElegantCardsTemplate = React.memo(function ElegantCardsTemplate({
    catalogName,
    products,
    primaryColor = "#7c3aed", // Default violet/soft purple
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
    titlePosition = 'left',
    productImageFit = 'cover',
    backgroundColor,
    backgroundImage,
    backgroundImageFit,
    backgroundGradient,
    headerTextColor = '#000000',
}: TemplateProps) {
    const safeProducts = products || []

    const _getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
            case 4: return "grid-cols-4"
            default: return "grid-cols-2"
        }
    }

    const {
        isHeaderLogo,
        logoAlignment,
        isCollisionLeft,
        isCollisionCenter,
        isCollisionRight
    } = getHeaderLayout(logoPosition, titlePosition)

    const logoHeight = getStandardLogoHeight(logoSize)

    const containerStyle = buildBackgroundStyle({ backgroundColor, backgroundImage, backgroundImageFit, backgroundGradient })

    return (
        <div className="h-full flex flex-col relative overflow-hidden selection:bg-stone-200 transition-colors" style={{ ...containerStyle, backgroundColor: containerStyle.backgroundColor || '#fdfaf6' }}>
            {/* Background Orbs for Depth */}
            <div
                className={cn(
                    "absolute top-[-10%] left-[-10%] w-[40%] h-[40%]",
                    "rounded-full blur-[120px] opacity-20"
                )}
                style={{ backgroundColor: primaryColor }}
            />
            <div
                className={cn(
                    "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%]",
                    "rounded-full blur-[120px] opacity-[0.15]"
                )}
                style={{ backgroundColor: primaryColor }}
            />

            {/* Header */}
            <header className="h-32 px-12 flex items-center justify-between shrink-0 relative z-10 transition-colors" style={{ color: headerTextColor }}>
                <div className="flex-1 flex items-center justify-between relative w-full h-full">
                    {/* Sol Alan */}
                    <div className="flex-1 flex items-center justify-start min-w-0 z-10 gap-6">
                        {isCollisionLeft ? (
                            <div className="flex flex-col gap-3 items-start">
                                {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                <h1 className="text-3xl font-serif italic tracking-tight truncate">{catalogName || "Elegance"}</h1>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6">
                                {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                {titlePosition === 'left' && (
                                    <h1 className="text-3xl font-serif italic tracking-tight truncate">{catalogName || "Elegance"}</h1>
                                )}
                            </div>
                        )}
                        {!isHeaderLogo && titlePosition !== 'left' && (
                            <div className="text-[10px] uppercase tracking-[0.4em] font-medium whitespace-nowrap opacity-50">SERIES COLLECTION // {String(pageNumber).padStart(2, '0')}</div>
                        )}
                    </div>

                    {/* Orta Alan */}
                    <div className="flex-1 flex items-center justify-center min-w-0 z-10 gap-6">
                        {isCollisionCenter ? (
                            <div className="flex flex-col gap-3 items-center">
                                {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                <h1 className="text-3xl font-serif italic tracking-tight truncate">{catalogName || "Elegance"}</h1>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6 text-center">
                                {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                {titlePosition === 'center' && (
                                    <h1 className="text-3xl font-serif italic tracking-tight truncate">{catalogName || "Elegance"}</h1>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sağ Alan */}
                    <div className="flex-1 flex items-center justify-end min-w-0 z-10 gap-6 text-right">
                        {isCollisionRight ? (
                            <div className="flex flex-col gap-3 items-end">
                                {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                <h1 className="text-3xl font-serif italic tracking-tight truncate">{catalogName || "Elegance"}</h1>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6 flex-row-reverse text-right">
                                {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                {titlePosition === 'right' && (
                                    <div className="flex flex-col items-end">
                                        <h1 className="text-3xl font-serif italic tracking-tight truncate">{catalogName || "Elegance"}</h1>
                                    </div>
                                )}
                            </div>
                        )}
                        {!isHeaderLogo && titlePosition !== 'right' && (
                            <div className="w-12 h-[1px] opacity-30" style={{ backgroundColor: headerTextColor }} />
                        )}
                    </div>
                </div>
            </header>

            {/* Grid - The Cards (Optimized for 4 items: 2x2) */}
            <div className={cn(
                "flex-1 px-14 pb-12 grid grid-cols-2 grid-rows-2",
                "gap-12 overflow-hidden relative z-10"
            )}>
                {safeProducts.slice(0, 4).map((product) => {
                    const productUrl = sanitizeHref(product.product_url)
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: cn(
                            'group h-full flex flex-col bg-white/40 backdrop-blur-xl',
                            'rounded-[48px] border border-white/60',
                            'shadow-[0_30px_60px_rgba(0,0,0,0.02)]',
                            'hover:shadow-[0_45px_90px_rgba(0,0,0,0.06)]',
                            'hover:bg-white/60 hover:-translate-y-2',
                            'transition-all duration-1000 cursor-pointer',
                            'overflow-hidden p-4'
                        )
                    } : {
                        className: cn(
                            'h-full flex flex-col bg-white/40 backdrop-blur-xl',
                            'rounded-[48px] border border-white/60',
                            'shadow-[0_30px_60px_rgba(0,0,0,0.02)]',
                            'overflow-hidden p-4'
                        )
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)}>
                            {/* Product Image Capsule - MAXIMIZED IMAGE AREA */}
                            <div className={cn(
                                "relative flex-1 bg-white rounded-[40px]",
                                "overflow-hidden shadow-inner",
                                "flex items-center justify-center p-2 shrink-0"
                            )}>
                                <ProductImageGallery
                                    product={product}
                                    imageFit={productImageFit}
                                    className="w-full h-full"
                                    imageClassName="p-2 group-hover:scale-105 transition-all duration-[1.5s]"
                                />
                                {(showUrls && productUrl) && (
                                    <div className={cn(
                                        "absolute top-6 right-6 w-10 h-10 rounded-full",
                                        "bg-white/80 backdrop-blur-md flex items-center",
                                        "justify-center text-stone-400 opacity-0",
                                        "group-hover:opacity-100 transition-all shadow-sm z-10"
                                    )}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Info Block - Refined & Compact to save space for image */}
                            <div className="py-6 px-8 text-center flex flex-col justify-center shrink-0">
                                <h3 className={cn(
                                    "font-serif text-xl text-stone-800 line-clamp-1 mb-1",
                                    "group-hover:text-stone-900 transition-colors tracking-tight"
                                )}>
                                    {product.name}
                                </h3>

                                {showDescriptions && product.description && (
                                    <p className="text-[10px] text-stone-400 font-serif italic line-clamp-1 mb-2">
                                        {product.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-center gap-3 mb-4">
                                    <div className="w-1.5 h-[1px] bg-stone-300" />
                                    {showPrices && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-light text-stone-500 tracking-[0.1em]">
                                                {formatProductPrice(product)}
                                            </span>
                                            {showUrls && productUrl && (
                                                <ShoppingBag className={cn(
                                                    "w-4 h-4 text-stone-300",
                                                    "group-hover:text-stone-600 transition-colors"
                                                )} />
                                            )}
                                        </div>
                                    )}
                                    <div className="w-1.5 h-[1px] bg-stone-300" />
                                </div>

                                {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                    <div className={cn(
                                        "flex items-center justify-center gap-8",
                                        "border-t border-stone-100 pt-4"
                                    )}>
                                        {product.custom_attributes
                                            .filter(a => a.name !== 'currency' && a.value)
                                            .slice(0, 2)
                                            .map((attr, aidx) => (
                                                <div key={aidx} className="flex flex-col gap-1">
                                                    <span className={cn(
                                                        "text-[8px] uppercase tracking-[0.2em]",
                                                        "text-stone-300 font-bold"
                                                    )}>{attr.name}</span>
                                                    <span className="text-xs text-stone-600 font-serif italic">
                                                        {attr.value}{attr.unit}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                )}

                                {showSku && product.sku && (
                                    <span className={cn(
                                        "mt-4 text-[8px] text-stone-200",
                                        "tracking-[0.4em] uppercase font-medium"
                                    )}>
                                        REF_ID_{product.sku}
                                    </span>
                                )}
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className={cn(
                "h-20 px-12 flex items-center justify-center shrink-0",
                "border-t border-stone-100 bg-white/30",
                "backdrop-blur-md relative z-10"
            )}>
                <div className="flex items-center gap-16">
                    <span className={cn(
                        "text-[10px] uppercase tracking-[0.5em]",
                        "text-stone-400 font-serif whitespace-nowrap"
                    )}>
                        ESTABLISHED CURATION
                    </span>
                    <div className="flex gap-3">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-[2px] w-8 transition-all duration-1000",
                                    i + 1 === pageNumber ? 'bg-stone-800' : 'bg-stone-200'
                                )}
                            />
                        ))}
                    </div>
                    <span className="text-[10px] font-serif italic text-stone-400">
                        {pageNumber} of {totalPages}
                    </span>
                </div>
            </div>
        </div >
    )
})
