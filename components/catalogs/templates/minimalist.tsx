import NextImage from "next/image"

import { TemplateProps } from "./types"

export function MinimalistTemplate({
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
    logoUrl,
    logoPosition,
    logoSize,
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

    const getGridRows = () => {
        return "grid-rows-3"
    }

    // Logo boyutu
    const getLogoHeight = () => {
        switch (logoSize) {
            case 'small': return 28
            case 'large': return 44
            default: return 36
        }
    }

    // Header'da logo var mı?
    const isHeaderLogo = logoPosition?.startsWith('header')
    const logoAlignment = logoPosition?.split('-')[1] || 'left'

    return (
        <div className="bg-transparent h-full flex flex-col overflow-hidden">
            {/* Header Alanı - Tüm sayfalarda aynı yükseklik */}
            <div className="shrink-0 px-8" style={{ height: HEADER_HEIGHT }}>
                {pageNumber === 1 ? (
                    <div className="h-full flex items-center justify-center border-b border-gray-200">
                        {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                            <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain mr-4 absolute left-8" />
                        )}
                        {logoUrl && isHeaderLogo && logoAlignment === 'center' ? (
                            <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                        ) : (
                            <h1 className="text-xl font-light text-gray-900 uppercase tracking-[0.25em]">
                                {catalogName || "KATALOG"}
                            </h1>
                        )}
                        {logoUrl && isHeaderLogo && logoAlignment === 'right' && (
                            <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain ml-4 absolute right-8" />
                        )}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-between border-b border-gray-200">
                        {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                            <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight() - 8} unoptimized style={{ height: getLogoHeight() - 8 }} className="object-contain mr-3" />
                        )}
                        <span className="text-sm font-light uppercase tracking-widest text-gray-500">{catalogName}</span>
                        <div className="flex-1" />
                        <span className="text-xs text-gray-400">Sayfa {pageNumber}</span>
                        {logoUrl && isHeaderLogo && logoAlignment === 'right' && (
                            <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight() - 8} unoptimized style={{ height: getLogoHeight() - 8 }} className="object-contain ml-3" />
                        )}
                    </div>
                )}
            </div>

            {/* Dinamik Grid İçerik */}
            <div className={`flex-1 p-6 grid ${getGridCols()} ${getGridRows()} gap-5 overflow-hidden`} style={{ maxHeight: 'calc(100% - 92px)' }}>
                {(products || []).map((product) => {
                    const productUrl = product.product_url
                    const Wrapper = productUrl ? 'a' : 'div'
                    const wrapperProps = productUrl ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden cursor-pointer group hover:bg-gray-100 transition-colors shrink-0'
                    } : {
                        className: 'flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden shrink-0'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)}>
                            {/* Görsel */}
                            <div className="aspect-square p-3 flex items-center justify-center bg-white relative shrink-0">
                                <NextImage src={product.image_url || product.images?.[0] || "/placeholder.svg"} alt={product.name} fill unoptimized className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                                {productUrl && (
                                    <div className="absolute top-2 right-2 text-gray-300 group-hover:text-gray-600 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Bilgiler */}
                            <div className="p-3 text-center flex-1 flex flex-col justify-between overflow-hidden">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-black transition-colors leading-tight">{product.name}</h3>

                                    {showDescriptions && product.description && (
                                        <p className="text-gray-500 font-light text-[10px] line-clamp-2 leading-tight">
                                            {product.description}
                                        </p>
                                    )}

                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                        <div className="pt-1.5 border-t border-gray-100 space-y-0.5 mt-1">
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 3).map((attr, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-[9px] gap-1">
                                                    <span className="text-gray-400 font-light truncate flex-1">{attr.name}</span>
                                                    <span className="text-gray-600 font-medium shrink-0 truncate max-w-[60%]">
                                                        {attr.value}{attr.unit}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto pt-1.5">
                                    {showPrices && (
                                        <p className="text-base font-light leading-none" style={{ color: primaryColor }}>
                                            {(() => {
                                                const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toFixed(2)}`
                                            })()}
                                        </p>
                                    )}

                                    {showSku && product.sku && (
                                        <p className="text-[8px] text-gray-300 font-mono mt-0.5">SKU: {product.sku}</p>
                                    )}
                                </div>
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
