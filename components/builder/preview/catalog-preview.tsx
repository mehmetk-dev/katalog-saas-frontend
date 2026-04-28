"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useUser } from "@/lib/contexts/user-context"
import type { Product } from "@/lib/actions/products"
import type { TemplateProps } from "@/components/catalogs/templates/types"
import { useTranslation } from "@/lib/contexts/i18n-provider"

import { ALL_TEMPLATES, A4_WIDTH, A4_HEIGHT } from "./template-registry"
import { useCatalogPages } from "./use-catalog-pages"
import { PreviewControlBar } from "./preview-control-bar"

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

export const CatalogPreview = React.memo(function CatalogPreview(props: CatalogPreviewProps) {
  const { user } = useUser()
  const { t } = useTranslation()
  const isFreeUser = user?.plan === "free"

  const uncategorizedLabel = t('preview.uncategorized') as string || 'Kategorisiz'
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

  const pageModel = useCatalogPages({
    products: props.products,
    layout: props.layout,
    columnsPerRow: props.columnsPerRow,
    enableCoverPage: props.enableCoverPage,
    enableCategoryDividers: props.enableCategoryDividers,
    categoryOrder: props.categoryOrder,
    pages: props.pages,
    uncategorizedLabel,
  })

  const totalPages = pageModel.totalPages

  const MULTI_VIRTUALIZATION_THRESHOLD = 50
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
  const virtualPages = React.useMemo(
    () => shouldVirtualizeMultiPages ? pageModel.getPagesRange(virtualStartPage, virtualEndPage) : [],
    [pageModel, shouldVirtualizeMultiPages, virtualStartPage, virtualEndPage]
  )
  // PERF: Memoize getAllPages() so non-virtualized multi view + export mode
  // don't allocate a fresh array on every render.
  const allPages = React.useMemo(
    () => (props.isExporting || (viewMode === 'multi' && !shouldVirtualizeMultiPages))
      ? pageModel.getAllPages()
      : [],
    [pageModel, props.isExporting, viewMode, shouldVirtualizeMultiPages]
  )
  const virtualOffsetY = virtualStartPage * estimatedMultiPageHeight
  const virtualTotalHeight = totalPages * estimatedMultiPageHeight

  // FIX(L9): Single source of truth — safeCurrentPage is the only clamped page index.
  // Sync currentPage state when totalPages shrinks so user doesn't need many back-clicks.
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1)
    }
  }, [totalPages, currentPage])
  const safeCurrentPage = Math.min(currentPage, Math.max(0, totalPages - 1))

  // PERF: Destructure primitives so useCallback deps are stable per-field,
  // otherwise `[props]` invalidates the memo on every parent render.
  const {
    catalogName,
    coverImageUrl,
    coverDescription,
    logoUrl,
    primaryColor,
    theme,
    headerTextColor,
    showPrices,
    showDescriptions,
    showAttributes,
    showSku,
    showUrls,
    productImageFit,
    columnsPerRow,
    backgroundColor,
    backgroundImage,
    backgroundImageFit,
    backgroundGradient,
    logoPosition,
    logoSize,
    titlePosition,
  } = props
  const productsLength = props.products?.length ?? 0

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
          catalogName={catalogName}
          coverImageUrl={coverImageUrl}
          coverDescription={coverDescription}
          logoUrl={logoUrl}
          primaryColor={primaryColor}
          productCount={productsLength}
          theme={theme}
        />
      )
    }
    if (page.type === 'divider') {
      return (
        <CategoryDivider
          categoryName={page.categoryName}
          firstProductImage={page.firstProductImage}
          primaryColor={primaryColor}
          theme={theme}
        />
      )
    }
    return (
      <TemplateComponent
        products={page.products}
        primaryColor={primaryColor}
        catalogName={catalogName}
        pageNumber={pageNumber}
        totalPages={pageTotalPages}
        isFreeUser={isFreeUser}
        headerTextColor={headerTextColor}
        showPrices={showPrices ?? true}
        showDescriptions={showDescriptions ?? true}
        showAttributes={showAttributes ?? true}
        showSku={showSku ?? true}
        showUrls={showUrls}
        productImageFit={productImageFit}
        columnsPerRow={columnsPerRow}
        backgroundColor={backgroundColor}
        backgroundImage={backgroundImage}
        backgroundImageFit={backgroundImageFit}
        backgroundGradient={backgroundGradient}
        logoUrl={logoUrl}
        logoPosition={logoPosition}
        logoSize={logoSize}
        titlePosition={titlePosition}
      />
    )
  }, [
    catalogName, coverImageUrl, coverDescription, logoUrl, primaryColor, theme,
    productsLength, isFreeUser, headerTextColor, showPrices, showDescriptions,
    showAttributes, showSku, showUrls, productImageFit, columnsPerRow,
    backgroundColor, backgroundImage, backgroundImageFit, backgroundGradient,
    logoPosition, logoSize, titlePosition,
  ])

  const layoutKey = props.layout
  const isExporting = props.isExporting
  const renderPage = useCallback((page: CatalogPage | undefined, pageIndex: number) => {
    if (!page) return null
    const TemplateComponent = (ALL_TEMPLATES[layoutKey as keyof typeof ALL_TEMPLATES] || ALL_TEMPLATES['modern-grid']) as React.ComponentType<TemplateProps>

    return (
      <div
        key={`page-container-${pageIndex}`}
        className="catalog-page-wrapper relative shrink-0"
        style={{
          width: isExporting ? A4_WIDTH : A4_WIDTH * scale,
          height: isExporting ? A4_HEIGHT : A4_HEIGHT * scale,
          marginBottom: viewMode === 'multi' ? 40 : 0
        }}
      >
        <div
          key={`page-${pageIndex}`}
          className="catalog-page catalog-light shadow-2xl overflow-hidden absolute top-0 left-1/2 -translate-x-1/2 bg-white"
          style={{
            width: A4_WIDTH,
            height: A4_HEIGHT,
            transform: isExporting ? 'none' : `scale(${scale})`,
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
  }, [layoutKey, isExporting, scale, viewMode, renderPageContent, totalPages, isFreeUser])

  if (props.showControls === false) {
    // Thumbnail'lar (Tasarım Ayarları Kartları) için sadece ilk sayfayı göster ve tam sığdır
    // Eğer kapak varsa kapağı, yoksa ilk ürünlü sayfayı gösterir
    const page = pageModel.getPage(0)
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
    <div
      ref={containerRef}
      className={props.isExporting
        ? "flex flex-col h-auto overflow-visible bg-white relative isolate"
        : "flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-gradient-to-br dark:from-[#0a0c1a] dark:to-[#020308] relative isolate"}
    >
      {/* Decorative Effects - Static for stability */}
      <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-indigo-500/15 blur-[140px] rounded-full pointer-events-none hidden dark:block -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[70%] bg-violet-600/10 blur-[140px] rounded-full pointer-events-none hidden dark:block -z-10" />

      {!props.isExporting && (
        <PreviewControlBar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          scale={scale}
          onScaleChange={setScale}
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Preview Workspace */}
      <div
        ref={workspaceScrollRef}
        onScroll={handleWorkspaceScroll}
        className={props.isExporting
          ? "flex-none overflow-visible p-0 relative z-10"
          : "flex-1 overflow-auto p-12 relative z-10 custom-scrollbar"}
        style={{ overflowAnchor: 'none' }}
      >
        <div className="min-h-full flex flex-col items-center w-full">
          {props.isExporting ? (
            /* Export modunda tüm sayfalar render edilmeli */
            <div className="flex flex-col items-center w-full">
              {allPages.map((page, index) => renderPage(page, index))}
            </div>
          ) : viewMode === 'single' ? (
            <div className="flex justify-center flex-1 w-full">
              {renderPage(pageModel.getPage(safeCurrentPage), safeCurrentPage)}
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
                {allPages.map((page, index) => renderPage(page, index))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
})

