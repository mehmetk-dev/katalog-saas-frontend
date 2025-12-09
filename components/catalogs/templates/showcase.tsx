import { TemplateProps } from "./types"

// Showcase - Spotlight vitrin, 1 dev ürün odaklı
export function ShowcaseTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    pageNumber = 1,
    totalPages = 1,
}: TemplateProps) {
    const safeProducts = products || []
    const [main, ...others] = safeProducts

    return (
        <div className="bg-black h-full flex flex-col overflow-hidden text-white">
            {/* Minimal Header */}
            <div className="h-14 px-8 flex items-center justify-between border-b border-white/10 shrink-0">
                <h1 className="text-sm font-light tracking-[0.4em] uppercase">{catalogName || "Vitrin"}</h1>
                <span className="text-xs text-white/40">{pageNumber}/{totalPages}</span>
            </div>

            {/* Ana İçerik */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sol - Dev ürün */}
                {main && (
                    <div className="w-3/5 relative">
                        <img loading="lazy"
                            src={main.image_url || "/placeholder.svg"}
                            alt={main.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 p-8 max-w-md">
                            <h2 className="text-3xl font-light mb-3">{main.name}</h2>
                            {showDescriptions && main.description && (
                                <p className="text-white/70 text-sm line-clamp-3 mb-4">{main.description}</p>
                            )}
                            {showPrices && (
                                <p className="text-2xl font-light" style={{ color: primaryColor }}>
                                    ₺{Number(main.price).toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Sağ - 2 küçük ürün */}
                <div className="w-2/5 flex flex-col bg-zinc-900">
                    {others.slice(0, 2).map((product, idx) => (
                        <div key={product.id} className={`flex-1 relative ${idx === 0 ? 'border-b border-white/10' : ''}`}>
                            <img loading="lazy"
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="text-sm font-light">{product.name}</h3>
                                {showPrices && (
                                    <p className="text-sm mt-1" style={{ color: primaryColor }}>
                                        ₺{Number(product.price).toFixed(2)}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
