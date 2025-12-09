"use client"

import { useState, useRef, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import type { Product } from "@/lib/actions/products"
import { ALL_TEMPLATES } from "../catalogs/templates/registry"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CatalogPreviewProps {
  catalogName: string
  products: Product[]
  layout: string
  primaryColor: string
  showPrices: boolean
  showDescriptions: boolean
  // Yeni kişiselleştirme props
  columnsPerRow?: number
  backgroundColor?: string
  backgroundImage?: string | null
  backgroundImageFit?: 'cover' | 'contain' | 'fill'
  backgroundGradient?: string | null
  logoUrl?: string | null
  logoPosition?: string
  logoSize?: string
}

export function CatalogPreview(props: CatalogPreviewProps) {
  const { user } = useUser()
  const isFreeUser = user?.plan === "free"
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [currentPage, setCurrentPage] = useState(0)
  const [viewMode, setViewMode] = useState<"single" | "all">("single")

  // A4 boyutları (pixel - 96 DPI)
  const A4_WIDTH = 794
  const A4_HEIGHT = 1123

  // Kişiselleştirme değerleri (varsayılanlarla)
  const columnsPerRow = props.columnsPerRow || 3
  const backgroundColor = props.backgroundColor || '#ffffff'
  const backgroundImage = props.backgroundImage
  const backgroundImageFit = props.backgroundImageFit || 'cover'
  const backgroundGradient = props.backgroundGradient
  const logoUrl = props.logoUrl
  const logoPosition = props.logoPosition || 'top-left'
  const logoSize = props.logoSize || 'medium'

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
    // Sütun sayısına göre otomatik hesapla (satır sayısı sabit: 3)
    const rowsPerPage = 3
    return columnsPerRow * rowsPerPage
  }

  const itemsPerPage = getItemsPerPage()

  const pages = props.products.length > 0
    ? Array.from({ length: Math.ceil(props.products.length / itemsPerPage) }, (_, i) =>
      props.products.slice(i * itemsPerPage, (i + 1) * itemsPerPage)
    )
    : [[]]

  // Sayfa değiştiğinde geçerli aralıkta tut
  useEffect(() => {
    if (currentPage >= pages.length) {
      setCurrentPage(Math.max(0, pages.length - 1))
    }
  }, [pages.length, currentPage])

  // Logo boyut hesaplama
  const getLogoSizeStyle = () => {
    switch (logoSize) {
      case 'small': return { width: '60px', height: 'auto' }
      case 'medium': return { width: '100px', height: 'auto' }
      case 'large': return { width: '150px', height: 'auto' }
      default: return { width: '100px', height: 'auto' }
    }
  }

  // Logo pozisyon hesaplama
  const getLogoPositionStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'absolute', zIndex: 40 }
    switch (logoPosition) {
      case 'top-left': return { ...base, top: '20px', left: '20px' }
      case 'top-center': return { ...base, top: '20px', left: '50%', transform: 'translateX(-50%)' }
      case 'top-right': return { ...base, top: '20px', right: '20px' }
      case 'bottom-left': return { ...base, bottom: '20px', left: '20px' }
      case 'bottom-center': return { ...base, bottom: '20px', left: '50%', transform: 'translateX(-50%)' }
      case 'bottom-right': return { ...base, bottom: '20px', right: '20px' }
      default: return { ...base, top: '20px', left: '20px' }
    }
  }

  // Arka plan stili hesaplama
  const getBackgroundStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {
      backgroundColor: backgroundColor,
    }

    if (backgroundGradient && backgroundGradient !== 'none') {
      style.background = backgroundGradient
    }

    if (backgroundImage) {
      style.backgroundImage = `url(${backgroundImage})`
      style.backgroundSize = backgroundImageFit === 'fill' ? '100% 100%' : backgroundImageFit
      style.backgroundPosition = 'center'
      style.backgroundRepeat = 'no-repeat'
    }

    return style
  }

  const renderTemplate = (pageProducts: Product[], pageNum: number, total: number) => {
    const pageProps = {
      ...props,
      products: pageProducts,
      isFreeUser,
      pageNumber: pageNum,
      totalPages: total,
      columnsPerRow, // Sütun sayısını template'e geçir
    }

    const TemplateComponent = ALL_TEMPLATES[props.layout] || ALL_TEMPLATES['modern-grid']
    return <TemplateComponent {...pageProps} />
  }

  const goToPage = (page: number) => {
    if (page >= 0 && page < pages.length) {
      setCurrentPage(page)
    }
  }

  // Sayfa içeriğini render et
  const renderPage = (pageProducts: Product[], pageIndex: number, isClickable: boolean = false) => (
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
      {/* Logo Overlay */}
      {logoUrl && (
        <div style={getLogoPositionStyle()}>
          <img
            src={logoUrl}
            alt="Logo"
            style={getLogoSizeStyle()}
            className="object-contain"
          />
        </div>
      )}

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

      {renderTemplate(pageProducts, pageIndex + 1, pages.length)}
    </div>
  )

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
          <div className="flex items-center gap-1">
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToPage(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${idx === currentPage
                  ? "bg-primary"
                  : "bg-gray-300 hover:bg-gray-400"
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Önizleme Alanı */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === "single" ? (
          /* Tek Sayfa Görünümü */
          <div
            className="flex justify-center"
            style={{
              minHeight: A4_HEIGHT * scale + 32
            }}
          >
            {renderPage(pages[currentPage], currentPage, false)}
          </div>
        ) : (
          /* Tüm Sayfalar Görünümü */
          <div className="flex flex-col items-center gap-8">
            {pages.map((pageProducts, index) => renderPage(pageProducts, index, true))}
          </div>
        )}
      </div>
    </div>
  )
}
