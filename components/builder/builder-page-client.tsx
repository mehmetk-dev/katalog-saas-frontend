"use client"

import { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { CatalogEditor } from "@/components/builder/catalog-editor"
import { CatalogPreview } from "@/components/builder/catalog-preview"
import { UpgradeModal } from "@/components/builder/upgrade-modal"
import { ShareModal } from "@/components/catalogs/share-modal"
import { useUser } from "@/lib/user-context"
import { type Catalog } from "@/lib/actions/catalogs"
import { type Product } from "@/lib/actions/products"
import { useTranslation } from "@/lib/i18n-provider"
import { LightboxProvider, CatalogPreloader } from "@/lib/lightbox-context"
import { ImageLightbox } from "@/components/ui/image-lightbox"
import { usePdfExport } from "@/lib/hooks/use-pdf-export"
import { useCatalogActions, type SavedState } from "@/lib/hooks/use-catalog-actions"
import { type BuilderCatalogData, buildSavedStateSnapshot } from "@/components/builder/builder-utils"

// Atomic Components
import { BuilderToolbar } from "./builder-toolbar"
import { ExitDialog } from "./exit-dialog"
import { PreviewFloatingHeader } from "./preview-floating-header"

interface BuilderPageClientProps {
  catalog: Catalog | null
  products: Product[]
  productTotalCount?: number
  isProductListTruncated?: boolean
}

const SPLIT_PREVIEW_SOFT_LIMIT = 1500

const normalizeLogoPosition = (
  position: Catalog['logo_position'] | null | undefined,
  hasLogo: boolean
): Catalog['logo_position'] => {
  const allowedPositions: Array<NonNullable<Catalog['logo_position']>> = [
    'none',
    'header-left',
    'header-center',
    'header-right',
  ]

  if (!hasLogo) return 'none'
  if (position && allowedPositions.includes(position as NonNullable<Catalog['logo_position']>)) {
    return position
  }

  return 'header-left'
}

export function BuilderPageClient({
  catalog,
  products,
  productTotalCount,
  isProductListTruncated = false,
}: BuilderPageClientProps) {
  const router = useRouter()
  const { user, canExport, refreshUser } = useUser()
  const { t: baseT } = useTranslation()
  const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])

  // ─── UI State ─────────────────────────────────────────────────────
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [view, setView] = useState<"split" | "editor" | "preview">("split")
  const [isMobile, setIsMobile] = useState(false)
  const [isSelectionUpdatePending, startSelectionTransition] = useTransition()

  // ─── Catalog Identity ─────────────────────────────────────────────
  const [currentCatalogId, setCurrentCatalogId] = useState(catalog?.id || null)
  const [isPublished, setIsPublished] = useState(catalog?.is_published || false)
  const [hasUnpushedChanges, setHasUnpushedChanges] = useState(false)

  // ─── Content State ────────────────────────────────────────────────
  const [catalogName, setCatalogName] = useState(catalog?.name || "")
  const [catalogDescription, setCatalogDescription] = useState(catalog?.description || "")
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(catalog?.product_ids || [])
  const [layout, setLayout] = useState(catalog?.layout || "grid")

  // ─── Color Helper ─────────────────────────────────────────────────
  const hexToRgba = useCallback((hex: string, alpha: number = 1): string => {
    if (hex.startsWith('rgba')) return hex
    if (hex === 'transparent') return 'rgba(0, 0, 0, 0)'
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      const r = parseInt(result[1], 16)
      const g = parseInt(result[2], 16)
      const b = parseInt(result[3], 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return `rgba(124, 58, 237, ${alpha})`
  }, [])

  const getInitialPrimaryColor = useCallback(() => {
    if (!catalog?.primary_color) return "rgba(124, 58, 237, 1)"
    if (catalog.primary_color.startsWith('rgba')) return catalog.primary_color
    if (catalog.primary_color === 'transparent') return 'rgba(0, 0, 0, 0)'
    return hexToRgba(catalog.primary_color)
  }, [catalog?.primary_color, hexToRgba])

  // ─── Design State ─────────────────────────────────────────────────
  const [primaryColor, setPrimaryColor] = useState(getInitialPrimaryColor())
  const [headerTextColor, setHeaderTextColor] = useState(catalog?.header_text_color || "#000000")
  const [showPrices, setShowPrices] = useState(catalog?.show_prices ?? true)
  const [showDescriptions, setShowDescriptions] = useState(catalog?.show_descriptions ?? true)
  const [showAttributes, setShowAttributes] = useState(catalog?.show_attributes ?? false)
  const [showSku, setShowSku] = useState(catalog?.show_sku ?? true)
  const [showUrls, setShowUrls] = useState(catalog?.show_urls ?? false)
  const [showInSearch, setShowInSearch] = useState(catalog?.show_in_search ?? true)
  const [columnsPerRow, setColumnsPerRow] = useState(catalog?.columns_per_row || 3)
  const [backgroundColor, setBackgroundColor] = useState(catalog?.background_color || '#ffffff')
  const [backgroundImage, setBackgroundImage] = useState<string | null>(catalog?.background_image || null)
  const [backgroundImageFit, setBackgroundImageFit] = useState<NonNullable<Catalog['background_image_fit']>>(catalog?.background_image_fit || 'cover')
  const [backgroundGradient, setBackgroundGradient] = useState<string | null>(catalog?.background_gradient || null)
  const initialLogoUrl = catalog?.logo_url || user?.logo_url || null
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl)
  const [logoPosition, setLogoPosition] = useState<Catalog['logo_position']>(
    normalizeLogoPosition(catalog?.logo_position, Boolean(initialLogoUrl))
  )
  const [logoSize, setLogoSize] = useState<Catalog['logo_size']>(catalog?.logo_size || 'medium')
  const [titlePosition, setTitlePosition] = useState<Catalog['title_position']>(catalog?.title_position || 'left')
  const [productImageFit, setProductImageFit] = useState<NonNullable<Catalog['product_image_fit']>>(catalog?.product_image_fit || 'cover')

  // ─── Storytelling State ───────────────────────────────────────────
  const [enableCoverPage, setEnableCoverPage] = useState(catalog?.enable_cover_page ?? false)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(catalog?.cover_image_url || null)
  const [coverDescription, setCoverDescription] = useState<string | null>(catalog?.cover_description || null)
  const [enableCategoryDividers, setEnableCategoryDividers] = useState(catalog?.enable_category_dividers ?? false)
  const [coverTheme, setCoverTheme] = useState(catalog?.cover_theme || "modern")

  // ─── Dirty Tracking ───────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false)
  const [lastSavedState, setLastSavedState] = useState<SavedState>(() =>
    buildSavedStateSnapshot({
      catalogName: catalog?.name || "",
      catalogDescription: catalog?.description || "",
      selectedProductIds: catalog?.product_ids || [],
      layout: catalog?.layout || "grid",
      primaryColor: getInitialPrimaryColor(),
      showPrices: catalog?.show_prices ?? true,
      showDescriptions: catalog?.show_descriptions ?? true,
      showAttributes: catalog?.show_attributes ?? false,
      showSku: catalog?.show_sku ?? true,
      showUrls: catalog?.show_urls ?? false,
      columnsPerRow: catalog?.columns_per_row || 3,
      backgroundColor: catalog?.background_color || '#ffffff',
      backgroundImage: catalog?.background_image || null,
      backgroundImageFit: catalog?.background_image_fit || 'cover',
      backgroundGradient: catalog?.background_gradient || null,
      logoUrl: initialLogoUrl,
      logoPosition: normalizeLogoPosition(catalog?.logo_position, Boolean(initialLogoUrl)),
      logoSize: catalog?.logo_size || 'medium',
      titlePosition: catalog?.title_position || 'left',
      productImageFit: catalog?.product_image_fit || 'cover',
      headerTextColor: catalog?.header_text_color || "#000000",
      enableCoverPage: catalog?.enable_cover_page ?? false,
      coverImageUrl: catalog?.cover_image_url || null,
      coverDescription: catalog?.cover_description || null,
      enableCategoryDividers: catalog?.enable_category_dividers ?? false,
      coverTheme: catalog?.cover_theme || "modern",
      isPublished: catalog?.is_published || false,
      showInSearch: catalog?.show_in_search ?? true,
    })
  )

  const hasUnsavedChanges = useMemo(() => {
    return (
      catalogName !== lastSavedState.name ||
      catalogDescription !== lastSavedState.description ||
      selectedProductIds.length !== lastSavedState.productIds.length ||
      selectedProductIds.some((id, i) => id !== lastSavedState.productIds[i]) ||
      layout !== lastSavedState.layout ||
      coverTheme !== lastSavedState.coverTheme ||
      primaryColor !== lastSavedState.primaryColor ||
      showPrices !== lastSavedState.showPrices ||
      showDescriptions !== lastSavedState.showDescriptions ||
      showAttributes !== lastSavedState.showAttributes ||
      showSku !== lastSavedState.showSku ||
      showUrls !== lastSavedState.showUrls ||
      columnsPerRow !== lastSavedState.columnsPerRow ||
      backgroundColor !== lastSavedState.backgroundColor ||
      backgroundImage !== lastSavedState.backgroundImage ||
      logoUrl !== lastSavedState.logoUrl ||
      enableCoverPage !== lastSavedState.enableCoverPage ||
      enableCategoryDividers !== lastSavedState.enableCategoryDividers ||
      showInSearch !== lastSavedState.showInSearch ||
      backgroundGradient !== lastSavedState.backgroundGradient
    )
  }, [
    catalogName, catalogDescription, selectedProductIds, layout, coverTheme,
    primaryColor, showPrices, showDescriptions, showAttributes, showSku,
    showUrls, columnsPerRow, backgroundColor, backgroundImage, logoUrl,
    enableCoverPage, enableCategoryDividers, showInSearch, lastSavedState,
    backgroundGradient
  ])

  // ─── Get State Callback (for hooks to read fresh data) ────────────
  const stateRef = useRef<BuilderCatalogData>(null!)
  stateRef.current = {
    catalogName, catalogDescription, selectedProductIds, layout, primaryColor,
    showPrices, showDescriptions, showAttributes, showSku, showUrls,
    columnsPerRow, backgroundColor, backgroundImage, backgroundImageFit,
    backgroundGradient, logoUrl, logoPosition, logoSize, titlePosition,
    productImageFit, headerTextColor, enableCoverPage, coverImageUrl,
    coverDescription, enableCategoryDividers, coverTheme, isPublished,
    showInSearch,
  }
  const getState = useCallback(() => stateRef.current, [])

  // ─── External Hooks ───────────────────────────────────────────────
  const {
    isPending,
    isUrlOutdated,
    handleSave,
    handlePushUpdates,
    handleUpdateSlug,
    handlePublish,
  } = useCatalogActions({
    currentCatalogId,
    catalog,
    isPublished,
    user,
    getState,
    catalogName,
    hasUnsavedChanges,
    isDirty,
    setCatalogName,
    setCurrentCatalogId,
    setLastSavedState,
    setIsDirty,
    setIsPublished,
    setHasUnpushedChanges,
    refreshUser,
    t,
  })

  // ─── Product Memos ────────────────────────────────────────────────
  const productMap = useMemo(() => {
    const map = new Map<string, Product>()
    for (const p of products) map.set(p.id, p)
    return map
  }, [products])

  const selectedProducts = useMemo(() =>
    selectedProductIds
      .map((id) => productMap.get(id))
      .filter((p): p is Product => p !== undefined),
    [selectedProductIds, productMap]
  )
  const deferredSelectedProducts = useDeferredValue(selectedProducts)

  const { isExporting, handleDownloadPDF } = usePdfExport({
    catalogName,
    selectedProducts,
    canExport,
    user,
    t,
    refreshUser,
    onShowUpgradeModal: () => setShowUpgradeModal(true),
  })

  // ─── Beforeunload Warning ─────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        const message = 'Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istediğinizden emin misiniz?'
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // ─── Sync State on Catalog Change ─────────────────────────────────
  useEffect(() => {
    if (catalog) {
      setCatalogName(catalog.name || "")
      setCatalogDescription(catalog.description || "")
      setSelectedProductIds(catalog.product_ids || [])
      setLayout(catalog.layout || "grid")
      setPrimaryColor(getInitialPrimaryColor())
      setHeaderTextColor(catalog.header_text_color || "#000000")
      setShowPrices(catalog.show_prices ?? true)
      setShowDescriptions(catalog.show_descriptions ?? true)
      setShowAttributes(catalog.show_attributes ?? false)
      setShowSku(catalog.show_sku ?? true)
      setShowUrls(catalog.show_urls ?? false)
      setShowInSearch(catalog.show_in_search ?? true)
      setColumnsPerRow(catalog.columns_per_row || 3)
      setBackgroundColor(catalog.background_color || '#ffffff')
      setBackgroundImage(catalog.background_image || null)
      setBackgroundImageFit(catalog.background_image_fit || 'cover')
      setBackgroundGradient(catalog.background_gradient || null)
      const nextLogoUrl = catalog.logo_url || user?.logo_url || null
      setLogoUrl(nextLogoUrl)
      setLogoPosition(normalizeLogoPosition(catalog.logo_position, Boolean(nextLogoUrl)))
      setLogoSize(catalog.logo_size || 'medium')
      setTitlePosition(catalog.title_position || 'left')
      setProductImageFit(catalog.product_image_fit || 'cover')
      setIsPublished(catalog.is_published || false)
      setCurrentCatalogId(catalog.id || null)
      setEnableCoverPage(catalog.enable_cover_page ?? false)
      setCoverImageUrl(catalog.cover_image_url || null)
      setCoverDescription(catalog.cover_description || null)
      setEnableCategoryDividers(catalog.enable_category_dividers ?? false)

      setLastSavedState(
        buildSavedStateSnapshot({
          catalogName: catalog.name || "",
          catalogDescription: catalog.description || "",
          selectedProductIds: catalog.product_ids || [],
          layout: catalog.layout || "grid",
          primaryColor: getInitialPrimaryColor(),
          showPrices: catalog.show_prices ?? true,
          showDescriptions: catalog.show_descriptions ?? true,
          showAttributes: catalog.show_attributes ?? false,
          showSku: catalog.show_sku ?? true,
          showUrls: catalog.show_urls ?? false,
          columnsPerRow: catalog.columns_per_row || 3,
          backgroundColor: catalog.background_color || '#ffffff',
          backgroundImage: catalog.background_image || null,
          backgroundImageFit: catalog.background_image_fit || 'cover',
          backgroundGradient: catalog.background_gradient || null,
          logoUrl: nextLogoUrl,
          logoPosition: normalizeLogoPosition(catalog.logo_position, Boolean(nextLogoUrl)),
          logoSize: catalog.logo_size || 'medium',
          titlePosition: catalog.title_position || 'left',
          productImageFit: catalog.product_image_fit || 'cover',
          headerTextColor: catalog.header_text_color || "#000000",
          enableCoverPage: catalog.enable_cover_page ?? false,
          coverImageUrl: catalog.cover_image_url || null,
          coverDescription: catalog.cover_description || null,
          enableCategoryDividers: catalog.enable_category_dividers ?? false,
          coverTheme: catalog.cover_theme || "modern",
          isPublished: catalog.is_published || false,
          showInSearch: catalog.show_in_search ?? true,
        })
      )
      setIsDirty(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog?.id])

  // ─── Mobile Detection ─────────────────────────────────────────────
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile && view === "split") {
        setView("editor")
      } else if (!mobile && view === "editor") {
        setView("split")
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [view])

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    if (!currentCatalogId || !catalog?.share_slug) {
      toast.error(t('toasts.saveCatalogFirst') as string)
      return
    }
    setShowShareModal(true)
  }, [currentCatalogId, catalog?.share_slug, t])

  const handleSelectedProductIdsChange = useCallback((ids: string[]) => {
    startSelectionTransition(() => {
      setSelectedProductIds(ids)
    })
  }, [])

  const effectiveView = isMobile ? (view === "split" ? "editor" : view) : view

  const shouldUseSplitPreviewSampling = useMemo(() => {
    return effectiveView !== "preview" && deferredSelectedProducts.length > SPLIT_PREVIEW_SOFT_LIMIT
  }, [effectiveView, deferredSelectedProducts.length])

  const previewProducts = useMemo(() => {
    if (!shouldUseSplitPreviewSampling) return deferredSelectedProducts
    return deferredSelectedProducts.slice(0, SPLIT_PREVIEW_SOFT_LIMIT)
  }, [deferredSelectedProducts, shouldUseSplitPreviewSampling])

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <LightboxProvider>
      <CatalogPreloader products={products} />
      <ImageLightbox />
      <div className="builder-page h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] flex flex-col -m-3 sm:-m-4 md:-m-6 overflow-hidden">
        {/* Header */}
        {view !== "preview" && (
          <BuilderToolbar
            catalog={catalog}
            catalogName={catalogName}
            onCatalogNameChange={setCatalogName}
            isMobile={isMobile}
            isPublished={isPublished}
            hasUnsavedChanges={hasUnsavedChanges}
            hasUnpushedChanges={hasUnpushedChanges}
            isUrlOutdated={isUrlOutdated}
            isPending={isPending}
            view={view}
            onViewChange={setView}
            onSave={handleSave}
            onPublish={handlePublish}
            onPushUpdates={handlePushUpdates}
            onUpdateSlug={handleUpdateSlug}
            onShare={handleShare}
            onDownloadPDF={handleDownloadPDF}
            onExit={() => {
              if (hasUnsavedChanges) {
                setShowExitDialog(true)
              } else {
                router.push('/dashboard')
              }
            }}
          />
        )}

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor */}
          {(effectiveView === "split" || effectiveView === "editor") && (
            <div className={`${effectiveView === "split" ? "w-1/2" : "w-full"} border-r overflow-auto`}>
              <CatalogEditor
                products={products}
                totalProductCount={productTotalCount}
                isProductListTruncated={isProductListTruncated}
                selectedProductIds={selectedProductIds}
                onSelectedProductIdsChange={handleSelectedProductIdsChange}
                description={catalogDescription}
                onDescriptionChange={setCatalogDescription}
                layout={layout}
                onLayoutChange={setLayout}
                primaryColor={primaryColor}
                onPrimaryColorChange={setPrimaryColor}
                headerTextColor={headerTextColor}
                onHeaderTextColorChange={setHeaderTextColor}
                showPrices={showPrices}
                onShowPricesChange={setShowPrices}
                showDescriptions={showDescriptions}
                onShowDescriptionsChange={setShowDescriptions}
                showAttributes={showAttributes}
                onShowAttributesChange={setShowAttributes}
                showSku={showSku}
                onShowSkuChange={setShowSku}
                showUrls={showUrls}
                onShowUrlsChange={setShowUrls}
                productImageFit={productImageFit}
                onProductImageFitChange={setProductImageFit}
                userPlan={user?.plan || "free"}
                onUpgrade={() => setShowUpgradeModal(true)}
                columnsPerRow={columnsPerRow}
                onColumnsPerRowChange={setColumnsPerRow}
                backgroundColor={backgroundColor}
                onBackgroundColorChange={setBackgroundColor}
                backgroundImage={backgroundImage}
                onBackgroundImageChange={setBackgroundImage}
                backgroundImageFit={backgroundImageFit}
                onBackgroundImageFitChange={(v) => setBackgroundImageFit(v)}
                backgroundGradient={backgroundGradient}
                onBackgroundGradientChange={setBackgroundGradient}
                logoUrl={logoUrl}
                onLogoUrlChange={setLogoUrl}
                logoPosition={logoPosition}
                onLogoPositionChange={(v) => setLogoPosition(v)}
                logoSize={logoSize}
                onLogoSizeChange={(v) => setLogoSize(v)}
                titlePosition={titlePosition}
                onTitlePositionChange={(v) => setTitlePosition(v)}
                enableCoverPage={enableCoverPage}
                onEnableCoverPageChange={setEnableCoverPage}
                coverImageUrl={coverImageUrl}
                onCoverImageUrlChange={setCoverImageUrl}
                coverDescription={coverDescription}
                onCoverDescriptionChange={setCoverDescription}
                enableCategoryDividers={enableCategoryDividers}
                onEnableCategoryDividersChange={setEnableCategoryDividers}
                coverTheme={coverTheme}
                onCoverThemeChange={setCoverTheme}
                showInSearch={showInSearch}
                onShowInSearchChange={setShowInSearch}
                catalogName={catalogName}
              />
            </div>
          )}

          {/* Preview */}
          {(effectiveView === "split" || effectiveView === "preview") && (
            <div
              id="catalog-preview-container"
              className={`${effectiveView === "split" ? "w-1/2" : "w-full"} bg-slate-100 dark:bg-[#03040a] overflow-auto`}
            >


              {shouldUseSplitPreviewSampling && (
                <div className="sticky top-0 z-20 px-3 py-2 text-xs border-b border-amber-200 bg-amber-50 text-amber-800">
                  Performans modu: bölünmüş görünümde ilk {SPLIT_PREVIEW_SOFT_LIMIT} ürün gösteriliyor.
                  Tam önizleme için "Önizleme" moduna geç.
                </div>
              )}

              <CatalogPreview
                catalogName={catalogName}
                products={previewProducts}
                layout={layout}
                primaryColor={primaryColor}
                headerTextColor={headerTextColor}
                showPrices={showPrices}
                showDescriptions={showDescriptions}
                showAttributes={showAttributes}
                showSku={showSku}
                showUrls={showUrls}
                productImageFit={productImageFit}
                columnsPerRow={columnsPerRow}
                backgroundColor={backgroundColor}
                backgroundImage={backgroundImage}
                backgroundImageFit={backgroundImageFit as 'cover' | 'contain' | 'fill' | undefined}
                backgroundGradient={backgroundGradient}
                logoUrl={logoUrl ?? undefined}
                logoPosition={logoPosition ?? undefined}
                logoSize={logoSize}
                titlePosition={titlePosition}
                enableCoverPage={enableCoverPage}
                coverImageUrl={coverImageUrl ?? undefined}
                coverDescription={coverDescription ?? undefined}
                enableCategoryDividers={enableCategoryDividers}
                theme={coverTheme}
              />
            </div>
          )}
        </div>

        {/* Preview Mode Floating Header */}
        <PreviewFloatingHeader
          view={view}
          onViewChange={setView}
          catalogName={catalogName}
          onPublish={handlePublish}
          onDownloadPDF={handleDownloadPDF}
        />

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          plan={user?.plan || "free"}
        />

        <ShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          catalog={catalog}
          isPublished={isPublished}
          shareUrl={catalog?.share_slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/catalog/${catalog.share_slug}` : ""}
          onDownloadPdf={handleDownloadPDF}
        />

        <ExitDialog
          open={showExitDialog}
          onOpenChange={setShowExitDialog}
          onExitWithoutSaving={() => {
            setShowExitDialog(false)
            router.push('/dashboard')
          }}
          onSaveAndExit={() => {
            handleSave()
            setShowExitDialog(false)
            setTimeout(() => router.push('/dashboard'), 1500)
          }}
        />

        {/* GHOST CONTAINER (PDF Export) */}
        {isExporting && (
          <div
            id="catalog-export-container"
            style={{
              position: 'fixed',
              top: 0,
              left: '-9999px',
              width: '1000px',
              zIndex: -100,
              opacity: 0,
              pointerEvents: 'none',
              overflow: 'visible'
            }}
          >
            <CatalogPreview
              catalogName={catalogName}
              products={selectedProducts}
              layout={layout}
              primaryColor={primaryColor}
              headerTextColor={headerTextColor}
              showPrices={showPrices}
              showDescriptions={showDescriptions}
              showAttributes={showAttributes}
              showSku={showSku}
              showUrls={showUrls}
              productImageFit={productImageFit}
              columnsPerRow={columnsPerRow}
              backgroundColor={backgroundColor}
              backgroundImage={backgroundImage}
              backgroundImageFit={backgroundImageFit as 'cover' | 'contain' | 'fill' | undefined}
              backgroundGradient={backgroundGradient}
              logoUrl={logoUrl ?? undefined}
              logoPosition={logoPosition ?? undefined}
              logoSize={logoSize}
              titlePosition={titlePosition}
              isExporting={true}
              enableCoverPage={enableCoverPage}
              coverImageUrl={coverImageUrl ?? undefined}
              coverDescription={coverDescription ?? undefined}
              enableCategoryDividers={enableCategoryDividers}
              theme={coverTheme}
            />
          </div>
        )}
      </div>
    </LightboxProvider>
  )
}
