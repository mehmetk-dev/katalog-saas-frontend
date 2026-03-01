import React from "react"
import NextImage from "next/image"
import { ShoppingBag } from "lucide-react"

import { TemplateProps } from "./types"
import { ProductImageGallery } from "@/components/ui/product-image-gallery"
import { buildBackgroundStyle, sanitizeHref, formatProductPrice, getStandardLogoHeight, getHeaderLayout } from "./utils"

export const ModernGridTemplate = React.memo(function ModernGridTemplate({
    catalogName,
    products,
    primaryColor,
    showPrices,
    showDescriptions,
    showAttributes,
    showSku,
    // YENİ ÖZELLİK: showUrls - Ürün URL'lerinin tıklanabilir olup olmayacağını kontrol eder
    // showUrls=true ve product_url varsa -> kart tıklanabilir (a tag)
    // showUrls=false veya product_url yoksa -> kart tıklanabilir değil (div tag)
    showUrls = false,
    pageNumber = 1,
    totalPages = 1,
    columnsPerRow = 2,
    logoUrl,
    logoPosition,
    logoSize,
    titlePosition = 'left',
    headerTextColor = '#ffffff',
    // YENİ ÖZELLİK: productImageFit - Ürün fotoğraflarının hizalanma şeklini kontrol eder
    // 'cover' (varsayılan): Fotoğraf alanı doldurur, kırpılabilir
    // 'contain': Fotoğraf tamamen görünür, boşluklar olabilir
    // 'fill': Fotoğraf alanı doldurur, oran bozulabilir
    productImageFit = 'cover',
    // New Props for Customization
    backgroundColor,
    backgroundImage,
    backgroundImageFit,
    backgroundGradient,
}: TemplateProps) {
    const HEADER_HEIGHT = "56px"

    // Dinamik grid sınıfı
    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
            default: return "grid-cols-2"
        }
    }

    // getGridRows function removed as it is no longer used

    const {
        isHeaderLogo,
        logoAlignment,
        isCollisionLeft,
        isCollisionCenter,
        isCollisionRight
    } = getHeaderLayout(logoPosition, titlePosition)

    const logoHeight = getStandardLogoHeight(logoSize)

    // Arka plan stili oluştur
    const containerStyle = buildBackgroundStyle({ backgroundColor, backgroundImage, backgroundImageFit, backgroundGradient })

    return (
        <div className="h-full flex flex-col relative overflow-hidden transition-colors" style={{ ...containerStyle, backgroundColor: containerStyle.backgroundColor || '#f4f4f5' }}>
            {/* Header */}
            <header className="shrink-0 transition-colors" style={{ height: HEADER_HEIGHT, backgroundColor: primaryColor, color: headerTextColor }}>
                <div className={`h-full px-8 flex items-center justify-between relative w-full ${pageNumber !== 1 ? 'border-b border-gray-200' : ''}`}>
                    {/* Sol Alan */}
                    <div className="flex-1 flex items-center justify-start min-w-0 z-10 gap-4">
                        {isCollisionLeft ? (
                            <div className="flex items-center gap-4">
                                {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={120} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                <span className="text-lg font-bold tracking-tight truncate max-w-[250px]">{catalogName || "Katalog"}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                {logoAlignment === 'left' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={120} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                {titlePosition === 'left' && (
                                    <span className="text-lg font-bold tracking-tight truncate max-w-[250px]">{catalogName || "Katalog"}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Orta Alan */}
                    <div className="flex-1 flex items-center justify-center min-w-0 z-10 gap-4">
                        {isCollisionCenter ? (
                            <div className="flex items-center justify-center gap-4">
                                {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={120} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                <span className="text-lg font-bold tracking-tight truncate max-w-[250px] text-center whitespace-nowrap">{catalogName || "Katalog"}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 text-center">
                                {logoAlignment === 'center' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={120} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                {titlePosition === 'center' && (
                                    <span className="text-lg font-bold tracking-tight truncate max-w-[250px] text-center whitespace-nowrap">{catalogName || "Katalog"}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sağ Alan */}
                    <div className="flex-1 flex items-center justify-end min-w-0 z-10 gap-4 text-right">
                        {isCollisionRight ? (
                            <div className="flex items-center gap-4 flex-row-reverse">
                                {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={120} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                <span className="text-lg font-bold tracking-tight truncate max-w-[250px]">{catalogName || "Katalog"}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 flex-row-reverse text-right">
                                {logoAlignment === 'right' && isHeaderLogo && logoUrl && (
                                    <NextImage src={logoUrl} alt="Logo" width={120} height={logoHeight} className="object-contain" style={{ maxHeight: logoHeight }} />
                                )}
                                {titlePosition === 'right' && (
                                    <span className="text-lg font-bold tracking-tight truncate max-w-[250px]">{catalogName || "Katalog"}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Grid İçerik */}
            {/* ÖNEMLİ: Kart yapısı değiştirilmedi - aspect-[4/3] fotoğraf and flex-1 bilgiler alanı korundu */}
            <div className={`flex-1 p-4 grid ${getGridCols()} gap-3 overflow-hidden`} style={{ gridTemplateRows: 'repeat(3, 1fr)' }}>
                {(products || []).map((product) => {
                    const productUrl = sanitizeHref(product.product_url)
                    // YENİ ÖZELLİK: showUrls kontrolü - showUrls=true ve URL varsa tıklanabilir, yoksa değil
                    // ÖNCE: Her zaman productUrl varsa tıklanabilirdi
                    // ŞİMDİ: showUrls=true VE productUrl varsa tıklanabilir
                    return (
                        <div key={product.id} className="flex flex-col h-full min-h-0 border border-gray-100 rounded-lg overflow-hidden bg-white shadow-sm relative group">
                            {/* Görsel - KART YAPISI KORUNDU: aspect-[4/3] sabit oran, değiştirilmedi */}
                            <div className="aspect-[4/3] relative overflow-hidden bg-gray-50">
                                {/* YENİ: ProductImageGallery bileşeni - Çoklu görsel desteği */}
                                <ProductImageGallery
                                    product={product}
                                    imageFit={productImageFit}
                                    className="w-full h-full"
                                />
                            </div>

                            {/* Bilgiler - KART YAPISI KORUNDU: flex-1 flex flex-col, değiştirilmedi */}
                            <div className="p-3 flex-1 flex flex-col relative">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1">{product.name}</h3>
                                    {showPrices && (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="font-bold text-sm" style={{ color: primaryColor }}>
                                                {formatProductPrice(product)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {showDescriptions && product.description && (
                                    <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-auto">
                                        {product.description}
                                    </p>
                                )}
                                {showAttributes && product.custom_attributes && product.custom_attributes.length > 0 && (
                                    <div className="mt-2 space-y-0.5 border-t pt-2 border-gray-50">
                                        {product.custom_attributes.filter(a => a.name !== 'currency' && a.value).slice(0, 4).map((attr, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-[10px] gap-2">
                                                <span className="text-gray-400 font-medium truncate flex-1">{attr.name}</span>
                                                <span className="text-gray-600 font-semibold shrink-0 truncate max-w-[60%]">
                                                    {attr.value}{attr.unit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {showSku && product.sku && (
                                    <p className="text-[10px] text-gray-400 mt-2 font-mono">SKU: {product.sku}</p>
                                )}

                                {/* Buy Button - Fixed to bottom right of info area */}
                                {showUrls && productUrl && (
                                    <a
                                        href={productUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute bottom-2 right-2 p-1.5 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 shadow-sm transition-all group-hover:scale-110 active:scale-95"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ShoppingBag className="w-4 h-4" style={{ color: primaryColor }} />
                                    </a>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Footer */}
            {/* DEĞİŞİKLİK: Footer tasarımı header ile aynı yapıldı */}
            {/* Arka plan: primaryColor, Yazı Rengi: headerTextColor */}
            {/* Footer */}
            {/* 3 Sütunlu Grid - Header ile Aynı Yapı (Logo Desteği Eklendi) */}
            <div className="shrink-0" style={{ height: HEADER_HEIGHT }}>
                <div
                    className="h-full px-6 flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                >
                    <span
                        className="text-sm font-bold tracking-tight"
                        style={{ color: headerTextColor }}
                    >
                        Sayfa {pageNumber} / {totalPages}
                    </span>
                </div>
            </div>
        </div>
    )
})
