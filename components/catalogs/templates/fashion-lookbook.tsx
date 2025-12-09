import { TemplateProps } from "./types"

// Fashion Lookbook - Moda kataloğu, asimetrik layout
export function FashionLookbookTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    pageNumber = 1,
    totalPages = 1,
}: TemplateProps) {
    const safeProducts = products || []
    const [hero, second, third, fourth] = safeProducts

    return (
        <div className="bg-white h-full flex flex-col overflow-hidden">
            {/* Minimal Header */}
            <div className="h-12 px-8 flex items-center justify-center shrink-0">
                <h1 className="text-xs font-light tracking-[0.6em] uppercase text-gray-600">{catalogName || "Lookbook"}</h1>
            </div>

            {/* Asimetrik Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sol kolon - 1 büyük */}
                <div className="w-1/2 p-4 pr-2">
                    {hero && (
                        <div className="h-full relative rounded-2xl overflow-hidden">
                            <img loading="lazy" src={hero.image_url || "/placeholder.svg"} alt={hero.name} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent text-white">
                                <h2 className="text-xl font-light">{hero.name}</h2>
                                {showPrices && <p className="text-lg font-medium mt-1">₺{Number(hero.price).toFixed(2)}</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sağ kolon - 3 küçük */}
                <div className="w-1/2 p-4 pl-2 flex flex-col gap-3">
                    {[second, third, fourth].filter(Boolean).map((product, idx) => (
                        <div key={product!.id} className="flex-1 flex gap-3 bg-gray-50 rounded-xl overflow-hidden">
                            <div className="w-2/5 relative">
                                <img loading="lazy" src={product!.image_url || "/placeholder.svg"} alt={product!.name} className="w-full h-full object-cover absolute inset-0" />
                            </div>
                            <div className="w-3/5 p-4 flex flex-col justify-center">
                                <div className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                                    {idx === 0 ? 'En Çok Satan' : idx === 1 ? 'Yeni' : 'Özel Fiyat'}
                                </div>
                                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product!.name}</h3>
                                {showDescriptions && product!.description && (
                                    <p className="text-[10px] text-gray-500 line-clamp-2 mt-1">{product!.description}</p>
                                )}
                                {showPrices && (
                                    <p className="font-semibold text-base mt-2" style={{ color: primaryColor }}>
                                        ₺{Number(product!.price).toFixed(2)}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="h-10 flex items-center justify-center border-t shrink-0">
                <div className="flex items-center gap-6 text-xs text-gray-400">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <span key={i} className={i + 1 === pageNumber ? 'text-gray-900 font-medium' : ''}>
                            {String(i + 1).padStart(2, '0')}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}
