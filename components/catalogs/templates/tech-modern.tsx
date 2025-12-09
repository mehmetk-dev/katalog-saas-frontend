import { TemplateProps } from "./types"

// Tech Modern - Teknoloji ürünleri için koyu tema
export function TechModernTemplate({
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
        <div className="bg-slate-950 h-full flex flex-col overflow-hidden text-white">
            {/* Header */}
            <div className="h-16 px-8 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-8 rounded-full" style={{ backgroundColor: primaryColor }} />
                    <div>
                        <h1 className="font-bold tracking-tight">{catalogName || "Tech Catalog"}</h1>
                        <p className="text-xs text-slate-500">Premium Products</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-slate-500">{pageNumber}/{totalPages}</span>
                </div>
            </div>

            {/* Grid - Dinamik sütunlar */}
            <div className={`flex-1 p-6 grid ${getGridCols()} gap-5 content-center`}>
                {safeProducts.map((product) => (
                    <div
                        key={product.id}
                        className="bg-slate-900 rounded-2xl p-5 flex flex-col border border-slate-800 hover:border-slate-700 transition-colors group"
                    >
                        <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden mb-4">
                            <img loading="lazy"
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                            />
                        </div>
                        <div className="flex-1 flex flex-col">
                            <h3 className="font-semibold text-base text-white mb-1">{product.name}</h3>
                            {showDescriptions && product.description && (
                                <p className="text-sm text-slate-400 line-clamp-2">{product.description}</p>
                            )}
                            <div className="mt-auto pt-4 flex items-center justify-between">
                                {showPrices && (
                                    <span className="font-bold text-xl" style={{ color: primaryColor }}>
                                        ₺{Number(product.price).toFixed(2)}
                                    </span>
                                )}
                                {product.sku && (
                                    <span className="text-[10px] text-slate-600 font-mono px-2 py-1 bg-slate-800 rounded">
                                        {product.sku}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="h-10 px-8 flex items-center justify-center border-t border-slate-800 shrink-0">
                <span className="text-xs text-slate-600 font-mono">{catalogName?.toUpperCase().replace(/\s/g, '_')}</span>
            </div>
        </div>
    )
}
