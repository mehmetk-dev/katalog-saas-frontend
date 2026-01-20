import NextImage from "next/image"

import { TemplateProps } from "./types"

// Catalog Pro - Profesyonel 3 sütun grid
export function CatalogProTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    showAttributes,
    showSku,
    pageNumber = 1,
    totalPages = 1,
    columnsPerRow = 3,
}: TemplateProps) {
    const safeProducts = products || []

    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
            case 4: return "grid-cols-4"
            default: return "grid-cols-3"
        }
    }

    const getGridRows = () => {
        return "grid-rows-3"
    }

    return (
        <div className="bg-transparent h-full flex flex-col overflow-hidden">
            {/* Kalın renkli header bar */}
            <div className="h-2 shrink-0" style={{ backgroundColor: primaryColor }} />

            {/* Header */}
            <div className="h-14 px-6 flex items-center justify-between border-b shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primaryColor }}>
                        {(catalogName || "K")[0]}
                    </div>
                    <span className="font-bold text-gray-900 text-sm truncate max-w-[200px]">{catalogName}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">SAYFA {pageNumber}</span>
            </div>

            {/* Dinamik Grid */}
            <div className={`flex-1 p-4 grid ${getGridCols()} ${getGridRows()} gap-4 overflow-hidden`} style={{ maxHeight: 'calc(100% - 100px)' }}>
                {safeProducts.map((product) => {
                    const productUrl = product.product_url
                    const Wrapper = productUrl ? 'a' : 'div'
                    const wrapperProps = productUrl ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'flex flex-col h-full bg-gray-50/50 rounded-lg overflow-hidden cursor-pointer group hover:shadow-md hover:bg-white transition-all border border-transparent hover:border-gray-200 shrink-0'
                    } : {
                        className: 'flex flex-col h-full bg-gray-50/50 rounded-lg overflow-hidden border border-transparent shrink-0'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)}>
                            <div className="aspect-square bg-white overflow-hidden relative shrink-0">
                                <NextImage src={product.image_url || product.images?.[0] || "/placeholder.svg"} alt={product.name} fill unoptimized className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
                                {productUrl && (
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                        <svg className="w-3 h-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="p-3 flex-1 flex flex-col justify-between overflow-hidden">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-xs text-gray-900 line-clamp-1 group-hover:text-violet-700 transition-colors leading-tight">{product.name}</h3>
                                    {showDescriptions && product.description && (
                                        <p className="text-[10px] text-gray-500 line-clamp-1 leading-tight">{product.description}</p>
                                    )}

                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                        <div className="mt-2 space-y-0.5 border-t border-gray-100 pt-1.5">
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 3).map((attr, aidx) => (
                                                <div key={aidx} className="flex justify-between items-center text-[9px] gap-1">
                                                    <span className="text-gray-400 font-medium truncate flex-1 uppercase tracking-tighter">{attr.name}</span>
                                                    <span className="text-gray-700 font-bold shrink-0 truncate max-w-[60%]">
                                                        {attr.value}{attr.unit}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-100/50">
                                    {showPrices && (
                                        <p className="font-bold text-sm leading-none" style={{ color: primaryColor }}>
                                            {(() => {
                                                const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toFixed(2)}`
                                            })()}
                                        </p>
                                    )}
                                    {showSku && product.sku && <span className="text-[8px] text-gray-400 font-mono">#{product.sku}</span>}
                                </div>
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-10 px-6 flex items-center justify-between bg-gray-50 border-t shrink-0">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{catalogName}</span>
                <span className="text-xs font-black font-mono" style={{ color: primaryColor }}>{pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
}
