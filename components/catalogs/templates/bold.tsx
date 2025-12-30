import { TemplateProps } from "./types"

export function BoldTemplate({
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
    const HEADER_HEIGHT = "56px"

    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
            case 4: return "grid-cols-4"
            default: return "grid-cols-2"
        }
    }

    const getGridRows = () => {
        // 2 sütun -> 6 ürün (3 satır)
        // 3 sütun -> 9 ürün (3 satır)
        // 4 sütun -> 12 ürün (3 satır)
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
        <div className="bg-transparent h-full border-[10px] flex flex-col overflow-hidden" style={{ borderColor: primaryColor }}>
            {/* Header Alanı - Tüm sayfalarda aynı yükseklik */}
            <div className="shrink-0" style={{ height: HEADER_HEIGHT }}>
                {pageNumber === 1 ? (
                    <div className="h-full bg-black text-white px-5 flex items-center">
                        {/* Logo Sol */}
                        {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                            <img src={logoUrl} alt="Logo" style={{ height: getLogoHeight() }} className="object-contain mr-4" />
                        )}
                        {/* Başlık - Logo ortada değilse göster */}
                        {!(logoUrl && isHeaderLogo && logoAlignment === 'center') && (
                            <h1 className="text-2xl font-black uppercase tracking-tighter">
                                {catalogName || "KATALOG"}
                            </h1>
                        )}
                        {/* Logo Orta */}
                        {logoUrl && isHeaderLogo && logoAlignment === 'center' && (
                            <div className="flex-1 flex justify-center">
                                <img src={logoUrl} alt="Logo" style={{ height: getLogoHeight() }} className="object-contain" />
                            </div>
                        )}
                        {/* Logo Sağ */}
                        {logoUrl && isHeaderLogo && logoAlignment === 'right' && (
                            <>
                                <div className="flex-1" />
                                <img src={logoUrl} alt="Logo" style={{ height: getLogoHeight() }} className="object-contain" />
                            </>
                        )}
                    </div>
                ) : (
                    <div className="h-full bg-black text-white px-5 flex items-center justify-between">
                        {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                            <img src={logoUrl} alt="Logo" style={{ height: getLogoHeight() - 8 }} className="object-contain mr-3" />
                        )}
                        <span className="font-bold uppercase tracking-tight">{catalogName}</span>
                        <div className="flex-1" />
                        <span className="text-sm font-mono">#{pageNumber}</span>
                        {logoUrl && isHeaderLogo && logoAlignment === 'right' && (
                            <img src={logoUrl} alt="Logo" style={{ height: getLogoHeight() - 8 }} className="object-contain ml-3" />
                        )}
                    </div>
                )}
            </div>

            {/* Dinamik Grid İçerik */}
            <div className={`flex-1 p-4 grid ${getGridCols()} ${getGridRows()} gap-4 overflow-hidden bg-white`} style={{ maxHeight: 'calc(100% - 88px)' }}>
                {(products || []).map((product) => {
                    const productUrl = (product as any).product_url
                    const Wrapper = productUrl ? 'a' : 'div'
                    const wrapperProps = productUrl ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'border-2 border-black h-full bg-white hover:bg-yellow-300 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden cursor-pointer group shrink-0'
                    } : {
                        className: 'border-2 border-black h-full bg-white flex flex-col overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as any)}>
                            {/* Görsel */}
                            <div className="aspect-[4/3] border-b-2 border-black overflow-hidden bg-white shrink-0 relative">
                                <img loading="lazy"
                                    crossOrigin="anonymous"
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.name}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                                />
                                {productUrl && (
                                    <div className="absolute top-1.5 right-1.5 bg-black text-white p-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Bilgiler */}
                            <div className="p-2 flex-1 flex flex-col justify-between overflow-hidden">
                                <div>
                                    <h3 className="text-[11px] font-black uppercase line-clamp-1 italic">{product.name}</h3>

                                    {showDescriptions && product.description && (
                                        <p className="text-[9px] text-gray-700 line-clamp-2 mt-0.5 leading-tight font-medium">
                                            {product.description}
                                        </p>
                                    )}

                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                        <div className="mt-1 space-y-0.5 border-t border-black/10 pt-1">
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 3).map((attr, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-[8px] gap-1 font-bold">
                                                    <span className="bg-black text-white px-0.5 uppercase truncate flex-1">{attr.name}</span>
                                                    <span className="text-black shrink-0 truncate max-w-[50%]">
                                                        {attr.value}{attr.unit}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto pt-1 flex items-center justify-between border-t-2 border-black/5">
                                    {showPrices && (
                                        <span className="text-sm font-black font-mono">
                                            {(() => {
                                                const currency = (product as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toFixed(2)}`
                                            })()}
                                        </span>
                                    )}
                                    {showSku && product.sku && (
                                        <span className="text-[8px] font-mono font-bold bg-gray-100 px-0.5">{product.sku}</span>
                                    )}
                                </div>
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-8 bg-black text-white flex items-center justify-center shrink-0">
                <span className="text-xs font-bold font-mono uppercase tracking-widest">{pageNumber} // {totalPages}</span>
            </div>
        </div>
    )
}
