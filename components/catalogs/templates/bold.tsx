import { TemplateProps } from "./types"

export function BoldTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    pageNumber = 1,
    totalPages = 1,
    columnsPerRow = 2,
}: TemplateProps) {
    const HEADER_HEIGHT = "56px"

    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
            case 4: return "grid-cols-4"
            default: return "grid-cols-2"
        }
    }

    return (
        <div className="bg-white h-full border-[10px] flex flex-col overflow-hidden" style={{ borderColor: primaryColor }}>
            {/* Header Alanı - Tüm sayfalarda aynı yükseklik */}
            <div className="shrink-0" style={{ height: HEADER_HEIGHT }}>
                {pageNumber === 1 ? (
                    <div className="h-full bg-black text-white px-5 flex items-center">
                        <h1 className="text-2xl font-black uppercase tracking-tighter">
                            {catalogName || "KATALOG"}
                        </h1>
                    </div>
                ) : (
                    <div className="h-full bg-black text-white px-5 flex items-center justify-between">
                        <span className="font-bold uppercase tracking-tight">{catalogName}</span>
                        <span className="text-sm font-mono">#{pageNumber}</span>
                    </div>
                )}
            </div>

            {/* Dinamik Grid İçerik */}
            <div className={`flex-1 p-4 grid ${getGridCols()} gap-3 content-start bg-white`}>
                {(products || []).map((product) => (
                    <div
                        key={product.id}
                        className="border-2 border-black bg-white hover:bg-yellow-300 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden"
                    >
                        {/* Görsel */}
                        <div className="aspect-[4/3] border-b-2 border-black overflow-hidden bg-white">
                            <img loading="lazy"
                                crossOrigin="anonymous"
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all"
                            />
                        </div>

                        {/* Bilgiler */}
                        <div className="p-2 flex-1 flex flex-col">
                            <h3 className="text-xs font-black uppercase line-clamp-1 transform -skew-x-2">{product.name}</h3>

                            {showDescriptions && product.description && (
                                <p className="text-[9px] text-gray-700 line-clamp-1 mt-0.5">
                                    {product.description}
                                </p>
                            )}

                            <div className="mt-auto pt-1 flex items-center justify-between">
                                {showPrices && (
                                    <span className="text-sm font-bold font-mono">
                                        {(() => {
                                            const currency = (product as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
                                            const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                            return `${symbol}${Number(product.price).toFixed(2)}`
                                        })()}
                                    </span>
                                )}
                                {product.sku && (
                                    <span className="text-[8px] font-mono text-gray-500">{product.sku}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="h-8 bg-black text-white flex items-center justify-center shrink-0">
                <span className="text-xs font-bold font-mono">{pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
}
