import { TemplateProps } from "./types"

// Clean White - Temiz minimalist beyaz
export function CleanWhiteTemplate({
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
        <div className="bg-white h-full flex flex-col overflow-hidden">
            {/* Minimal Header */}
            <div className="h-16 px-12 flex items-end pb-4 shrink-0">
                {pageNumber === 1 ? (
                    <div className="flex items-center gap-4 w-full">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                            <span className="text-white font-medium">{(catalogName || "K")[0]}</span>
                        </div>
                        <h1 className="text-lg font-medium text-gray-900">{catalogName}</h1>
                    </div>
                ) : (
                    <div className="w-full flex justify-between items-center text-sm text-gray-400">
                        <span>{catalogName}</span>
                        <span>{pageNumber}</span>
                    </div>
                )}
            </div>

            {/* Çok temiz Dinamik grid */}
            <div className={`flex-1 px-12 pb-8 grid ${getGridCols()} gap-8 content-start`}>
                {safeProducts.map((product) => (
                    <div key={product.id}>
                        <div className="aspect-[3/2] bg-gray-50 rounded-lg overflow-hidden mb-4">
                            <img loading="lazy"
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 line-clamp-1">{product.name}</h3>
                                {showDescriptions && product.description && (
                                    <p className="text-sm text-gray-400 line-clamp-1 mt-1">{product.description}</p>
                                )}
                            </div>
                            {showPrices && (
                                <span className="font-medium shrink-0" style={{ color: primaryColor }}>
                                    ₺{Number(product.price).toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="h-12 px-12 flex items-center justify-between border-t shrink-0">
                <span className="text-xs text-gray-300">{catalogName}</span>
                <span className="text-xs text-gray-400">{pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
}
