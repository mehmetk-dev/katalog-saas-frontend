import { TemplateProps } from "./types"

// Product Tiles - Kompakt karo görünümü
export function ProductTilesTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    pageNumber = 1,
    totalPages = 1,
    columnsPerRow = 3,
}: TemplateProps) {
    const safeProducts = products || []

    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
            case 4: return "grid-cols-4"
            default: return "grid-cols-3"
        }
    }

    return (
        <div className="bg-gray-100 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-12 bg-white border-b px-5 flex items-center justify-between shrink-0">
                <h1 className="font-bold text-gray-900">{catalogName || "Ürünler"}</h1>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{safeProducts.length} ürün</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{pageNumber}/{totalPages}</span>
                </div>
            </div>

            {/* Dinamik Grid */}
            <div className={`flex-1 p-3 grid ${getGridCols()} gap-2 content-start overflow-hidden`}>
                {safeProducts.map((product) => (
                    <div
                        key={product.id}
                        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                    >
                        <div className="aspect-square bg-gray-50 overflow-hidden">
                            <img loading="lazy"
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                        </div>
                        <div className="p-2 flex-1 flex flex-col min-h-0">
                            <h3 className="font-medium text-[11px] text-gray-800 line-clamp-1">{product.name}</h3>
                            {showPrices && (
                                <p className="font-bold text-sm mt-auto pt-1" style={{ color: primaryColor }}>
                                    ₺{Number(product.price).toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="h-8 bg-white border-t flex items-center justify-center shrink-0">
                <span className="text-[9px] text-gray-400">{catalogName}</span>
            </div>
        </div>
    )
}
