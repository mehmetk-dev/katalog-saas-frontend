import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"
import { TemplateProps } from "./types"
import { cn } from "@/lib/utils"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"

/**
 * Product Tiles Template - Art Gallery / Lookbook Style
 * Klasik kart yapısından uzak, modern ve ferah bir karo dizilimi.
 */
export function ProductTilesTemplate({
    catalogName,
    products,
    primaryColor,
    headerTextColor = '#ffffff',
    showPrices,
    showDescriptions,
    showAttributes,
    showSku,
    showUrls = false,
    pageNumber = 1,
    totalPages: _totalPages = 1,
    columnsPerRow = 3,
    logoUrl,
    logoPosition,
    logoSize: _logoSize,
    titlePosition = 'left',
    productImageFit = 'cover'
}: TemplateProps) {
    const safeProducts = products || []

    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3:
            default: return "grid-cols-3"
        }
    }

    const getImageFitClass = () => {
        switch (productImageFit) {
            case 'cover': return 'object-cover'
            case 'fill': return 'object-fill'
            case 'contain':
            default: return 'object-contain'
        }
    }

    return (
        <div className="h-full flex flex-col overflow-hidden relative font-sans text-slate-900">
            {/* Minimalist Artist Header */}
            <header
                className="shrink-0 flex items-center px-10 relative z-20"
                style={{
                    height: '100px',
                    backgroundColor: 'transparent' // Arkadaki ana rengin görünmesi için
                }}
            >
                <div className={cn(
                    "w-full flex items-center gap-8",
                    titlePosition === 'center' ? "justify-center" : titlePosition === 'right' ? "justify-end" : "justify-between"
                )}>
                    {/* Catalog Branding */}
                    <div className={cn(
                        "flex items-center gap-6",
                        titlePosition === 'right' && "flex-row-reverse"
                    )}>
                        {logoUrl && logoPosition?.startsWith('header') && (
                            <div className="bg-white p-2 shadow-xl rounded-sm rotate-[-2deg]">
                                <NextImage
                                    src={logoUrl}
                                    alt="Logo"
                                    width={140}
                                    height={40}
                                    unoptimized
                                    style={{ height: '40px' }}
                                    className="object-contain"
                                />
                            </div>
                        )}
                        <div className={cn(
                            "flex flex-col",
                            titlePosition === 'center' ? "items-center" : titlePosition === 'right' ? "items-end" : "items-start"
                        )}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-[2px]" style={{ backgroundColor: primaryColor }} />
                                <h1
                                    className="text-3xl font-black uppercase tracking-tighter leading-none italic"
                                    style={{ color: headerTextColor }}
                                >
                                    {catalogName || "COLLECTION"}
                                </h1>
                            </div>
                            <span className="text-[10px] font-bold tracking-[0.4em] mt-1 opacity-60 uppercase" style={{ color: headerTextColor }}>
                                Edition {new Date().getFullYear()} / {pageNumber}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Lookbook Style Tile Grid */}
            <main
                className={cn(
                    "flex-1 px-8 py-2 grid overflow-hidden",
                    getGridCols(),
                    columnsPerRow === 2 ? "grid-rows-2 gap-x-12 gap-y-6" : "grid-rows-3 gap-x-10 gap-y-6",
                )}
                style={{
                    gridTemplateRows: columnsPerRow === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'
                }}
            >
                {safeProducts.map((product, index) => {
                    const productUrl = product.product_url
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'

                    return (
                        <Wrapper
                            key={product.id}
                            href={productUrl || undefined}
                            target={productUrl ? "_blank" : undefined}
                            className="group relative flex flex-col h-full overflow-hidden transition-transform duration-500 hover:scale-[1.02]"
                        >
                            {/* The Tile Image - STRICT FIXED HEIGHTS FOR PERFECT ALIGNMENT */}
                            <div
                                className="relative shrink-0 overflow-hidden bg-white shadow-2xl"
                                style={{
                                    height: columnsPerRow === 2 ? '320px' : '220px'
                                }}
                            >
                                <ProductImageGallery
                                    product={product}
                                    imageFit={productImageFit}
                                    className="w-full h-full"
                                    imageClassName="transition-transform duration-1000 group-hover:scale-110"
                                />

                                {/* Geometric Accent */}
                                <div
                                    className="absolute top-0 right-0 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-white font-black text-[10px]"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {(index + 1 + (pageNumber - 1) * 9).toString().padStart(2, '0')}
                                </div>

                                {/* Floating Price Tag */}
                                {showPrices && (
                                    <div className={cn(
                                        "absolute bottom-4 right-[-5px] bg-slate-900 text-white font-black shadow-xl translate-x-0 group-hover:translate-x-[-10px] transition-transform italic flex items-center gap-2",
                                        columnsPerRow === 2 ? "px-3 py-1.5 text-base" : "px-2 py-1 text-xs"
                                    )}>
                                        {(() => {
                                            const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                            const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                            return `${symbol}${Number(product.price).toLocaleString('tr-TR')}`
                                        })()}
                                        {showUrls && product.product_url && (
                                            <ShoppingBag className={cn(
                                                columnsPerRow === 2 ? "w-4 h-4" : "w-3 h-3",
                                                "text-white/50"
                                            )} />
                                        )}
                                    </div>
                                )}

                                {/* URL / External Link Indicator */}
                                {showUrls && product.product_url && (
                                    <div className="absolute bottom-4 left-4 z-30">
                                        <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg border border-slate-200 text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:scale-110">
                                            <ShoppingBag className={cn(
                                                columnsPerRow === 2 ? "w-4 h-4" : "w-3 h-3"
                                            )} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Minimalist Info Overlay-ish Bottom - LOCKED HEIGHTS */}
                            <div
                                className="mt-3 flex flex-col gap-0.5 overflow-hidden"
                                style={{ height: columnsPerRow === 2 ? '130px' : '85px' }}
                            >
                                <div className="flex items-baseline justify-between gap-2 shrink-0">
                                    <h3 className={cn(
                                        "font-black uppercase tracking-tight text-slate-950 line-clamp-1 border-b-2 border-transparent group-hover:border-slate-900 transition-all inline-block",
                                        columnsPerRow === 2 ? "text-sm" : "text-[11px]"
                                    )}>
                                        {product.name}
                                    </h3>
                                    {showSku && product.sku && (
                                        <span className="text-[9px] font-bold font-mono text-slate-600 shrink-0">Ref.{product.sku.slice(-4)}</span>
                                    )}
                                </div>

                                {showDescriptions && product.description && (
                                    <p className={cn(
                                        "text-slate-800 font-bold leading-tight mt-0.5",
                                        columnsPerRow === 2 ? "text-[11px] line-clamp-3" : "text-[9px] line-clamp-1"
                                    )}>
                                        {product.description}
                                    </p>
                                )}

                                {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-auto pt-1 pb-1">
                                        {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, columnsPerRow === 2 ? 3 : 2).map((attr, aidx) => (
                                            <div key={aidx} className="flex flex-col border-l-2 border-slate-300 pl-1.5">
                                                <span className="text-[8px] uppercase text-slate-600 font-black truncate max-w-[50px]">{attr.name}</span>
                                                <span className="text-[9px] font-black text-slate-900 uppercase leading-none mt-0.5">{attr.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Wrapper>
                    )
                })}
            </main>

            {/* Contemporary Footer */}
            <footer className="h-16 px-10 flex items-center justify-between z-20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-[2px] bg-slate-900" />
                    <p className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-900 opacity-60">
                        {catalogName} • Lookbook Collection
                    </p>
                </div>

                <div
                    className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-slate-900 text-[11px] font-black"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                >
                    {pageNumber}
                </div>
            </footer>
        </div>
    )
}
