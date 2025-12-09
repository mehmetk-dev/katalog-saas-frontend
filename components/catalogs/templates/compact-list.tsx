import { TemplateProps } from "./types"

export function CompactListTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    pageNumber = 1,
    totalPages = 1,
}: TemplateProps) {
    const HEADER_HEIGHT = "56px"

    return (
        <div className="bg-white h-full flex flex-col relative overflow-hidden">
            {/* Header Alanı - Tüm sayfalarda aynı yükseklik */}
            <div className="shrink-0" style={{ height: HEADER_HEIGHT }}>
                {pageNumber === 1 ? (
                    <div className="h-full px-6 flex items-center border-b-2" style={{ borderColor: primaryColor }}>
                        <h1 className="text-lg font-bold uppercase tracking-widest" style={{ color: primaryColor }}>
                            {catalogName || "Katalog"}
                        </h1>
                    </div>
                ) : (
                    <div className="h-full px-6 flex items-center justify-between border-b border-gray-200">
                        <span className="text-sm font-medium" style={{ color: primaryColor }}>{catalogName}</span>
                        <span className="text-xs text-gray-400">Sayfa {pageNumber}</span>
                    </div>
                )}
            </div>

            {/* Liste İçerik */}
            <div className="flex-1 px-6 py-4 flex flex-col gap-2 overflow-hidden">
                {(products || []).map((product) => (
                    <div
                        key={product.id}
                        className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                    >
                        {/* Görsel */}
                        <div className="w-16 h-16 shrink-0 bg-white rounded-md border border-gray-200 overflow-hidden">
                            <img loading="lazy"
                                crossOrigin="anonymous"
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Bilgiler */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h3>
                                    {showDescriptions && product.description && (
                                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.description}</p>
                                    )}
                                    {product.sku && (
                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">SKU: {product.sku}</p>
                                    )}
                                </div>

                                {showPrices && (
                                    <div className="text-right shrink-0">
                                        <span className="font-bold text-base" style={{ color: primaryColor }}>
                                            {(() => {
                                                const currency = (product as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toFixed(2)}`
                                            })()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="h-8 px-6 flex items-center justify-center border-t border-gray-100 shrink-0">
                <span className="text-[10px] text-gray-400">{catalogName} • Sayfa {pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
}
