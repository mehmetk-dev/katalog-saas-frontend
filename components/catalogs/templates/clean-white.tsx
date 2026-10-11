import React from "react"
import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"
import { sanitizeHref, formatProductPrice, buildBackgroundStyle, getStandardLogoHeight, ensureReadable, approximateSurfaceColor, readableAccent, isLightColor } from "./utils"
import { HeaderSlots } from "./header-slots"

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

    // Başlık ve alt bilgi sayfa zemini üzerinde: seçilen yazı rengi okunmuyorsa siyah/beyaza çekilir
    const textColor = ensureReadable(headerTextColor, approximateSurfaceColor({ backgroundColor, backgroundGradient, backgroundImage }))

    const logoHeight = getStandardLogoHeight(logoSize)

    const containerStyle = buildBackgroundStyle({ backgroundColor, backgroundImage, backgroundImageFit, backgroundGradient })



    // Fiyat/ikon vurgusu sayfa zemini üzerinde: kart rengi okunmuyorsa aynı tonda koyulaştırılır
    const accentColor = readableAccent(primaryColor, approximateSurfaceColor({ backgroundColor, backgroundGradient, backgroundImage }))

    // Koyu sayfa zemininde ürün metinleri açık tona çevrilir (globals.css → .catalog-on-dark)
    const onDarkSurface = !isLightColor(approximateSurfaceColor({ backgroundColor, backgroundGradient, backgroundImage }))

    return (
        <div className={`${onDarkSurface ? "catalog-on-dark " : ""}bg-transparent h-full flex flex-col overflow-hidden transition-colors`} style={{ ...containerStyle, backgroundColor: containerStyle.backgroundColor || '#ffffff' }}>
            {/* Minimal Header */}
            <header className="h-20 px-12 flex items-end pb-4 shrink-0 relative z-10 transition-colors" style={{ color: textColor }}>
                <HeaderSlots
                    align="end"
                    gapClassName="gap-6"
                    logoPosition={logoPosition}
                    titlePosition={titlePosition}
                    logo={logoUrl ? <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} /> : null}
                    title={<h1 className="truncate text-lg font-medium tracking-tight">{catalogName}</h1>}
                    aside={pageNumber > 1 ? <span className="text-xs font-medium opacity-50">{pageNumber}</span> : null}
                />
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
                            <div className="relative mb-3 min-h-0 flex-1 overflow-hidden rounded-xl bg-gray-50">
                                <ProductImageGallery
                                    product={product}
                                    imageFit={productImageFit}
                                    className="w-full h-full"
                                    imageClassName="p-3 group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <div className="relative flex shrink-0 flex-col overflow-hidden">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-gray-600 transition-colors leading-tight flex-1">{product.name}</h3>
                                        {showPrices && (
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="font-bold text-sm leading-tight" style={{ color: accentColor }}>
                                                    {formatProductPrice(product)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {showDescriptions && product.description && (
                                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-snug">{product.description}</p>
                                    )}

                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                        <div className="mt-2 space-y-0.5 border-t border-gray-100 pt-2">
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 3).map((attr, aidx) => (
                                                <div key={aidx} className="flex justify-between items-center text-[9px] gap-2">
                                                    <span className="text-gray-400 font-medium truncate flex-1">{attr.name}</span>
                                                    <span className="text-gray-500 font-bold shrink-0 truncate max-w-[60%]">
                                                        {attr.value}{attr.unit}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {showSku && product.sku && (
                                    <div className="pt-1.5">
                                        <span className="text-[9px] text-gray-400 font-mono tracking-wider leading-none uppercase">SKU: {product.sku}</span>
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
            <div className="h-12 px-12 flex items-center justify-between border-t border-black/5 shrink-0 transition-colors" style={{ color: textColor }}>
                <span className="text-[9px] opacity-60 font-medium tracking-widest uppercase">{catalogName}</span>
                <span className="text-xs opacity-80 font-bold px-3 py-1 rounded-full border border-black/10">{pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
})
