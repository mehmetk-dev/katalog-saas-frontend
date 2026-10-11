import React from "react"
import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"
import { buildBackgroundStyle, sanitizeHref, formatProductPrice, getStandardLogoHeight, ensureReadable, approximateSurfaceColor, readableAccent } from "./utils"
import { HeaderSlots } from "./header-slots"

/**
 * Retail Template - "The High-Street Gallery"
 * A high-impact, modern retail design inspired by street fashion and boutique storefronts.
 * Features: Massive headers, bold typography, card-based layout with sharp shadows.
 */
export const RetailTemplate = React.memo(function RetailTemplate({
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
    const safeProducts = products || []

    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
            case 4: return "grid-cols-4"
            default: return "grid-cols-2"
        }
    }


    const logoHeight = getStandardLogoHeight(logoSize)

    const containerStyle = buildBackgroundStyle({ backgroundColor, backgroundImage, backgroundImageFit, backgroundGradient })

    // Yazı sayfa zemini üzerinde: seçilen renk okunmuyorsa siyah/beyaza çekilir
    const textColor = ensureReadable(headerTextColor || '#000000', approximateSurfaceColor({ backgroundColor, backgroundGradient, backgroundImage }))

    const renderTitleBlock = () => (
        <div>
            <h1 className="line-clamp-2 text-4xl font-[900] uppercase leading-none tracking-tighter" style={{ color: textColor }}>
                {catalogName || "COLLECTION_2026"}
            </h1>
            <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 tracking-widest uppercase">
                    Season Lookbook
                </span>
                <div className="h-[1px] w-12 bg-black/10" />
            </div>
        </div>
    )

    // Fiyat/ikon vurgusu beyaz ürün kartı üzerinde: kart rengi okunmuyorsa aynı tonda koyulaştırılır
    const accentColor = readableAccent(primaryColor, '#ffffff')

    return (
        <div className="h-full flex flex-col relative overflow-hidden selection:bg-black selection:text-white transition-colors" style={{ ...containerStyle, backgroundColor: containerStyle.backgroundColor || '#ffffff' }}>
            {/* Top Fashion Strip */}
            <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: primaryColor }} />

            {/* Header - High Impact */}
            <header className="h-32 px-12 flex items-center justify-between shrink-0 z-10 transition-colors" style={{ backgroundColor: primaryColor ? `${primaryColor}10` : 'transparent' }}>
                <HeaderSlots
                    gapClassName="gap-6"
                    logoPosition={logoPosition}
                    titlePosition={titlePosition}
                    logo={logoUrl ? <NextImage src={logoUrl} alt="Logo" width={120} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} /> : null}
                    title={renderTitleBlock()}
                    aside={<div className="whitespace-nowrap border-2 px-3 py-1 text-[11px] font-bold italic" style={{ borderColor: textColor, color: textColor }}>PAGE_{pageNumber.toString().padStart(2, '0')} OF {totalPages.toString().padStart(2, '0')}</div>}
                />
            </header>

            {/* Retail Grid - Sophisticated Cards */}
            <div className={`flex-1 px-10 pb-10 grid ${getGridCols()} grid-rows-3 gap-8 overflow-hidden z-10`}>
                {safeProducts.map((product) => {
                    const productUrl = sanitizeHref(product.product_url)
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
                                    imageFit={productImageFit}
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
                                            <span className="text-lg font-[900] tracking-tighter" style={{ color: accentColor }}>
                                                {formatProductPrice(product)}
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
            <div className="h-16 px-12 border-t flex items-center justify-between shrink-0 transition-colors z-10" style={{ backgroundColor: primaryColor ? `${primaryColor}10` : 'transparent', borderColor: `${textColor}20` }}>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: textColor }}>
                    <span className="w-12 h-0.5 bg-black" style={{ backgroundColor: primaryColor || '#000000' }} />
                    <span>Archive Edition</span>
                </div>
                <div className="text-[10px] font-bold opacity-60" style={{ color: textColor }}>
                    © {new Date().getFullYear()} {catalogName?.toUpperCase()}
                </div>
            </div>
        </div>
    )
})
