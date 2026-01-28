import NextImage from "next/image"

import { TemplateProps } from "./types"

export function ModernGridTemplate({
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
}: TemplateProps) {
    const HEADER_HEIGHT = "56px"

    // Dinamik grid sınıfı
    const getGridCols = () => {
        switch (columnsPerRow) {
            case 2: return "grid-cols-2"
            case 3: return "grid-cols-3"
            case 4: return "grid-cols-4"
            default: return "grid-cols-2"
        }
    }

    const getGridRows = () => {
        // columnsPerRow: 2 -> 6 items (3 rows)
        // columnsPerRow: 3 -> 9 items (3 rows)
        // columnsPerRow: 4 -> 12 items (3 rows)
        return "grid-rows-3"
    }

    // Logo boyutu
    const getLogoHeight = () => {
        switch (logoSize) {
            case 'small': return 24
            case 'large': return 40
            default: return 32
        }
    }

    // Header'da logo var mı?
    const isHeaderLogo = logoPosition?.startsWith('header')
    const logoAlignment = logoPosition?.split('-')[1] || 'left'

    // Header içeriğini render et (Logo + Başlık akıllı yerleşimi)
    const renderHeaderContent = (_isFirstPage: boolean) => {
        // Başlık yazı rengi - headerTextColor prop'undan alınır, yoksa beyaz
        const textSize = 'text-lg font-bold'

        // Grid Yapısı: Sol - Orta - Sağ (3 sütun)
        // Bu sayede orta kısım her zaman tam ortada kalır, sol veya sağdaki içerik onu itmez.
        return (
            <div className="grid grid-cols-3 w-full items-center">

                {/* SOL SÜTUN */}
                <div className="flex items-center justify-start gap-3">
                    {logoUrl && isHeaderLogo && logoAlignment === 'left' && (
                        <NextImage
                            src={logoUrl}
                            alt="Logo"
                            width={120}
                            height={getLogoHeight()}
                            unoptimized
                            className="object-contain shrink-0"
                            style={{ height: getLogoHeight() }}
                        />
                    )}
                    {titlePosition === 'left' && (
                        <span className={`${textSize} tracking-tight`} style={{ color: headerTextColor }}>{catalogName || "Katalog"}</span>
                    )}
                </div>

                {/* ORTA SÜTUN (Tamamen Bağımsız ve Ortada) */}
                <div className="flex items-center justify-center gap-3">
                    {logoUrl && isHeaderLogo && logoAlignment === 'center' && (
                        <NextImage
                            src={logoUrl}
                            alt="Logo"
                            width={120}
                            height={getLogoHeight()}
                            unoptimized
                            className="object-contain shrink-0"
                            style={{ height: getLogoHeight() }}
                        />
                    )}
                    {titlePosition === 'center' && (
                        <span className={`${textSize} tracking-tight`} style={{ color: headerTextColor }}>{catalogName || "Katalog"}</span>
                    )}
                </div>

                {/* SAĞ SÜTUN */}
                <div className="flex items-center justify-end gap-3">
                    {titlePosition === 'right' && (
                        <span className={`${textSize} tracking-tight`} style={{ color: headerTextColor }}>{catalogName || "Katalog"}</span>
                    )}
                    {logoUrl && isHeaderLogo && logoAlignment === 'right' && (
                        <NextImage
                            src={logoUrl}
                            alt="Logo"
                            width={120}
                            height={getLogoHeight()}
                            unoptimized
                            className="object-contain shrink-0"
                            style={{ height: getLogoHeight() }}
                        />
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-transparent h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            {/* DEĞİŞİKLİK: Tüm sayfalarda header renkli (primaryColor) */}
            {/* ÖNCE: style={{ backgroundColor: pageNumber === 1 ? primaryColor : 'transparent' }} */}
            {/* ŞİMDİ: Tüm sayfalarda primaryColor */}
            <div className="shrink-0" style={{ height: HEADER_HEIGHT }}>
                <div
                    className={`h-full px-6 flex items-center ${pageNumber !== 1 ? 'border-b border-gray-200' : ''}`}
                    style={{ backgroundColor: primaryColor }}
                >
                    {renderHeaderContent(pageNumber === 1)}
                </div>
            </div>

            {/* Grid İçerik */}
            {/* ÖNEMLİ: Kart yapısı değiştirilmedi - aspect-[4/3] fotoğraf and flex-1 bilgiler alanı korundu */}
            <div className={`flex-1 p-4 grid ${getGridCols()} ${getGridRows()} gap-3 overflow-hidden`}>
                {(products || []).map((product) => {
                    const productUrl = product.product_url
                    // YENİ ÖZELLİK: showUrls kontrolü - showUrls=true ve URL varsa tıklanabilir, yoksa değil
                    // ÖNCE: Her zaman productUrl varsa tıklanabilirdi
                    // ŞİMDİ: showUrls=true VE productUrl varsa tıklanabilir
                    const Wrapper = (showUrls && productUrl) ? 'a' : 'div'
                    const wrapperProps = (showUrls && productUrl) ? {
                        href: productUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'flex flex-col h-full border border-gray-100 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer'
                    } : {
                        className: 'flex flex-col h-full border border-gray-100 rounded-lg overflow-hidden bg-white shadow-sm'
                    }

                    return (
                        <Wrapper key={product.id} {...(wrapperProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.HTMLAttributes<HTMLDivElement>)}>
                            {/* Görsel - KART YAPISI KORUNDU: aspect-[4/3] sabit oran, değiştirilmedi */}
                            <div className="aspect-[4/3] relative overflow-hidden bg-gray-50">
                                {/* YENİ ÖZELLİK: productImageFit - Fotoğraf hizalaması */}
                                {/* ÖNCE: className="object-cover" (sadece cover) */}
                                {/* ŞİMDİ: productImageFit'e göre contain/fill/cover */}
                                <NextImage
                                    src={product.image_url || product.images?.[0] || "/placeholder.svg"}
                                    alt={product.name}
                                    fill
                                    unoptimized
                                    className={productImageFit === 'contain' ? 'object-contain' : productImageFit === 'fill' ? 'object-fill' : 'object-cover'}
                                />
                                {/* YENİ ÖZELLİK: showUrls açıksa ve URL varsa link ikonu göster */}
                                {(showUrls && productUrl) && (
                                    <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow-sm">
                                        <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Bilgiler - KART YAPISI KORUNDU: flex-1 flex flex-col, değiştirilmedi */}
                            <div className="p-3 flex-1 flex flex-col">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1">{product.name}</h3>
                                    {showPrices && (
                                        <span className="font-bold text-sm shrink-0" style={{ color: primaryColor }}>
                                            {(() => {
                                                const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
                                                const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
                                                return `${symbol}${Number(product.price).toFixed(2)}`
                                            })()}
                                        </span>
                                    )}
                                </div>
                                {showDescriptions && product.description && (
                                    <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
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
                                    <p className="text-[10px] text-gray-400 mt-auto pt-1 font-mono">SKU: {product.sku}</p>
                                )}
                            </div>
                        </Wrapper>
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
                    className="h-full px-6 grid grid-cols-3 items-center"
                    style={{ backgroundColor: primaryColor }}
                >
                    {/* SOL SÜTUN */}
                    <div className="flex items-center justify-start gap-3">
                        {logoUrl && logoPosition?.startsWith('footer') && logoAlignment === 'left' && (
                            <NextImage
                                src={logoUrl}
                                alt="Logo"
                                width={120}
                                height={getLogoHeight()}
                                unoptimized
                                className="object-contain shrink-0"
                                style={{ height: getLogoHeight() }}
                            />
                        )}
                    </div>

                    {/* ORTA SÜTUN */}
                    <div className="flex items-center justify-center gap-3">
                        {logoUrl && logoPosition?.startsWith('footer') && logoAlignment === 'center' && (
                            <NextImage
                                src={logoUrl}
                                alt="Logo"
                                width={120}
                                height={getLogoHeight()}
                                unoptimized
                                className="object-contain shrink-0"
                                style={{ height: getLogoHeight() }}
                            />
                        )}
                        {/* Sayfa bilgisi her zaman ortada veya logo ortadaysa yanında */}
                        <span
                            className="text-sm font-bold tracking-tight"
                            style={{ color: headerTextColor }}
                        >
                            {catalogName} • Sayfa {pageNumber} / {totalPages}
                        </span>
                    </div>

                    {/* SAĞ SÜTUN */}
                    <div className="flex items-center justify-end gap-3">
                        {logoUrl && logoPosition?.startsWith('footer') && logoAlignment === 'right' && (
                            <NextImage
                                src={logoUrl}
                                alt="Logo"
                                width={120}
                                height={getLogoHeight()}
                                unoptimized
                                className="object-contain shrink-0"
                                style={{ height: getLogoHeight() }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
