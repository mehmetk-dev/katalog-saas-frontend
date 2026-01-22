import NextImage from "next/image"

import { useTranslation } from "@/lib/i18n-provider"

import { TemplateProps } from "./types"

// Tech Modern - Teknoloji ürünleri için koyu tema
export function TechModernTemplate({
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
}: TemplateProps) {
    const { t } = useTranslation()
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

    return (
        <div className="bg-slate-950 h-full flex flex-col overflow-hidden text-white">
            {/* Header */}
            <div className="h-16 px-8 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-8 rounded-full" style={{ backgroundColor: primaryColor }} />
                    <div>
                        <h1 className="font-bold tracking-tight text-sm truncate max-w-[200px]">{catalogName || t('catalogs.techCatalog')}</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{t('catalogs.premiumProducts')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-xs text-slate-500 font-mono">{pageNumber}/{totalPages}</span>
                </div>
            </div>

            {/* Grid - Dinamik sütunlar */}
            <div className={`flex-1 p-6 grid ${getGridCols()} ${getGridRows()} gap-5 overflow-hidden`} style={{ maxHeight: 'calc(100% - 104px)' }}>
                {safeProducts.map((product) => {
                    const productUrl = product.product_url
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'bg-slate-900 h-full rounded-2xl p-4 flex flex-col border border-slate-800 hover:border-slate-600 hover:bg-slate-800 transition-all cursor-pointer group shrink-0 shadow-lg'
                    } : {
                        className: 'bg-slate-900 h-full rounded-2xl p-4 flex flex-col border border-slate-800 shrink-0'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)}>
                            <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden mb-3 relative shrink-0">
                                <NextImage src={product.image_url || product.images?.[0] || "/placeholder.svg"} alt={product.name} fill unoptimized className="w-full h-full object-contain p-2 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                                {(showUrls && productUrl) && (
                                    <div className="absolute top-2 right-2 bg-slate-950/60 backdrop-blur-md p-1.5 rounded-full border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between overflow-hidden">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-blue-400 transition-colors leading-tight">{product.name}</h3>
                                    {showDescriptions && product.description && (
                                        <p className="text-[10px] text-slate-500 line-clamp-1 leading-tight">{product.description}</p>
                                    )}

                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 3).map((attr, aidx) => (
                                                <div key={aidx} className="bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                                                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter truncate">{attr.name}</span>
                                                    <span className="text-[9px] text-blue-400 font-bold truncate tracking-widest">{attr.value}{attr.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-800/50">
                                    {showPrices && (
                                        <span className="font-black text-base leading-none" style={{ color: primaryColor }}>
                                            {(() => {
                                                const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toFixed(2)}`
                                            })()}
                                        </span>
                                    )}
                                    {showSku && product.sku && (
                                        <span className="text-[8px] text-slate-600 font-mono px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800">
                                            #{product.sku}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-10 px-8 flex items-center justify-between border-t border-slate-800 shrink-0">
                <span className="text-[10px] text-slate-600 font-mono tracking-widest font-bold">{catalogName?.toUpperCase().replace(/\s/g, '_')}</span>
                <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${i + 1 === pageNumber ? 'bg-blue-500 scale-125' : 'bg-slate-800'}`} />
                    ))}
                </div>
            </div>
        </div>
    )
}
