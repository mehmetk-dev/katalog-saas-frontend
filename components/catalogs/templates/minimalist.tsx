import { TemplateProps } from "./types"

export function MinimalistTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    pageNumber = 1,
    totalPages = 1,
    columnsPerRow = 2,
}: TemplateProps) {
    const HEADER_HEIGHT = "60px"

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
            {/* Header Alanı - Tüm sayfalarda aynı yükseklik */}
            <div className="shrink-0 px-8" style={{ height: HEADER_HEIGHT }}>
                {pageNumber === 1 ? (
                    <div className="h-full flex items-center justify-center border-b border-gray-200">
                        <h1 className="text-xl font-light text-gray-900 uppercase tracking-[0.25em]">
                            {catalogName || "KATALOG"}
                        </h1>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-between border-b border-gray-200">
                        <span className="text-sm font-light uppercase tracking-widest text-gray-500">{catalogName}</span>
                        <span className="text-xs text-gray-400">Sayfa {pageNumber}</span>
                    </div>
                )}
            </div>

            {/* Dinamik Grid İçerik */}
            <div className={`flex-1 p-6 grid ${getGridCols()} gap-5 content-start`}>
                {(products || []).map((product) => {
                    const productUrl = (product as any).product_url
                    const Wrapper = productUrl ? 'a' : 'div'
                    const wrapperProps = productUrl ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'flex flex-col bg-gray-50 rounded-lg overflow-hidden cursor-pointer group hover:bg-gray-100 transition-colors'
                    } : {
                        className: 'flex flex-col bg-gray-50 rounded-lg overflow-hidden'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as any)}>
                            {/* Görsel */}
                            <div className="aspect-square p-4 flex items-center justify-center bg-white relative">
                                <img loading="lazy"
                                    crossOrigin="anonymous"
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.name}
                                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                />
                                {productUrl && (
                                    <div className="absolute top-2 right-2 text-gray-300 group-hover:text-gray-600 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Bilgiler */}
                            <div className="p-4 text-center space-y-1.5">
                                <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-black transition-colors">{product.name}</h3>

                                {showDescriptions && product.description && (
                                    <p className="text-gray-500 font-light text-xs line-clamp-2 leading-relaxed">
                                        {product.description}
                                    </p>
                                )}

                                {showPrices && (
                                    <p className="text-lg font-light pt-1" style={{ color: primaryColor }}>
                                        {(() => {
                                            const currency = (product as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
                                            const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                            return `${symbol}${Number(product.price).toFixed(2)}`
                                        })()}
                                    </p>
                                )}

                                {product.sku && (
                                    <p className="text-[9px] text-gray-400 font-mono">SKU: {product.sku}</p>
                                )}
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-8 px-8 flex items-center justify-center border-t border-gray-200 shrink-0">
                <span className="text-[9px] tracking-widest text-gray-300 uppercase">Sayfa {pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
}
