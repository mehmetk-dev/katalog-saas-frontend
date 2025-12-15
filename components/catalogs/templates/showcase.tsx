import { TemplateProps } from "./types"

// Showcase - Spotlight vitrin, 1 dev ürün odaklı
export function ShowcaseTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    pageNumber = 1,
    totalPages = 1,
}: TemplateProps) {
    const safeProducts = products || []
    const [main, ...others] = safeProducts

    return (
        <div className="bg-black h-full flex flex-col overflow-hidden text-white">
            {/* Minimal Header */}
            <div className="h-14 px-8 flex items-center justify-between border-b border-white/10 shrink-0">
                <h1 className="text-sm font-light tracking-[0.4em] uppercase">{catalogName || "Vitrin"}</h1>
                <span className="text-xs text-white/40">{pageNumber}/{totalPages}</span>
            </div>

            {/* Ana İçerik */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sol - Dev ürün */}
                {main && (() => {
                    const productUrl = (main as any).product_url
                    const Wrapper = productUrl ? 'a' : 'div'
                    const wrapperProps = productUrl ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'w-3/5 relative block cursor-pointer group'
                    } : {
                        className: 'w-3/5 relative'
                    }

                    return (
                        <Wrapper {...(wrapperProps as any)}>
                            <img loading="lazy"
                                src={main.image_url || "/placeholder.svg"}
                                alt={main.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent group-hover:from-black/80 transition-all" />
                            {productUrl && (
                                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 p-8 max-w-md">
                                <h2 className="text-3xl font-light mb-3 group-hover:text-blue-100 transition-colors">{main.name}</h2>
                                {showDescriptions && main.description && (
                                    <p className="text-white/70 text-sm line-clamp-3 mb-4">{main.description}</p>
                                )}
                                {showPrices && (
                                    <p className="text-2xl font-light" style={{ color: primaryColor }}>
                                        {(() => {
                                            const currency = (main as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
                                            const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                            return `${symbol}${Number(main.price).toFixed(2)}`
                                        })()}
                                    </p>
                                )}
                            </div>
                        </Wrapper>
                    )
                })()}

                {/* Sağ - 2 küçük ürün */}
                <div className="w-2/5 flex flex-col bg-zinc-900">
                    {others.slice(0, 2).map((product, idx) => {
                        const productUrl = (product as any).product_url
                        const Wrapper = productUrl ? 'a' : 'div'
                        const wrapperProps = productUrl ? {
                            href: productUrl,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            className: `flex-1 relative cursor-pointer group ${idx === 0 ? 'border-b border-white/10' : ''}`
                        } : {
                            className: `flex-1 relative ${idx === 0 ? 'border-b border-white/10' : ''}`
                        }

                        return (
                            <Wrapper key={product.id} {...(wrapperProps as any)}>
                                <img loading="lazy"
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.name}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                {productUrl && (
                                    <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="text-sm font-light group-hover:text-blue-100 transition-colors">{product.name}</h3>
                                    {showPrices && (
                                        <p className="text-sm mt-1" style={{ color: primaryColor }}>
                                            {(() => {
                                                const currency = (product as any).custom_attributes?.find((a: any) => a.name === "currency")?.value || "TRY"
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
