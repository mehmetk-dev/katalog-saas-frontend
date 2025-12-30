import { TemplateProps } from "./types"

// Elegant Cards - Lüks kart tasarımı, geniş boşluklar
export function ElegantCardsTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    showAttributes,
    showSku,
    pageNumber = 1,
    totalPages = 1,
    columnsPerRow = 2,
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

    const getGridRows = () => {
        return "grid-rows-3"
    }

    return (
        <div className="bg-transparent h-full flex flex-col overflow-hidden">
            {/* Header - Sayfanın üst kısmı */}
            <div className="h-20 px-10 flex items-end pb-4 border-b border-stone-200 shrink-0">
                {pageNumber === 1 ? (
                    <div className="w-full flex justify-between items-end">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-1">Koleksiyon</div>
                            <h1 className="text-2xl font-serif text-stone-800">{catalogName || "Katalog"}</h1>
                        </div>
                        <div className="h-1 w-24 rounded-full" style={{ backgroundColor: primaryColor }} />
                    </div>
                ) : (
                    <div className="w-full flex justify-between items-center">
                        <span className="font-serif text-stone-600">{catalogName}</span>
                        <span className="text-sm text-stone-400">{pageNumber}</span>
                    </div>
                )}
            </div>

            {/* Dinamik Grid - Büyük kartlar */}
            <div className={`flex-1 p-6 grid ${getGridCols()} ${getGridRows()} gap-6 overflow-hidden`} style={{ maxHeight: 'calc(100% - 128px)' }}>
                {safeProducts.map((product) => {
                    const productUrl = (product as any).product_url
                    const Wrapper = productUrl ? 'a' : 'div'
                    const wrapperProps = productUrl ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'bg-white rounded-3xl shadow-lg border border-stone-100 overflow-hidden flex flex-col group h-full cursor-pointer shrink-0'
                    } : {
                        className: 'bg-white rounded-3xl shadow-lg border border-stone-100 overflow-hidden flex flex-col h-full shrink-0'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as any)}>
                            <div className="h-32 min-h-[128px] bg-gradient-to-br from-stone-100 to-stone-50 overflow-hidden shrink-0 relative">
                                <img loading="lazy"
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                {productUrl && (
                                    <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-md rounded-full p-2 text-stone-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
                                <div className="space-y-1">
                                    <h3 className="font-serif text-base text-stone-800 line-clamp-1 leading-tight">{product.name}</h3>
                                    {showDescriptions && product.description && (
                                        <p className="text-[10px] text-stone-500 line-clamp-2 leading-tight italic">{product.description}</p>
                                    )}

                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                        <div className="mt-2 space-y-0.5 border-t border-stone-100 pt-2">
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 3).map((attr, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-[9px] gap-2">
                                                    <span className="text-stone-400 font-serif italic truncate flex-1">{attr.name}</span>
                                                    <span className="text-stone-600 font-medium shrink-0 truncate max-w-[50%]">
                                                        {attr.value}{attr.unit}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-auto pt-2 flex items-center justify-between">
                                    {showPrices && (
                                        <p className="text-lg font-light leading-none" style={{ color: primaryColor }}>
                                            {(() => {
                                                const currency = (product as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toFixed(2)}`
                                            })()}
                                        </p>
                                    )}
                                    {showSku && product.sku && (
                                        <span className="text-[8px] text-stone-300 font-serif tracking-widest">{product.sku}</span>
                                    )}
                                </div>
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-12 px-10 flex items-center justify-center border-t border-stone-200 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-px bg-stone-300" />
                    <span className="text-xs text-stone-400 font-serif">{pageNumber} / {totalPages}</span>
                    <div className="w-8 h-px bg-stone-300" />
                </div>
            </div>
        </div>
    )
}
