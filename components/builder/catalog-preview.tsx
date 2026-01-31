"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import NextImage from "next/image"

import { useUser } from "@/lib/user-context"
import type { Product } from "@/lib/actions/products"
import { Button } from "@/components/ui/button"

import { ALL_TEMPLATES } from "../catalogs/templates/registry"
import { CategoryDivider } from "../catalogs/category-divider"
import { CoverPage } from "../catalogs/cover-page"

interface CatalogPreviewProps {
  catalogName: string
  products: Product[]
  layout: string
  primaryColor?: string
  showPrices?: boolean
  showDescriptions?: boolean
  showAttributes?: boolean
  showSku?: boolean
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
  // Storytelling Props
  enableCoverPage?: boolean
  coverImageUrl?: string | null
  coverDescription?: string | null
  enableCategoryDividers?: boolean
  showControls?: boolean // Kontrolleri açıp kapatmak için yeni prop
  theme?: string
}

export function CatalogPreview(props: CatalogPreviewProps) {
  const { user } = useUser()
  const isFreeUser = user?.plan === "free"
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [currentPage, setCurrentPage] = useState(0)
  const [viewMode, setViewMode] = useState<"single" | "all">("single")
  const { isExporting = false, showControls = true } = props

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
      case 'showcase':
        return 5;
      case 'fashion-lookbook':
        return 5;
      case 'industrial':
        return 8;
      case 'compact-list':
        return 10;
      case 'classic-catalog':
        return 3;
      case 'minimalist':
        return 4;
      case 'retail':
        return 12;
      case 'luxury':
        return 6;
      case 'product-tiles':
        return columnsPerRow === 2 ? 4 : 9;
      case 'catalog-pro':
      case 'modern-grid':
      case 'bold':
      case 'tech-modern':
      case 'clean-white':
      case 'elegant-cards':
        return columnsPerRow * 3;
      default:
        return columnsPerRow * 3;
    }
  }

  const itemsPerPage = getItemsPerPage()

  // === STORYTELLING & PAGINATION LOGIC ===
  const buildPages = () => {
    const pages: any[] = []

    // 1. Kapak sayfası (Prop ile kontrol edilir)
    if (props.enableCoverPage) {
      pages.push({ type: 'cover' })
    }

    // 2. Ürün sayfaları (Kategori bölücüleri ile birlikte)
    if (props.enableCategoryDividers && props.products.length > 0) {
      // Ürünleri kategorilerine göre grupla
      const productsByCategory = new Map<string, Product[]>()
      props.products.forEach(product => {
        const category = product.category || 'Kategorisiz'
        if (!productsByCategory.has(category)) {
          productsByCategory.set(category, [])
        }
        productsByCategory.get(category)!.push(product)
      })

      // Her kategori için bölücü + ürün sayfaları ekle
      productsByCategory.forEach((catProducts, categoryName) => {
        // Kategori bölücü ekle
        pages.push({
          type: 'divider',
          categoryName,
          firstProductImage: catProducts[0]?.image_url || null
        })

        // Bu kategorideki ürünleri sayfalara böl
        for (let i = 0; i < catProducts.length; i += itemsPerPage) {
          pages.push({
            type: 'products',
            products: catProducts.slice(i, i + itemsPerPage)
          })
        }
      })
    } else {
      // Kategori bölücü yoksa her zamanki gibi sayfalara böl
      const basicPages = props.products.length > 0
        ? Array.from({ length: Math.ceil(props.products.length / itemsPerPage) }, (_, i) =>
          props.products.slice(i * itemsPerPage, (i + 1) * itemsPerPage)
        )
        : [[]]

      basicPages.forEach(p => {
        pages.push({ type: 'products', products: p })
      })
    }

    return pages
  }

  const displayPages = buildPages()

  useEffect(() => {
    if (displayPages.length > 0 && currentPage >= displayPages.length) {
      setCurrentPage(Math.max(0, displayPages.length - 1))
    }
  }, [displayPages.length, currentPage])

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
    if (page >= 0 && page < displayPages.length) {
      setCurrentPage(page)
    }
  }

  // Sayfa içeriğini render et - Logo bilgisi template'e geçirilir
  const renderPage = (page: any, pageIndex: number, isClickable: boolean = false) => {
    // 1. KAPAK SAYFASI
    if (page.type === 'cover') {
      return (
        <div
          key="cover"
          className={`catalog-page shadow-2xl overflow-hidden relative shrink-0 ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all' : ''}`}
          style={{
            width: A4_WIDTH,
            height: A4_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            ...(isClickable ? { marginBottom: (A4_HEIGHT * scale - A4_HEIGHT) + 16 } : {}),
            backgroundColor: '#ffffff'
          }}
          onClick={isClickable ? () => { setCurrentPage(pageIndex); setViewMode("single") } : undefined}
        >
          <CoverPage
            catalogName={props.catalogName}
            coverImageUrl={props.coverImageUrl}
            coverDescription={props.coverDescription}
            logoUrl={props.logoUrl}
            primaryColor={props.primaryColor}
            isExporting={isExporting}
            theme={props.theme}
          />

          {/* Watermark for Free Users */}
          {isFreeUser && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 mix-blend-multiply opacity-20">
              <div className="text-8xl font-black text-gray-300 rotate-[-30deg] select-none border-8 border-gray-300 p-8">
                PREVIEW ONLY
              </div>
            </div>
          )}
        </div>
      )
    }

    // 2. KATEGORİ BÖLÜCÜ SAYFASI
    if (page.type === 'divider') {
      return (
        <div
          key={`divider-${page.categoryName}`}
          className={`catalog-page shadow-2xl overflow-hidden relative shrink-0 ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all' : ''}`}
          style={{
            width: A4_WIDTH,
            height: A4_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            ...(isClickable ? { marginBottom: (A4_HEIGHT * scale - A4_HEIGHT) + 16 } : {}),
            backgroundColor: 'yellow' // Temp, will be removed via logic below
          }}
          onClick={isClickable ? () => { setCurrentPage(pageIndex); setViewMode("single") } : undefined}
        >
          <CategoryDivider
            categoryName={page.categoryName}
            firstProductImage={page.firstProductImage}
            primaryColor={props.primaryColor}
            theme={props.theme}
          />

          {/* Watermark for Free Users */}
          {isFreeUser && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 mix-blend-multiply opacity-20">
              <div className="text-8xl font-black text-gray-300 rotate-[-30deg] select-none border-8 border-gray-300 p-8">
                PREVIEW ONLY
              </div>
            </div>
          )}

          {/* Page Number Badge */}
          {isClickable && (
            <div className="absolute top-3 right-3 z-50 bg-black/70 text-white text-xs px-2 py-1 rounded">
              Sayfa {pageIndex + 1}
            </div>
          )}
        </div>
      )
    }

    // 3. ÜRÜN SAYFASI
    const TemplateComponent = ALL_TEMPLATES[props.layout] || ALL_TEMPLATES['modern-grid']
    const pageProducts = page.products || []

    return (
      <div
        key={pageIndex}
        className={`catalog-page bg-white shadow-2xl overflow-hidden relative shrink-0 flex flex-col ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all' : ''}`}
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
          primaryColor={props.primaryColor || '#4f46e5'}
          headerTextColor={props.headerTextColor || '#ffffff'}
          showPrices={props.showPrices ?? true}
          showDescriptions={props.showDescriptions ?? true}
          showAttributes={props.showAttributes ?? true}
          showSku={props.showSku ?? true}
          showUrls={props.showUrls ?? true}
          productImageFit={props.productImageFit || 'cover'}
          isFreeUser={isFreeUser}
          pageNumber={pageIndex + 1}
          totalPages={displayPages.length}
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
    <div ref={containerRef} className="flex flex-col h-full overflow-hidden bg-white catalog-light">
      {/* Sayfa Kontrolü - Sadece 'showControls' true ise göster */}
      {showControls && (
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-white/90 backdrop-blur-md border-b shrink-0 gap-3">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewMode(viewMode === "single" ? "all" : "single")}
              className="h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-bold uppercase tracking-tight rounded-full transition-all"
            >
              {viewMode === "single" ? "TÜM SAYFALAR" : "TEK SAYFA"}
            </Button>

            <div className="h-4 w-px bg-border/60 mx-1 hidden xs:block" />

            {/* Sütun sayısı göstergesi */}
            <div className="hidden xs:flex items-center gap-1 px-2 py-1 bg-muted/60 rounded-full border border-border/40 shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{columnsPerRow} SÜTUN</span>
            </div>
          </div>

          {viewMode === "single" && (
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center justify-center bg-muted/50 px-3 py-1 rounded-full border border-border/30 min-w-[70px] sm:min-w-[90px]">
                <span className="text-xs font-black text-foreground tabular-nums">{currentPage + 1}</span>
                <span className="text-[10px] font-bold text-muted-foreground mx-1">/</span>
                <span className="text-xs font-black text-muted-foreground tabular-nums">{displayPages.length}</span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === displayPages.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {viewMode === "all" && (
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:block">
              TOPLAM {displayPages.length} SAYFA
            </div>
          )}

          {/* Mini indicators - Hidden on very small screens */}
          {displayPages.length > 1 && viewMode === "single" && (
            <div className="hidden md:flex items-center justify-end gap-1.5 min-w-0">
              {displayPages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToPage(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all hover:scale-150 ${idx === currentPage
                    ? "bg-violet-500 w-3 shadow-md shadow-violet-200"
                    : "bg-slate-300 hover:bg-slate-400"
                    }`}
                  title={`Sayfa ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
              {renderPage(displayPages[currentPage], currentPage, false)}
            </div>
          </div>
        ) : (
          /* Tüm Sayfalar Görünümü (veya Export Modu) */
          <div className="flex flex-col items-center gap-8">
            {displayPages.map((page, index) => (
              <div key={index} className="catalog-page-wrapper">
                {renderPage(page, index, !isExporting)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
