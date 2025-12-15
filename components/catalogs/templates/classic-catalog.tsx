import { TemplateProps } from "./types"

// Classic Catalog - Klasik tablo formatı
export function ClassicCatalogTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    pageNumber = 1,
    totalPages = 1,
}: TemplateProps) {
    const safeProducts = products || []

    return (
        <div className="bg-white h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0" style={{ backgroundColor: primaryColor }}>
                {pageNumber === 1 ? (
                    <div className="px-8 py-6 text-white">
                        <h1 className="text-2xl font-bold">{catalogName || "Ürün Kataloğu"}</h1>
                        <p className="text-white/70 text-sm mt-1">Güncel Fiyat Listesi - 2024</p>
                    </div>
                ) : (
                    <div className="px-8 py-3 text-white flex justify-between items-center">
                        <span className="font-medium">{catalogName}</span>
                        <span className="text-sm text-white/70">Sayfa {pageNumber}</span>
                    </div>
                )}
            </div>

            {/* Tablo Header */}
            <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wide border-b shrink-0">
                <div className="col-span-1">#</div>
                <div className="col-span-2">Görsel</div>
                <div className="col-span-4">Ürün Adı</div>
                <div className="col-span-3">{showDescriptions ? "Açıklama" : ""}</div>
                <div className="col-span-2 text-right">{showPrices ? "Fiyat" : ""}</div>
            </div>

            {/* Ürün Listesi */}
            <div className="flex-1 overflow-hidden">
                {safeProducts.slice(0, 8).map((product, idx) => {
                    const productUrl = (product as any).product_url
                    const Wrapper = productUrl ? 'a' : 'div'
                    const wrapperProps = productUrl ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: `grid grid-cols-12 gap-2 px-6 py-3 items-center border-b hover:bg-gray-50 transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} block text-inherit no-underline`
                    } : {
                        className: `grid grid-cols-12 gap-2 px-6 py-3 items-center border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`
                    }

                    return (
                        <Wrapper
                            key={product.id}
                            {...(wrapperProps as any)}
                        >
                            <div className="col-span-1 text-sm font-mono text-gray-400">{String(idx + 1).padStart(2, '0')}</div>
                            <div className="col-span-2">
                                <div className="w-14 h-14 rounded bg-gray-100 overflow-hidden relative">
                                    <img loading="lazy" src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
                                    {productUrl && (
                                        <div className="absolute top-0 right-0 bg-white/80 p-0.5 rounded-bl">
                                            <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-span-4">
                                <p className="font-semibold text-sm text-gray-900 group-hover:text-violet-600 transition-colors">{product.name}</p>
                                {product.sku && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{product.sku}</p>}
                            </div>
                            <div className="col-span-3">
                                {showDescriptions && product.description && (
                                    <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                                )}
                            </div>
                            <div className="col-span-2 text-right">
                                {showPrices && (
                                    <span className="font-bold text-base" style={{ color: primaryColor }}>
                                        {(() => {
                                            const currency = (product as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
                                            const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                            return `${symbol}${Number(product.price).toFixed(2)}`
                                        })()}
                                    </span>
                                )}
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-12 px-8 flex items-center justify-between border-t bg-gray-50 shrink-0">
                <span className="text-[10px] text-gray-400">Fiyatlar KDV dahildir. Stok durumu değişkenlik gösterebilir.</span>
                <span className="text-xs font-semibold" style={{ color: primaryColor }}>{pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
}
