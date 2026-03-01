import React from "react"
import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import type { CustomAttribute } from "@/lib/actions/products"
import { TemplateProps } from "./types"
import { cn } from "@/lib/utils"
import { buildBackgroundStyle, sanitizeHref, formatProductPrice, getStandardLogoHeight, getHeaderLayout } from "./utils"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"

/**
 * Minimalist Template - "The Essence"
 * A zen-like design focusing purely on product photography and essential info.
 * Features: High whitespace, hairline borders, and sophisticated light typography.
 */
export const MinimalistTemplate = React.memo(function MinimalistTemplate({
    catalogName,
    products,
    primaryColor: _primaryColor = "#000000",
    showPrices,
    showDescriptions,
    showAttributes: _showAttributes,
    showSku: _showSku,
    showUrls = false,
    pageNumber = 1,
    totalPages: _totalPages = 1,
    columnsPerRow: _columnsPerRow = 2,
    logoUrl,
    logoPosition,
    logoSize,
    titlePosition = 'center',
    productImageFit = 'contain',
    backgroundColor,
    backgroundImage,
    backgroundImageFit,
    backgroundGradient,
    headerTextColor,
}: TemplateProps) {
    const HEADER_HEIGHT = "70px"
    const FOOTER_HEIGHT = "48px"
    const PRODUCTS_PER_PAGE = 4

    const {
        isHeaderLogo,
        logoAlignment,
        isCollisionLeft,
        isCollisionCenter,
        isCollisionRight
    } = getHeaderLayout(logoPosition, titlePosition)

    const logoHeight = getStandardLogoHeight(logoSize)

    const containerStyle = buildBackgroundStyle({ backgroundColor, backgroundImage, backgroundImageFit, backgroundGradient })

    // Ürünleri sayfalara böl (Builder modunda çoklu sayfa, Public modunda tek sayfa)
    const productChunks = []
    const safeProducts = products || []

    // Eğer hiç ürün yoksa en az bir boş sayfa oluştur
    if (safeProducts.length === 0) {
        productChunks.push([])
    } else {
        for (let i = 0; i < safeProducts.length; i += PRODUCTS_PER_PAGE) {
            productChunks.push(safeProducts.slice(i, i + PRODUCTS_PER_PAGE))
        }
    }

    return (
        <div className="flex flex-col gap-8 w-full">
            {productChunks.map((pageProducts, pageIndex) => {
                // Sayfa numarası hesaplama:
                // Eğer builder/preview modundaysak (ürün sayısı > 4), sayfa numaralarını kendimiz üretiyoruz.
                // Eğer public modundaysak (tek sayfa render ediliyor), prop'tan gelen numarayı kullanıyoruz.
                const isBuilderMode = safeProducts.length > PRODUCTS_PER_PAGE

                const currentPage = isBuilderMode ? pageIndex + 1 : pageNumber
                const totalPageCount = isBuilderMode ? productChunks.length : _totalPages

                return (
                    <div key={pageIndex} className="h-[1123px] w-full flex flex-col overflow-hidden selection:bg-[#f0f0f0] relative shadow-sm transition-colors" style={{ ...containerStyle, backgroundColor: containerStyle.backgroundColor || '#ffffff', color: headerTextColor || '#1a1a1a' }}>
                        {/* Header - Delicate and Precise */}
                        <header className="shrink-0 px-12 transition-colors border-b" style={{ height: HEADER_HEIGHT, borderColor: headerTextColor ? `${headerTextColor}20` : '#f0f0f0' }}>
                            <div className="flex-1 flex items-center justify-between relative w-full h-full">
                                {/* Sol Alan */}
                                <div className="flex-1 flex items-center justify-start min-w-0 z-10 gap-6">
                                    {isCollisionLeft ? (
                                        <div className="flex flex-col gap-2 items-start">
                                            {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                                <NextImage src={logoUrl} alt="Logo" width={110} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                            )}
                                            <h1 className="text-sm font-light tracking-[0.5em] uppercase truncate">{catalogName || "MINIMAL"}</h1>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-6">
                                            {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                                <NextImage src={logoUrl} alt="Logo" width={110} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                            )}
                                            {titlePosition === 'left' && (
                                                <h1 className="text-sm font-light tracking-[0.5em] uppercase truncate">{catalogName || "MINIMAL"}</h1>
                                            )}
                                        </div>
                                    )}
                                    {!isHeaderLogo && titlePosition !== 'left' && (
                                        <span className="text-[10px] tracking-[0.4em] uppercase whitespace-nowrap opacity-40">COLLECTION</span>
                                    )}
                                </div>

                                {/* Orta Alan */}
                                <div className="flex-1 flex items-center justify-center min-w-0 z-10 gap-6">
                                    {isCollisionCenter ? (
                                        <div className="flex flex-col gap-2 items-center text-center">
                                            {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                                <NextImage src={logoUrl} alt="Logo" width={110} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                            )}
                                            <h1 className="text-sm font-light tracking-[0.5em] uppercase truncate">{catalogName || "MINIMAL"}</h1>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-6 text-center">
                                            {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                                <NextImage src={logoUrl} alt="Logo" width={110} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                            )}
                                            {titlePosition === 'center' && (
                                                <h1 className="text-sm font-light tracking-[0.5em] uppercase truncate">{catalogName || "MINIMAL"}</h1>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Sağ Alan */}
                                <div className="flex-1 flex items-center justify-end min-w-0 z-10 gap-6 text-right">
                                    {isCollisionRight ? (
                                        <div className="flex flex-col gap-2 items-end">
                                            <span className="text-[10px] font-mono opacity-60">P.{currentPage.toString().padStart(2, '0')}</span>
                                            {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                                <NextImage src={logoUrl} alt="Logo" width={110} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                            )}
                                            <h1 className="text-sm font-light tracking-[0.5em] uppercase truncate">{catalogName || "MINIMAL"}</h1>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-6 flex-row-reverse text-right">
                                            <span className="text-[10px] font-mono opacity-60">P.{currentPage.toString().padStart(2, '0')}</span>
                                            {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                                <NextImage src={logoUrl} alt="Logo" width={110} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                            )}
                                            {titlePosition === 'right' && (
                                                <h1 className="text-sm font-light tracking-[0.5em] uppercase truncate">{catalogName || "MINIMAL"}</h1>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </header>

                        {/* Grid - Flexible 2x2 Layout */}
                        <div className="flex-1 px-12 grid grid-cols-2 gap-x-12 gap-y-12 overflow-hidden py-10 content-start">
                            {pageProducts.map((product) => {
                                const productUrl = sanitizeHref(product.product_url)
                                return (
                                    <div key={product.id} className="flex flex-col relative w-full aspect-[3/4] group">
                                        {/* Product Image - Fixed Proportion */}
                                        <div className="relative flex-1 mb-6 bg-[#fafafa] flex items-center justify-center transition-all duration-1000 group-hover:bg-[#f2f2f2]">
                                            <div className="absolute inset-8">
                                                <ProductImageGallery
                                                    product={product}
                                                    imageFit={productImageFit}
                                                    className="w-full h-full"
                                                    imageClassName={cn(
                                                        "mix-blend-multiply opacity-90 group-hover:opacity-100 group-hover:scale-[1.05] transition-all duration-[1.5s]"
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {/* Product Info - Precise Typography */}
                                        <div className="shrink-0 pb-4 relative">
                                            <div className="flex justify-between items-baseline mb-2">
                                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#1a1a1a] truncate flex-1">
                                                    {product.name}
                                                </h3>
                                                {showPrices && (
                                                    <div className="text-xs font-medium text-[#1a1a1a] ml-4">
                                                        {formatProductPrice(product)}
                                                    </div>
                                                )}
                                            </div>

                                            {showDescriptions && product.description && (
                                                <p className="text-[10px] font-medium text-[#777] leading-relaxed line-clamp-2 mb-4">
                                                    {product.description}
                                                </p>
                                            )}

                                            {_showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                                <div className="flex flex-wrap gap-4 pt-4 border-t border-[#f0f0f0] pb-8">
                                                    {product.custom_attributes.filter((a: CustomAttribute) => a.name !== 'currency' && a.value).slice(0, 3).map((attr: CustomAttribute, idx: number) => (
                                                        <div key={idx} className="flex flex-col gap-0.5">
                                                            <span className="text-[7px] font-black uppercase tracking-tighter text-[#bbb]">{attr.name}</span>
                                                            <span className="text-[9px] font-bold text-[#444] whitespace-nowrap">{attr.value}{attr.unit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Buy Button - Fixed to bottom right */}
                                            {(showUrls && productUrl) && (
                                                <a
                                                    href={productUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm hover:bg-black hover:text-white transition-all duration-300"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <ShoppingBag className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Footer - Minimal */}
                        <div className="shrink-0 flex items-center justify-center transition-colors" style={{ height: FOOTER_HEIGHT }}>
                            <div className="flex items-center gap-10">
                                <div className="w-12 h-[1px]" style={{ backgroundColor: headerTextColor ? `${headerTextColor}20` : '#f0f0f0' }} />
                                <span className="text-[9px] tracking-[0.5em] uppercase opacity-40">
                                    {currentPage} / {totalPageCount}
                                </span>
                                <div className="w-12 h-[1px]" style={{ backgroundColor: headerTextColor ? `${headerTextColor}20` : '#f0f0f0' }} />
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
})
