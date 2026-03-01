import React from "react"
import NextImage from "next/image"
import { ExternalLink, ShoppingBag } from "lucide-react"
import { TemplateProps } from "./types"
import { cn } from "@/lib/utils"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"
import { buildBackgroundStyle, sanitizeHref, formatProductPrice, getStandardLogoHeight, getHeaderLayout } from "./utils"

export const MagazineTemplate = React.memo(function MagazineTemplate({
    catalogName,
    products,
    primaryColor,
    headerTextColor = '#020617', // slate-950 default
    showPrices,
    showDescriptions,
    showAttributes: _showAttributes,
    showSku: _showSku,
    showUrls = false,
    pageNumber = 1,
    totalPages: _totalPages = 1,
    columnsPerRow = 2,
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
}: TemplateProps) {
    const HEADER_HEIGHT = "120px"
    const safeProducts = products || []

    // Asimetrik yapı: İlk ürün HERO, diğerleri GRID
    const [heroProduct, ...gridProducts] = safeProducts

    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
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

    // Arka plan stili oluştur
    const containerStyle = buildBackgroundStyle({ backgroundColor, backgroundImage, backgroundImageFit, backgroundGradient })

    const borderColor = headerTextColor ? `${headerTextColor}20` : 'rgba(2, 6, 23, 0.1)' // slate-950/10

    const renderLogo = () => {
        if (!logoUrl || !isHeaderLogo) return null
        return (
            <div className="shrink-0 flex items-center">
                <NextImage
                    src={logoUrl}
                    alt="Logo"
                    width={160}
                    height={logoHeight}
                    className="object-contain max-h-14 w-auto"
                />
            </div>
        )
    }

    const renderTitle = (align: 'left' | 'center' | 'right') => (
        <div className={cn(
            "flex flex-col",
            align === 'center' ? "items-center" : align === 'right' ? "items-end" : "items-start"
        )}>
            <h1
                className="text-3xl font-black italic tracking-tighter leading-none uppercase"
                style={{ color: headerTextColor }}
            >
                {catalogName || "EDITORIAL"}
            </h1>
            <div className="flex items-center gap-3 mt-1">
                <span className="text-[11px] font-bold tracking-[0.5em] uppercase" style={{ color: headerTextColor ? `${headerTextColor}80` : '#64748b' }}>
                    Issue {new Date().getFullYear()} / {pageNumber}
                </span>
            </div>
        </div>
    )

    const renderSidebarInfo = (align: 'left' | 'right') => (
        <div className={`hidden lg:flex flex-col border-l pl-6 font-sans font-bold uppercase tracking-widest text-[9px] ${align === 'right' ? 'text-right border-l-0 border-r pr-6 pl-0' : 'text-left'}`} style={{ borderColor: borderColor, color: headerTextColor ? `${headerTextColor}66` : '#94a3b8' }}>
            <span>Autumn Winter</span>
            <span>Selection Portfolio</span>
        </div>
    )

    return (
        <div className="h-full flex flex-col relative overflow-hidden font-serif" style={containerStyle}>
            {/* Editorial Header - Adjusted Size & Alignment */}
            <header
                className="shrink-0 relative z-20 flex items-center px-10 border-b-2 transition-colors h-[120px]"
                style={{ borderColor: headerTextColor || '#020617', backgroundColor: primaryColor }}
            >
                {/* Sol Alan */}
                <div className="flex-1 flex items-center justify-start min-w-0 z-10 gap-8">
                    {/* Çarpışma varsa ikisini yan yana çiz */}
                    {isCollisionLeft ? (
                        <>
                            {renderLogo()}
                            {renderTitle('left')}
                        </>
                    ) : (
                        <>
                            {/* Yoksa kendi konumlarında olanları çiz */}
                            {logoAlignment === 'left' && renderLogo()}
                            {titlePosition === 'left' && renderTitle('left')}
                        </>
                    )}
                </div>

                {/* Orta Alan */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20 w-full max-w-[50%] gap-8">
                    {isCollisionCenter ? (
                        <>
                            {renderLogo()}
                            {renderTitle('center')}
                        </>
                    ) : (
                        <>
                            {logoAlignment === 'center' && renderLogo()}
                            {titlePosition === 'center' && renderTitle('center')}
                        </>
                    )}
                </div>

                {/* Sağ Alan */}
                <div className="flex-1 flex items-center justify-end min-w-0 z-10 gap-8">
                    {/* Sadece title sol ve ortadaysa sağda sidebar göster */}
                    {(titlePosition === 'left' || titlePosition === 'center') && !isCollisionRight && renderSidebarInfo('left')}

                    {isCollisionRight ? (
                        <>
                            {renderTitle('right')}
                            {renderLogo()}
                        </>
                    ) : (
                        <>
                            {titlePosition === 'right' && renderTitle('right')}
                            {logoAlignment === 'right' && renderLogo()}
                        </>
                    )}

                    {/* Title sağdaysa sidebar sola geçer */}
                    {titlePosition === 'right' && !isCollisionLeft && (
                        <div className="absolute left-10">{renderSidebarInfo('right')}</div>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden p-6 flex flex-col gap-6">

                {/* 1. HERO PRODUCT - BIG SHOT */}
                {heroProduct && (
                    <div className="relative h-[380px] w-full flex overflow-hidden group shadow-2xl">
                        {/* Huge Image */}
                        <div className="w-2/3 h-full relative overflow-hidden">
                            <ProductImageGallery
                                product={heroProduct}
                                imageFit={productImageFit}
                                className="w-full h-full"
                                imageClassName="transition-transform duration-[2000ms] group-hover:scale-110"
                            />
                            {/* Decorative Frame */}
                            <div className="absolute inset-4 border border-white/30 z-10" />
                        </div>

                        {/* Hero Info Sidebar */}
                        <div className="w-1/3 h-full bg-slate-950 text-white p-6 flex flex-col justify-between relative overflow-hidden">
                            {/* Texture background */}
                            <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none select-none text-[80px] font-black italic break-all leading-none py-10">
                                {heroProduct.name}
                            </div>

                            <div className="relative z-10">
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/40">Featured Item</span>
                                <h3 className="text-3xl font-black italic mt-2 uppercase leading-none truncate">{heroProduct.name}</h3>
                                {showDescriptions && heroProduct.description && (
                                    <p className="text-xs text-white/70 mt-4 leading-relaxed line-clamp-4 font-sans font-medium">
                                        {heroProduct.description}
                                    </p>
                                )}
                            </div>

                            <div className="relative z-10 border-t border-white/20 pt-6">
                                {showPrices && (
                                    <div className="flex items-center gap-3">
                                        <p className="text-3xl font-black italic tracking-tighter">
                                            {formatProductPrice(heroProduct)}
                                        </p>
                                        {showUrls && heroProduct.product_url && (
                                            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors">
                                                <ShoppingBag className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                )}
                                {showUrls && sanitizeHref(heroProduct.product_url) && (
                                    <a
                                        href={sanitizeHref(heroProduct.product_url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white hover:text-white/70 transition-colors"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        Discover Online
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. GRID PRODUCTS - SUPPORTING CAST */}
                {gridProducts.length > 0 && (
                    <div className={cn(
                        "grid flex-1 gap-6 overflow-hidden content-start",
                        getGridCols()
                    )}>
                        {gridProducts.map((product) => (
                            <div key={product.id} className="relative group flex flex-col h-[260px] overflow-hidden">
                                {/* Secondary Image - FIXED HEIGHT */}
                                <div className="relative h-[180px] overflow-hidden shadow-lg transition-transform duration-500 hover:translate-y-[-4px]">
                                    <ProductImageGallery
                                        product={product}
                                        imageFit={productImageFit}
                                        className="w-full h-full"
                                        imageClassName="transition-transform duration-700 group-hover:scale-110"
                                    />

                                    {/* Small URL Tab */}
                                    {showUrls && product.product_url && (
                                        <div className="absolute bottom-0 right-0 bg-white/90 backdrop-blur-sm p-2 text-slate-900 shadow-xl z-10">
                                            <ExternalLink className="w-3 h-3" />
                                        </div>
                                    )}

                                    {/* Price Tag Overlay */}
                                    {showPrices && (
                                        <div className="absolute top-2 left-2 px-2 py-1 text-[11px] font-black italic shadow-lg z-10 flex items-center gap-2 bg-slate-950 text-white">
                                            <span>
                                                {formatProductPrice(product)}
                                            </span>
                                            {showUrls && product.product_url && (
                                                <ShoppingBag className="w-3 h-3 opacity-70" />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Minimal Info */}
                                <div className="mt-3 overflow-hidden">
                                    <h4 className="font-black italic text-sm uppercase truncate text-slate-900">
                                        {product.name}
                                    </h4>
                                    {showDescriptions && product.description && (
                                        <p className="text-[10px] font-sans font-bold leading-tight line-clamp-2 mt-1 text-slate-500">
                                            {product.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Editorial Footer */}
            <footer className="h-10 px-10 flex items-center justify-between border-t shrink-0" style={{ borderColor: borderColor }}>
                <span className="text-[9px] font-bold uppercase tracking-[0.4em]" style={{ color: headerTextColor ? `${headerTextColor}4D` : '#cbd5e1' }}>
                    {catalogName} · Selection Portfolio · Edition {new Date().getFullYear()}
                </span>
                <div className="h-full w-[1px] mx-10" style={{ backgroundColor: borderColor }} />
                <span className="text-[11px] font-black italic tracking-[0.4em]" style={{ color: headerTextColor || '#020617' }}>{pageNumber}</span>
            </footer>
        </div>
    )
})
