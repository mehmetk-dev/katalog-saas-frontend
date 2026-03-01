import React from "react"
import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"
import { buildBackgroundStyle, sanitizeHref, formatProductPrice, getStandardLogoHeight, getHeaderLayout } from "./utils"

/**
 * Industrial Template - "The Structural Blueprint"
 * A rugged, technical design suited for heavy machinery, construction, or hardware catalogs.
 * Features: Grid paper background, mono fonts, technical callouts, and industrial yellow accents.
 */
export const IndustrialTemplate = React.memo(function IndustrialTemplate({
    catalogName,
    products,
    primaryColor = "#f59e0b", // Construction Yellow
    showPrices,
    showDescriptions,
    showAttributes,
    showSku,
    showUrls = false,
    pageNumber = 1,
    totalPages = 1,
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
        <div className="h-full flex flex-col relative overflow-hidden selection:bg-yellow-400 selection:text-black transition-colors" style={{ ...containerStyle, backgroundColor: containerStyle.backgroundColor || '#f8f9fa' }}>
            {/* Blueprint Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
                style={{ backgroundImage: "radial-gradient(#000 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }} />

            {/* Top Warning Strip */}
            <div className="h-4 w-full flex overflow-hidden shrink-0">
                {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className={`h-full w-8 rotate-[45deg] scale-150 shrink-0 ${i % 2 === 0 ? 'bg-yellow-400' : 'bg-black'}`}
                        style={{ backgroundColor: i % 2 === 0 ? primaryColor : undefined }} />
                ))}
            </div>

            {/* Header */}
            <header className="h-24 px-10 flex items-center justify-between shrink-0 border-b-4 border-black z-10 transition-colors" style={{ backgroundColor: containerStyle.backgroundColor || '#ffffff', color: headerTextColor }}>
                <div className="flex-1 flex items-center justify-between relative w-full h-full">
                    {/* Sol Alan */}
                    <div className="flex-1 flex items-center justify-start min-w-0 z-10 gap-6">
                        {isCollisionLeft ? (
                            <div className="flex flex-col gap-2 items-start">
                                {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                <div>
                                    <h1 className="text-2xl font-[900] uppercase tracking-tighter leading-none italic">{catalogName || "TECHNICAL_SPEC_V1"}</h1>
                                    <p className="text-[10px] font-mono font-bold mt-1 uppercase tracking-widest opacity-40">INDUSTRIAL SERIES // DEPT_REF_{pageNumber}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6">
                                {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                {titlePosition === 'left' && (
                                    <div>
                                        <h1 className="text-2xl font-[900] uppercase tracking-tighter leading-none italic">{catalogName || "TECHNICAL_SPEC_V1"}</h1>
                                        <p className="text-[10px] font-mono font-bold mt-1 uppercase tracking-widest opacity-40">INDUSTRIAL SERIES // DEPT_REF_{pageNumber}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Orta Alan */}
                    <div className="flex-1 flex items-center justify-center min-w-0 z-10 gap-6">
                        {isCollisionCenter ? (
                            <div className="flex flex-col gap-2 items-center text-center">
                                {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                <div>
                                    <h1 className="text-2xl font-[900] uppercase tracking-tighter leading-none italic">{catalogName || "TECHNICAL_SPEC_V1"}</h1>
                                    <p className="text-[10px] font-mono font-bold mt-1 uppercase tracking-widest opacity-40">INDUSTRIAL SERIES // DEPT_REF_{pageNumber}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6 text-center">
                                {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                {titlePosition === 'center' && (
                                    <div>
                                        <h1 className="text-2xl font-[900] uppercase tracking-tighter leading-none italic">{catalogName || "TECHNICAL_SPEC_V1"}</h1>
                                        <p className="text-[10px] font-mono font-bold mt-1 uppercase tracking-widest opacity-40">INDUSTRIAL SERIES // DEPT_REF_{pageNumber}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sağ Alan */}
                    <div className="flex-1 flex items-center justify-end min-w-0 z-10 gap-6 text-right">
                        {isCollisionRight ? (
                            <div className="flex flex-col gap-2 items-end">
                                <div className="text-[10px] font-mono font-bold px-2 py-0.5 border-2 border-black bg-black text-white italic">PAGE. {String(pageNumber).padStart(3, '0')}</div>
                                {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                <div>
                                    <h1 className="text-2xl font-[900] uppercase tracking-tighter leading-none italic">{catalogName || "TECHNICAL_SPEC_V1"}</h1>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6 flex-row-reverse text-right">
                                <div className="text-[10px] font-mono font-bold px-2 py-0.5 border-2 border-black bg-black text-white italic" style={{ borderColor: headerTextColor === '#000000' || !headerTextColor ? 'black' : headerTextColor, backgroundColor: headerTextColor === '#000000' || !headerTextColor ? 'black' : headerTextColor }}>PAGE. {String(pageNumber).padStart(3, '0')}</div>
                                {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={140} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                {titlePosition === 'right' && (
                                    <div>
                                        <h1 className="text-2xl font-[900] uppercase tracking-tighter leading-none italic">{catalogName || "TECHNICAL_SPEC_V1"}</h1>
                                        <p className="text-[10px] font-mono font-bold mt-1 uppercase tracking-widest opacity-40">INDUSTRIAL SERIES // DEPT_REF_{pageNumber}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Content List - Heavy Machinery Rows (6 Items - Expanded) */}
            <div className="flex-1 px-8 py-6 flex flex-col justify-between overflow-hidden z-10 w-full bg-zinc-100/50">
                {safeProducts.slice(0, 6).map((product, idx) => {
                    const productUrl = sanitizeHref(product.product_url)
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'group flex w-full bg-white border-2 border-black hover:border-yellow-500 transition-all cursor-pointer relative shrink-0 overflow-hidden h-[145px] shadow-md'
                    } : {
                        className: 'flex w-full bg-white border-2 border-black relative shrink-0 overflow-hidden h-[145px] shadow-md'
                    }

                    return (
                        <Wrapper key={product.id || idx} {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)}>
                            {/* Left: Index & Stripe */}
                            <div className="w-10 bg-black flex flex-col items-center justify-center gap-1 shrink-0 text-white z-20">
                                <span className="text-[10px] font-mono font-bold -rotate-90 whitespace-nowrap tracking-widest opacity-50">NO</span>
                                <span className="text-sm font-mono font-bold">{(idx + 1 + (pageNumber - 1) * 6).toString().padStart(2, '0')}</span>
                            </div>

                            {/* Image Section */}
                            <div className="w-36 relative border-r-2 border-black shrink-0 bg-white group-hover:bg-yellow-50 transition-colors">
                                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-black z-10 opacity-30" />
                                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-black z-10 opacity-30" />
                                <ProductImageGallery
                                    product={product}
                                    imageFit={productImageFit}
                                    className="w-full h-full"
                                    imageClassName="p-3 mix-blend-multiply group-hover:scale-105 transition-all duration-500"
                                    showNavigation={false}
                                />
                            </div>

                            {/* Middle: Technical Specs */}
                            <div className="flex-1 flex flex-col min-w-0 border-r-2 border-dashed border-black/20">
                                {/* Header */}
                                <div className="h-8 bg-black/5 border-b border-black flex items-center justify-between px-4">
                                    <h3 className="font-black text-sm uppercase tracking-tight text-black truncate pr-4">
                                        {product.name}
                                    </h3>
                                    {showSku && product.sku && (
                                        <div className="flex items-center gap-1.5 bg-white px-2 border border-black h-5">
                                            <span className="text-[9px] font-bold text-black/50">KOD:</span>
                                            <span className="text-[10px] font-bold font-mono">{product.sku}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Details Grid */}
                                <div className="flex-1 p-2 flex flex-col gap-1">
                                    {showDescriptions && product.description && (
                                        <div className="text-[10px] font-mono leading-tight text-black/80 line-clamp-2 relative pl-3 border-l-2 border-yellow-400 mb-1">
                                            {product.description}
                                        </div>
                                    )}

                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-auto pt-2 border-t border-black/5">
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 4).map((attr, aidx) => (
                                                <div key={aidx} className="flex items-center gap-1">
                                                    <span className="text-[9px] font-bold text-black/40 uppercase">{attr.name}:</span>
                                                    <span className="text-[9px] font-mono font-bold text-black">{attr.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Data Display */}
                            <div className="w-32 bg-zinc-50 flex flex-col items-center justify-center gap-1 shrink-0 px-2 relative overflow-hidden">
                                {/* Background diagonal lines */}
                                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 10px)" }} />

                                {showPrices && (
                                    <div className="relative z-10 flex flex-col items-center w-full">
                                        <div className="w-full text-center border-b border-black/10 pb-1 mb-1">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-black/40">FİYAT</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xl font-[900] font-mono leading-none tracking-tighter text-black">
                                                {formatProductPrice(product)}
                                            </div>
                                            {showUrls && productUrl && (
                                                <ShoppingBag className="w-4 h-4 text-black/30 group-hover:text-yellow-600 transition-colors" />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {(showUrls && productUrl) && (
                                    <div className="mt-1 w-full text-center text-[9px] font-bold border-2 border-black py-1 hover:bg-yellow-400 hover:border-yellow-400 hover:text-white transition-colors z-10 shadow-[2px_2px_0px_#000]">
                                        İNCELE
                                    </div>
                                )}
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-12 border-t-4 border-black px-10 flex items-center justify-between shrink-0 z-10 font-mono transition-colors" style={{ backgroundColor: containerStyle.backgroundColor || '#ffffff', color: headerTextColor }}>
                <div className="text-[10px] font-bold flex items-center gap-4">
                    <span className="w-20 h-4" style={{ backgroundColor: headerTextColor || '#000000' }} />
                    <span>SYSTEM_MASTER_REV: 2.04</span>
                </div>
                <div className="text-[10px] font-black tracking-widest uppercase">
                    {catalogName} // {pageNumber} OF {totalPages}
                </div>
            </div>
        </div>
    )
})
