import React from "react"
import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import type { CustomAttribute } from "@/lib/actions/products"
import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"
import { cn } from "@/lib/utils"
import { buildBackgroundStyle, sanitizeHref, formatProductPrice, getStandardLogoHeight, getHeaderLayout } from "./utils"

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

    const {
        isHeaderLogo,
        logoAlignment,
        isCollisionLeft,
        isCollisionCenter,
        isCollisionRight
    } = getHeaderLayout(logoPosition, titlePosition)

    const logoHeight = getStandardLogoHeight(logoSize)

    // Arka plan stili oluştur
    const containerStyle: React.CSSProperties = {
        ...buildBackgroundStyle({ backgroundColor, backgroundImage, backgroundImageFit, backgroundGradient }),
        borderLeftColor: primaryColor,
    }

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
            <div className="flex-1 flex flex-col p-10 pr-14 relative z-10 w-full transition-colors" style={{ color: headerTextColor }}>
                {/* Editorial Header */}
                <header className="mb-12 flex items-end justify-between border-b-2 pb-6 min-h-[100px] transition-colors relative" style={{ borderColor: headerTextColor ? `${headerTextColor}10` : 'rgba(0,0,0,0.05)' }}>
                    {/* Sol Alan */}
                    <div className="flex-1 flex flex-col items-start justify-end min-w-0 z-10 gap-4">
                        {isCollisionLeft ? (
                            <div className="flex flex-col gap-4 items-start">
                                {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                <h1 className="text-4xl font-serif italic tracking-tighter leading-none">{catalogName || "The Look"}</h1>
                            </div>
                        ) : (
                            <div className="flex items-end gap-6">
                                {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                    <div className="mb-1"><NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} /></div>
                                )}
                                {titlePosition === 'left' && (
                                    <h1 className="text-4xl font-serif italic tracking-tighter leading-none">{catalogName || "The Look"}</h1>
                                )}
                            </div>
                        )}
                        {!isHeaderLogo && titlePosition !== 'left' && (
                            <div className="text-[10px] uppercase tracking-[0.5em] font-medium whitespace-nowrap opacity-50 block mb-1 mt-auto pt-4">LOOKBOOK — VOL.{String(pageNumber).padStart(2, '0')}</div>
                        )}
                    </div>

                    {/* Orta Alan */}
                    <div className="flex-1 flex flex-col items-center justify-end min-w-0 z-10 gap-4">
                        {isCollisionCenter ? (
                            <div className="flex flex-col gap-4 items-center">
                                {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                <h1 className="text-4xl font-serif italic tracking-tighter leading-none">{catalogName || "The Look"}</h1>
                            </div>
                        ) : (
                            <div className="flex items-end gap-6 text-center">
                                {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                    <div className="mb-1"><NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} /></div>
                                )}
                                {titlePosition === 'center' && (
                                    <h1 className="text-4xl font-serif italic tracking-tighter leading-none">{catalogName || "The Look"}</h1>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sağ Alan */}
                    <div className="flex-1 flex flex-col items-end justify-end min-w-0 z-10 gap-4 text-right">
                        {isCollisionRight ? (
                            <div className="flex flex-col gap-4 items-end">
                                {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                <h1 className="text-4xl font-serif italic tracking-tighter leading-none">{catalogName || "The Look"}</h1>
                            </div>
                        ) : (
                            <div className="flex items-end gap-6 flex-row-reverse text-right">
                                {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                    <div className="mb-1"><NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} /></div>
                                )}
                                {titlePosition === 'right' && (
                                    <div className="flex flex-col items-end">
                                        <h1 className="text-4xl font-serif italic tracking-tighter leading-none">{catalogName || "The Look"}</h1>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

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
                                        <h2 className="text-2xl font-serif italic line-clamp-1" style={{ color: headerTextColor || '#000000' }}>{hero.name}</h2>
                                        {showPrices && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl font-light" style={{ color: headerTextColor ? `${headerTextColor}99` : 'rgba(0,0,0,0.6)' }}>
                                                    {formatProductPrice(hero)}
                                                </span>
                                                {showUrls && hero.product_url && (
                                                    <ShoppingBag className="w-5 h-5" style={{ color: headerTextColor ? `${headerTextColor}33` : 'rgba(0,0,0,0.2)' }} />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {showDescriptions && hero.description && (
                                        <p className="text-[11px] leading-relaxed mt-2 italic font-serif" style={{ color: headerTextColor ? `${headerTextColor}80` : 'rgba(0,0,0,0.5)' }}>
                                            {hero.description}
                                        </p>
                                    )}
                                    {showSku && hero.sku && (
                                        <p className="text-[9px] font-mono mt-3 uppercase tracking-tighter" style={{ color: headerTextColor ? `${headerTextColor}33` : 'rgba(0,0,0,0.2)' }}>SKU_REF: {hero.sku}</p>
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
                                    style={{ borderColor: headerTextColor ? `${headerTextColor}10` : 'rgba(0,0,0,0.05)' }}
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
                                        <div className="text-[8px] font-bold tracking-[0.2em] mb-1 uppercase truncate" style={{ color: headerTextColor ? `${headerTextColor}66` : 'rgba(0,0,0,0.4)' }}>
                                            {idx === 0 ? '01' : idx === 1 ? '02' : idx === 2 ? '03' : '04'}
                                        </div>
                                        <h3 className="text-sm font-serif italic mb-1 transition-colors truncate" style={{ color: headerTextColor || '#000000' }}>
                                            {product.name}
                                        </h3>

                                        {showDescriptions && product.description && (
                                            <p
                                                className={cn(
                                                    "text-[9px] font-serif leading-tight",
                                                    "line-clamp-2 mb-2 pr-2"
                                                )}
                                                style={{ color: headerTextColor ? `${headerTextColor}80` : 'rgba(0,0,0,0.5)' }}
                                            >
                                                {product.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 mt-auto">
                                            {showPrices && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-light" style={{ color: headerTextColor || '#000000' }}>
                                                        {formatProductPrice(product)}
                                                    </span>
                                                    {showUrls && productUrl && (
                                                        <ShoppingBag className="w-3 h-3" style={{ color: headerTextColor ? `${headerTextColor}33` : 'rgba(0,0,0,0.2)' }} />
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
                    <div className="text-[10px] font-black tracking-[0.3em] uppercase italic" style={{ color: headerTextColor || '#000000' }}>
                        PAGE {pageNumber.toString().padStart(2, '0')}
                    </div>
                    <div className="h-[2px] flex-1 relative overflow-hidden" style={{ backgroundColor: headerTextColor ? `${headerTextColor}1A` : 'rgba(0,0,0,0.1)' }}>
                        <div
                            className="absolute left-0 top-0 h-full transition-all duration-1000"
                            style={{ width: `${(pageNumber / totalPages) * 100}%`, backgroundColor: headerTextColor || '#000000' }}
                        />
                    </div>
                    <div className="text-[10px] font-serif italic" style={{ color: headerTextColor ? `${headerTextColor}4D` : 'rgba(0,0,0,0.3)' }}>
                        {catalogName} • Lookbook Archive
                    </div>
                </div>
            </div>
        </div>
    )
})
