"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback, useTransition } from "react"
import dynamic from "next/dynamic"
import type { Catalog } from "@/lib/actions/catalogs"
import type { ProductSortField, ProductSortOrder } from "@/lib/actions/products"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebouncedCallback } from "@/lib/hooks/use-debounce"
import { useEditorUpload } from "@/lib/hooks/use-editor-upload"
import { useAllProductIds, useProducts } from "@/lib/hooks/use-products"
import { MAX_CATALOG_PRODUCTS } from "@/lib/constants"
import { toast } from "sonner"
import { Package, Palette } from "lucide-react"

import { EditorContentTab } from "./editor-content-tab"

// PERF: Lazy-load design tab — defers react-colorful, template constants,
// 6 design sections, and cover themes until user clicks the "Design" tab.
const EditorDesignTab = dynamic(
  () => import("./editor-design-tab").then(m => ({ default: m.EditorDesignTab })),
  { ssr: false }
)

// FIX(F2): Context-based — no more 60+ prop drilling
import { useBuilder } from "@/components/builder/builder-context"

// ─── Types ────────────────────────────────────────────────────────────────────

// PERF(F14): Color utilities consolidated in builder-utils
// parseColor and rgbToHex are now imported from builder-utils
import { getAvailableColumns, parseColor, rgbToHex } from "@/components/builder/builder-utils"

// ─── Component ────────────────────────────────────────────────────────────────

/** FIX(F2): CatalogEditor now reads all data from BuilderContext via useBuilder().
 *  No props needed — eliminates 60+ prop drilling. */
