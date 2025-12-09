import { TemplateProps } from "./types"

// Elegant Cards - Lüks kart tasarımı, geniş boşluklar
export function ElegantCardsTemplate({
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
        <div className="bg-stone-50 h-full flex flex-col overflow-hidden">
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
            <div className={`flex-1 p-8 grid ${getGridCols()} gap-6 content-center`}>
                {safeProducts.map((product) => (
                    <div
                        key={product.id}
                        className="bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col group"
                    >
                        <div className="h-40 bg-gradient-to-br from-stone-100 to-stone-50 overflow-hidden">
                            <img loading="lazy"
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-serif text-lg text-stone-800 mb-2">{product.name}</h3>
                            {showDescriptions && product.description && (
                                <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed flex-1">{product.description}</p>
                            )}
                            {showPrices && (
                                <p className="text-xl font-light mt-3" style={{ color: primaryColor }}>
                                    ₺{Number(product.price).toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
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
