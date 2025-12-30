import { TemplateProps } from "./types"

// Industrial - Endüstriyel/teknik katalog
export function IndustrialTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    showAttributes,
    showSku,
    pageNumber = 1,
    totalPages = 1,
}: TemplateProps) {
    const safeProducts = products || []

    return (
        <div className="bg-transparent h-full flex flex-col overflow-hidden">
            {/* Üst Header Bar */}
            <div className="h-2 shrink-0" style={{ backgroundColor: primaryColor }} />

            {/* Header */}
            <div className="h-14 bg-zinc-900 px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-yellow-400" />
                    <h1 className="text-white font-bold uppercase tracking-wider text-sm truncate max-w-[250px]">{catalogName || "Teknik Katalog"}</h1>
                </div>
                <div className="text-zinc-400 text-[10px] font-mono tracking-widest">REF:{String(pageNumber).padStart(3, '0')}</div>
            </div>

            {/* Tek kolon tam genişlik liste */}
            <div className="flex-1 p-4 flex flex-col gap-2 overflow-hidden">
                {safeProducts.map((product, idx) => {
                    const productUrl = (product as any).product_url
                    const Wrapper = productUrl ? 'a' : 'div'
                    const wrapperProps = productUrl ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'bg-white flex items-center gap-4 p-3 rounded h-[76px] border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all cursor-pointer group shrink-0 overflow-hidden'
                    } : {
                        className: 'bg-white flex items-center gap-4 p-3 rounded h-[76px] border border-zinc-200 shrink-0 overflow-hidden'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as any)}>
                            {/* Sıra No */}
                            <div className="w-8 h-8 rounded bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                {String(idx + 1 + (pageNumber - 1) * 8).padStart(2, '0')}
                            </div>

                            {/* Görsel */}
                            <div className="w-14 h-14 shrink-0 bg-white rounded border border-zinc-100 overflow-hidden relative">
                                <img loading="lazy" src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-500" />
                                {productUrl && (
                                    <div className="absolute top-0 right-0 bg-zinc-900 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Bilgiler */}
                            <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="font-bold text-xs text-zinc-900 uppercase truncate leading-none">{product.name}</h3>
                                    {showSku && product.sku && <span className="text-[8px] text-zinc-400 font-mono bg-zinc-100 px-1 py-0.2 rounded shrink-0 leading-none">#{product.sku}</span>}
                                </div>
                                {showDescriptions && product.description && (
                                    <p className="text-[10px] text-zinc-500 line-clamp-1 leading-none italic">{product.description}</p>
                                )}

                                {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                        {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 3).map((attr, aidx) => (
                                            <div key={aidx} className="flex items-center gap-1 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                                                <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-tighter truncate">{attr.name}</span>
                                                <div className="w-px h-2 bg-zinc-200" />
                                                <span className="text-[8px] text-zinc-700 font-black truncate">{attr.value}{attr.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Fiyat */}
                            {showPrices && (
                                <div className="shrink-0 text-right overflow-hidden ml-2">
                                    <span className="font-black text-sm block leading-none" style={{ color: primaryColor }}>
                                        {(() => {
                                            const currency = (product as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
                                            const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                            return `${symbol}${Number(product.price).toFixed(2)}`
                                        })()}
                                    </span>
                                </div>
                            )}
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-10 bg-zinc-900 flex items-center justify-between px-6 shrink-0">
                <span className="text-[9px] text-zinc-500 font-mono font-bold tracking-widest">{catalogName?.toUpperCase().replace(/\s/g, '-')}-{new Date().getFullYear()}</span>
                <span className="text-zinc-400 text-xs font-black font-mono">{pageNumber} // {totalPages}</span>
            </div>
        </div>
    )
}
