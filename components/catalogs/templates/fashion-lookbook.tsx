import React from "react"
import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"
import { cn } from "@/lib/utils"
import { buildBackgroundStyle, sanitizeHref, formatProductPrice, getStandardLogoHeight, ensureReadable, approximateSurfaceColor } from "./utils"
import { HeaderSlots } from "./header-slots"

/**
 * Fashion Lookbook Template - "The Couture Editorial"
 * A high-end, asymmetrical layout designed for fashion, lifestyle, and art catalogs.
 * Features: Overlapping elements, vertical typography, and a magazine-like structure.
 */
export const FashionLookbookTemplate = React.memo(function FashionLookbookTemplate({
    catalogName,
    products,
    primaryColor = "#000000",
    showPrices,
    showDescriptions,
    showAttributes: _showAttributes,
    showSku,
    showUrls = false,
    pageNumber = 1,
    totalPages = 1,
    logoUrl,
    logoPosition,
    logoSize,
    titlePosition = 'left',
    productImageFit = 'cover',
    // New Props for Customization
    backgroundColor,
    backgroundImage,
    backgroundImageFit,
    backgroundGradient,
    headerTextColor = '#000000',
}: TemplateProps) {
    const safeProducts = products || []
    const [hero, ...others] = safeProducts


    const logoHeight = getStandardLogoHeight(logoSize)

    // Arka plan stili oluştur
    const containerStyle: React.CSSProperties = {
        ...buildBackgroundStyle({ backgroundColor, backgroundImage, backgroundImageFit, backgroundGradient }),
        borderLeftColor: primaryColor,
    }

    // Yazı sayfa zemini üzerinde: seçilen renk okunmuyorsa siyah/beyaza çekilir
    const textColor = ensureReadable(headerTextColor || '#000000', approximateSurfaceColor({ backgroundColor, backgroundGradient, backgroundImage }))

    return (
        <div className="h-full flex border-l-[40px] relative overflow-hidden selection:bg-black selection:text-white transition-colors" style={containerStyle}>
            {/* Side Page Indicator - Vertical */}
            <div className="absolute left-[-30px] top-0 h-full flex items-center justify-center pointer-events-none">
                <span className="rotate-[-90deg] text-white text-[10px] font-black tracking-[1em] uppercase whitespace-nowrap opacity-50">
                    {catalogName} • PAGE {pageNumber.toString().padStart(2, '0')}
                </span>
            </div>

            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20" style={{ backgroundColor: primaryColor }} />
            <div
                className={cn(
                    "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%]",
                    "rounded-full blur-[120px] opacity-[0.15]"
                )}
                style={{ backgroundColor: primaryColor }}
            />
            <div className="flex-1 flex flex-col p-10 pr-14 relative z-10 w-full transition-colors" style={{ color: textColor }}>
                {/* Editorial Header */}
                <header className="mb-12 flex items-end justify-between border-b-2 pb-6 min-h-[100px] transition-colors relative" style={{ borderColor: `${textColor}10` }}>
                    <HeaderSlots
                        align="end"
                        gapClassName="gap-6"
                        logoPosition={logoPosition}
                        titlePosition={titlePosition}
                        logo={logoUrl ? <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} /> : null}
                        title={<h1 className="line-clamp-2 font-serif text-4xl italic leading-none tracking-tighter">{catalogName || "The Look"}</h1>}
                    />
                    {/* Big absolute page number */}
                    <span
                        className="text-[120px] font-serif italic leading-none absolute top-[-50px] right-2 pointer-events-none opacity-[0.03]"
                    >
                        {String(pageNumber).padStart(2, '0')}
                    </span>
                </header>

                {/* The Asymmetrical Grid */}
                <div className="flex-1 flex gap-12 overflow-hidden">
                    {/* Left: Big Hero Product */}
                    <div className="w-[55%] flex flex-col relative shrink-0">
                        {hero && (
                            <div className="h-full flex flex-col group">
                                <div className="flex-1 relative bg-[#f5f5f5] overflow-hidden">
                                    <ProductImageGallery
                                        product={hero}
                                        imageFit={productImageFit}
                                        className="w-full h-full"
                                        imageClassName="group-hover:scale-105 transition-all duration-[2s]"
                                    />
                                    {/* Overlay label */}
                                    <div className={cn(
                                        "absolute top-6 right-[-20px] rotate-90 origin-center",
                                        "bg-black text-white px-4 py-1",
                                        "text-[10px] font-bold tracking-[0.3em] uppercase"
                                    )}>
                                        FEATURED PIECE
                                    </div>

                                    {(showUrls && sanitizeHref(hero.product_url)) && (
                                        <a
                                            href={sanitizeHref(hero.product_url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                                "absolute bottom-6 left-6 w-10 h-10",
                                                "bg-white/20 backdrop-blur-md border border-white/40",
                                                "flex items-center justify-center rounded-full",
                                                "hover:bg-white hover:text-black transition-all"
                                            )}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                                <div className="mt-6">
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-2xl font-serif italic line-clamp-1" style={{ color: textColor }}>{hero.name}</h2>
                                        {showPrices && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl font-light" style={{ color: `${textColor}99` }}>
                                                    {formatProductPrice(hero)}
                                                </span>
                                                {showUrls && hero.product_url && (
                                                    <ShoppingBag className="w-5 h-5" style={{ color: `${textColor}33` }} />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {showDescriptions && hero.description && (
                                        <p className="text-[11px] leading-relaxed mt-2 italic font-serif" style={{ color: `${textColor}80` }}>
                                            {hero.description}
                                        </p>
                                    )}
                                    {showSku && hero.sku && (
                                        <p className="text-[9px] font-mono mt-3 uppercase tracking-tighter" style={{ color: `${textColor}33` }}>SKU_REF: {hero.sku}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Detailed Minimal Grid */}
                    <div className="w-[40%] flex flex-col justify-between overflow-hidden shrink-0 h-full py-2">
                        {others.slice(0, 4).map((product, idx) => {
                            const productUrl = sanitizeHref(product.product_url)
                            const Wrapper = (showUrls && productUrl) ? 'a' : 'div'

                            return (
                                <Wrapper
                                    key={product.id}
                                    {...(showUrls && productUrl ? { href: productUrl, target: '_blank', rel: 'noopener noreferrer' } : {})}
                                    className={cn(
                                        "flex gap-4 group cursor-pointer flex-1",
                                        "items-center border-b last:border-0"
                                    )}
                                    style={{ borderColor: `${textColor}10` }}
                                >
                                    <div className="w-[80px] h-[100px] relative bg-[#f5f5f5] shrink-0 overflow-hidden">
                                        <ProductImageGallery
                                            product={product}
                                            imageFit={productImageFit}
                                            className="w-full h-full"
                                            imageClassName="group-hover:scale-110 transition-all duration-1000 grayscale group-hover:grayscale-0"
                                            showNavigation={false}
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center flex-1 min-w-0">
                                        <div className="text-[8px] font-bold tracking-[0.2em] mb-1 uppercase truncate" style={{ color: `${textColor}66` }}>
                                            {idx === 0 ? '01' : idx === 1 ? '02' : idx === 2 ? '03' : '04'}
                                        </div>
                                        <h3 className="text-sm font-serif italic mb-1 transition-colors truncate" style={{ color: textColor }}>
                                            {product.name}
                                        </h3>

                                        {showDescriptions && product.description && (
                                            <p
                                                className={cn(
                                                    "text-[9px] font-serif leading-tight",
                                                    "line-clamp-2 mb-2 pr-2"
                                                )}
                                                style={{ color: `${textColor}80` }}
                                            >
                                                {product.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 mt-auto">
                                            {showPrices && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-light" style={{ color: textColor }}>
                                                        {formatProductPrice(product)}
                                                    </span>
                                                    {showUrls && productUrl && (
                                                        <ShoppingBag className="w-3 h-3" style={{ color: `${textColor}33` }} />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Wrapper>
                            )
                        })}
                    </div>
                </div>

                {/* Creative Footer */}
                <div className="mt-12 flex items-center gap-8 pl-4">
                    <div className="text-[10px] font-black tracking-[0.3em] uppercase italic" style={{ color: textColor }}>
                        PAGE {pageNumber.toString().padStart(2, '0')}
                    </div>
                    <div className="h-[2px] flex-1 relative overflow-hidden" style={{ backgroundColor: `${textColor}1A` }}>
                        <div
                            className="absolute left-0 top-0 h-full transition-all duration-1000"
                            style={{ width: `${(pageNumber / totalPages) * 100}%`, backgroundColor: textColor }}
                        />
                    </div>
                    <div className="text-[10px] font-serif italic" style={{ color: `${textColor}4D` }}>
                        {catalogName} • Lookbook Archive
                    </div>
                </div>
            </div>
        </div>
    )
})
