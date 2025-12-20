import { useTranslation } from "@/lib/i18n-provider"
import { TemplateProps } from "./types"

// Luxury - Lüks koleksiyon, altın tema
export function LuxuryTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    showAttributes,
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
        if (columnsPerRow === 2) return "grid-rows-3"
        return "grid-rows-2"
    }

    return (
        <div className="h-full flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)' }}>
            {/* Altın border */}
            <div className="h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 shrink-0" />

            {/* Header */}
            <div className="h-20 px-10 flex items-center justify-center shrink-0">
                {pageNumber === 1 ? (
                    <div className="text-center">
                        <div className="text-[10px] text-yellow-600 tracking-[0.4em] uppercase mb-1">{t('catalogs.premiumCollection')}</div>
                        <h1 className="text-xl font-serif text-white tracking-wide truncate max-w-[400px]">{catalogName || t('catalogs.luxury')}</h1>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-px bg-gradient-to-r from-transparent to-yellow-600" />
                        <span className="text-yellow-600 font-serif text-sm px-2">{pageNumber}</span>
                        <div className="w-12 h-px bg-gradient-to-l from-transparent to-yellow-600" />
                    </div>
                )}
            </div>

            {/* Dinamik Grid - Lüks kartlar */}
            <div className={`flex-1 px-10 pb-6 grid ${getGridCols()} ${getGridRows()} gap-6 overflow-hidden`} style={{ maxHeight: 'calc(100% - 132px)' }}>
                {safeProducts.map((product) => {
                    const productUrl = (product as any).product_url
                    const Wrapper = productUrl ? 'a' : 'div'
                    const wrapperProps = productUrl ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'bg-zinc-900/50 h-full rounded-lg overflow-hidden border border-yellow-900/30 group cursor-pointer transition-all hover:border-yellow-600/50 hover:bg-zinc-900 flex flex-col shrink-0'
                    } : {
                        className: 'bg-zinc-900/50 h-full rounded-lg overflow-hidden border border-yellow-900/30 flex flex-col shrink-0'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as any)}>
                            <div className="aspect-[4/3] min-h-0 relative overflow-hidden shrink-0">
                                <img loading="lazy"
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.name}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                {productUrl && (
                                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-yellow-600/20 backdrop-blur-md border border-yellow-600/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-3 h-3 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
                                <div className="space-y-1">
                                    <h3 className="font-serif text-white text-sm line-clamp-1 leading-tight">{product.name}</h3>
                                    {showDescriptions && product.description && (
                                        <p className="text-[10px] text-zinc-500 line-clamp-1 italic italic">{product.description}</p>
                                    )}

                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                        <div className="mt-2 space-y-0.5 border-t border-yellow-900/20 pt-2">
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 3).map((attr, aidx) => (
                                                <div key={aidx} className="flex justify-between items-center text-[9px] gap-2">
                                                    <span className="text-zinc-600 font-serif italic truncate flex-1">{attr.name}</span>
                                                    <span className="text-yellow-600/80 font-medium shrink-0 truncate max-w-[50%]">
                                                        {attr.value}{attr.unit}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-auto pt-2 flex items-center justify-between border-t border-yellow-900/10">
                                    {showPrices && (
                                        <p className="text-base font-serif text-yellow-500 leading-none">
                                            {(() => {
                                                const currency = (product as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toFixed(2)}`
                                            })()}
                                        </p>
                                    )}
                                    {product.sku && (
                                        <span className="text-[8px] text-zinc-700 font-serif tracking-[0.2em]">#{product.sku}</span>
                                    )}
                                </div>
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-12 flex items-center justify-center border-t border-yellow-900/20 shrink-0">
                <span className="text-[10px] text-yellow-700/50 tracking-[0.3em] uppercase font-serif">
                    {catalogName} • {pageNumber} / {totalPages}
                </span>
            </div>

            {/* Alt altın border */}
            <div className="h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 shrink-0" />
        </div>
    )
}
