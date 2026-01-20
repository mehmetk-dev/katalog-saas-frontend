import NextImage from "next/image"

import { TemplateProps } from "./types"

// Clean White - Temiz minimalist beyaz
export function CleanWhiteTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    showAttributes,
    showSku,
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

    const getGridRows = () => {
        return "grid-rows-3"
    }

    return (
        <div className="bg-transparent h-full flex flex-col overflow-hidden">
            {/* Minimal Header */}
            <div className="h-16 px-12 flex items-end pb-4 shrink-0">
                {pageNumber === 1 ? (
                    <div className="flex items-center gap-4 w-full">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor }}>
                            <span className="text-white font-medium">{(catalogName || "K")[0]}</span>
                        </div>
                        <h1 className="text-lg font-medium text-gray-900 truncate">{catalogName}</h1>
                    </div>
                ) : (
                    <div className="w-full flex justify-between items-center text-sm text-gray-400 h-full">
                        <span className="truncate max-w-[70%]">{catalogName}</span>
                        <span className="font-medium">{pageNumber}</span>
                    </div>
                )}
            </div>

            {/* Çok temiz Dinamik grid */}
            <div className={`flex-1 px-12 py-6 grid ${getGridCols()} ${getGridRows()} gap-x-8 gap-y-6 overflow-hidden`} style={{ maxHeight: 'calc(100% - 112px)' }}>
                {safeProducts.map((product) => {
                    const productUrl = product.product_url
                    const Wrapper = productUrl ? 'a' : 'div'
                    const wrapperProps = productUrl ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'flex flex-col h-full group cursor-pointer shrink-0'
                    } : {
                        className: 'flex flex-col h-full shrink-0'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)}>
                            <div className="aspect-[3/2] bg-gray-50 rounded-xl overflow-hidden mb-3 relative shrink-0">
                                <NextImage src={product.image_url || product.images?.[0] || "/placeholder.svg"} alt={product.name} fill unoptimized className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
                                {productUrl && (
                                    <div className="absolute top-3 right-3 bg-white/60 backdrop-blur-sm p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between overflow-hidden">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-gray-600 transition-colors leading-tight flex-1">{product.name}</h3>
                                        {showPrices && (
                                            <span className="font-bold text-sm shrink-0 leading-tight" style={{ color: primaryColor }}>
                                                {(() => {
                                                    const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                    return `${symbol}${Number(product.price).toFixed(2)}`
                                                })()}
                                            </span>
                                        )}
                                    </div>
                                    {showDescriptions && product.description && (
                                        <p className="text-[10px] text-gray-400 line-clamp-1 leading-tight">{product.description}</p>
                                    )}

                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                        <div className="mt-2 space-y-0.5 border-t border-gray-50 pt-2">
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 3).map((attr, aidx) => (
                                                <div key={aidx} className="flex justify-between items-center text-[9px] gap-2">
                                                    <span className="text-gray-300 font-medium truncate flex-1">{attr.name}</span>
                                                    <span className="text-gray-500 font-bold shrink-0 truncate max-w-[60%]">
                                                        {attr.value}{attr.unit}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {showSku && product.sku && (
                                    <div className="mt-auto pt-2">
                                        <span className="text-[8px] text-gray-200 font-mono tracking-widest leading-none uppercase">SKU: {product.sku}</span>
                                    </div>
                                )}
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-12 px-12 flex items-center justify-between border-t border-gray-50 shrink-0">
                <span className="text-[9px] text-gray-300 font-medium tracking-widest uppercase">{catalogName}</span>
                <span className="text-xs text-gray-400 font-bold px-3 py-1 bg-gray-50 rounded-full">{pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
}
