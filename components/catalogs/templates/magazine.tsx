import NextImage from "next/image"
import { ExternalLink, ShoppingBag } from "lucide-react"
import { TemplateProps } from "./types"
import { cn } from "@/lib/utils"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"

export function MagazineTemplate({
    catalogName,
    products,
    primaryColor,
    headerTextColor = '#020617', // slate-950 default
    showPrices,
    showDescriptions,
    showAttributes: _showAttributes,
    showSku: _showSku,
    showUrls = false,
    pageNumber = 1,
    totalPages: _totalPages = 1,
    columnsPerRow = 2,
    logoUrl,
    logoPosition,
    logoSize: _logoSize,
    titlePosition = 'left',
    productImageFit = 'cover',
    // New Props for Customization
    backgroundColor,
    backgroundImage,
    backgroundImageFit,
    backgroundGradient,
}: TemplateProps) {
    const HEADER_HEIGHT = "120px"
    const safeProducts = products || []

    // Asimetrik yapı: İlk ürün HERO, diğerleri GRID
    const [heroProduct, ...gridProducts] = safeProducts

    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
            default: return "grid-cols-2"
        }
    }

    const _getImageFitClass = () => {
        switch (productImageFit) {
            case 'cover': return 'object-cover'
            case 'fill': return 'object-fill'
            case 'contain':
            default: return 'object-contain'
        }
    }

    const isHeaderLogo = logoPosition?.startsWith('header')

    // Arka plan stili oluştur
    const containerStyle: React.CSSProperties = {
        backgroundColor: backgroundColor || '#ffffff',
        ...(backgroundImage ? {
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: backgroundImageFit || 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        } : {}),
        ...(backgroundGradient ? {
            background: backgroundGradient
        } : {})
    }

    const borderColor = headerTextColor ? `${headerTextColor}20` : 'rgba(2, 6, 23, 0.1)' // slate-950/10

    return (
        <div className="h-full flex flex-col relative overflow-hidden font-serif" style={containerStyle}>
            {/* Editorial Header - Extra Tall & Bold */}
            <header
                className="shrink-0 relative z-20 flex items-center px-10 border-b-2"
                style={{ height: HEADER_HEIGHT, borderColor: headerTextColor || '#020617' }}
            >
                <div className={cn(
                    "w-full flex items-center gap-10",
                    titlePosition === 'center' ? "justify-center" : titlePosition === 'right' ? "justify-end" : "justify-between"
                )}>
                    {/* Catalog Branding */}
                    <div className={cn(
                        "flex items-center gap-8",
                        titlePosition === 'right' && "flex-row-reverse"
                    )}>
                        {logoUrl && isHeaderLogo && (
                            <div className="bg-slate-950 p-2 transform rotate-[-3deg] shadow-xl">
                                <NextImage
                                    src={logoUrl}
                                    alt="Logo"
                                    width={120}
                                    height={40}
                                    unoptimized
                                    style={{ height: '40px' }}
                                    className="object-contain brightness-[100]"
                                />
                            </div>
                        )}
                        <div className={cn(
                            "flex flex-col",
                            titlePosition === 'center' ? "items-center" : titlePosition === 'right' ? "items-end" : "items-start"
                        )}>
                            <h1
                                className="text-5xl font-black italic tracking-tighter leading-none uppercase"
                                style={{ color: headerTextColor }}
                            >
                                {catalogName || "EDITORIAL"}
                            </h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[11px] font-bold tracking-[0.5em] uppercase" style={{ color: headerTextColor ? `${headerTextColor}80` : '#64748b' }}>
                                    Issue {new Date().getFullYear()} / {pageNumber}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Editorial Sidebar Info */}
                    <div className="hidden lg:flex flex-col border-l pl-6 font-sans font-bold uppercase tracking-widest text-[9px]" style={{ borderColor: borderColor, color: headerTextColor ? `${headerTextColor}66` : '#94a3b8' }}>
                        <span>Autumn Winter</span>
                        <span>Selection Portfolio</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden p-6 flex flex-col gap-6">

                {/* 1. HERO PRODUCT - BIG SHOT */}
                {heroProduct && (
                    <div className="relative h-[380px] w-full flex bg-slate-100 overflow-hidden group shadow-2xl">
                        {/* Huge Image */}
                        <div className="w-2/3 h-full relative overflow-hidden">
                            <ProductImageGallery
                                product={heroProduct}
                                imageFit={productImageFit}
                                className="w-full h-full"
                                imageClassName="transition-transform duration-[2000ms] group-hover:scale-110"
                            />
                            {/* Decorative Frame */}
                            <div className="absolute inset-4 border border-white/30 z-10" />
                        </div>

                        {/* Hero Info Sidebar */}
                        <div className="w-1/3 h-full bg-slate-950 text-white p-6 flex flex-col justify-between relative overflow-hidden">
                            {/* Texture background */}
                            <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none select-none text-[80px] font-black italic break-all leading-none py-10">
                                {heroProduct.name}
                            </div>

                            <div className="relative z-10">
                                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/40">Featured Item</span>
                                <h3 className="text-3xl font-black italic mt-2 uppercase leading-none truncate">{heroProduct.name}</h3>
                                {showDescriptions && heroProduct.description && (
                                    <p className="text-xs text-white/70 mt-4 leading-relaxed line-clamp-4 font-sans font-medium">
                                        {heroProduct.description}
                                    </p>
                                )}
                            </div>

                            <div className="relative z-10 border-t border-white/20 pt-6">
                                {showPrices && (
                                    <div className="flex items-center gap-3">
                                        <p className="text-3xl font-black italic tracking-tighter" style={{ color: primaryColor }}>
                                            {(() => {
                                                const currency = heroProduct.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(heroProduct.price).toLocaleString('tr-TR')}`
                                            })()}
                                        </p>
                                        {showUrls && heroProduct.product_url && (
                                            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors">
                                                <ShoppingBag className="w-5 h-5" style={{ color: primaryColor }} />
                                            </div>
                                        )}
                                    </div>
                                )}
                                {showUrls && heroProduct.product_url && (
                                    <a
                                        href={heroProduct.product_url}
                                        target="_blank"
                                        className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white hover:text-white/70 transition-colors"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        Discover Online
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. GRID PRODUCTS - SUPPORTING CAST */}
                {gridProducts.length > 0 && (
                    <div className={cn(
                        "grid flex-1 gap-6 overflow-hidden content-start",
                        getGridCols()
                    )}>
                        {gridProducts.map((product) => (
                            <div key={product.id} className="relative group flex flex-col h-[260px] overflow-hidden">
                                {/* Secondary Image - FIXED HEIGHT */}
                                <div className="relative h-[180px] bg-slate-50 border border-slate-100 overflow-hidden shadow-lg transition-transform duration-500 hover:translate-y-[-4px]">
                                    <ProductImageGallery
                                        product={product}
                                        imageFit={productImageFit}
                                        className="w-full h-full"
                                        imageClassName="transition-transform duration-700 group-hover:scale-110"
                                    />

                                    {/* Small URL Tab */}
                                    {showUrls && product.product_url && (
                                        <div className="absolute bottom-0 right-0 bg-white/90 backdrop-blur-sm p-2 text-slate-900 shadow-xl z-10">
                                            <ExternalLink className="w-3 h-3" />
                                        </div>
                                    )}

                                    {/* Price Tag Overlay */}
                                    {showPrices && (
                                        <div className="absolute top-2 left-2 px-2 py-1 text-[11px] font-black italic shadow-lg z-10 flex items-center gap-2" style={{ backgroundColor: headerTextColor || '#020617', color: backgroundColor || '#ffffff' }}>
                                            <span>
                                                {(() => {
                                                    const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                    return `${symbol}${Number(product.price).toLocaleString('tr-TR')}`
                                                })()}
                                            </span>
                                            {showUrls && product.product_url && (
                                                <ShoppingBag className="w-3 h-3 opacity-70" />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Minimal Info */}
                                <div className="mt-3 overflow-hidden">
                                    <h4 className="font-black italic text-sm uppercase truncate" style={{ color: headerTextColor || '#020617' }}>
                                        {product.name}
                                    </h4>
                                    {showDescriptions && product.description && (
                                        <p className="text-[10px] font-sans font-bold leading-tight line-clamp-2 mt-1" style={{ color: headerTextColor ? `${headerTextColor}80` : '#64748b' }}>
                                            {product.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Editorial Footer */}
            <footer className="h-10 px-10 flex items-center justify-between border-t shrink-0" style={{ borderColor: borderColor }}>
                <span className="text-[9px] font-bold uppercase tracking-[0.4em]" style={{ color: headerTextColor ? `${headerTextColor}4D` : '#cbd5e1' }}>
                    {catalogName} · Selection Portfolio · Edition {new Date().getFullYear()}
                </span>
                <div className="h-full w-[1px] mx-10" style={{ backgroundColor: borderColor }} />
                <span className="text-[11px] font-black italic tracking-[0.4em]" style={{ color: headerTextColor || '#020617' }}>{pageNumber}</span>
            </footer>
        </div>
    )
}
