"use client"

import React, { useState, useRef, useMemo, useEffect, useCallback } from "react"
import { FileText, List, ZoomIn, ZoomOut } from "lucide-react"
import { useUser } from "@/lib/user-context"
import type { Product } from "@/lib/actions/products"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

// Şablon bileşenleri - TÜM ŞABLONLAR GERİ GETİRİLDİ
import { ModernGridTemplate } from "@/components/catalogs/templates/modern-grid"
import { CompactListTemplate } from "@/components/catalogs/templates/compact-list"
import { MagazineTemplate } from "@/components/catalogs/templates/magazine"
import { MinimalistTemplate } from "@/components/catalogs/templates/minimalist"
import { BoldTemplate } from "@/components/catalogs/templates/bold"
import { ElegantCardsTemplate } from "@/components/catalogs/templates/elegant-cards"
import { ClassicCatalogTemplate } from "@/components/catalogs/templates/classic-catalog"
import { ShowcaseTemplate } from "@/components/catalogs/templates/showcase"
import { CatalogProTemplate } from "@/components/catalogs/templates/catalog-pro"
import { RetailTemplate } from "@/components/catalogs/templates/retail"
import { TechModernTemplate } from "@/components/catalogs/templates/tech-modern"
import { FashionLookbookTemplate } from "@/components/catalogs/templates/fashion-lookbook"
import { IndustrialTemplate } from "@/components/catalogs/templates/industrial"
import { LuxuryTemplate } from "@/components/catalogs/templates/luxury"
import { CleanWhiteTemplate } from "@/components/catalogs/templates/clean-white"
import { ProductTilesTemplate } from "@/components/catalogs/templates/product-tiles"

// Sayfa Bileşenleri
import { CoverPage } from "@/components/catalogs/cover-page"
import { CategoryDivider } from "@/components/catalogs/category-divider"

export type CatalogPage =
  | { type: 'cover' }
  | { type: 'divider'; categoryName: string; firstProductImage?: string }
  | { type: 'products'; products: Product[] }

interface CatalogPreviewProps {
  catalogName: string
  products: Product[]
  layout: string
  primaryColor: string
  headerTextColor?: string
  showPrices?: boolean
  showDescriptions?: boolean
  showAttributes?: boolean
  showSku?: boolean
  showUrls?: boolean
  productImageFit?: string
  columnsPerRow?: number
  logoUrl?: string
  logoPosition?: string
  logoSize?: string
  titlePosition?: string
  enableCoverPage?: boolean
  coverImageUrl?: string
  coverDescription?: string
  enableCategoryDividers?: boolean
  backgroundColor?: string
  backgroundImage?: string | null
  backgroundImageFit?: 'cover' | 'contain' | 'fill'
  backgroundGradient?: string | null
  theme?: string
  pages?: CatalogPage[]
  showControls?: boolean
  isExporting?: boolean
}

type TemplateComponentProps = {
  products: Product[]
  primaryColor: string
  catalogName: string
  pageNumber: number
  totalPages: number
  headerTextColor?: string
  showPrices?: boolean
  showDescriptions?: boolean
  showAttributes?: boolean
  showSku?: boolean
  showUrls?: boolean
  productImageFit?: string
  columnsPerRow?: number
  logoUrl?: string
  logoPosition?: string
  logoSize?: string
  titlePosition?: string
  isFreeUser: boolean
}

const ALL_TEMPLATES = {
  'modern-grid': ModernGridTemplate,
  'compact-list': CompactListTemplate,
  'list': CompactListTemplate,
  'magazine': MagazineTemplate,
  'minimalist': MinimalistTemplate,
  'minimal-gallery': MinimalistTemplate,
  'bold': BoldTemplate,
  'bold-grid': BoldTemplate,
  'elegant-cards': ElegantCardsTemplate,
  'elegant-showcase': ElegantCardsTemplate,
  'classic-catalog': ClassicCatalogTemplate,
  'showcase': ShowcaseTemplate,
  'catalog-pro': CatalogProTemplate,
  'retail': RetailTemplate,
  'tech-modern': TechModernTemplate,
  'fashion-lookbook': FashionLookbookTemplate,
  'industrial': IndustrialTemplate,
  'luxury': LuxuryTemplate,
  'clean-white': CleanWhiteTemplate,
  'product-tiles': ProductTilesTemplate,
}

const A4_WIDTH = 794
const A4_HEIGHT = 1123

