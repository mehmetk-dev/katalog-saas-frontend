"use client"

import React, { useState, useRef, useMemo, useEffect, useCallback } from "react"
import { FileText, List, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import type { Product } from "@/lib/actions/products"
import type { TemplateProps } from "@/components/catalogs/templates/types"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/contexts/i18n-provider"

// PERF(F4): Lazy-load templates — only the active template is loaded at any time
import dynamic from "next/dynamic"

const ModernGridTemplate = dynamic(() => import("@/components/catalogs/templates/modern-grid").then(m => ({ default: m.ModernGridTemplate })), { ssr: false })
const CompactListTemplate = dynamic(() => import("@/components/catalogs/templates/compact-list").then(m => ({ default: m.CompactListTemplate })), { ssr: false })
const MagazineTemplate = dynamic(() => import("@/components/catalogs/templates/magazine").then(m => ({ default: m.MagazineTemplate })), { ssr: false })
const MinimalistTemplate = dynamic(() => import("@/components/catalogs/templates/minimalist").then(m => ({ default: m.MinimalistTemplate })), { ssr: false })
const BoldTemplate = dynamic(() => import("@/components/catalogs/templates/bold").then(m => ({ default: m.BoldTemplate })), { ssr: false })
const ElegantCardsTemplate = dynamic(() => import("@/components/catalogs/templates/elegant-cards").then(m => ({ default: m.ElegantCardsTemplate })), { ssr: false })
const ClassicCatalogTemplate = dynamic(() => import("@/components/catalogs/templates/classic-catalog").then(m => ({ default: m.ClassicCatalogTemplate })), { ssr: false })
const ShowcaseTemplate = dynamic(() => import("@/components/catalogs/templates/showcase").then(m => ({ default: m.ShowcaseTemplate })), { ssr: false })
const CatalogProTemplate = dynamic(() => import("@/components/catalogs/templates/catalog-pro").then(m => ({ default: m.CatalogProTemplate })), { ssr: false })
const RetailTemplate = dynamic(() => import("@/components/catalogs/templates/retail").then(m => ({ default: m.RetailTemplate })), { ssr: false })
const TechModernTemplate = dynamic(() => import("@/components/catalogs/templates/tech-modern").then(m => ({ default: m.TechModernTemplate })), { ssr: false })
const FashionLookbookTemplate = dynamic(() => import("@/components/catalogs/templates/fashion-lookbook").then(m => ({ default: m.FashionLookbookTemplate })), { ssr: false })
const IndustrialTemplate = dynamic(() => import("@/components/catalogs/templates/industrial").then(m => ({ default: m.IndustrialTemplate })), { ssr: false })
const LuxuryTemplate = dynamic(() => import("@/components/catalogs/templates/luxury").then(m => ({ default: m.LuxuryTemplate })), { ssr: false })
const CleanWhiteTemplate = dynamic(() => import("@/components/catalogs/templates/clean-white").then(m => ({ default: m.CleanWhiteTemplate })), { ssr: false })
const ProductTilesTemplate = dynamic(() => import("@/components/catalogs/templates/product-tiles").then(m => ({ default: m.ProductTilesTemplate })), { ssr: false })

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
  productImageFit?: 'cover' | 'contain' | 'fill'
  columnsPerRow?: number
  logoUrl?: string
  logoPosition?: string
  logoSize?: string
  titlePosition?: 'left' | 'center' | 'right'
  enableCoverPage?: boolean
  coverImageUrl?: string
  coverDescription?: string
  enableCategoryDividers?: boolean
  categoryOrder?: string[]
  backgroundColor?: string
  backgroundImage?: string | null
  backgroundImageFit?: 'cover' | 'contain' | 'fill'
  backgroundGradient?: string | null
  theme?: string
  pages?: CatalogPage[]
  showControls?: boolean
  isExporting?: boolean
}

