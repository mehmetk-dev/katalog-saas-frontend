import NextImage from "next/image"

import { TemplateProps } from "./types"

// Product Tiles - Kompakt karo görünümü
export function ProductTilesTemplate({
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
    logoUrl,
    logoPosition,
    logoSize,
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

    // Logo boyutu
    const getLogoHeight = () => {
        switch (logoSize) {
            case 'small': return 22
            case 'large': return 34
            default: return 28
        }
    }

    // Header'da logo var mı?
    const isHeaderLogo = logoPosition?.startsWith('header')
    const logoAlignment = logoPosition?.split('-')[1] || 'left'

    return (
        <div className="bg-gray-100 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-12 bg-white border-b px-5 flex items-center justify-between shrink-0">
                {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                    <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain mr-3" />
                )}
                {!(logoUrl && isHeaderLogo && logoAlignment === 'center') && (
                    <h1 className="font-bold text-sm text-gray-900 truncate max-w-[200px]">{catalogName || "Ürünler"}</h1>
                )}
                {logoUrl && isHeaderLogo && logoAlignment === 'center' && (
                    <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                )}
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-medium">{safeProducts.length} ÜRÜN</span>
                    <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600">{pageNumber}/{totalPages}</span>
                </div>
                {logoUrl && isHeaderLogo && logoAlignment === 'right' && (
                    <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain ml-3" />
                )}
            </div>

            {/* Dinamik Grid */}
            <div className={`flex-1 p-3 grid ${getGridCols()} ${getGridRows()} gap-3 overflow-hidden`} style={{ maxHeight: 'calc(100% - 80px)' }}>
                {safeProducts.map((product) => {
                    const productUrl = product.product_url
                    const Wrapper = productUrl ? 'a' : 'div'
                    const wrapperProps = productUrl ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all h-full group cursor-pointer border border-transparent hover:border-gray-200 flex flex-col shrink-0'
                    } : {
                        className: 'bg-white rounded-xl overflow-hidden shadow-sm h-full flex flex-col border border-transparent shrink-0'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)}>
                            <div className="aspect-square bg-gray-50 overflow-hidden shrink-0 relative">
                                <NextImage src={product.image_url || product.images?.[0] || "/placeholder.svg"} alt={product.name} fill unoptimized className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-500" />
                                {productUrl && (
                                    <div className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-sm p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                        <svg className="w-2.5 h-2.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="p-2.5 flex-1 flex flex-col justify-between overflow-hidden">
                                <div className="space-y-0.5">
                                    <h3 className="font-bold text-[11px] text-gray-900 line-clamp-1 leading-tight">{product.name}</h3>
                                    {showDescriptions && product.description && (
                                        <p className="text-[9px] text-gray-400 line-clamp-1 leading-none">{product.description}</p>
                                    )}

                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 2).map((attr, aidx) => (
                                                <div key={aidx} className="bg-gray-50 px-1 py-0.2 rounded text-[8px] border border-gray-100 flex items-center gap-0.5 shrink-0">
                                                    <span className="text-gray-400 font-medium truncate">{attr.name}:</span>
                                                    <span className="text-gray-700 font-bold truncate">{attr.value}{attr.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-auto pt-1.5 flex items-center justify-between border-t border-gray-50">
                                    {showPrices && (
                                        <p className="font-black text-xs leading-none" style={{ color: primaryColor }}>
                                            {(() => {
                                                const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toFixed(2)}`
                                            })()}
                                        </p>
                                    )}
                                    {showSku && product.sku && <span className="text-[8px] text-gray-300 font-mono">#{product.sku}</span>}
                                </div>
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-8 bg-white border-t flex items-center justify-center shrink-0">
                <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">{catalogName}</span>
            </div>
        </div>
    )
}
