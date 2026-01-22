import NextImage from "next/image"

import { TemplateProps } from "./types"

export function CompactListTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    showAttributes,
    showSku,
    showUrls = false,
    pageNumber = 1,
    totalPages = 1,
    logoUrl,
    logoPosition,
    logoSize,
}: TemplateProps) {
    const HEADER_HEIGHT = "48px"

    // Logo boyutu
    const getLogoHeight = () => {
        switch (logoSize) {
            case 'small': return 22
            case 'large': return 36
            default: return 28
        }
    }

    // Header'da logo var mı?
    const isHeaderLogo = logoPosition?.startsWith('header')
    const logoAlignment = logoPosition?.split('-')[1] || 'left'

    return (
        <div className="bg-transparent h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="shrink-0" style={{ height: HEADER_HEIGHT }}>
                {pageNumber === 1 ? (
                    <div className="h-full px-6 flex items-center border-b-2" style={{ borderColor: primaryColor }}>
                        {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                            <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain mr-3" />
                        )}
                        {!(logoUrl && isHeaderLogo && logoAlignment === 'center') && (
                            <h1 className="text-base font-bold uppercase tracking-widest" style={{ color: primaryColor }}>
                                {catalogName || "Katalog"}
                            </h1>
                        )}
                        {logoUrl && isHeaderLogo && logoAlignment === 'center' && (
                            <div className="flex-1 flex justify-center">
                                <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                            </div>
                        )}
                        {logoUrl && isHeaderLogo && logoAlignment === 'right' && (
                            <>
                                <div className="flex-1" />
                                <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                            </>
                        )}
                    </div>
                ) : (
                    <div className="h-full px-6 flex items-center justify-between border-b border-gray-200">
                        {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                            <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight() - 6} unoptimized style={{ height: getLogoHeight() - 6 }} className="object-contain mr-2" />
                        )}
                        <span className="text-sm font-medium" style={{ color: primaryColor }}>{catalogName}</span>
                        <div className="flex-1" />
                        <span className="text-xs text-gray-400">Sayfa {pageNumber}</span>
                        {logoUrl && isHeaderLogo && logoAlignment === 'right' && (
                            <NextImage src={logoUrl} alt="Logo" width={120} height={getLogoHeight() - 6} unoptimized style={{ height: getLogoHeight() - 6 }} className="object-contain ml-2" />
                        )}
                    </div>
                )}
            </div>

            {/* Liste İçerik */}
            <div className="flex-1 px-6 py-4 flex flex-col gap-2 overflow-hidden">
                {(products || []).map((product) => {
                    const productUrl = product.product_url
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'flex items-center gap-3 p-2 h-[68px] rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group shrink-0'
                    } : {
                        className: 'flex items-center gap-3 p-2 h-[68px] rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors shrink-0'
                    }

                    return (
                        <Wrapper
                            key={product.id}
                            {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)}
                        >
                            {/* Görsel */}
                            <div className="w-12 h-12 shrink-0 bg-white rounded-md border border-gray-200 overflow-hidden relative">
                                <NextImage src={product.image_url || product.images?.[0] || "/placeholder.svg"} alt={product.name} fill unoptimized className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                {(showUrls && productUrl) && (
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Bilgiler */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors leading-none">{product.name}</h3>
                                        {showDescriptions && product.description && (
                                            <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5 leading-none">{product.description}</p>
                                        )}
                                        {showSku && product.sku && (
                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">SKU: {product.sku}</p>
                                        )}
                                        {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                                                {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 3).map((attr, idx) => (
                                                    <span key={idx} className="text-[9px] text-gray-500 bg-gray-100 px-1 py-0.2 rounded flex items-center gap-0.5 max-w-[120px]">
                                                        <span className="font-medium opacity-70 truncate">{attr.name}:</span>
                                                        <span className="font-semibold text-gray-700 truncate">{attr.value}{attr.unit}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {showPrices && (
                                        <div className="text-right shrink-0">
                                            <span className="font-bold text-base" style={{ color: primaryColor }}>
                                                {(() => {
                                                    const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                    return `${symbol}${Number(product.price).toFixed(2)}`
                                                })()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-8 px-6 flex items-center justify-center border-t border-gray-100 shrink-0">
                <span className="text-[10px] text-gray-400">{catalogName} • Sayfa {pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
}
