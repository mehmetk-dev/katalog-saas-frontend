import { TemplateProps } from "./types"

// Catalog Pro - Profesyonel 3 sütun grid
export function CatalogProTemplate({
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
        <div className="bg-white h-full flex flex-col overflow-hidden">
            {/* Kalın renkli header bar */}
            <div className="h-3 shrink-0" style={{ backgroundColor: primaryColor }} />

            {/* Header */}
            <div className="h-14 px-6 flex items-center justify-between border-b shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primaryColor }}>
                        {(catalogName || "K")[0]}
                    </div>
                    <span className="font-bold text-gray-900">{catalogName}</span>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Sayfa {pageNumber}</span>
            </div>

            {/* Dinamik Grid */}
            <div className={`flex-1 p-4 grid ${getGridCols()} gap-3 content-start overflow-hidden`}>
                {safeProducts.map((product) => (
                    <div key={product.id} className="flex flex-col bg-gray-50 rounded-lg overflow-hidden">
                        <div className="aspect-square bg-white overflow-hidden">
                            <img loading="lazy"
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                        </div>
                        <div className="p-2.5 flex-1 flex flex-col min-h-0">
                            <h3 className="font-semibold text-xs text-gray-900 line-clamp-1">{product.name}</h3>
                            {showDescriptions && product.description && (
                                <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{product.description}</p>
                            )}
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
            <div className="h-10 px-6 flex items-center justify-between bg-gray-50 border-t shrink-0">
                <span className="text-[10px] text-gray-400">{catalogName}</span>
                <span className="text-xs font-medium" style={{ color: primaryColor }}>{pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
}
