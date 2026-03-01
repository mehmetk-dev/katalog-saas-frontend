import React from "react"
import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"
import { buildBackgroundStyle, sanitizeHref, formatProductPrice, getStandardLogoHeight, getHeaderLayout } from "./utils"

/**
 * Tech Modern Template - "The Kinetic HUD"
 * A futuristic, high-tech design perfect for electronics, software, or automotive catalogs.
 * Features: Dark mode, neon accents, scanline effects, and precise UI-style borders.
 */
export const TechModernTemplate = React.memo(function TechModernTemplate({
    catalogName,
    products,
    primaryColor = "#3b82f6", // Default blue neon
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
    headerTextColor = '#ffffff',
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

    const {
        isHeaderLogo,
        logoAlignment,
        isCollisionLeft,
        isCollisionCenter,
        isCollisionRight
    } = getHeaderLayout(logoPosition, titlePosition)

    const logoHeight = getStandardLogoHeight(logoSize)

    const containerStyle = buildBackgroundStyle({ backgroundColor, backgroundImage, backgroundImageFit, backgroundGradient })

    const renderTitleBlock = () => (
        <div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none flex items-center gap-3">
                <span className="w-1 h-5" style={{ backgroundColor: primaryColor || '#3b82f6' }} />
                <span style={{ color: headerTextColor || '#ffffff' }}>{catalogName || "SYSTEM_CATALOG"}</span>
            </h1>
            <p className="text-[9px] font-mono tracking-[0.3em] mt-1" style={{ color: headerTextColor ? `${headerTextColor}4d` : '#ffffff4d' }}>STATUS: OPERATIONAL_V2.0</p>
        </div>
    )

    return (
        <div className="h-full bg-[#05070a] text-[#e2e8f0] flex flex-col relative overflow-hidden selection:bg-blue-500 selection:text-white transition-colors" style={{ ...containerStyle, backgroundColor: containerStyle.backgroundColor || '#05070a' }}>
            {/* Scanline Effect Layer */}
            <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03]"
                style={{ backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))", backgroundSize: "100% 2px, 3px 100%" }} />

            {/* HUD Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 opacity-30 z-20" style={{ borderColor: primaryColor }} />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 opacity-30 z-20" style={{ borderColor: primaryColor }} />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 opacity-30 z-20" style={{ borderColor: primaryColor }} />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 opacity-30 z-20" style={{ borderColor: primaryColor }} />

            {/* Header */}
            <header className="h-20 px-8 flex items-center shrink-0 z-20 border-b bg-[#0a0f18]/80 backdrop-blur-sm transition-colors" style={{ borderColor: headerTextColor ? `${headerTextColor}1a` : '#ffffff1a' }}>
                {/* Sol Alan */}
                <div className="flex-1 flex items-center justify-start min-w-0 gap-8">
                    {isCollisionLeft ? (
                        <div className="flex items-center gap-6">
                            {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                <NextImage src={logoUrl} alt="Logo" width={120} height={logoHeight} className="object-contain filter brightness-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" style={{ maxHeight: logoHeight }} />
                            )}
                            {renderTitleBlock()}
                        </div>
                    ) : (
                        <div className="flex items-center gap-6">
                            {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                <NextImage src={logoUrl} alt="Logo" width={120} height={logoHeight} className="object-contain filter brightness-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" style={{ maxHeight: logoHeight }} />
                            )}
                            {titlePosition === 'left' && renderTitleBlock()}
                        </div>
                    )}
                </div>

                {/* Orta Alan */}
                <div className="flex-1 flex items-center justify-center min-w-0 gap-8 text-center">
                    {isCollisionCenter ? (
                        <div className="flex items-center gap-4">
                            {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                <NextImage src={logoUrl} alt="Logo" width={120} height={logoHeight} className="object-contain filter brightness-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" style={{ maxHeight: logoHeight }} />
                            )}
                            {renderTitleBlock()}
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 text-center">
                            {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                <NextImage src={logoUrl} alt="Logo" width={120} height={logoHeight} className="object-contain filter brightness-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" style={{ maxHeight: logoHeight }} />
                            )}
                            {titlePosition === 'center' && renderTitleBlock()}
                        </div>
                    )}
                </div>

                {/* Sağ Alan */}
                <div className="flex-1 flex items-center justify-end min-w-0 gap-6 text-right relative">
                    {isCollisionRight ? (
                        <div className="flex items-center gap-6 flex-row-reverse text-right">
                            {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                <NextImage src={logoUrl} alt="Logo" width={120} height={logoHeight} className="object-contain filter brightness-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" style={{ maxHeight: logoHeight }} />
                            )}
                            {renderTitleBlock()}
                        </div>
                    ) : (
                        <div className="flex items-center gap-6 flex-row-reverse text-right">
                            {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                <NextImage src={logoUrl} alt="Logo" width={120} height={logoHeight} className="object-contain filter brightness-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" style={{ maxHeight: logoHeight }} />
                            )}
                            {titlePosition === 'right' && renderTitleBlock()}
                        </div>
                    )}

                    <div className="flex flex-col items-end font-mono ml-6 pl-6 border-l" style={{ borderColor: headerTextColor ? `${headerTextColor}20` : '#ffffff1a' }}>
                        <div className="text-[10px] tracking-widest flex items-center gap-2" style={{ color: headerTextColor ? `${headerTextColor}66` : '#ffffff66' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            SECURE_SERVER_LINKED
                        </div>
                        <div className="text-xs font-bold mt-1" style={{ color: primaryColor }}>
                            PAGE::{pageNumber.toString().padStart(3, '0')}
                        </div>
                    </div>
                </div>
            </header>

            {/* Grid */}
            <div className={`flex-1 p-8 grid ${getGridCols()} grid-rows-3 gap-6 overflow-hidden z-20`}>
                {safeProducts.map((product) => {
                    const productUrl = sanitizeHref(product.product_url)
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'group h-full flex flex-col bg-[#0d141f] border border-white/5 hover:border-blue-500/50 transition-all duration-300 relative rounded-sm cursor-pointer'
                    } : {
                        className: 'h-full flex flex-col bg-[#0d141f] border border-white/5 relative rounded-sm'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as React.AllHTMLAttributes<HTMLElement>)}>
                            {/* Technical Frame */}
                            <div className="relative aspect-video bg-[#05070a] m-1 overflow-hidden shrink-0">
                                <ProductImageGallery
                                    product={product}
                                    imageFit={productImageFit}
                                    className="w-full h-full"
                                    imageClassName="p-4 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                />
                                {/* Crosshair Overlay */}
                                <div className="absolute inset-2 border border-white/5 opacity-40" />
                                <div className="absolute top-1/2 left-4 right-4 h-[1px] bg-white/5 pointer-events-none" />

                                {(showUrls && productUrl) && (
                                    <div className="absolute top-2 right-2 p-1.5 bg-blue-500/20 border border-blue-500/40 text-blue-400 opacity-0 group-hover:opacity-100 transition-all">
                                        <ShoppingBag className="w-3 h-3" />
                                    </div>
                                )}
                            </div>

                            {/* Info Block */}
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start gap-4 mb-2">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-black uppercase tracking-tight group-hover:text-blue-400 transition-colors leading-tight">
                                            {product.name}
                                        </h3>
                                        {showSku && product.sku && (
                                            <span className="text-[8px] font-mono text-white/20">UID::{product.sku}</span>
                                        )}
                                    </div>
                                    {showPrices && (
                                        <div className="flex items-center gap-2 text-right">
                                            <span className="text-sm font-black font-mono shadow-[0_0_15px_rgba(59,130,246,0.2)]" style={{ color: primaryColor }}>
                                                {formatProductPrice(product)}
                                            </span>
                                            {showUrls && productUrl && (
                                                <ShoppingBag className="w-3.5 h-3.5 text-white/20 group-hover:text-blue-400 transition-colors" />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {showDescriptions && product.description && (
                                    <p className="text-[10px] text-white/40 line-clamp-1 italic font-mono mb-3">
                                        {`> ${product.description}`}
                                    </p>
                                )}

                                {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                    <div className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1 pt-2 border-t border-white/5">
                                        {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 2).map((attr, idx) => (
                                            <div key={idx} className="flex justify-between font-mono text-[9px] border-l border-blue-500/30 pl-2">
                                                <span className="text-white/20 uppercase truncate">{attr.name}</span>
                                                <span className="text-blue-400/80 font-bold ml-2 truncate">{attr.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-12 px-8 flex items-center justify-between shrink-0 z-20 bg-[#0a0f18]/80 backdrop-blur-sm border-t border-white/5">
                <div className="text-[9px] font-mono text-white/40 flex items-center gap-6">
                    <span>X_COORD: 1.029</span>
                    <span>Y_COORD: 4.882</span>
                    <span className="hidden md:inline">SYSTEM_ARCH::{catalogName?.replace(/\s/g, '_').toUpperCase()}</span>
                </div>
                <div className="flex gap-1.5 items-center">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <div key={i} className={`h-1 transition-all ${i + 1 === pageNumber ? 'w-6 bg-blue-500' : 'w-2 bg-white/10'}`}
                            style={{ backgroundColor: i + 1 === pageNumber ? primaryColor : undefined }} />
                    ))}
                </div>
            </div>
        </div>
    )
})
