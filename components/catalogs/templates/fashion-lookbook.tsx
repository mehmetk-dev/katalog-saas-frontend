import NextImage from "next/image"
import { TemplateProps } from "./types"

/**
 * Fashion Lookbook Template - "The Couture Editorial"
 * A high-end, asymmetrical layout designed for fashion, lifestyle, and art catalogs.
 * Features: Overlapping elements, vertical typography, and a magazine-like structure.
 */
export function FashionLookbookTemplate({
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
    logoUrl,
    logoPosition,
    logoSize,
}: TemplateProps) {
    const safeProducts = products || []
    const [hero, second, third, fourth] = safeProducts

    const getLogoHeight = () => {
        switch (logoSize) {
            case 'small': return 24
            case 'large': return 48
            default: return 32
        }
    }

    const isHeaderLogo = logoPosition?.startsWith('header')
    const logoAlignment = logoPosition?.split('-')[1] || 'left'

    return (
        <div className="h-full bg-[#fdfdfd] flex border-l-[40px] relative overflow-hidden selection:bg-black selection:text-white" style={{ borderLeftColor: primaryColor }}>
            {/* Side Page Indicator - Vertical */}
            <div className="absolute left-[-30px] top-0 h-full flex items-center justify-center pointer-events-none">
                <span className="rotate-[-90deg] text-white text-[10px] font-black tracking-[1em] uppercase whitespace-nowrap opacity-50">
                    {catalogName} • PAGE {pageNumber.toString().padStart(2, '0')}
                </span>
            </div>

            <div className="flex-1 flex flex-col p-10 pr-14 relative z-10 w-full">
                {/* Editorial Header */}
                <div className="mb-12 flex justify-between items-end border-b-2 border-black/5 pb-6">
                    <div>
                        {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                            <div className="mb-4">
                                <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                            </div>
                        )}
                        <h1 className="text-4xl font-serif italic tracking-tighter leading-none text-black">
                            {catalogName || "Summer Collection"}
                        </h1>
                        <p className="text-[10px] tracking-[0.4em] uppercase text-black/40 mt-2 font-bold">
                            Editorial Lookbook / Series {pageNumber}
                        </p>
                    </div>

                    <div className="text-right">
                        {logoUrl && isHeaderLogo && logoAlignment === 'right' && (
                            <div className="mb-4">
                                <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                            </div>
                        )}
                        <span className="text-[60px] font-serif italic text-black/5 leading-none absolute top-4 right-10 pointer-events-none">
                            {String(pageNumber).padStart(2, '0')}
                        </span>
                    </div>
                </div>

                {/* The Asymmetrical Grid */}
                <div className="flex-1 flex gap-12 overflow-hidden">
                    {/* Left: Big Hero Product */}
                    <div className="w-[55%] flex flex-col relative shrink-0">
                        {hero && (
                            <div className="h-full flex flex-col group">
                                <div className="flex-1 relative bg-[#f5f5f5] overflow-hidden">
                                    <NextImage
                                        src={hero.image_url || hero.images?.[0] || "/placeholder.svg"}
                                        alt={hero.name}
                                        fill
                                        unoptimized
                                        className="object-cover group-hover:scale-105 transition-all duration-[2s]"
                                    />
                                    {/* Overlay label */}
                                    <div className="absolute top-6 right-[-20px] rotate-90 origin-center bg-black text-white px-4 py-1 text-[10px] font-bold tracking-[0.3em] uppercase">
                                        FEATURED PIECE
                                    </div>

                                    {(showUrls && hero.product_url) && (
                                        <a href={hero.product_url} target="_blank" rel="noopener noreferrer" className="absolute bottom-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center rounded-full hover:bg-white hover:text-black transition-all">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                                <div className="mt-6">
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-2xl font-serif text-black italic line-clamp-1">{hero.name}</h2>
                                        {showPrices && (
                                            <span className="text-xl font-light text-black/60">
                                                {(() => {
                                                    const currency = hero.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                    return `${symbol}${Number(hero.price).toFixed(2)}`
                                                })()}
                                            </span>
                                        )}
                                    </div>
                                    {showDescriptions && hero.description && (
                                        <p className="text-[11px] text-black/50 leading-relaxed mt-2 italic font-serif">
                                            {hero.description}
                                        </p>
                                    )}
                                    {showSku && hero.sku && (
                                        <p className="text-[9px] text-black/20 font-mono mt-3 uppercase tracking-tighter">SKU_REF: {hero.sku}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Detailed Minimal Grid */}
                    <div className="w-[45%] flex flex-col gap-8 overflow-hidden shrink-0">
                        {[second, third, fourth].filter(Boolean).map((product, idx) => {
                            const productUrl = product!.product_url
                            const Wrapper = (showUrls && productUrl) ? 'a' : 'div'

                            return (
                                <Wrapper
                                    key={product!.id}
                                    {...(showUrls && productUrl ? { href: productUrl, target: '_blank', rel: 'noopener noreferrer' } : {})}
                                    className="flex gap-6 group cursor-pointer"
                                >
                                    <div className="w-[120px] h-[150px] relative bg-[#f5f5f5] shrink-0 overflow-hidden">
                                        <NextImage
                                            src={product!.image_url || product!.images?.[0] || "/placeholder.svg"}
                                            alt={product!.name}
                                            fill
                                            unoptimized
                                            className="object-cover group-hover:scale-110 transition-all duration-1000 grayscale group-hover:grayscale-0"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center border-b border-black/5 pb-4 flex-1">
                                        <div className="text-[9px] font-bold tracking-[0.2em] text-black/40 mb-2 uppercase">
                                            {idx === 0 ? 'THE ESSENTIAL' : idx === 1 ? 'SEASONAL SELECTION' : 'DETAILS MATTER'}
                                        </div>
                                        <h3 className="text-base font-serif italic text-black mb-2 group-hover:text-black/60 transition-colors">
                                            {product!.name}
                                        </h3>
                                        <div className="flex items-center gap-4">
                                            {showPrices && (
                                                <span className="text-sm font-light text-black">
                                                    {(() => {
                                                        const currency = product!.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                        const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                        return `${symbol}${Number(product!.price).toFixed(2)}`
                                                    })()}
                                                </span>
                                            )}
                                            {showAttributes && product!.custom_attributes && product!.custom_attributes.length > 0 && (
                                                <div className="flex gap-2">
                                                    {product!.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 1).map((attr, aidx) => (
                                                        <span key={aidx} className="text-[9px] text-black/30 uppercase tracking-widest italic">
                                                            {attr.value}{attr.unit}
                                                        </span>
                                                    ))}
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
                    <div className="text-[10px] font-black tracking-[0.3em] uppercase text-black italic">
                        PAGE {pageNumber.toString().padStart(2, '0')}
                    </div>
                    <div className="h-[2px] flex-1 bg-black/10 relative overflow-hidden">
                        <div
                            className="absolute left-0 top-0 h-full bg-black transition-all duration-1000"
                            style={{ width: `${(pageNumber / totalPages) * 100}%` }}
                        />
                    </div>
                    <div className="text-[10px] font-serif italic text-black/30">
                        {catalogName} • Lookbook Archive
                    </div>
                </div>
            </div>
        </div>
    )
}