export function CatalogEditor() {
  const { state, initialProductsResponse, userPlan } = useBuilder()

  // Destructure state for readability
  const {
    selectedProductIds, handleSelectedProductIdsChange: onSelectedProductIdsChange,
    catalogDescription: description, setCatalogDescription: onDescriptionChange,
    layout, setLayout: onLayoutChange,
    primaryColor, setPrimaryColor: onPrimaryColorChange,
    headerTextColor, setHeaderTextColor: onHeaderTextColorChange,
    showPrices, setShowPrices: onShowPricesChange,
    showDescriptions, setShowDescriptions: onShowDescriptionsChange,
    showAttributes, setShowAttributes: onShowAttributesChange,
    showSku, setShowSku: onShowSkuChange,
    showUrls, setShowUrls: onShowUrlsChange,
    productImageFit, setProductImageFit: onProductImageFitChange,
    columnsPerRow, setColumnsPerRow: onColumnsPerRowChange,
    backgroundColor, setBackgroundColor: onBackgroundColorChange,
    backgroundImage, setBackgroundImage: onBackgroundImageChange,
    backgroundImageFit, setBackgroundImageFit,
    backgroundGradient, setBackgroundGradient: onBackgroundGradientChange,
    logoUrl, setLogoUrl: onLogoUrlChange,
    logoPosition, setLogoPosition,
    logoSize, setLogoSize,
    titlePosition, setTitlePosition,
    enableCoverPage, setEnableCoverPage: onEnableCoverPageChange,
    coverImageUrl, setCoverImageUrl: onCoverImageUrlChange,
    coverDescription, setCoverDescription: onCoverDescriptionChange,
    enableCategoryDividers, setEnableCategoryDividers: onEnableCategoryDividersChange,
    categoryOrder, setCategoryOrder: onCategoryOrderChange,
    coverTheme, setCoverTheme: onCoverThemeChange,
    catalogName, setShowUpgradeModal,
    loadedProductsCount,
    upsertLoadedProducts,
    selectedProductIdSet,
  } = state

  const onUpgrade = useCallback(() => setShowUpgradeModal(true), [setShowUpgradeModal])
  const onBackgroundImageFitChange = useCallback((v: NonNullable<Catalog['background_image_fit']>) => setBackgroundImageFit(v), [setBackgroundImageFit])
  const onLogoPositionChange = useCallback((v: NonNullable<Catalog['logo_position']>) => setLogoPosition(v), [setLogoPosition])
  const onLogoSizeChange = useCallback((v: NonNullable<Catalog['logo_size']>) => setLogoSize(v), [setLogoSize])
  const onTitlePositionChange = useCallback((v: NonNullable<Catalog['title_position']>) => setTitlePosition(v), [setTitlePosition])
  const { productMap } = state
  const loadedProductsArray = useMemo(() => Array.from(productMap.values()), [productMap])

  const { t: baseT } = useTranslation()
  const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])

  // ─── Local State ──────────────────────────────────────────────────────────
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ template: true, appearance: true, branding: true })
  const toggleSection = useCallback((key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const primaryColorParsed = useMemo(() => {
    const rgb = parseColor(primaryColor)
    const hexColor = rgbToHex(rgb.r, rgb.g, rgb.b)
    const opacity = Math.round(rgb.a * 100)
    return { rgb, hexColor, opacity }
  }, [primaryColor])

  // Debounced color change callbacks
  const debouncedPrimaryColorChange = useDebouncedCallback(
    (color: string) => onPrimaryColorChange(color), 50
  )
  const debouncedHeaderTextColorChange = useDebouncedCallback(
    (color: string) => onHeaderTextColorChange?.(color), 50
  )
  const debouncedBackgroundColorChange = useDebouncedCallback(
    (color: string) => onBackgroundColorChange?.(color), 50
  )

  // ─── Upload Hook ──────────────────────────────────────────────────────────
  const {
    logoInputRef,
    bgInputRef,
    coverInputRef,
    handleUploadClick,
    handleFileUpload,
  } = useEditorUpload({
    onLogoUrlChange,
    onCoverImageUrlChange,
    onBackgroundImageChange,
    backgroundImage,
    t,
  })

  // ─── Search & Pagination ──────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 24
  const [sortBy, setSortBy] = useState<ProductSortField>("display_order")
  const [sortOrder, setSortOrder] = useState<ProductSortOrder>("asc")

  const [activeTab, setActiveTab] = useState("content")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [isFilterPending, startFilterTransition] = useTransition()

  const debouncedSearchUpdate = useDebouncedCallback(
    (query: string) => {
      startFilterTransition(() => {
        setDebouncedSearchQuery(query)
      })
    }, 200
  )

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    debouncedSearchUpdate(val)
  }, [debouncedSearchUpdate])

  const handleCategoryChange = useCallback((category: string) => {
    startFilterTransition(() => {
      setSelectedCategory(category)
    })
  }, [])

  const productsParams = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    category: selectedCategory === "all" ? undefined : selectedCategory,
    search: debouncedSearchQuery.trim() || undefined,
    sortBy,
    sortOrder,
  }), [currentPage, itemsPerPage, selectedCategory, debouncedSearchQuery, sortBy, sortOrder])

  const initialQueryData = useMemo(() => {
    const isInitialQuery = currentPage === 1
      && selectedCategory === "all"
      && !debouncedSearchQuery.trim()
      && sortBy === "display_order"
      && sortOrder === "asc"
    return isInitialQuery ? initialProductsResponse : undefined
  }, [currentPage, selectedCategory, debouncedSearchQuery, sortBy, sortOrder, initialProductsResponse])

  // FIX: Builder opens with SSR initialData — no need to refetch on mount.
  const productsQuery = useProducts(productsParams, initialQueryData, { refetchOnMount: false })
  // PERF(O2): Tüm ürün ID'lerini sadece "Tümünü Seç" butonu etkileşime girince çek.
  // İlk builder açılışında 10k ürün için 10 seri sunucu çağrısını engelliyor.
  const allProductIdFilters = useMemo(() => ({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    search: debouncedSearchQuery.trim() || undefined,
    sortBy,
    sortOrder,
  }), [selectedCategory, debouncedSearchQuery, sortBy, sortOrder])
  const allProductIdsQuery = useAllProductIds(allProductIdFilters, undefined, { enabled: false })
  const refetchAllProductIds = allProductIdsQuery.refetch
  const prefetchAllProductIds = useCallback(async () => {
    const result = await refetchAllProductIds()
    if (result.error) throw result.error
    return result.data || []
  }, [refetchAllProductIds])
  const productsResponse = productsQuery.data
  const allProductIds = useMemo(() => allProductIdsQuery.data || [], [allProductIdsQuery.data])
  const pagedProducts = useMemo(() => productsResponse?.products || [], [productsResponse])
  const totalFilteredProducts = productsResponse?.metadata.total || 0
  const totalPages = Math.max(1, productsResponse?.metadata.totalPages || 1)
  const startIndex = (currentPage - 1) * itemsPerPage

  useEffect(() => {
    if (pagedProducts.length > 0) {
      upsertLoadedProducts(pagedProducts)
    }
  }, [pagedProducts, upsertLoadedProducts])

  useEffect(() => {
    if (currentPage > totalPages && !productsQuery.isPlaceholderData && !productsQuery.isLoading) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages, productsQuery.isPlaceholderData, productsQuery.isLoading])

  // ─── Derived Data ─────────────────────────────────────────────────────────
  // PERF(Y1): selectedProductIdSet artık context state'inden geliyor (tek kaynak).
  const categories = productsResponse?.allCategories || []

  // PERF(Y6): productMap.has(id) zaten O(1) — ayrı Set allocate etmeye gerek yok.
  const validProductIds = useMemo(() => {
    return selectedProductIds.filter(id => productMap.has(id))
  }, [selectedProductIds, productMap])
  const filteredProducts = pagedProducts

  useEffect(() => { setCurrentPage(1) }, [selectedCategory, debouncedSearchQuery])
  useEffect(() => { setCurrentPage(1) }, [sortBy, sortOrder])

  // ─── Product Selection & Sorting ──────────────────────────────────────────
  // PERFORMANCE: Set-based toggle — O(1) add/delete instead of O(n) filter/spread
  const toggleProduct = useCallback((id: string) => {
    if (selectedProductIdSet.has(id)) {
      // Remove: filter is unavoidable but we avoid unnecessary copies
      onSelectedProductIdsChange(selectedProductIds.filter(i => i !== id))
    } else {
      if (selectedProductIds.length >= MAX_CATALOG_PRODUCTS) {
        toast.error(t('builder.catalogProductLimit'))
        return
      }
      // Add: push to end, no full-copy needed (spread is still O(n) but unavoidable for immutability)
      onSelectedProductIdsChange([...selectedProductIds, id])
    }
  }, [selectedProductIds, selectedProductIdSet, onSelectedProductIdsChange, t])

  const handleSortDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.stopPropagation()
    e.dataTransfer.setData("text", index.toString())
    setDraggingIndex(index)
  }, [])

  // PERF(Y3): rAF throttle — dragover ~60fps tetikleniyor; her event'te setState
  // yapmak 500+ seçili üründe jank'a yol açıyor.
  const dropIndexRafRef = useRef<number>(0)
  const pendingDropIndexRef = useRef<number | null>(null)
  const handleSortDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (pendingDropIndexRef.current === index) return
    pendingDropIndexRef.current = index
    cancelAnimationFrame(dropIndexRafRef.current)
    dropIndexRafRef.current = requestAnimationFrame(() => {
      setDropIndex(pendingDropIndexRef.current)
    })
  }, [])
  useEffect(() => {
    return () => cancelAnimationFrame(dropIndexRafRef.current)
  }, [])

  const handleSortDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    const from = Number(e.dataTransfer.getData("text"))

    // FIX: Drag indices come from validProductIds rendering, so splice on
    // validProductIds first, then rebuild the full selectedProductIds list.
    // Without this, unloaded IDs at the start of selectedProductIds shift
    // indices and the visible order appears unchanged after drop.
    const reordered = [...validProductIds]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(index, 0, moved)

    const validSet = new Set(validProductIds)
    const nonValidIds = selectedProductIds.filter(id => !validSet.has(id))
    onSelectedProductIdsChange([...reordered, ...nonValidIds])
    setDraggingIndex(null)
    setDropIndex(null)
  }, [selectedProductIds, validProductIds, onSelectedProductIdsChange])

  const handleSortMove = useCallback((index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= validProductIds.length) return

    const reordered = [...validProductIds]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)

    const validSet = new Set(validProductIds)
    const unloadedIds = selectedProductIds.filter((id) => !validSet.has(id))
    onSelectedProductIdsChange([...reordered, ...unloadedIds])
  }, [selectedProductIds, validProductIds, onSelectedProductIdsChange])

  const handleRemoveProduct = useCallback((id: string) => {
    onSelectedProductIdsChange(selectedProductIds.filter(i => i !== id))
  }, [selectedProductIds, onSelectedProductIdsChange])

  // ─── Column Constraints ───────────────────────────────────────────────────
  // Şablon değişince geçersiz sütun sayısı reducer'da aynı adımda düzeltilir.
  const availableColumns = useMemo(() => getAvailableColumns(layout), [layout])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="shrink-0 border-b px-3 py-2 sm:px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">
              <Package />
              {t('builder.tabProducts')}
            </TabsTrigger>
            <TabsTrigger value="design">
              <Palette />
              {t('builder.tabDesign')}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-3 pb-12 pt-5 sm:px-6">
          <TabsContent value="content" className="m-0">
            <EditorContentTab
              t={t}
              description={description}
              onDescriptionChange={onDescriptionChange}
              availableProductCount={loadedProductsCount}
              totalProductCount={totalFilteredProducts}
              isProductListTruncated={false}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              categories={categories}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              filteredProducts={filteredProducts}
              allProductIds={allProductIds}
              visibleProducts={filteredProducts}
              selectedProductIds={selectedProductIds}
              selectedProductIdSet={selectedProductIdSet}
              validProductIds={validProductIds}
              onSelectedProductIdsChange={onSelectedProductIdsChange}
              toggleProduct={toggleProduct}
              onPrefetchAllProductIds={prefetchAllProductIds}
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              productMap={productMap}
              isLoadingProducts={productsQuery.isLoading || productsQuery.isFetching || isFilterPending}
              isLoadingAllProductIds={allProductIdsQuery.isLoading || allProductIdsQuery.isFetching}
              draggingIndex={draggingIndex}
              dropIndex={dropIndex}
              onSortDragStart={handleSortDragStart}
              onSortDragOver={handleSortDragOver}
              onSortDrop={handleSortDrop}
              onSortMove={handleSortMove}
              onRemoveProduct={handleRemoveProduct}
            />
          </TabsContent>

          <TabsContent value="design" className="m-0">
            {/* FIX(P6): Only compute 40+ design props when design tab is active */}
            {activeTab === 'design' && <EditorDesignTab
              t={t}
              openSections={openSections}
              toggleSection={toggleSection}
              layout={layout}
              onLayoutChange={onLayoutChange}
              showPrices={showPrices}
              onShowPricesChange={onShowPricesChange}
              showDescriptions={showDescriptions}
              onShowDescriptionsChange={onShowDescriptionsChange}
              showAttributes={showAttributes}
              onShowAttributesChange={onShowAttributesChange}
              showSku={showSku}
              onShowSkuChange={onShowSkuChange}
              showUrls={showUrls}
              onShowUrlsChange={onShowUrlsChange}
              productImageFit={productImageFit}
              onProductImageFitChange={onProductImageFitChange}
              columnsPerRow={columnsPerRow}
              onColumnsPerRowChange={onColumnsPerRowChange}
              availableColumns={availableColumns}
              primaryColor={primaryColor}
              onPrimaryColorChange={onPrimaryColorChange}
              primaryColorParsed={primaryColorParsed}
              debouncedPrimaryColorChange={debouncedPrimaryColorChange}
              headerTextColor={headerTextColor}
              onHeaderTextColorChange={onHeaderTextColorChange}
              debouncedHeaderTextColorChange={debouncedHeaderTextColorChange}
              backgroundColor={backgroundColor}
              onBackgroundColorChange={onBackgroundColorChange}
              debouncedBackgroundColorChange={debouncedBackgroundColorChange}
              backgroundImage={backgroundImage}
              onBackgroundImageChange={onBackgroundImageChange}
              backgroundImageFit={backgroundImageFit}
              onBackgroundImageFitChange={onBackgroundImageFitChange}
              backgroundGradient={backgroundGradient}
              onBackgroundGradientChange={onBackgroundGradientChange}
              logoUrl={logoUrl}
              onLogoUrlChange={onLogoUrlChange}
              logoPosition={logoPosition}
              onLogoPositionChange={onLogoPositionChange}
              logoSize={logoSize}
              onLogoSizeChange={onLogoSizeChange}
              titlePosition={titlePosition}
              onTitlePositionChange={onTitlePositionChange}
              enableCoverPage={enableCoverPage}
              onEnableCoverPageChange={onEnableCoverPageChange}
              coverImageUrl={coverImageUrl}
              onCoverImageUrlChange={onCoverImageUrlChange}
              coverDescription={coverDescription}
              onCoverDescriptionChange={onCoverDescriptionChange}
              enableCategoryDividers={enableCategoryDividers}
              onEnableCategoryDividersChange={onEnableCategoryDividersChange}
              categoryOrder={categoryOrder}
              onCategoryOrderChange={onCategoryOrderChange}
              coverTheme={coverTheme}
              onCoverThemeChange={onCoverThemeChange}
              catalogName={catalogName}
              products={loadedProductsArray}
              handleUploadClick={handleUploadClick}
              handleFileUpload={handleFileUpload}
              logoInputRef={logoInputRef}
              bgInputRef={bgInputRef}
              coverInputRef={coverInputRef}
              userPlan={userPlan}
              onUpgrade={onUpgrade}
              selectedProductIds={selectedProductIds}
            />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
