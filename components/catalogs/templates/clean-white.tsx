import React from "react"
import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"
import { sanitizeHref, formatProductPrice, buildBackgroundStyle, getStandardLogoHeight, getHeaderLayout } from "./utils"

// Clean White - Temiz minimalist beyaz
export const CleanWhiteTemplate = React.memo(function CleanWhiteTemplate({
    catalogName,
    products,
    primaryColor,
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

    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
            case 4: return "grid-cols-4"
            default: return "grid-cols-2"
        }
    }

    const getGridRows = () => {
        return "grid-rows-3"
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
        <div className="bg-transparent h-full flex flex-col overflow-hidden transition-colors" style={{ ...containerStyle, backgroundColor: containerStyle.backgroundColor || '#ffffff' }}>
            {/* Minimal Header */}
            <header className="h-20 px-12 flex items-end pb-4 shrink-0 relative z-10 transition-colors" style={{ color: headerTextColor }}>
                <div className="flex-1 flex items-end justify-between relative w-full h-full">
                    {/* Sol Alan */}
                    <div className="flex-1 flex items-end justify-start min-w-0 z-10 gap-6">
                        {isCollisionLeft ? (
                            <div className="flex flex-col gap-3 items-start">
                                {logoAlignment === 'left' && isHeaderLogo && logoUrl ? (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                ) : (logoAlignment === 'left' && isHeaderLogo && !logoUrl && (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor }}><span className="text-white text-xs font-medium">{(catalogName || "K")[0]}</span></div>
                                ))}
                                <h1 className="text-lg font-medium tracking-tight truncate">{catalogName}</h1>
                            </div>
                        ) : (
                            <div className="flex items-end gap-6">
                                {logoAlignment === 'left' && isHeaderLogo && logoUrl ? (
                                    <div className="mb-1"><NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} /></div>
                                ) : (logoAlignment === 'left' && isHeaderLogo && !logoUrl && (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1" style={{ backgroundColor: primaryColor }}><span className="text-white text-xs font-medium">{(catalogName || "K")[0]}</span></div>
                                ))}
                                {titlePosition === 'left' && (
                                    <h1 className="text-lg font-medium tracking-tight truncate">{catalogName}</h1>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Orta Alan */}
                    <div className="flex-1 flex items-end justify-center min-w-0 z-10 gap-6">
                        {isCollisionCenter ? (
                            <div className="flex flex-col gap-3 items-center">
                                {logoAlignment === 'center' && isHeaderLogo && logoUrl ? (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                ) : (logoAlignment === 'center' && isHeaderLogo && !logoUrl && (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor }}><span className="text-white text-xs font-medium">{(catalogName || "K")[0]}</span></div>
                                ))}
                                <h1 className="text-lg font-medium tracking-tight truncate">{catalogName}</h1>
                            </div>
                        ) : (
                            <div className="flex items-end gap-6 text-center">
                                {logoAlignment === 'center' && isHeaderLogo && logoUrl ? (
                                    <div className="mb-1"><NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} /></div>
                                ) : (logoAlignment === 'center' && isHeaderLogo && !logoUrl && (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1" style={{ backgroundColor: primaryColor }}><span className="text-white text-xs font-medium">{(catalogName || "K")[0]}</span></div>
                                ))}
                                {titlePosition === 'center' && (
                                    <h1 className="text-lg font-medium tracking-tight truncate">{catalogName}</h1>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sağ Alan */}
                    <div className="flex-1 flex items-end justify-end min-w-0 z-10 gap-6 text-right">
                        {isCollisionRight ? (
                            <div className="flex flex-col gap-3 items-end">
                                {logoAlignment === 'right' && isHeaderLogo && logoUrl ? (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                ) : (logoAlignment === 'right' && isHeaderLogo && !logoUrl && (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor }}><span className="text-white text-xs font-medium">{(catalogName || "K")[0]}</span></div>
                                ))}
                                <h1 className="text-lg font-medium tracking-tight truncate">{catalogName}</h1>
                                {pageNumber > 1 && <span className="font-medium opacity-50 text-xs">{pageNumber}</span>}
                            </div>
                        ) : (
                            <div className="flex items-end gap-6 flex-row-reverse text-right">
                                {logoAlignment === 'right' && isHeaderLogo && logoUrl ? (
                                    <div className="mb-1"><NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} /></div>
                                ) : (logoAlignment === 'right' && isHeaderLogo && !logoUrl && (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1" style={{ backgroundColor: primaryColor }}><span className="text-white text-xs font-medium">{(catalogName || "K")[0]}</span></div>
                                ))}
                                {titlePosition === 'right' && (
                                    <div className="flex flex-col items-end">
                                        <h1 className="text-lg font-medium tracking-tight truncate">{catalogName}</h1>
                                        {pageNumber > 1 && <span className="font-medium opacity-50 text-xs mt-1">{pageNumber}</span>}
                                    </div>
                                )}
                                {titlePosition !== 'right' && logoAlignment !== 'right' && pageNumber > 1 && (
                                    <div className="flex flex-col items-end">
                                        <span className="font-medium opacity-50 text-xs mt-1">{pageNumber}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Çok temiz Dinamik grid */}
            <div className={`flex-1 px-12 py-6 grid ${getGridCols()} ${getGridRows()} gap-x-8 gap-y-6 overflow-hidden`} style={{ maxHeight: 'calc(100% - 112px)' }}>
                {safeProducts.map((product) => {
                    const productUrl = sanitizeHref(product.product_url)
                    const _Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const _wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'flex flex-col h-full group cursor-pointer shrink-0'
                    } : {
                        className: 'flex flex-col h-full shrink-0'
                    }

                    return (
                        <div key={product.id} className="flex flex-col h-full group shrink-0 relative">
                            <div className="aspect-[3/2] bg-gray-50 rounded-xl overflow-hidden mb-3 relative shrink-0">
                                <ProductImageGallery
                                    product={product}
                                    imageFit="contain"
                                    className="w-full h-full"
                                    imageClassName="p-2 group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-gray-600 transition-colors leading-tight flex-1">{product.name}</h3>
                                        {showPrices && (
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="font-bold text-sm leading-tight" style={{ color: primaryColor }}>
                                                    {formatProductPrice(product)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {showDescriptions && product.description && (
                                        <p className="text-[10px] text-gray-400 line-clamp-1 leading-tight">{product.description}</p>
                                    )}

                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                        <div className="mt-2 space-y-0.5 border-t border-gray-50 pt-2 pb-6">
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 3).map((attr, aidx) => (
                                                <div key={aidx} className="flex justify-between items-center text-[9px] gap-2">
                                                    <span className="text-gray-300 font-medium truncate flex-1">{attr.name}</span>
                                                    <span className="text-gray-500 font-bold shrink-0 truncate max-w-[60%]">
                                                        {attr.value}{attr.unit}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {showSku && product.sku && (
                                    <div className="mt-auto pt-2">
                                        <span className="text-[8px] text-gray-200 font-mono tracking-widest leading-none uppercase">SKU: {product.sku}</span>
                                    </div>
                                )}

                                {/* Buy Button - Fixed to bottom right of info area */}
                                {showUrls && productUrl && (
                                    <a
                                        href={productUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center bg-gray-50 hover:bg-black hover:text-white border border-gray-100 transition-all duration-300"
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

            {/* Footer */}
            <div className="h-12 px-12 flex items-center justify-between border-t border-black/5 shrink-0 transition-colors" style={{ color: headerTextColor }}>
                <span className="text-[9px] opacity-60 font-medium tracking-widest uppercase">{catalogName}</span>
                <span className="text-xs opacity-80 font-bold px-3 py-1 rounded-full border border-black/10">{pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
})
