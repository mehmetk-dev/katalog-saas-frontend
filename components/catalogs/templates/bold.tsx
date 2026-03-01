import React from "react"
import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import { TemplateProps } from "./types"
import { cn } from "@/lib/utils"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"
import { sanitizeHref, formatProductPrice, buildBackgroundStyle, getStandardLogoHeight, getHeaderLayout } from "./utils"

/**
 * Bold Template - "The Neo-Brutalist"
 * A high-impact, raw design inspired by modern streetwear and radical architecture.
 * Features: Chunky borders, massive headers, and a "Zine" aesthetic.
 */
export const BoldTemplate = React.memo(function BoldTemplate({
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
    titlePosition = 'left',
    productImageFit = 'cover',
    backgroundColor,
    backgroundImage,
    backgroundImageFit,
    backgroundGradient,
    headerTextColor = '#000000',
}: TemplateProps) {
    const HEADER_HEIGHT = "80px"

    const getGridCols = () => {
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
        <div className="h-full flex flex-col overflow-hidden selection:bg-black selection:text-white transition-colors" style={{ border: `8px solid ${primaryColor}`, ...containerStyle, backgroundColor: containerStyle.backgroundColor || '#ffffff' }}>
            {/* Header - Huge and Loud */}
            <div className="shrink-0 flex items-stretch border-b-8 transition-colors" style={{ height: HEADER_HEIGHT, borderColor: primaryColor, color: headerTextColor }}>
                <div className="flex-1 flex items-center px-6 relative w-full">
                    {/* Sol Alan */}
                    <div className="flex-1 flex items-center justify-start min-w-0 z-10 gap-6 h-full">
                        {isCollisionLeft ? (
                            <>
                                {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                    <div className="mr-4 border-r-8 pr-4 h-full flex items-center" style={{ borderColor: primaryColor }}>
                                        <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                    </div>
                                )}
                                <h1 className="text-4xl font-[900] uppercase tracking-tighter leading-none italic truncate">{catalogName || "KATALOG"}</h1>
                            </>
                        ) : (
                            <>
                                {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                    <div className="mr-6 border-r-8 pr-6 h-full flex items-center" style={{ borderColor: primaryColor }}>
                                        <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                    </div>
                                )}
                                {titlePosition === 'left' && (
                                    <h1 className="text-4xl font-[900] uppercase tracking-tighter leading-none italic truncate">{catalogName || "KATALOG"}</h1>
                                )}
                            </>
                        )}
                    </div>

                    {/* Orta Alan */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20 w-full max-w-[50%] gap-6 h-full">
                        {isCollisionCenter ? (
                            <>
                                {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                    <div className="border-r-8 pr-4 h-full flex items-center" style={{ borderColor: primaryColor }}>
                                        <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                    </div>
                                )}
                                <h1 className="text-4xl font-[900] uppercase tracking-tighter leading-none italic truncate">{catalogName || "KATALOG"}</h1>
                            </>
                        ) : (
                            <>
                                {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                    <div className="h-full flex items-center">
                                        <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                    </div>
                                )}
                                {titlePosition === 'center' && (
                                    <h1 className="text-4xl font-[900] uppercase tracking-tighter leading-none italic truncate">{catalogName || "KATALOG"}</h1>
                                )}
                            </>
                        )}
                    </div>

                    {/* Sağ Alan */}
                    <div className="flex-1 flex items-center justify-end min-w-0 z-10 gap-6 h-full">
                        {isCollisionRight ? (
                            <>
                                <h1 className="text-4xl font-[900] uppercase tracking-tighter leading-none italic truncate">{catalogName || "KATALOG"}</h1>
                                {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                    <div className="ml-4 border-l-8 pl-4 h-full flex items-center" style={{ borderColor: primaryColor }}>
                                        <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {titlePosition === 'right' && (
                                    <h1 className="text-4xl font-[900] uppercase tracking-tighter leading-none italic truncate">{catalogName || "KATALOG"}</h1>
                                )}
                                {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                    <div className="ml-6 border-l-8 pl-6 h-full flex items-center" style={{ borderColor: primaryColor }}>
                                        <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="w-[120px] shrink-0 flex items-center justify-center border-l-8 text-white font-black italic text-2xl transition-colors" style={{ backgroundColor: primaryColor, borderColor: primaryColor }}>
                    {pageNumber.toString().padStart(2, '0')}
                </div>
            </div>

            {/* Grid - The "Chaos" Grid */}
            <div className={`flex-1 p-6 grid ${getGridCols()} grid-rows-3 gap-6 overflow-hidden transition-colors`}>
                {(products || []).map((product) => {
                    const productUrl = sanitizeHref(product.product_url)
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'group h-full flex flex-col bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer overflow-hidden'
                    } : {
                        className: 'h-full flex flex-col bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)}>
                            {/* Huge Image Area */}
                            <div className="relative aspect-[16/10] bg-gray-200 border-b-4 border-black overflow-hidden group">
                                <ProductImageGallery
                                    product={product}
                                    imageFit={productImageFit}
                                    className="w-full h-full"
                                    imageClassName={cn(
                                        "grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                                    )}
                                />
                                {/* Label Ribbon */}
                                {showSku && product.sku && (
                                    <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-tighter">
                                        ID: {product.sku}
                                    </div>
                                )}
                                {/* URL Icon */}
                                {(showUrls && productUrl) && (
                                    <div className="absolute top-2 right-2 bg-white border-2 border-black p-1 group-hover:bg-yellow-400 transition-colors z-10">
                                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Content Block */}
                            <div className="p-3 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-black uppercase leading-tight tracking-tighter italic flex-1 mr-4">
                                        {product.name}
                                    </h3>
                                    {showPrices && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="bg-black text-white px-2 py-1 text-sm font-black italic shadow-[4px_4px_0px_0px_#fbbf24]">
                                                {formatProductPrice(product)}
                                            </div>
                                            {showUrls && productUrl && (
                                                <div className="bg-white border-2 border-black p-1 group-hover:bg-yellow-400 transition-colors">
                                                    <ShoppingBag className="w-3.5 h-3.5 text-black" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {showDescriptions && product.description && (
                                    <p className="text-[11px] font-bold text-gray-800 line-clamp-2 leading-tight uppercase mb-2 border-l-4 border-black pl-2">
                                        {product.description}
                                    </p>
                                )}

                                {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                    <div className="mt-auto pt-2 grid grid-cols-2 gap-1 border-t-2 border-black/10">
                                        {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 4).map((attr, idx) => (
                                            <div key={idx} className="flex flex-col text-[9px] font-black uppercase tracking-tighter">
                                                <span className="text-gray-400">{attr.name}</span>
                                                <span className="truncate">{attr.value}{attr.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer - Solid Block */}
            <div className="h-10 text-white flex items-center px-6 font-black italic uppercase tracking-widest text-sm" style={{ backgroundColor: primaryColor }}>
                <div className="flex-1">{catalogName}</div>
                <div className="h-full w-[1px] bg-white opacity-20 mx-4" />
                <div>PAGE {pageNumber} / {totalPages}</div>
            </div>
        </div>
    )
})
