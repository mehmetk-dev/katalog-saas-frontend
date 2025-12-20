import { TemplateProps } from "./types"

// Retail - Mağaza fiyat listesi
export function RetailTemplate({
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
        if (columnsPerRow === 2) return "grid-rows-4"
        return "grid-rows-3"
    }

    return (
        <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#fafafa' }}>
            {/* Header Banner */}
            <div className="shrink-0 relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                {pageNumber === 1 ? (
                    <div className="px-8 py-4 text-white relative">
                        <div className="inline-block px-1.5 py-0.5 bg-white/20 rounded text-[9px] font-bold mb-1 tracking-widest uppercase">YENİ SEZON</div>
                        <h1 className="text-xl font-bold leading-tight truncate">{catalogName || "Katalog"}</h1>
                    </div>
                ) : (
                    <div className="px-8 py-2 text-white relative flex justify-between items-center h-10 shrink-0">
                        <span className="font-bold text-sm truncate max-w-[70%]">{catalogName}</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">SAYFA {pageNumber}</span>
                    </div>
                )}
            </div>

            {/* Dinamik Sütunlu Ürün Grid */}
            <div className={`flex-1 p-4 grid ${getGridCols()} ${getGridRows()} gap-3 overflow-hidden`} style={{ maxHeight: 'calc(100% - 90px)' }}>
                {safeProducts.map((product) => {
                    const productUrl = (product as any).product_url
                    const Wrapper = productUrl ? 'a' : 'div'
                    const wrapperProps = productUrl ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'bg-white rounded-xl shadow-sm overflow-hidden flex border border-gray-100 h-full group cursor-pointer transition-all hover:border-gray-300 hover:shadow-md shrink-0'
                    } : {
                        className: 'bg-white rounded-xl shadow-sm overflow-hidden flex border border-gray-100 h-full shrink-0'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as any)}>
                            <div className="w-24 min-w-[96px] bg-gray-50 overflow-hidden shrink-0 relative">
                                <img loading="lazy"
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-500"
                                />
                                {productUrl && (
                                    <div className="absolute top-0 right-0 bg-white/80 p-1 rounded-bl shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-2.5 h-2.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 p-2.5 flex flex-col justify-between min-w-0">
                                <div className="space-y-0.5 overflow-hidden">
                                    <h3 className="font-bold text-xs text-gray-900 line-clamp-1 leading-tight">{product.name}</h3>
                                    {showDescriptions && product.description && (
                                        <p className="text-[10px] text-gray-500 line-clamp-1 leading-tight">{product.description}</p>
                                    )}

                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 2).map((attr, aidx) => (
                                                <div key={aidx} className="bg-gray-50 px-1.5 py-0.5 rounded text-[8px] border border-gray-100 flex items-center gap-0.5">
                                                    <span className="text-gray-400 font-medium truncate">{attr.name}:</span>
                                                    <span className="text-gray-700 font-bold truncate">{attr.value}{attr.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-gray-100/50">
                                    {showPrices && (
                                        <span className="font-black text-sm leading-none" style={{ color: primaryColor }}>
                                            {(() => {
                                                const currency = (product as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toFixed(2)}`
                                            })()}
                                        </span>
                                    )}
                                    {product.sku && (
                                        <span className="text-[8px] text-gray-400 font-mono bg-gray-100 px-1 py-0.2 rounded">#{product.sku}</span>
                                    )}
                                </div>
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-10 px-6 flex items-center justify-between bg-white border-t shrink-0">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Resmi Satış Listesi</span>
                <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded border border-gray-100 shadow-sm" style={{ color: primaryColor }}>{pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
}
