import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"

import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"

// Reusable Title Component (For Collisions) - moved outside render
function TitleBlock({
    align = 'left',
    catalogName,
    headerTextColor,
    primaryColor
}: {
    align?: 'left' | 'right'
    catalogName: string
    headerTextColor?: string
    primaryColor: string
}) {
    return (
        <div className={`flex flex-col ${align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
            <h1 className="text-2xl font-black tracking-tight leading-none mb-1 uppercase truncate max-w-[300px]"
                style={{ color: headerTextColor || '#1a1a1a' }}>
                {catalogName || "KATALOG"}
            </h1>
            <div className={`h-1 w-12 rounded-full opacity-60`} style={{ backgroundColor: primaryColor }} />
        </div>
    )
}

export function CompactListTemplate({
    catalogName,
    products,
    primaryColor,
    headerTextColor,
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
    titlePosition = 'left',
    productImageFit = "cover",
    backgroundColor: _backgroundColor
}: TemplateProps) {
    // A4 Yüksekliği ~1123px
    // Header: 80px
    // Footer: 50px
    // İçerik Padding: 32px (16 top + 16 bottom)
    // Kalan: ~960px
    // 10 Ürün için -> ~96px yer var (gap dahil)
    // Gap: 12px -> Kart Yüksekliği: 84px

    const HEADER_HEIGHT = "80px"
    const FOOTER_HEIGHT = "50px"

    // Logo boyutu - Header büyüdüğü için logoları da biraz büyüttük
    const getLogoHeight = () => {
        switch (logoSize) {
            case 'small': return 32
            case 'large': return 56
            default: return 44
        }
    }

    // Header'da logo var mı?
    // "Logo alt kısıma gelmesin" -> Sadece header logolarını gösteriyoruz.
    const isHeaderLogo = logoPosition?.startsWith('header')
    const logoAlignment = logoPosition?.split('-')[1] || 'left'

    // Çakışma Kontrolü (Collision Detection)
    // Logo ve Başlık aynı hizadaysa (Örn: İkisi de Solda), üst üste binmemeleri için onları yan yana (flex) basacağız.
    const isCollisionLeft = isHeaderLogo && logoAlignment === 'left' && (titlePosition === 'left' || !titlePosition) // !titlePosition defaults to left
    const isCollisionCenter = isHeaderLogo && logoAlignment === 'center' && titlePosition === 'center'
    const isCollisionRight = isHeaderLogo && logoAlignment === 'right' && titlePosition === 'right'

    // Herhangi bir çakışma var mı? Varsa "Absolute Title"ı gizleyeceğiz.
    const isAnyCollision = isCollisionLeft || isCollisionCenter || isCollisionRight

    // Başlık hizalama stili (Çakışma yoksa kullanılır)
    const getTitleAlignmentClass = () => {
        if (titlePosition === 'right') return 'items-end text-right justify-center pr-8'
        if (titlePosition === 'center') return 'items-center text-center justify-center'
        return 'items-start text-left justify-center pl-8'
    }

    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            {/* Header - Premium Tasarım */}
            <div className="shrink-0 relative z-10" style={{ height: HEADER_HEIGHT }}>
                {/* Dekoratif Üst Çizgi */}
                <div className="absolute top-0 left-0 right-0 h-1.5 w-full" style={{ backgroundColor: primaryColor }} />

                {/* Başlık Alanı (Absolute) - SADECE ÇAKIŞMA YOKSA GÖSTER */}
                {!isAnyCollision && (
                    <div className={`absolute inset-0 flex flex-col px-4 pt-2 pointer-events-none z-10 ${getTitleAlignmentClass()}`}>
                        <div className="flex flex-col max-w-[60%]">
                            <h1 className="text-2xl font-black tracking-tight leading-none mb-1 uppercase truncate"
                                style={{ color: headerTextColor || '#1a1a1a' }}>
                                {catalogName || "KATALOG"}
                            </h1>
                            <div className={`h-1 w-12 rounded-full opacity-60 ${titlePosition === 'center' ? 'mx-auto' : titlePosition === 'right' ? 'ml-auto' : ''}`} style={{ backgroundColor: primaryColor }} />
                        </div>
                    </div>
                )}

                {/* Logolar Container - Absolute Overlay */}
                <div className="absolute inset-0 px-8 flex items-center justify-between pt-2 pointer-events-none z-20">
                    {/* Sol Logo Alanı */}
                    <div className="flex-1 flex justify-start items-center pointer-events-auto">
                        {/* Çakışma Varsa: LOGO + TITLE */}
                        {isCollisionLeft ? (
                            <div className="flex items-center gap-4">
                                {logoUrl && <NextImage src={logoUrl} alt="Logo" width={160} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />}
                                <TitleBlock align="left" catalogName={catalogName} headerTextColor={headerTextColor} primaryColor={primaryColor} />
                            </div>
                        ) : (
                            /* Normal Logo */
                            logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                                <NextImage src={logoUrl} alt="Logo" width={160} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain object-left" />
                            )
                        )}
                    </div>

                    {/* Orta Logo Alanı */}
                    <div className="flex-1 flex justify-center items-center pointer-events-auto">
                        {/* Çakışma Varsa: LOGO + TITLE */}
                        {isCollisionCenter ? (
                            <div className="flex items-center gap-4">
                                {logoUrl && <NextImage src={logoUrl} alt="Logo" width={160} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />}
                                <TitleBlock align="left" catalogName={catalogName} headerTextColor={headerTextColor} primaryColor={primaryColor} />
                            </div>
                        ) : (
                            /* Normal Logo */
                            logoUrl && isHeaderLogo && logoAlignment === 'center' && (
                                <NextImage src={logoUrl} alt="Logo" width={160} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />
                            )
                        )}
                    </div>

                    {/* Sağ Logo Alanı */}
                    <div className="flex-1 flex justify-end items-center pointer-events-auto">
                        {/* Çakışma Varsa: TITLE + LOGO (Sağ olduğu için title önce) */}
                        {isCollisionRight ? (
                            <div className="flex items-center gap-4">
                                <TitleBlock align="right" catalogName={catalogName} headerTextColor={headerTextColor} primaryColor={primaryColor} />
                                {logoUrl && <NextImage src={logoUrl} alt="Logo" width={160} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain" />}
                            </div>
                        ) : (
                            /* Normal Logo */
                            logoUrl && isHeaderLogo && logoAlignment === 'right' && (
                                <NextImage src={logoUrl} alt="Logo" width={160} height={getLogoHeight()} unoptimized style={{ height: getLogoHeight() }} className="object-contain object-right" />
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* İçerik Alanı - Daha ferah grid/gap */}
            <div className="flex-1 px-8 pt-2 pb-6 flex flex-col justify-start gap-3 overflow-hidden">
                {(products || []).map((product) => {
                    const productUrl = product.product_url
                    return (
                        <div
                            key={product.id}
                            className="flex items-center gap-4 p-3 h-[84px] bg-white rounded-xl border border-gray-100 shadow-sm transition-all group shrink-0 relative overflow-hidden"
                        >
                            {/* Sol Kenar Vurgusu (Opsiyonel - Primary Color) */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: primaryColor }} />

                            {/* Görsel - Daha Büyük (80px) */}
                            <div className="w-20 h-20 shrink-0 bg-gray-50 rounded-lg overflow-hidden relative shadow-inner border border-gray-100">
                                <ProductImageGallery
                                    product={product}
                                    imageFit={productImageFit}
                                    className="w-full h-full"
                                    showNavigation={false}
                                />
                            </div>

                            {/* Bilgiler */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center h-full py-0.5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        {/* Ürün Adı */}
                                        <h3 className="font-bold text-base text-gray-900 truncate group-hover:text-primary transition-colors mb-1 leading-tight">
                                            {product.name}
                                        </h3>

                                        {/* Açıklama */}
                                        {showDescriptions && product.description && (
                                            <p className="text-xs text-gray-500 line-clamp-1 mb-1.5 opacity-80">{product.description}</p>
                                        )}

                                        {/* Alt Bilgiler (SKU + Attributes) */}
                                        <div className="flex items-center flex-wrap gap-2">
                                            {showSku && product.sku && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                    SKU: {product.sku}
                                                </span>
                                            )}
                                            {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 2).map((attr, idx) => (
                                                        <span key={idx} className="text-[10px] text-gray-500 flex items-center gap-1">
                                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                            <span className="truncate max-w-[80px]">{attr.value}{attr.unit}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Fiyat Alanı */}
                                    {showPrices && (
                                        <div className="flex items-center gap-2 pl-2 shrink-0 self-center">
                                            <span className="font-bold text-xl tracking-tight" style={{ color: primaryColor }}>
                                                {(() => {
                                                    const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                    return `${symbol}${Number(product.price).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                                                })()}
                                            </span>
                                        </div>
                                    )}

                                    {/* Buy Button - Right side of price */}
                                    {showUrls && productUrl && (
                                        <a
                                            href={productUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 group-hover:bg-primary/10 transition-colors"
                                            style={{ color: primaryColor }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ShoppingBag className="w-5 h-5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Footer - Sade Tasarım */}
            <div className="shrink-0 px-8 flex items-center relative gap-4" style={{ height: FOOTER_HEIGHT, backgroundColor: 'rgba(0,0,0,0.03)' }}>
                {/* Sol Taraf - Katalog Adı ve Ürün Sayısı */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: headerTextColor }}>{catalogName}</span>
                    </div>
                    <div className="h-4 w-px bg-gray-300" />
                    <span className="text-xs font-medium text-gray-400">
                        {products.length} Ürün
                    </span>
                </div>

                <div className="flex-1" />

                {/* Sağ Taraf - Sayfa Numarası */}
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-bold text-gray-600">
                        {pageNumber} <span className="text-gray-300 font-light mx-1">/</span> {totalPages}
                    </div>
                </div>
            </div>
        </div>
    )
}
