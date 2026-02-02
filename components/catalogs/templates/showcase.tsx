import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import type { CustomAttribute } from "@/lib/actions/products"
import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"

/**
 * Showcase Template - "The Spotlight Noir"
 * A high-end, cinematic layout designed to highlight a main feature product with a spotlight effect.
 * Features: Dark mode by default, large hero imagery, and a sophisticated monochromatic sidebar.
 */
export function ShowcaseTemplate({
    catalogName,
    products,
    primaryColor = "#3b82f6",
    showPrices,
    showDescriptions,
    showAttributes: _showAttributes,
    showSku,
    showUrls = false,
    pageNumber = 1,
    totalPages = 1,
    columnsPerRow: _columnsPerRow = 2,
    logoUrl,
    logoPosition,
    logoSize,
    productImageFit = 'cover',
}: TemplateProps) {
    const safeProducts = products || []
    const [main, ...others] = safeProducts

    const getImageFitClass = () => {
        switch (productImageFit) {
            case 'contain': return 'object-contain'
            case 'fill': return 'object-fill'
            case 'cover':
            default: return 'object-cover'
        }
    }

    // Kullanıcı isteği: Vitrin (Showcase) sağ taraf tek sütun
    const getRightCols = () => "grid-cols-1"

    const getLogoHeight = () => {
        switch (logoSize) {
            case 'small': return 24
            case 'large': return 44
            default: return 32
        }
    }

    const isHeaderLogo = logoPosition?.startsWith('header')
    const logoAlignment = logoPosition?.split('-')[1] || 'left'

    return (
        <div className="bg-[#0a0a0a] h-full flex flex-col overflow-hidden text-white selection:bg-blue-500/30">
            {/* Minimal High-End Header */}
            <div className="h-20 px-10 flex items-center justify-between border-b border-white/5 shrink-0 bg-[#0a0a0a] z-50">
                <div className="flex items-center gap-10">
                    {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                        <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain filter brightness-110" />
                    )}
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black tracking-[0.3em] uppercase truncate max-w-[400px]">
                            {catalogName || "FEATURE_SHOW"}
                        </h1>
                        <span className="text-[9px] font-bold text-white/20 tracking-[0.5em] mt-1">CURATED EDITION</span>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {logoUrl && isHeaderLogo && (logoAlignment === 'right' || logoAlignment === 'center') && (
                        <NextImage src={logoUrl} alt="Logo" width={110} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain filter brightness-110" />
                    )}
                    <div className="h-10 w-[1px] bg-white/10" />
                    <div className="text-right">
                        <span className="text-[11px] font-mono font-bold text-white/40 block leading-none">PV_{pageNumber}</span>
                        <span className="text-[9px] text-white/20 mt-1 block">T_VOL: {totalPages}</span>
                    </div>
                </div>
            </div>

            {/* Main Cinematic Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Hero Feature - Left */}
                {main && (() => {
                    const productUrl = main.product_url

                    return (
                        <div className="w-[60%] h-full relative shrink-0 group overflow-hidden">
                            {/* Spotlight Effect Background */}
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

                            <ProductImageGallery
                                product={main}
                                imageFit={productImageFit}
                                className="w-full h-full"
                                imageClassName="p-20 group-hover:scale-105 transition-transform duration-[3000ms] opacity-80 group-hover:opacity-100"
                            />

                            {/* Cinematic Overlays */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />
                            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent pointer-events-none" />

                            <div className="absolute bottom-0 left-0 p-16 max-w-xl z-20">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-[2px] w-12" style={{ backgroundColor: primaryColor }} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Master Piece</span>
                                </div>

                                <h2 className="text-6xl font-[900] mb-6 tracking-tighter leading-[0.9] uppercase">
                                    {main.name}
                                </h2>

                                {showDescriptions && main.description && (
                                    <p className="text-white/40 text-base line-clamp-2 mb-8 leading-relaxed font-medium italic">
                                        {main.description}
                                    </p>
                                )}

                                <div className="flex items-end gap-12">
                                    {showPrices && (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-black tracking-widest text-white/20 mb-2">Value Reference</span>
                                            <div className="flex items-center gap-4">
                                                <p className="text-4xl font-black leading-none tracking-tighter" style={{ color: primaryColor }}>
                                                    {(() => {
                                                        const currency = main.custom_attributes?.find((a: CustomAttribute) => a.name === "currency")?.value || "TRY"
                                                        const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                        return `${symbol}${Number(main.price).toFixed(2)}`
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {showSku && main.sku && (
                                        <div className="pb-1 border-b border-white/10">
                                            <span className="text-[11px] font-mono text-white/40">REF::{main.sku}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Buy Button - Main Hero */}
                            {(showUrls && productUrl) && (
                                <a
                                    href={productUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute bottom-10 right-10 w-14 h-14 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 z-30 group/btn"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ShoppingBag className="w-6 h-6" />
                                </a>
                            )}
                        </div>
                    )
                })()}

                {/* Vertical Sidebar - Right (1 Column, 4 Rows) */}
                <div className={`w-[40%] grid ${getRightCols()} grid-rows-4 bg-[#0d0d0d] border-l border-white/5 shrink-0`}>
                    {others.slice(0, 4).map((product, idx) => {
                        const productUrl = product.product_url

                        return (
                            <div key={product.id} className="relative group overflow-hidden border-b border-white/5 flex flex-col h-full">
                                <div className="absolute inset-0 opacity-20 group-hover:opacity-50 transition-all duration-[1.5s]">
                                    <ProductImageGallery
                                        product={product}
                                        imageFit={productImageFit}
                                        className="w-full h-full"
                                        imageClassName="p-12 group-hover:scale-110 transition-all duration-[2s]"
                                        showNavigation={false}
                                        interactive={true}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                </div>

                                <div className="mt-auto p-8 relative z-10 transition-transform duration-700 group-hover:-translate-y-2">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-black italic text-white/20">{(idx + 2).toString().padStart(2, '0')}</span>
                                        <div className="h-[1px] flex-1 bg-white/5" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-tight group-hover:text-blue-400 transition-colors line-clamp-1">
                                        {product.name}
                                    </h3>

                                    <div className="flex items-end justify-between mt-3">
                                        {showPrices && (
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold tracking-tighter" style={{ color: primaryColor }}>
                                                    {(() => {
                                                        const currency = product.custom_attributes?.find((a: CustomAttribute) => a.name === "currency")?.value || "TRY"
                                                        const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                        return `${symbol}${Number(product.price).toFixed(2)}`
                                                    })()}
                                                </p>
                                            </div>
                                        )}
                                        {showSku && product.sku && (
                                            <span className="text-[9px] font-mono text-white/20">#{product.sku}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Buy Button - Sidebar Item */}
                                {showUrls && productUrl && (
                                    <a
                                        href={productUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white hover:text-black border border-white/10 flex items-center justify-center transition-all duration-300 z-20"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ShoppingBag className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
