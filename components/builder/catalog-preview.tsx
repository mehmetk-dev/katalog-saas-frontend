"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { useUser } from "@/lib/user-context"
import type { Product } from "@/lib/actions/products"
import { Button } from "@/components/ui/button"

import { ALL_TEMPLATES } from "../catalogs/templates/registry"

interface CatalogPreviewProps {
  catalogName: string
  products: Product[]
  layout: string
  primaryColor: string
  showPrices: boolean
  showDescriptions: boolean
  showAttributes: boolean
  showSku: boolean
  showUrls?: boolean
  // Yeni kişiselleştirme props
  columnsPerRow?: number
  backgroundColor?: string
  backgroundImage?: string | null
  backgroundImageFit?: 'cover' | 'contain' | 'fill'
  backgroundGradient?: string | null
  logoUrl?: string | null
  logoPosition?: string
  logoSize?: string
  titlePosition?: string
  headerTextColor?: string
  productImageFit?: 'cover' | 'contain' | 'fill'
  isExporting?: boolean
}

export function CatalogPreview(props: CatalogPreviewProps) {
  const { user } = useUser()
  const isFreeUser = user?.plan === "free"
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [currentPage, setCurrentPage] = useState(0)
  const [viewMode, setViewMode] = useState<"single" | "all">("single")
  const { isExporting = false } = props

  // A4 boyutları (pixel - 96 DPI)
  const A4_WIDTH = 794
  const A4_HEIGHT = 1123

  // Kişiselleştirme değerleri (varsayılanlarla)
  const columnsPerRow = props.columnsPerRow || 3
  const backgroundColor = props.backgroundColor || '#ffffff'
  const backgroundImage = props.backgroundImage
  const backgroundImageFit = props.backgroundImageFit || 'cover'
  const backgroundGradient = props.backgroundGradient

  // Container genişliğine göre scale hesapla
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const padding = 48 // Her iki tarafta 24px padding
        const availableWidth = containerWidth - padding
        const newScale = Math.min(availableWidth / A4_WIDTH, 0.85)
        setScale(newScale)
      }
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  // Sütun sayısına göre sayfa başına ürün hesapla
  const getItemsPerPage = () => {
    switch (props.layout) {
      case 'magazine':
        return columnsPerRow === 2 ? 5 : 7;
      case 'fashion-lookbook':
        return 4;
      case 'industrial':
        return 8;
      case 'compact-list':
        return 10; // Kullanıcı isteği üzerine 10'a çekildi
      case 'classic-catalog':
        return 10;
      case 'minimalist':
        return 6; // Public ile aynı
      case 'retail':
        return 12; // Public ile aynı
      case 'product-tiles':
        return columnsPerRow === 2 ? 4 : columnsPerRow * 3;
      case 'catalog-pro':
      case 'modern-grid':
      case 'bold':
      case 'luxury':
      case 'tech-modern':
      case 'clean-white':
      case 'elegant-cards':
        return columnsPerRow * 3;
      default:
        return columnsPerRow * 3;
    }
  }

  const itemsPerPage = getItemsPerPage()

  const pages = props.products.length > 0
    ? Array.from({ length: Math.ceil(props.products.length / itemsPerPage) }, (_, i) =>
      props.products.slice(i * itemsPerPage, (i + 1) * itemsPerPage)
    )
    : [[]]

  // Sayfa değiştiğinde geçerli aralıkta tut
  useEffect(() => {
    if (pages.length > 0 && currentPage >= pages.length) {
      setCurrentPage(Math.max(0, pages.length - 1))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length])

  // Arka plan stili hesaplama
  const getBackgroundStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {
      backgroundColor: backgroundColor,
    }

    if (backgroundGradient && backgroundGradient !== 'none') {
      // Shorthand 'background' yerine 'backgroundImage' kullanarak çakışmayı önle
      style.backgroundImage = backgroundGradient
    }

    if (backgroundImage) {
      // Eğer hem gradient hem image varsa, ikisini birden ( virgülle ayırarak) destekleyebiliriz
      // Ancak şimdilik sadece görsel varsa görseli önceliklendir veya üstüne yaz
      // React'te 'background' shorthand'i ile 'backgroundColor' karıştırmak hata verir.
      style.backgroundImage = `url(${backgroundImage})`
      style.backgroundSize = backgroundImageFit === 'fill' ? '100% 100%' : backgroundImageFit
      style.backgroundPosition = 'center'
      style.backgroundRepeat = 'no-repeat'
    }

    return style
  }

  const goToPage = (page: number) => {
    if (page >= 0 && page < pages.length) {
      setCurrentPage(page)
    }
  }

  // Sayfa içeriğini render et - Logo bilgisi template'e geçirilir
  const renderPage = (pageProducts: Product[], pageIndex: number, isClickable: boolean = false) => {
    const TemplateComponent = ALL_TEMPLATES[props.layout] || ALL_TEMPLATES['modern-grid']

    return (
      <div
        key={pageIndex}
        className={`catalog-page shadow-2xl overflow-hidden relative shrink-0 ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all' : ''}`}
        style={{
          width: A4_WIDTH,
          height: A4_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          ...(isClickable ? { marginBottom: (A4_HEIGHT * scale - A4_HEIGHT) + 16 } : {}),
          ...getBackgroundStyle(),
        }}
        onClick={isClickable ? () => { setCurrentPage(pageIndex); setViewMode("single") } : undefined}
      >
        {/* Watermark for Free Users */}
        {isFreeUser && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 mix-blend-multiply opacity-20">
            <div className="text-8xl font-black text-gray-300 rotate-[-30deg] select-none border-8 border-gray-300 p-8">
              PREVIEW ONLY
            </div>
          </div>
        )}

        {/* Sayfa numarası rozeti (sadece tüm sayfalar görünümünde) */}
        {isClickable && (
          <div className="absolute top-3 right-3 z-50 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Sayfa {pageIndex + 1}
          </div>
        )}

        {/* Template - Logo bilgisi template'e geçirilir */}
        <TemplateComponent
          catalogName={props.catalogName}
          products={pageProducts}
          primaryColor={props.primaryColor}
          headerTextColor={props.headerTextColor}
          showPrices={props.showPrices}
          showDescriptions={props.showDescriptions}
          showAttributes={props.showAttributes}
          showSku={props.showSku}
          showUrls={props.showUrls}
          productImageFit={props.productImageFit || 'cover'}
          isFreeUser={isFreeUser}
          pageNumber={pageIndex + 1}
          totalPages={pages.length}
          columnsPerRow={columnsPerRow}
          backgroundColor={props.backgroundColor}
          backgroundImage={props.backgroundImage ?? undefined}
          backgroundImageFit={props.backgroundImageFit}
          backgroundGradient={props.backgroundGradient ?? undefined}
          logoUrl={props.logoUrl ?? undefined}
          logoPosition={props.logoPosition}
          logoSize={props.logoSize}
          titlePosition={props.titlePosition as 'left' | 'center' | 'right' | undefined}
        />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-hidden bg-gray-100/50">
      {/* Sayfa Kontrolü */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur border-b shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "single" ? "all" : "single")}
            className="text-xs"
          >
            {viewMode === "single" ? "Tüm Sayfalar" : "Tek Sayfa"}
          </Button>

          {/* Sütun sayısı göstergesi */}
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {columnsPerRow} sütun
          </span>
        </div>

        {viewMode === "single" && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 min-w-[100px] justify-center">
              <span className="text-sm font-medium">Sayfa {currentPage + 1}</span>
              <span className="text-sm text-muted-foreground">/ {pages.length}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === pages.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {viewMode === "all" && (
          <div className="text-sm text-muted-foreground">
            Toplam {pages.length} sayfa
          </div>
        )}

        {/* Mini sayfa göstergeleri */}
        {pages.length > 1 && viewMode === "single" && (
          <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[120px] sm:max-w-[200px] min-w-0">
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToPage(idx)}
                className={`w-2 h-2 rounded-full transition-all hover:scale-125 ${idx === currentPage
                  ? "bg-primary shadow-sm"
                  : "bg-slate-300 hover:bg-slate-400"
                  }`}
                title={`Sayfa ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Önizleme Alanı */}
      {/* Önizleme Alanı */}
      <div
        id="catalog-preview-container"
        className="flex-1 overflow-auto p-6"
      >
        {viewMode === "single" && !isExporting ? (
          /* Tek Sayfa Görünümü */
          <div
            className="flex justify-center"
            style={{
              minHeight: A4_HEIGHT * scale + 32
            }}
          >
            {/* Tek sayfa modunda wrapper'a gerek var mı? PDF için yok ama tutarlılık için ekleyelim */}
            <div className="catalog-page-wrapper">
              {renderPage(pages[currentPage], currentPage, false)}
            </div>
          </div>
        ) : (
          /* Tüm Sayfalar Görünümü (veya Export Modu) */
          <div className="flex flex-col items-center gap-8">
            {pages.map((pageProducts, index) => (
              <div key={index} className="catalog-page-wrapper">
                {renderPage(pageProducts, index, !isExporting)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
