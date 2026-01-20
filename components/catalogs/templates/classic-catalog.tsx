import NextImage from "next/image"

import { TemplateProps } from "./types"

// Classic Catalog - Klasik tablo formatı
export function ClassicCatalogTemplate({
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
            {/* Header */}
            <div className="shrink-0" style={{ backgroundColor: primaryColor }}>
                {pageNumber === 1 ? (
                    <div className="px-8 py-4 text-white">
                        <h1 className="text-xl font-bold leading-tight">{catalogName || "Ürün Kataloğu"}</h1>
                        <p className="text-white/70 text-[10px] mt-0.5 uppercase tracking-wider">Güncel Fiyat Listesi - 2024</p>
                    </div>
                ) : (
                    <div className="px-8 py-2 text-white flex justify-between items-center shrink-0 h-10">
                        <span className="font-medium text-sm truncate max-w-[70%]">{catalogName}</span>
                        <span className="text-[10px] text-white/70">Sayfa {pageNumber}</span>
                    </div>
                )}
            </div>

            {/* Tablo Header */}
            <div className="grid grid-cols-12 gap-2 px-8 py-2 bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b shrink-0">
                <div className="col-span-1">No</div>
                <div className="col-span-1 text-center">Resim</div>
                <div className="col-span-10 grid grid-cols-10 gap-2 items-center">
                    <div className="col-span-4 pl-4">Ürün Adı</div>
                    <div className="col-span-4 text-center">{showAttributes ? "Özellikler" : (showDescriptions ? "Açıklama" : "")}</div>
                    <div className="col-span-2 text-right">{showPrices ? "Fiyat" : ""}</div>
                </div>
            </div>

            {/* Ürün Listesi */}
            <div className="flex-1 overflow-hidden">
                {safeProducts.slice(0, 10).map((product, idx) => {
                    const productUrl = product.product_url
                    const Wrapper = productUrl ? 'a' : 'div'
                    const wrapperProps = productUrl ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: `grid grid-cols-12 gap-2 px-8 h-[82px] items-center border-b hover:bg-gray-50 transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} block text-inherit no-underline shrink-0 overflow-hidden`
                    } : {
                        className: `grid grid-cols-12 gap-2 px-8 h-[82px] items-center border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} shrink-0 overflow-hidden`
                    }

                    return (
                        <Wrapper
                            key={product.id}
                            {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)}
                        >
                            <div className="col-span-1 text-[11px] font-mono text-gray-400 group-hover:text-gray-900 transition-colors">{String(idx + 1).padStart(2, '0')}</div>
                            <div className="col-span-1 flex justify-center">
                                <div className="w-14 h-14 rounded-lg bg-white border border-gray-100 overflow-hidden relative shrink-0">
                                    <NextImage src={product.image_url || product.images?.[0] || "/placeholder.svg"} alt={product.name} fill unoptimized className="w-full h-full object-contain p-1" />
                                    {productUrl && (
                                        <div className="absolute top-0 right-0 bg-white/90 p-0.5 rounded-bl shadow-sm">
                                            <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-span-10 grid grid-cols-10 gap-2 items-center">
                                <div className="col-span-4 pl-4 overflow-hidden">
                                    <p className="font-bold text-sm text-gray-900 truncate leading-tight">{product.name}</p>
                                    {showSku && product.sku && <p className="text-[9px] text-gray-400 font-mono mt-0.5 truncate tracking-tighter">SKU: {product.sku}</p>}
                                </div>
                                <div className="col-span-4 px-2 overflow-hidden">
                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 ? (
                                        <div className="space-y-0.5">
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 3).map((attr, aidx) => (
                                                <div key={aidx} className="flex justify-between items-center bg-white/40 px-1.5 py-0.5 rounded border border-gray-100">
                                                    <span className="text-[8px] text-gray-400 font-medium truncate flex-1">{attr.name}</span>
                                                    <span className="text-[8px] text-gray-600 font-bold ml-1 truncate">{attr.value}{attr.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        showDescriptions && product.description && (
                                            <p className="text-[10px] text-gray-500 line-clamp-2 italic leading-tight">{product.description}</p>
                                        )
                                    )}
                                </div>
                                <div className="col-span-2 text-right overflow-hidden">
                                    {showPrices && (
                                        <span className="font-black text-sm block" style={{ color: primaryColor }}>
                                            {(() => {
                                                const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toFixed(2)}`
                                            })()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Wrapper>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="h-10 px-8 flex items-center justify-between border-t bg-gray-50 shrink-0">
                <span className="text-[8px] text-gray-400 uppercase tracking-widest font-bold">Resmi Fiyat Listesi © 2024</span>
                <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded bg-white border border-gray-100 shadow-sm" style={{ color: primaryColor }}>{pageNumber} / {totalPages}</span>
            </div>
        </div>
    )
}
