import { TemplateProps } from "./types"
import { useTranslation } from "@/lib/i18n-provider"

// Luxury - Lüks koleksiyon, altın tema
export function LuxuryTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    pageNumber = 1,
    totalPages = 1,
    columnsPerRow = 2,
}: TemplateProps) {
    const { t } = useTranslation()
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
        <div className="h-full flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)' }}>
            {/* Altın border */}
            <div className="h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 shrink-0" />

            {/* Header */}
            <div className="h-20 px-10 flex items-center justify-center shrink-0">
                {pageNumber === 1 ? (
                    <div className="text-center">
                        <div className="text-[10px] text-yellow-600 tracking-[0.4em] uppercase mb-2">{t('catalogs.premiumCollection')}</div>
                        <h1 className="text-2xl font-serif text-white tracking-wide">{catalogName || t('catalogs.luxury')}</h1>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-px bg-gradient-to-r from-transparent to-yellow-600" />
                        <span className="text-yellow-600 text-sm font-serif">{pageNumber}</span>
                        <div className="w-12 h-px bg-gradient-to-l from-transparent to-yellow-600" />
                    </div>
                )}
            </div>

            {/* Dinamik Grid - Lüks kartlar */}
            <div className={`flex-1 px-10 pb-6 grid ${getGridCols()} gap-6 content-center`}>
                {safeProducts.map((product) => (
                    <div key={product.id} className="bg-zinc-900/50 rounded-lg overflow-hidden border border-yellow-900/30 group">
                        <div className="aspect-[4/3] relative overflow-hidden">
                            <img loading="lazy"
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                        <div className="p-4 text-center">
                            <h3 className="font-serif text-white text-sm">{product.name}</h3>
                            {showDescriptions && product.description && (
                                <p className="text-[11px] text-zinc-500 line-clamp-1 mt-1">{product.description}</p>
                            )}
                            {showPrices && (
                                <p className="text-lg font-serif text-yellow-500 mt-2">
                                    ₺{Number(product.price).toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="h-12 flex items-center justify-center border-t border-yellow-900/20 shrink-0">
                <span className="text-[10px] text-yellow-700/50 tracking-[0.3em] uppercase font-serif">
                    {catalogName} • {pageNumber} / {totalPages}
                </span>
            </div>

            {/* Alt altın border */}
            <div className="h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 shrink-0" />
        </div>
    )
}

