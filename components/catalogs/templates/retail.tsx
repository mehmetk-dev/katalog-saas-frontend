import { TemplateProps } from "./types"

// Retail - Mağaza fiyat listesi
export function RetailTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
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

    return (
        <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#fafafa' }}>
            {/* Header Banner */}
            <div className="shrink-0 relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                {pageNumber === 1 ? (
                    <div className="px-8 py-5 text-white relative">
                        <div className="inline-block px-2 py-0.5 bg-white/20 rounded text-xs mb-2">YENİ SEZON</div>
                        <h1 className="text-2xl font-bold">{catalogName || "Katalog"}</h1>
                    </div>
                ) : (
                    <div className="px-8 py-3 text-white relative flex justify-between items-center">
                        <span className="font-medium">{catalogName}</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs">Sayfa {pageNumber}</span>
                    </div>
                )}
            </div>

            {/* Dinamik Sütunlu Ürün Grid */}
            <div className={`flex-1 p-5 grid ${getGridCols()} gap-4 content-start overflow-hidden`}>
                {safeProducts.map((product) => (
                    <div
                        key={product.id}
                        className="bg-white rounded-xl shadow-sm overflow-hidden flex border border-gray-100"
                    >
                        <div className="w-28 h-28 shrink-0 bg-gray-50 overflow-hidden">
                            <img loading="lazy"
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 p-3 flex flex-col min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{product.name}</h3>
                            {showDescriptions && product.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 mt-1 flex-1">{product.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                                {showPrices && (
                                    <span className="font-bold text-lg" style={{ color: primaryColor }}>
                                        ₺{Number(product.price).toFixed(2)}
                                    </span>
                                )}
                                {product.sku && (
                                    <span className="text-[9px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{product.sku}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="h-10 px-6 flex items-center justify-between bg-white border-t shrink-0">
                <span className="text-[10px] text-gray-400">Stoklar sınırlıdır</span>
                <span className="text-xs" style={{ color: primaryColor }}>{pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
}
