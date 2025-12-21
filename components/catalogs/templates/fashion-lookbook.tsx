import { TemplateProps } from "./types"

// Fashion Lookbook - Moda kataloğu, asimetrik layout
export function FashionLookbookTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    showAttributes,
    pageNumber = 1,
    totalPages = 1,
}: TemplateProps) {
    const safeProducts = products || []
    const [hero, second, third, fourth] = safeProducts

    return (
        <div className="bg-transparent h-full flex flex-col overflow-hidden">
            {/* Minimal Header */}
            <div className="h-12 px-8 flex items-center justify-center shrink-0">
                <h1 className="text-xs font-light tracking-[0.6em] uppercase text-gray-600">{catalogName || "Lookbook"}</h1>
            </div>

            {/* Asimetrik Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sol kolon - 1 büyük */}
                <div className="w-1/2 p-4 pr-2 shrink-0">
                    {hero && (
                        <div className="h-full relative rounded-2xl overflow-hidden group">
                            <img loading="lazy" src={hero.image_url || "/placeholder.svg"} alt={hero.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent text-white p-8 flex flex-col justify-end">
                                <h2 className="text-2xl font-light leading-tight mb-2 truncate">{hero.name}</h2>
                                {showAttributes && hero.custom_attributes && hero.custom_attributes.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {hero.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 3).map((attr, aidx) => (
                                            <span key={aidx} className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest leading-none">
                                                {attr.value}{attr.unit}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {showPrices && (
                                    <p className="text-xl font-medium" style={{ color: primaryColor }}>
                                        {(() => {
                                            const currency = (hero as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
                                            const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                            return `${symbol}${Number(hero.price).toFixed(2)}`
                                        })()}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sağ kolon - 3 küçük */}
                <div className="w-1/2 p-4 pl-2 flex flex-col gap-3 shrink-0">
                    {[second, third, fourth].filter(Boolean).map((product, idx) => {
                        const productUrl = (product as any).product_url
                        const Wrapper = productUrl ? 'a' : 'div'
                        const wrapperProps = productUrl ? {
                            href: productUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'flex-1 flex gap-3 bg-gray-50/50 hover:bg-white rounded-xl overflow-hidden border border-transparent hover:border-gray-100 hover:shadow-md transition-all cursor-pointer group shrink-0'
                        } : {
                            className: 'flex-1 flex gap-3 bg-gray-50/50 rounded-xl overflow-hidden shrink-0 border border-transparent'
                        }

                        return (
                            <Wrapper key={product!.id} {...(wrapperProps as any)}>
                                <div className="w-2/5 relative shrink-0">
                                    <img loading="lazy" src={product!.image_url || "/placeholder.svg"} alt={product!.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <div className="w-3/5 p-4 flex flex-col justify-center overflow-hidden">
                                    <div className="text-[8px] uppercase tracking-[0.2em] text-gray-400 mb-1 font-bold">
                                        {idx === 0 ? 'SEZONUN SEÇİMİ' : idx === 1 ? 'YENİ GELEN' : 'ÖZEL SERİ'}
                                    </div>
                                    <h3 className="text-xs font-bold text-gray-900 line-clamp-1 leading-tight mb-1">{product!.name}</h3>
                                    {showDescriptions && product!.description && (
                                        <p className="text-[9px] text-gray-500 line-clamp-1 leading-tight italic">{product!.description}</p>
                                    )}

                                    {showAttributes && product!.custom_attributes && product!.custom_attributes.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2 mb-1">
                                            {product!.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 2).map((attr, aidx) => (
                                                <span key={aidx} className="text-[8px] bg-white border border-gray-100 px-1.5 py-0.5 rounded text-gray-400 font-bold uppercase tracking-tighter truncate">
                                                    {attr.value}{attr.unit}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {showPrices && (
                                        <p className="font-bold text-sm mt-1" style={{ color: primaryColor }}>
                                            {(() => {
                                                const currency = (product as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product!.price).toFixed(2)}`
                                            })()}
                                        </p>
                                    )}
                                </div>
                            </Wrapper>
                        )
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="h-10 flex items-center justify-center border-t border-gray-100 shrink-0">
                <div className="flex items-center gap-6 text-[10px] text-gray-300 font-bold tracking-[0.3em]">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <span key={i} className={i + 1 === pageNumber ? 'text-gray-900 border-b-2' : ''} style={{ borderColor: i + 1 === pageNumber ? primaryColor : 'transparent' }}>
                            {String(i + 1).padStart(2, '0')}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}
