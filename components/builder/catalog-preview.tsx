"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight, Layout, Monitor } from "lucide-react"
import { useUser } from "@/lib/user-context"
import type { Product } from "@/lib/actions/products"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import { ALL_TEMPLATES } from "../catalogs/templates/registry"
import { CategoryDivider } from "../catalogs/category-divider"
import { CoverPage } from "../catalogs/cover-page"
// Lightbox support
import { LightboxProvider } from "@/lib/lightbox-context"
import { ImageLightbox } from "@/components/ui/image-lightbox"

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

// Sayfa tipi için type-safe interface
type CatalogPage =
  | { type: 'cover' }
  | { type: 'divider'; categoryName: string; firstProductImage: string | null }
  | { type: 'products'; products: Product[] }

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

  // === STORYTELLING & PAGINATION LOGIC (MEMOIZED) ===
  const displayPages = useMemo(() => {
    const pages: CatalogPage[] = []

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
  }, [props.enableCoverPage, props.enableCategoryDividers, props.products, itemsPerPage])

  useEffect(() => {
    if (displayPages.length > 0 && currentPage >= displayPages.length) {
      setCurrentPage(Math.max(0, displayPages.length - 1))
    }
  }, [displayPages.length, currentPage])

  // Arka plan stili hesaplama (MEMOIZED)
  const backgroundStyle = useMemo((): React.CSSProperties => {
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
  }, [backgroundColor, backgroundGradient, backgroundImage, backgroundImageFit])

  const goToPage = (page: number) => {
    if (page >= 0 && page < displayPages.length) {
      setCurrentPage(page)
    }
  }

  // Sayfa içeriğini render et - Logo bilgisi template'e geçirilir
  const renderPage = (page: CatalogPage | undefined, pageIndex: number, isClickable: boolean = false) => {
    // Null/undefined kontrolü
    if (!page) {
      return null
    }

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
            ...(isClickable ? { marginBottom: (A4_HEIGHT * scale - A4_HEIGHT) + 16 } : {})
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

    // 3. ÜRÜN SAYFASI (page.type === 'products' olmalı - else bloğu olarak düşecek)
    const TemplateComponent = ALL_TEMPLATES[props.layout] || ALL_TEMPLATES['modern-grid']
    const pageProducts = page.type === 'products' ? page.products : []

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
          ...backgroundStyle,
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
    <LightboxProvider>
      <div ref={containerRef} className="flex flex-col h-full overflow-hidden bg-white catalog-light">
        {/* Global Lightbox support in Preview */}
        <ImageLightbox />

        {/* Sayfa Kontrolü - Sadece 'showControls' true ise göster */}
        {showControls && (
          <div className="flex items-center justify-between px-2 sm:px-4 py-2 bg-white border-b shrink-0 gap-1.5 sm:gap-4 shadow-sm z-10">
            <div className="flex items-center gap-1 sm:gap-3 min-w-0">
              <div className="flex xl:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full border border-border/40 bg-muted/30 px-3 flex items-center gap-2 hover:bg-muted/50 transition-all active:scale-95"
                  onClick={() => setViewMode(viewMode === "single" ? "all" : "single")}
                >
                  {viewMode === "single" ? (
                    <>
                      <Monitor className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[9px] font-black uppercase">TEK SAYFA</span>
                    </>
                  ) : (
                    <>
                      <Layout className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[9px] font-black uppercase tracking-tight">TÜM SAYFALAR</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="hidden xl:block">
                <Tabs
                  value={viewMode}
                  onValueChange={(v) => setViewMode(v as "single" | "all")}
                  className="h-9"
                >
                  <TabsList className="bg-muted/50 p-1 rounded-full border border-border/40">
                    <TabsTrigger
                      value="single"
                      className="rounded-full px-4 py-1.5 h-7 text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                    >
                      <Monitor className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                      TEK SAYFA
                    </TabsTrigger>
                    <TabsTrigger
                      value="all"
                      className="rounded-full px-4 py-1.5 h-7 text-[10px] font-black uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                    >
                      <Layout className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                      TÜM SAYFALAR
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="h-5 w-px bg-border/40 mx-0.5 hidden xl:block" />

              {/* Sütun sayısı - Sadece geniş ekranlarda */}
              <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-muted/40 rounded-full border border-border/20 shrink-0">
                <span className="text-[9px] font-black text-muted-foreground uppercase opacity-80 tracking-widest">{columnsPerRow} SÜTUN</span>
              </div>
            </div>

            {viewMode === "single" && (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-muted"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>

                <div className="flex items-center justify-center bg-muted/50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-border/30 min-w-[50px] sm:min-w-[80px]">
                  <span className="text-[10px] sm:text-xs font-black text-foreground tabular-nums">{currentPage + 1}</span>
                  <span className="text-[9px] font-bold text-muted-foreground mx-1">/</span>
                  <span className="text-[10px] sm:text-xs font-black text-muted-foreground tabular-nums">{displayPages.length}</span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-muted"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === displayPages.length - 1}
                >
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            )}

            {/* Sayfa Kaydırıcı - Sadece geniş ekranlarda */}
            {displayPages.length > 1 && viewMode === "single" && (
              <div className="hidden 2xl:flex items-center gap-3 flex-1 max-w-[200px] ml-4">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[8px] font-black text-muted-foreground uppercase">SAYFA GEZGİNİ</span>
                  </div>
                  <Slider
                    value={[currentPage]}
                    max={displayPages.length - 1}
                    step={1}
                    onValueChange={(vals) => goToPage(vals[0])}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            )}

            {viewMode === "all" && (
              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest hidden sm:flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-full border border-border/20">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                {displayPages.length} SAYFA
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
    </LightboxProvider>
  )
}