export const CatalogPreview = React.memo(function CatalogPreview(props: CatalogPreviewProps) {
  const { user } = useUser()
  const isFreeUser = user?.plan === "free"
  const [currentPage, setCurrentPage] = useState(0)
  const [viewMode, setViewMode] = useState<"single" | "multi">("single")
  const [scale, setScale] = useState(0.7)
  const containerRef = useRef<HTMLDivElement>(null)
  const workspaceScrollRef = useRef<HTMLDivElement>(null)
  const [multiScrollTop, setMultiScrollTop] = useState(0)
  const [multiViewportHeight, setMultiViewportHeight] = useState(0)

  // Sayfa hesaplama mantığı
  const pages = useMemo(() => {
    if (props.pages && props.pages.length > 0) return props.pages
    const calculatedPages: CatalogPage[] = []

    if (props.enableCoverPage) calculatedPages.push({ type: 'cover' })

    const products = props.products || []

    // Şablona göre sayfa başına ürün sayısı
    let itemsPerPage = 6
    const layout = props.layout?.toLowerCase() || 'modern-grid'

    if (layout === 'classic-list' || layout === 'classic-catalog') itemsPerPage = 3
    else if (layout === 'minimal-gallery' || layout === 'minimalist') itemsPerPage = 4
    else if (layout === 'magazine') itemsPerPage = 1 + (props.columnsPerRow || 3) * 2
    else if (layout === 'showcase' || layout === 'fashion-lookbook') itemsPerPage = 5
    else if (layout === 'industrial') itemsPerPage = 8
    else if (layout === 'luxury') itemsPerPage = 6
    else if (layout === 'compact-list' || layout === 'list') itemsPerPage = 10
    else if (layout === 'retail') itemsPerPage = (props.columnsPerRow || 3) * 5
    else if (layout === 'catalog-pro') itemsPerPage = (props.columnsPerRow || 3) * 3
    else if (layout === 'product-tiles') itemsPerPage = 6
    else {
      // Modern Grid ve Varsayılan
      if (props.columnsPerRow === 2) itemsPerPage = 6
      else if (props.columnsPerRow === 3) itemsPerPage = 9
      else if (props.columnsPerRow === 4) itemsPerPage = 12
      else itemsPerPage = 9
    }

    if (props.enableCategoryDividers) {
      const groupedByCategory = new Map<string, Product[]>()
      for (const product of products) {
        const categoryName = product.category || 'Diğer'
        const current = groupedByCategory.get(categoryName)
        if (current) {
          current.push(product)
        } else {
          groupedByCategory.set(categoryName, [product])
        }
      }

      for (const [catName, catProducts] of groupedByCategory.entries()) {
        calculatedPages.push({
          type: 'divider',
          categoryName: catName,
          firstProductImage: catProducts[0]?.image_url ?? undefined,
        })

        for (let i = 0; i < catProducts.length; i += itemsPerPage) {
          calculatedPages.push({ type: 'products', products: catProducts.slice(i, i + itemsPerPage) })
        }
      }
    } else {
      for (let i = 0; i < products.length; i += itemsPerPage) {
        calculatedPages.push({ type: 'products', products: products.slice(i, i + itemsPerPage) })
      }
    }
    if (calculatedPages.length === 0) calculatedPages.push({ type: 'products', products: [] })
    return calculatedPages
  }, [props.products, props.layout, props.columnsPerRow, props.enableCoverPage, props.enableCategoryDividers, props.pages])

  const totalPages = pages.length

  const MULTI_VIRTUALIZATION_THRESHOLD = 30
  const MULTI_OVERSCAN_PAGES = 2
  const estimatedMultiPageHeight = A4_HEIGHT * scale + 40
  const shouldVirtualizeMultiPages = viewMode === 'multi' && totalPages > MULTI_VIRTUALIZATION_THRESHOLD

  const updateMultiViewportMetrics = useCallback(() => {
    if (!workspaceScrollRef.current) return
    setMultiViewportHeight(workspaceScrollRef.current.clientHeight)
  }, [])

  useEffect(() => {
    if (viewMode !== 'multi') return
    updateMultiViewportMetrics()
    const handleResize = () => updateMultiViewportMetrics()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [viewMode, updateMultiViewportMetrics])

  const handleWorkspaceScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (!shouldVirtualizeMultiPages) return
    setMultiScrollTop(event.currentTarget.scrollTop)
  }, [shouldVirtualizeMultiPages])

  const virtualVisiblePageCount = Math.max(
    1,
    Math.ceil((multiViewportHeight || estimatedMultiPageHeight) / estimatedMultiPageHeight)
  )
  const virtualStartPage = shouldVirtualizeMultiPages
    ? Math.max(0, Math.floor(multiScrollTop / estimatedMultiPageHeight) - MULTI_OVERSCAN_PAGES)
    : 0
  const virtualEndPage = shouldVirtualizeMultiPages
    ? Math.min(totalPages, virtualStartPage + virtualVisiblePageCount + MULTI_OVERSCAN_PAGES * 2)
    : totalPages
  const virtualPages = pages.slice(virtualStartPage, virtualEndPage)
  const virtualOffsetY = virtualStartPage * estimatedMultiPageHeight
  const virtualTotalHeight = totalPages * estimatedMultiPageHeight

  // Sayfa indeksi güvenliği: Render sırasında geçersiz indeksi engelle
  const safeCurrentPage = Math.min(currentPage, totalPages - 1 >= 0 ? totalPages - 1 : 0)

  // Sayfa indeksi değiştiğinde state'i de güncelle (useEffect yerine render sırasında kontrol)
  if (currentPage > safeCurrentPage) {
    setCurrentPage(safeCurrentPage)
  }

  const renderPage = (page: CatalogPage | undefined, pageIndex: number) => {
    if (!page) return null
    const TemplateComponent = (ALL_TEMPLATES[props.layout as keyof typeof ALL_TEMPLATES] || ALL_TEMPLATES['modern-grid']) as React.ComponentType<TemplateComponentProps>

    // Export modunda scale uygulamadan tam boyut render et
    const effectiveScale = props.isExporting ? 1 : scale

    return (
      <div
        key={`page-container-${props.layout}-${pageIndex}`}
        className="catalog-page-wrapper relative shrink-0"
        style={{
          width: props.isExporting ? A4_WIDTH : A4_WIDTH * scale,
          height: props.isExporting ? A4_HEIGHT : A4_HEIGHT * scale,
          marginBottom: viewMode === 'multi' ? 40 : 0
        }}
      >
        <div
          key={`page-${props.layout}-${pageIndex}`}
          className="catalog-page catalog-light shadow-2xl overflow-hidden absolute top-0 left-1/2 -translate-x-1/2 bg-white"
          style={{
            width: A4_WIDTH,
            height: A4_HEIGHT,
            transform: props.isExporting ? 'none' : `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          {page.type === 'cover' ? (
            <CoverPage
              catalogName={props.catalogName}
              coverImageUrl={props.coverImageUrl}
              coverDescription={props.coverDescription}
              logoUrl={props.logoUrl}
              primaryColor={props.primaryColor}
              productCount={props.products?.length || 0}
              theme={props.theme}
            />
          ) : page.type === 'divider' ? (
            <CategoryDivider
              categoryName={page.categoryName}
              firstProductImage={page.firstProductImage}
              primaryColor={props.primaryColor}
              theme={props.theme}
            />
          ) : (
            <TemplateComponent
              products={page.products}
              primaryColor={props.primaryColor}
              catalogName={props.catalogName}
              pageNumber={pageIndex + 1}
              totalPages={totalPages}
              isFreeUser={isFreeUser}
              headerTextColor={props.headerTextColor}
              showPrices={props.showPrices}
              showDescriptions={props.showDescriptions}
              showAttributes={props.showAttributes}
              showSku={props.showSku}
              showUrls={props.showUrls}
              productImageFit={props.productImageFit}
              columnsPerRow={props.columnsPerRow}
              logoUrl={props.logoUrl}
              logoPosition={props.logoPosition}
              logoSize={props.logoSize}
              titlePosition={props.titlePosition}
            />
          )}

          {isFreeUser && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 mix-blend-multiply opacity-5">
              <div className="text-8xl font-black text-gray-400 rotate-[-30deg] border-8 border-gray-400 p-8">FOGCATALOG</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (props.showControls === false) {
    // Thumbnail'lar (Tasarım Ayarları Kartları) için sadece ilk sayfayı göster ve tam sığdır
    // Eğer kapak varsa kapağı, yoksa ilk ürünlü sayfayı gösterir
    const page = pages[0]
    if (!page) return null
    const TemplateComponent = (ALL_TEMPLATES[props.layout as keyof typeof ALL_TEMPLATES] || ALL_TEMPLATES['modern-grid']) as React.ComponentType<TemplateComponentProps>

    return (
      <div className="w-full h-full flex items-start justify-center overflow-hidden bg-white">
        <div
          className="catalog-page catalog-light shadow-none overflow-hidden shrink-0"
          style={{ width: A4_WIDTH, height: A4_HEIGHT }}
        >
          {page.type === 'cover' ? (
            <CoverPage
              catalogName={props.catalogName}
              coverImageUrl={props.coverImageUrl}
              coverDescription={props.coverDescription}
              logoUrl={props.logoUrl}
              primaryColor={props.primaryColor}
              productCount={props.products?.length || 0}
              theme={props.theme}
            />
          ) : page.type === 'divider' ? (
            <CategoryDivider
              categoryName={page.categoryName}
              firstProductImage={page.firstProductImage}
              primaryColor={props.primaryColor}
              theme={props.theme}
            />
          ) : (
            <TemplateComponent
              products={page.products}
              primaryColor={props.primaryColor}
              catalogName={props.catalogName}
              pageNumber={1}
              totalPages={totalPages}
              isFreeUser={isFreeUser}
              headerTextColor={props.headerTextColor}
              showPrices={props.showPrices}
              showDescriptions={props.showDescriptions}
              showAttributes={props.showAttributes}
              showSku={props.showSku}
              showUrls={props.showUrls}
              productImageFit={props.productImageFit}
              columnsPerRow={props.columnsPerRow}
              logoUrl={props.logoUrl}
              logoPosition={props.logoPosition}
              logoSize={props.logoSize}
              titlePosition={props.titlePosition}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-gradient-to-br dark:from-[#0a0c1a] dark:to-[#020308] relative isolate">
      {/* Decorative Effects - Static for stability */}
      <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-indigo-500/15 blur-[140px] rounded-full pointer-events-none hidden dark:block -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[70%] bg-violet-600/10 blur-[140px] rounded-full pointer-events-none hidden dark:block -z-10" />

      {/* Ultra-Compact Responsive Control Bar */}
      <div className="flex items-center justify-between px-2 md:px-4 py-1.5 md:py-2.5 bg-white/80 dark:bg-[#080a12]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 shrink-0 z-30 shadow-sm gap-1 md:gap-2">
        <div className="flex items-center gap-1 md:gap-2">
          <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 rounded-xl border border-slate-200 dark:border-white/10">
            <Button
              variant={viewMode === 'single' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "h-7 md:h-8 px-1.5 md:px-3 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                viewMode === 'single' && "bg-white dark:bg-indigo-600 shadow-sm text-slate-900 dark:text-white"
              )}
              onClick={() => setViewMode('single')}
            >
              <FileText className="w-3.5 h-3.5 lg:mr-1.5" />
              <span className="hidden lg:inline">Tek Sayfa</span>
            </Button>
            <Button
              variant={viewMode === 'multi' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "h-7 md:h-8 px-1.5 md:px-3 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                viewMode === 'multi' && "bg-white dark:bg-indigo-600 shadow-sm text-slate-900 dark:text-white"
              )}
              onClick={() => setViewMode('multi')}
            >
              <List className="w-3.5 h-3.5 lg:mr-1.5" />
              <span className="hidden lg:inline">Tüm Sayfalar</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 md:gap-2 bg-slate-100 dark:bg-white/5 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 md:h-8 px-1.5 md:px-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
              onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[10px] font-bold w-8 text-center text-slate-500 dark:text-slate-400 tabular-nums">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 md:h-8 px-1.5 md:px-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
              onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>

          {viewMode === 'single' && totalPages > 1 && (
            <div className="flex items-center gap-3 md:gap-4 bg-slate-100 dark:bg-white/5 px-4 py-1.5 rounded-2xl border border-slate-200 dark:border-white/10 min-w-[200px] md:min-w-[300px]">
              <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                Sayfa {safeCurrentPage + 1}
              </div>
              <Slider
                value={[safeCurrentPage]}
                max={totalPages - 1}
                step={1}
                onValueChange={([val]) => setCurrentPage(val)}
                className="flex-1 cursor-pointer"
              />
              <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                {totalPages}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Workspace */}
      <div
        ref={workspaceScrollRef}
        onScroll={handleWorkspaceScroll}
        className="flex-1 overflow-auto p-12 relative z-10 custom-scrollbar"
        style={{ overflowAnchor: 'none' }}
      >
        <div className="min-h-full flex flex-col items-center w-full">
          {viewMode === 'single' ? (
            <div className="flex justify-center flex-1 w-full">
              {renderPage(pages[safeCurrentPage], safeCurrentPage)}
            </div>
          ) : (
            shouldVirtualizeMultiPages ? (
              <div className="w-full" style={{ height: `${virtualTotalHeight}px`, position: 'relative' }}>
                <div
                  className="absolute left-0 right-0 top-0 flex flex-col items-center w-full"
                  style={{ transform: `translateY(${virtualOffsetY}px)` }}
                >
                  {virtualPages.map((page, localIndex) => renderPage(page, virtualStartPage + localIndex))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                {pages.map((page, index) => renderPage(page, index))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
})
