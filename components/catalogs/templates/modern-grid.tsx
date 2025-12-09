import { TemplateProps } from "./types"

export function ModernGridTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    pageNumber = 1,
    totalPages = 1,
    columnsPerRow = 2,
}: TemplateProps) {
    // A4 boyutu için baskıya uygun kenar boşlukları
    const HEADER_HEIGHT = "60px"

    // Dinamik grid sınıfı
    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
            case 4: return "grid-cols-4"
            default: return "grid-cols-2"
        }
    }

    return (
        <div className="bg-transparent h-full flex flex-col relative overflow-hidden">
            {/* Header Alanı - Tüm sayfalarda aynı yükseklik */}
            <div className="shrink-0" style={{ height: HEADER_HEIGHT }}>
                {pageNumber === 1 ? (
                    <div className="h-full px-8 flex items-center text-white" style={{ backgroundColor: primaryColor }}>
                        <div className="w-full text-center">
                            <h1 className="text-xl font-bold tracking-tight">{catalogName || "Katalog Başlığı"}</h1>
                        </div>
                    </div>
                ) : (
                    <div className="h-full px-8 flex items-center justify-between border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-600">{catalogName}</span>
                        <span className="text-sm text-gray-400">Sayfa {pageNumber}</span>
                    </div>
                )}
            </div>

            {/* Grid İçerik - Dinamik sütun sayısı */}
            <div className={`flex-1 p-6 grid ${getGridCols()} gap-4 content-start`}>
                {(products || []).map((product) => (
                    <div key={product.id} className="flex flex-col border border-gray-100 rounded-lg overflow-hidden bg-white shadow-sm">
                        {/* Görsel */}
                        <div className="aspect-[4/3] relative overflow-hidden bg-gray-50">
                            <img loading="lazy"
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Bilgiler */}
                        <div className="p-3 flex-1 flex flex-col">
                            <div className="flex justify-between items-start gap-2 mb-1">
                                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1">{product.name}</h3>
                                {showPrices && (
                                    <span className="font-bold text-sm shrink-0" style={{ color: primaryColor }}>
                                        {(() => {
                                            const currency = (product as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
                                            const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                            return `${symbol}${Number(product.price).toFixed(2)}`
                                        })()}
                                    </span>
                                )}
                            </div>
                            {showDescriptions && product.description && (
                                <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                                    {product.description}
                                </p>
                            )}
                            {product.sku && (
                                <p className="text-[10px] text-gray-400 mt-auto pt-1 font-mono">SKU: {product.sku}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="h-8 px-8 flex items-center justify-center border-t border-gray-100 shrink-0">
                <span className="text-[10px] text-gray-400">{catalogName} • Sayfa {pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
}
