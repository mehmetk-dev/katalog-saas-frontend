import NextImage from "next/image"

import type { CustomAttribute } from "@/lib/actions/products"
import { TemplateProps } from "./types"

// Showcase - Spotlight vitrin, 1 dev ürün odaklı
export function ShowcaseTemplate({
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
    columnsPerRow = 2,
}: TemplateProps) {
    const safeProducts = products || []
    const [main, ...others] = safeProducts

    const getRightCols = () => {
        if (columnsPerRow === 2) return "grid-cols-1"
        return "grid-cols-2"
    }

    return (
        <div className="bg-black h-full flex flex-col overflow-hidden text-white">
            {/* Minimal Header */}
            <div className="h-14 px-8 flex items-center justify-between border-b border-white/10 shrink-0">
                <h1 className="text-sm font-light tracking-[0.4em] uppercase truncate max-w-[400px]">{catalogName || "Vitrin"}</h1>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-white/20 font-mono tracking-widest uppercase">{columnsPerRow} COL LAYOUT</span>
                    <span className="text-xs text-white/40">{pageNumber}/{totalPages}</span>
                </div>
            </div>

            {/* Ana İçerik */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sol - Dev ürün */}
                {main && (() => {
                    const productUrl = main.product_url
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'w-[55%] h-full relative block cursor-pointer group shrink-0'
                    } : {
                        className: 'w-[55%] h-full relative shrink-0'
                    }

                    return (
                        <Wrapper {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)}>
                            <NextImage src={main.image_url || "/placeholder.svg"} alt={main.name} fill unoptimized className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms] opacity-80 group-hover:opacity-100" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/20 to-transparent group-hover:from-black/95 transition-all" />
                            {(showUrls && productUrl) && (
                                <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 border border-white/20">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 p-10 max-w-lg z-20">
                                {showSku && (
                                    <span className="text-[10px] text-blue-500 font-bold tracking-[0.3em] uppercase mb-2 block">{main.sku || "FEATURED"}</span>
                                )}
                                <h2 className="text-4xl font-light mb-4 group-hover:text-blue-200 transition-colors leading-tight">{main.name}</h2>
                                {showDescriptions && main.description && (
                                    <p className="text-white/50 text-sm line-clamp-3 mb-6 leading-relaxed font-light">{main.description}</p>
                                )}

                                {showAttributes && main.custom_attributes && main.custom_attributes.length > 0 && (
                                    <div className="flex flex-wrap gap-4 mb-6 border-l border-white/20 pl-4 py-1">
                                        {main.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 3).map((attr, aidx) => (
                                            <div key={aidx} className="flex flex-col">
                                                <span className="text-[10px] text-white/30 uppercase tracking-widest">{attr.name}</span>
                                                <span className="text-sm font-light text-white/90">{attr.value}{attr.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {showPrices && (
                                    <p className="text-3xl font-light leading-none" style={{ color: primaryColor }}>
                                        {(() => {
                                            const currency = main.custom_attributes?.find((a: CustomAttribute) => a.name === "currency")?.value || "TRY"
                                            const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                            return `${symbol}${Number(main.price).toFixed(2)}`
                                        })()}
                                    </p>
                                )}
                            </div>
                        </Wrapper>
                    )
                })()}

                {/* Sağ - Küçük ürünler grid */}
                <div className={`w-[45%] grid ${getRightCols()} grid-rows-3 bg-zinc-900 border-l border-white/10 shrink-0`}>
                    {others.slice(0, columnsPerRow === 2 ? 3 : 6).map((product) => {
                        const productUrl = product.product_url
                        const Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                        const wrapperProps = (showUrls && productUrl) ? {
                            href: productUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: 'relative cursor-pointer group overflow-hidden border-b border-r border-white/5 flex flex-col h-full'
                        } : {
                            className: 'relative overflow-hidden border-b border-r border-white/5 flex flex-col h-full'
                        }

                        return (
                            <Wrapper key={product.id} {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)}>
                                <div className="absolute inset-0 opacity-40 group-hover:opacity-80 transition-opacity duration-700">
                                    <NextImage src={product.image_url || product.images?.[0] || "/placeholder.svg"} alt={product.name} fill unoptimized className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                </div>

                                {productUrl && (
                                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 z-10">
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}

                                <div className="mt-auto p-4 relative z-10">
                                    <h3 className="text-sm font-light group-hover:text-blue-100 transition-colors line-clamp-1">{product.name}</h3>

                                    {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1 mb-1">
                                            {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 1).map((attr, aidx) => (
                                                <span key={aidx} className="text-[8px] text-white/30 border border-white/10 px-1.5 py-0.5 rounded uppercase">
                                                    {attr.name}: {attr.value}{attr.unit}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {showSku && product.sku && (
                                        <span className="text-[8px] text-gray-400 font-mono bg-gray-100 px-1 py-0.2 rounded">#{product.sku}</span>
                                    )}
                                    {showPrices && (
                                        <p className="text-sm font-light mt-0.5" style={{ color: primaryColor }}>
                                            {(() => {
                                                const currency = product.custom_attributes?.find((a: CustomAttribute) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toFixed(2)}`
                                            })()}
                                        </p>
                                    )}
                                </div>
                            </Wrapper>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