// PERF(Q5): Properly typed template map — no `any` suppression needed
const ALL_TEMPLATES: Record<string, React.ComponentType<TemplateProps>> = {
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
  const { t } = useTranslation()
  const isFreeUser = user?.plan === "free"
  const [currentPage, setCurrentPage] = useState(0)
  const [viewMode, setViewMode] = useState<"single" | "multi">("single")
  const [scale, setScale] = useState(0.5) // Start small, auto-fit will adjust
  const containerRef = useRef<HTMLDivElement>(null)
  const workspaceScrollRef = useRef<HTMLDivElement>(null)
  const [multiScrollTop, setMultiScrollTop] = useState(0)
  const [multiViewportHeight, setMultiViewportHeight] = useState(0)
  const hasAutoFitted = useRef(false)

  // Auto-fit scale to container width on mount
  useEffect(() => {
    if (props.isExporting || props.showControls === false) return
    const fitScale = () => {
      const container = containerRef.current
      if (!container) return
      const availableWidth = container.clientWidth - 96 // padding (p-12 = 48px each side)
      if (availableWidth > 0) {
        const fitW = Math.min(1.0, availableWidth / A4_WIDTH)
        // Only auto-set on first mount, don't override user's manual zoom
        if (!hasAutoFitted.current) {
          setScale(Math.round(fitW * 10) / 10) // Round to nearest 0.1
          hasAutoFitted.current = true
        }
      }
    }
    // Delay to ensure container is laid out
    const raf = requestAnimationFrame(fitScale)
    return () => cancelAnimationFrame(raf)
  }, [props.isExporting, props.showControls])

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
        const categoryName = product.category || (t('preview.uncategorized') as string || 'Kategorisiz')
        const current = groupedByCategory.get(categoryName)
        if (current) {
          current.push(product)
        } else {
          groupedByCategory.set(categoryName, [product])
        }
      }

      const categoryKeys = Array.from(groupedByCategory.keys())
      const order = props.categoryOrder
      if (order && order.length > 0) {
        categoryKeys.sort((a, b) => {
          const idxA = order.indexOf(a)
          const idxB = order.indexOf(b)
          if (idxA === -1 && idxB === -1) return 0
          if (idxA === -1) return 1
          if (idxB === -1) return -1
          return idxA - idxB
        })
      }

      for (const catName of categoryKeys) {
        const catProducts = groupedByCategory.get(catName)!
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
  }, [props.products, props.layout, props.columnsPerRow, props.enableCoverPage, props.enableCategoryDividers, props.categoryOrder, props.pages])

  const totalPages = pages.length

  const MULTI_VIRTUALIZATION_THRESHOLD = 10
  const MULTI_OVERSCAN_PAGES = 3
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

  const scrollRaf = useRef<number>(0)
  const handleWorkspaceScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (!shouldVirtualizeMultiPages) return
    const st = event.currentTarget.scrollTop
    cancelAnimationFrame(scrollRaf.current)
    scrollRaf.current = requestAnimationFrame(() => setMultiScrollTop(st))
  }, [shouldVirtualizeMultiPages])

  // Cleanup scrollRaf on unmount to prevent setState on unmounted component
  useEffect(() => {
    return () => cancelAnimationFrame(scrollRaf.current)
  }, [])

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

  // PERF(F9): Clamp page index safely — no setState during render
  const safeCurrentPage = Math.min(currentPage, Math.max(0, totalPages - 1))

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1)
    }
  }, [totalPages, currentPage])

  // A2: Shared page content renderer — eliminates duplicate cover/divider/template rendering
  const renderPageContent = useCallback((
    page: CatalogPage,
    TemplateComponent: React.ComponentType<TemplateProps>,
    pageNumber: number,
    pageTotalPages: number,
  ) => {
    if (page.type === 'cover') {
      return (
        <CoverPage
          catalogName={props.catalogName}
          coverImageUrl={props.coverImageUrl}
          coverDescription={props.coverDescription}
          logoUrl={props.logoUrl}
          primaryColor={props.primaryColor}
          productCount={props.products?.length || 0}
          theme={props.theme}
        />
      )
    }
    if (page.type === 'divider') {
      return (
        <CategoryDivider
          categoryName={page.categoryName}
          firstProductImage={page.firstProductImage}
          primaryColor={props.primaryColor}
          theme={props.theme}
        />
      )
    }
    return (
      <TemplateComponent
        products={page.products}
        primaryColor={props.primaryColor}
        catalogName={props.catalogName}
        pageNumber={pageNumber}
        totalPages={pageTotalPages}
        isFreeUser={isFreeUser}
        headerTextColor={props.headerTextColor}
        showPrices={props.showPrices ?? true}
        showDescriptions={props.showDescriptions ?? true}
        showAttributes={props.showAttributes ?? true}
        showSku={props.showSku ?? true}
        showUrls={props.showUrls}
        productImageFit={props.productImageFit}
        columnsPerRow={props.columnsPerRow}
        backgroundColor={props.backgroundColor}
        backgroundImage={props.backgroundImage}
        backgroundImageFit={props.backgroundImageFit}
        backgroundGradient={props.backgroundGradient}
        logoUrl={props.logoUrl}
        logoPosition={props.logoPosition}
        logoSize={props.logoSize}
        titlePosition={props.titlePosition}
      />
    )
  }, [props, isFreeUser])

  const renderPage = useCallback((page: CatalogPage | undefined, pageIndex: number) => {
    if (!page) return null
    const TemplateComponent = (ALL_TEMPLATES[props.layout as keyof typeof ALL_TEMPLATES] || ALL_TEMPLATES['modern-grid']) as React.ComponentType<TemplateProps>

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
          {renderPageContent(page, TemplateComponent, pageIndex + 1, totalPages)}

          {isFreeUser && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 mix-blend-multiply opacity-5">
              <div className="text-8xl font-black text-gray-400 rotate-[-30deg] border-8 border-gray-400 p-8">FOGCATALOG</div>
            </div>
          )}
        </div>
      </div>
    )
  }, [props.layout, props.isExporting, scale, viewMode, renderPageContent, totalPages, isFreeUser])

  if (props.showControls === false) {
    // Thumbnail'lar (Tasarım Ayarları Kartları) için sadece ilk sayfayı göster ve tam sığdır
    // Eğer kapak varsa kapağı, yoksa ilk ürünlü sayfayı gösterir
    const page = pages[0]
    if (!page) return null
    const TemplateComponent = (ALL_TEMPLATES[props.layout as keyof typeof ALL_TEMPLATES] || ALL_TEMPLATES['modern-grid']) as React.ComponentType<TemplateProps>

    return (
      <div className="w-full h-full flex items-start justify-center overflow-hidden bg-white">
        <div
          className="catalog-page catalog-light shadow-none overflow-hidden shrink-0"
          style={{ width: A4_WIDTH, height: A4_HEIGHT }}
        >
          {renderPageContent(page, TemplateComponent, 1, totalPages)}
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
        {/* View Mode Toggle */}
        <div className="flex items-center">
          <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 rounded-xl border border-slate-200 dark:border-white/10">
            <Button
              variant={viewMode === 'single' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "h-7 px-1.5 2xl:px-3 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                viewMode === 'single' && "bg-white dark:bg-indigo-600 shadow-sm text-slate-900 dark:text-white"
              )}
              onClick={() => setViewMode('single')}
            >
              <FileText className="w-3.5 h-3.5 2xl:mr-1" />
              <span className="hidden 2xl:inline">{(t('preview.singlePage') as string) || 'Tek Sayfa'}</span>
            </Button>
            <Button
              variant={viewMode === 'multi' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "h-7 px-1.5 2xl:px-3 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                viewMode === 'multi' && "bg-white dark:bg-indigo-600 shadow-sm text-slate-900 dark:text-white"
              )}
              onClick={() => setViewMode('multi')}
            >
              <List className="w-3.5 h-3.5 2xl:mr-1" />
              <span className="hidden 2xl:inline">{(t('preview.allPages') as string) || 'Tüm Sayfalar'}</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3 min-w-0 justify-end">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 shrink-0">
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

          {/* Page Navigation - only in single view mode */}
          {viewMode === 'single' && totalPages > 1 && (
            <>
              {/* Small screen: compact prev/next */}
              <div className="flex md:hidden items-center gap-0.5 bg-slate-100 dark:bg-white/5 px-1 py-0.5 rounded-xl border border-slate-200 dark:border-white/10 shrink-0">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg text-slate-500" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={safeCurrentPage === 0}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-[9px] font-black text-slate-500 tabular-nums px-0.5 whitespace-nowrap">
                  {safeCurrentPage + 1}/{totalPages}
                </span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg text-slate-500" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={safeCurrentPage >= totalPages - 1}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Large screen: slider */}
              <div className="hidden md:flex items-center gap-3 bg-slate-100 dark:bg-white/5 px-4 py-1.5 rounded-2xl border border-slate-200 dark:border-white/10 min-w-[200px] max-w-[300px] flex-1">
                <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                  {safeCurrentPage + 1}
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
            </>
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
          {props.isExporting ? (
            /* Export modunda tüm sayfalar render edilmeli */
            <div className="flex flex-col items-center w-full">
              {pages.map((page, index) => renderPage(page, index))}
            </div>
          ) : viewMode === 'single' ? (
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
