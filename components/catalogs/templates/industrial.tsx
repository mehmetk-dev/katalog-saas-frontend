import NextImage from "next/image"
import { TemplateProps } from "./types"

/**
 * Industrial Template - "The Structural Blueprint"
 * A rugged, technical design suited for heavy machinery, construction, or hardware catalogs.
 * Features: Grid paper background, mono fonts, technical callouts, and industrial yellow accents.
 */
export function IndustrialTemplate({
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
}: TemplateProps) {
    const safeProducts = products || []

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
        <div className="h-full bg-[#f8f9fa] flex flex-col relative overflow-hidden selection:bg-yellow-400 selection:text-black">
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
            <div className="h-24 px-10 flex items-center justify-between shrink-0 bg-white border-b-4 border-black z-10">
                <div className="flex items-center gap-6">
                    {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                        <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                    )}
                    <div>
                        <h1 className="text-2xl font-[900] uppercase tracking-tighter text-black leading-none italic">
                            {catalogName || "TECHNICAL_SPEC_V1"}
                        </h1>
                        <p className="text-[10px] font-mono font-bold text-black/40 mt-1 uppercase tracking-widest">
                            INDUSTRIAL SERIES // DEPT_REF_{pageNumber}
                        </p>
                    </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                    <div className="text-[10px] font-mono font-bold px-2 py-0.5 border-2 border-black bg-black text-white italic">
                        PAGE. {String(pageNumber).padStart(3, '0')}
                    </div>
                    {logoUrl && isHeaderLogo && logoAlignment === 'right' && (
                        <div className="mt-2">
                            <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                        </div>
                    )}
                </div>
            </div>

            {/* Content List - Heavy Technical List */}
            <div className="flex-1 p-8 flex flex-col gap-4 overflow-hidden z-10">
                {safeProducts.map((product, idx) => {
                    const productUrl = product.product_url
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'group flex items-center gap-6 bg-white p-4 border-2 border-black hover:bg-zinc-50 transition-all cursor-pointer relative shrink-0'
                    } : {
                        className: 'flex items-center gap-6 bg-white p-4 border-2 border-black relative shrink-0'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as any)}>
                            {/* Sequence & Status */}
                            <div className="flex flex-col items-center gap-2 shrink-0 border-r-2 border-black/5 pr-6">
                                <span className="text-sm font-black font-mono">#{idx + 1 + (pageNumber - 1) * 8}</span>
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            </div>

                            {/* Product Photo - Like a technical detail */}
                            <div className="w-20 h-20 bg-[#fafafa] border-2 border-dashed border-black/20 shrink-0 relative p-1 overflow-hidden">
                                <NextImage
                                    src={product.image_url || product.images?.[0] || "/placeholder.svg"}
                                    alt={product.name}
                                    fill
                                    unoptimized
                                    className="object-contain p-2 mix-blend-multiply group-hover:scale-110 transition-all duration-700"
                                />
                                {(showUrls && productUrl) && (
                                    <div className="absolute top-0 right-0 bg-black text-white p-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Info Callout */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-black text-sm uppercase tracking-tight text-black truncate">{product.name}</h3>
                                    {showSku && product.sku && (
                                        <span className="text-[9px] font-mono font-bold bg-zinc-100 text-zinc-500 px-2 border border-zinc-200">
                                            MODEL_{product.sku}
                                        </span>
                                    )}
                                </div>
                                {showDescriptions && product.description && (
                                    <p className="text-[10px] text-black/40 font-mono italic truncate leading-none">
                                        {`// ${product.description}`}
                                    </p>
                                )}

                                {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                                        {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 4).map((attr, aidx) => (
                                            <div key={aidx} className="flex flex-col text-[9px] font-mono leading-none border-l-2 border-yellow-400 pl-2">
                                                <span className="text-black/30 uppercase text-[7px] mb-1 font-bold">{attr.name}</span>
                                                <span className="text-black font-black uppercase">{attr.value}{attr.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pricing - Massive label */}
                            {showPrices && (
                                <div className="ml-4 pl-6 border-l-2 border-black/5 text-right">
                                    <span className="text-xs font-mono font-bold text-black/40 block leading-tight">MSRP_VAL</span>
                                    <span className="text-xl font-[900] font-mono leading-none tracking-tighter" style={{ color: primaryColor }}>
                                        {(() => {
                                            const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                            const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                            return `${symbol}${Number(product.price).toFixed(2)}`
                                        })()}
                                    </span>
                                </div>
                            )}
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-12 bg-white px-10 border-t-4 border-black flex items-center justify-between shrink-0 z-10 font-mono">
                <div className="text-[10px] font-bold text-black flex items-center gap-4">
                    <span className="w-20 h-4 bg-black" />
                    <span>SYSTEM_MASTER_REV: 2.04</span>
                </div>
                <div className="text-[10px] font-black tracking-widest uppercase">
                    {catalogName} // {pageNumber} OF {totalPages}
                </div>
            </div>
        </div>
    )
}
