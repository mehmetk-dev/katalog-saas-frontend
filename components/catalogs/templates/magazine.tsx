import { TemplateProps } from "./types"

export function MagazineTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    pageNumber = 1,
    totalPages = 1,
    columnsPerRow = 2,
}: TemplateProps) {
    const HEADER_HEIGHT = "70px"
    const safeProducts = products || []
    const [featured, ...others] = safeProducts

    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
            case 4: return "grid-cols-4"
            default: return "grid-cols-2"
        }
    }

    return (
        <div className="bg-white h-full flex flex-col relative overflow-hidden">
            {/* Dekoratif arka plan */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full opacity-5 blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ backgroundColor: primaryColor }} />

            {/* Header Alanı - Tüm sayfalarda aynı yükseklik */}
            <div className="shrink-0 relative z-10" style={{ height: HEADER_HEIGHT }}>
                {pageNumber === 1 ? (
                    <div className="h-full px-6 flex flex-col justify-center">
                        <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400">Koleksiyon 2024</span>
                        <h1 className="text-2xl font-serif font-medium text-gray-900 italic">
                            {catalogName || "Katalog"}
                        </h1>
                    </div>
                ) : (
                    <div className="h-full px-6 flex items-center justify-between border-b border-gray-100">
                        <span className="text-sm font-serif italic text-gray-600">{catalogName}</span>
                        <span className="text-xs text-gray-400">Sayfa {pageNumber}</span>
                    </div>
                )}
            </div>

            {/* İçerik */}
            <div className="flex-1 p-5 flex flex-col gap-4 relative z-10">
                {/* Featured Ürün */}
                {featured && (
                    <div className="relative h-[260px] overflow-hidden rounded-xl bg-gray-100 shrink-0 group">
                        <img loading="lazy"
                            crossOrigin="anonymous"
                            src={featured.image_url || "/placeholder.svg"}
                            alt={featured.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                            <h3 className="text-xl font-serif font-medium">{featured.name}</h3>
                            {showDescriptions && featured.description && (
                                <p className="text-sm text-white/80 line-clamp-2 mt-1">{featured.description}</p>
                            )}
                            {showPrices && (
                                <p className="font-semibold text-lg mt-2">
                                    {(() => {
                                        const currency = (featured as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
                                        const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                        return `${symbol}${Number(featured.price).toFixed(2)}`
                                    })()}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Diğer Ürünler - 2x2 grid */}
                {others.length > 0 && (
                    <div className={`grid ${getGridCols()} gap-3 flex-1`}>
                        {others.map((product) => (
                            <div key={product.id} className="relative overflow-hidden rounded-lg bg-gray-100 group">
                                <img loading="lazy"
                                    crossOrigin="anonymous"
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.name}
                                    className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                                    <h3 className="text-sm font-serif line-clamp-1">{product.name}</h3>
                                    {showDescriptions && product.description && (
                                        <p className="text-[10px] text-white/70 line-clamp-1 mt-0.5">{product.description}</p>
                                    )}
                                    {showPrices && (
                                        <p className="text-sm font-medium mt-1">
                                            {(() => {
                                                const currency = (product as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toFixed(2)}`
                                            })()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="h-8 px-6 flex items-center justify-center border-t border-gray-100 shrink-0 relative z-10">
                <span className="text-[10px] text-gray-400 font-serif italic">{catalogName} • Sayfa {pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
}
