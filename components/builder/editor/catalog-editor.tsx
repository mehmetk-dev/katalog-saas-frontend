"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback, useTransition } from "react"
import dynamic from "next/dynamic"
import type { Catalog } from "@/lib/actions/catalogs"
import type { ProductSortField, ProductSortOrder } from "@/lib/actions/products"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebouncedCallback } from "@/lib/hooks/use-debounce"
import { useEditorUpload } from "@/lib/hooks/use-editor-upload"
import { useProducts } from "@/lib/hooks/use-products"

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
import { parseColor, rgbToHex } from "@/components/builder/builder-utils"

// ŞABLON SÜTUN REFERANS LİSTESİ (TEMPLATE COLUMN CONSTRAINTS)
// ───
// Bu ayarlar her şablonun Görünüm Düzeni sekmesinde kaç "Sütun" seçeneği
// göstereceğini belirler. Şablonlar isimleri (layout) üzerinden eşleştirilir.
// 
// Yeni bir template eklediğinde veya mevcut bir template'in desteklediği
// sütun sayısını değiştirmek istediğinde, SADECE bu fonksiyonu güncelle.
//
// ─── Mevcut Şablon Sütun Ayarları ───────────────────────────────────
// - modern-grid (Modern Izgara): 1–5 arası
// - compact-list (Kompakt Liste): Sadece 1 sütun (Sabit)
// - list (Liste): Sadece 1 sütun (Sabit)
// - magazine (Dergi): 1 veya 2 sütun
// - luxury (Lüks Katalog): 1–4 arası
// - tech-catalog (Teknoloji Kataloğu): 1–4 arası
// - premium-collection (Premium Koleksiyon): 1–3 arası
// - product-cards (Ürün Kartları): 1–4 arası
// - product-tiles (Ürün Döşemeleri): 2 veya 3 sütun
// - catalog-minimalist (Minimalist): 1 veya 2 sütun
// - catalog-elegant (Zarif): 1 veya 2 sütun
// - photo-gallery (Fotoğraf Galerisi): 2–4 arası
// - price-list (Fiyat Listesi): Sadece 1 sütun (Sabit)
// - premium-products (Premium Ürünler): 1–3 arası
// - industrial (Endüstriyel): Sadece 1 sütun (Sabit)
// - classic-catalog (Klasik Katalog): Sadece 1 sütun (Sabit)
// - showcase (Vitrin): Sadece 2 sütun (Sabit)
const getAvailableColumns = (layout: string): number[] => {
  switch (layout) {
    case 'modern-grid':
      return [1, 2, 3, 4, 5]
    case 'compact-list':
    case 'list':
      return [1]
    case 'magazine':
      return [1, 2]
    case 'luxury':
    case 'tech-catalog':
      return [1, 2, 3, 4]
    case 'premium-collection':
    case 'premium-products':
      return [1, 2, 3]
    case 'product-cards':
      return [1, 2, 3, 4]
    case 'product-tiles':
      return [2, 3]
    case 'catalog-minimalist':
    case 'catalog-elegant':
      return [1, 2]
    case 'photo-gallery':
      return [2, 3, 4]
    case 'price-list':
    case 'industrial':
    case 'classic-catalog':
      return [1]
    case 'showcase':
      return [2]
    default:
      return [1, 2, 3, 4]
  }
}

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
  } = state

  const onUpgrade = useCallback(() => setShowUpgradeModal(true), [setShowUpgradeModal])
  const onBackgroundImageFitChange = useCallback((v: NonNullable<Catalog['background_image_fit']>) => setBackgroundImageFit(v), [setBackgroundImageFit])
  const onLogoPositionChange = useCallback((v: NonNullable<Catalog['logo_position']>) => setLogoPosition(v), [setLogoPosition])
  const onLogoSizeChange = useCallback((v: NonNullable<Catalog['logo_size']>) => setLogoSize(v), [setLogoSize])
  const onTitlePositionChange = useCallback((v: NonNullable<Catalog['title_position']>) => setTitlePosition(v), [setTitlePosition])
  const { productMap } = state

  const { t: baseT } = useTranslation()
  const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])

  // ─── Local State ──────────────────────────────────────────────────────────
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ appearance: true, branding: true })
  const toggleSection = useCallback((key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // Color pickers
  const [showPrimaryColorPicker, setShowPrimaryColorPicker] = useState(false)
  const [showHeaderTextColorPicker, setShowHeaderTextColorPicker] = useState(false)
  const [showBackgroundColorPicker, setShowBackgroundColorPicker] = useState(false)
  const primaryColorPickerRef = useRef<HTMLDivElement>(null)
  const headerTextColorPickerRef = useRef<HTMLDivElement>(null)
  const backgroundColorPickerRef = useRef<HTMLDivElement>(null)

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

  // Close color pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (showPrimaryColorPicker && primaryColorPickerRef.current && !primaryColorPickerRef.current.contains(target)) {
        setShowPrimaryColorPicker(false)
      }
      if (showHeaderTextColorPicker && headerTextColorPickerRef.current && !headerTextColorPickerRef.current.contains(target)) {
        setShowHeaderTextColorPicker(false)
      }
      if (showBackgroundColorPicker && backgroundColorPickerRef.current && !backgroundColorPickerRef.current.contains(target)) {
        setShowBackgroundColorPicker(false)
      }
    }

    if (showPrimaryColorPicker || showHeaderTextColorPicker || showBackgroundColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPrimaryColorPicker, showHeaderTextColorPicker, showBackgroundColorPicker])

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
  const [_isFilterPending, startFilterTransition] = useTransition()

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

  const productsQuery = useProducts(productsParams, initialQueryData)
  const productsResponse = productsQuery.data
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
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  // ─── Derived Data ─────────────────────────────────────────────────────────
  const selectedProductIdSet = useMemo(() => new Set(selectedProductIds), [selectedProductIds])

  const categories = productsResponse?.allCategories || []

  const productIdSet = useMemo(() => new Set(Array.from(productMap.keys())), [productMap])
  const validProductIds = useMemo(() => {
    return selectedProductIds.filter(id => productIdSet.has(id))
  }, [selectedProductIds, productIdSet])
  const filteredProducts = pagedProducts
  const visibleProducts = pagedProducts

  useEffect(() => { setCurrentPage(1) }, [selectedCategory, debouncedSearchQuery])
  useEffect(() => { setCurrentPage(1) }, [sortBy, sortOrder])

  // ─── Product Selection & Sorting ──────────────────────────────────────────
  // PERFORMANCE: Set-based toggle — O(1) add/delete instead of O(n) filter/spread
  const toggleProduct = useCallback((id: string) => {
    if (selectedProductIdSet.has(id)) {
      // Remove: filter is unavoidable but we avoid unnecessary copies
      onSelectedProductIdsChange(selectedProductIds.filter(i => i !== id))
    } else {
      // Add: push to end, no full-copy needed (spread is still O(n) but unavoidable for immutability)
      onSelectedProductIdsChange([...selectedProductIds, id])
    }
  }, [selectedProductIds, selectedProductIdSet, onSelectedProductIdsChange])

  const handleSortDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.stopPropagation()
    e.dataTransfer.setData("text", index.toString())
    setDraggingIndex(index)
  }, [])

  const handleSortDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDropIndex(index)
  }, [])

  const handleSortDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    const from = Number(e.dataTransfer.getData("text"))
    const newList = [...selectedProductIds]
    const [moved] = newList.splice(from, 1)
    newList.splice(index, 0, moved)
    onSelectedProductIdsChange(newList)
    setDraggingIndex(null)
    setDropIndex(null)
  }, [selectedProductIds, onSelectedProductIdsChange])

  const handleRemoveProduct = useCallback((id: string) => {
    onSelectedProductIdsChange(selectedProductIds.filter(i => i !== id))
  }, [selectedProductIds, onSelectedProductIdsChange])

  // ─── Column Constraints ───────────────────────────────────────────────────
  // PERF(F13): Memoize to stabilize reference — prevents effect re-runs every render
  const availableColumns = useMemo(() => getAvailableColumns(layout), [layout])

  useEffect(() => {
    if (availableColumns.length > 0 && !availableColumns.includes(columnsPerRow ?? 0) && onColumnsPerRowChange) {
      onColumnsPerRowChange(availableColumns[0])
    }
  }, [layout, availableColumns, columnsPerRow, onColumnsPerRowChange])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-gradient-to-b dark:from-[#080a12] dark:to-[#03040a] border-r border-slate-200 dark:border-white/5 overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        {/* Modern App-like Tab Navigation */}
        <div className="bg-white/80 dark:bg-[#080a12]/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 dark:border-white/5 px-4 py-3 shrink-0">
          <TabsList className="flex w-full max-w-[480px] mx-auto h-12 p-1 bg-slate-100/80 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-inner">
            <TabsTrigger
              value="content"
              className="flex-1 rounded-xl text-[10px] sm:text-xs uppercase tracking-[0.05em] font-black data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 transition-all duration-300 gap-2"
            >
              {t('builder.productSelection')}
            </TabsTrigger>
            <TabsTrigger
              value="design"
              className="flex-1 rounded-xl text-[10px] sm:text-xs uppercase tracking-[0.05em] font-black data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 transition-all duration-300 gap-2"
            >
              {t('builder.designSettings')}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-4 pb-12 px-3 sm:px-6 custom-scrollbar space-y-6">
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
              visibleProducts={visibleProducts}
              selectedProductIds={selectedProductIds}
              selectedProductIdSet={selectedProductIdSet}
              validProductIds={validProductIds}
              onSelectedProductIdsChange={onSelectedProductIdsChange}
              toggleProduct={toggleProduct}
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              productMap={productMap}
              isLoadingProducts={productsQuery.isLoading || productsQuery.isFetching}
              draggingIndex={draggingIndex}
              dropIndex={dropIndex}
              onSortDragStart={handleSortDragStart}
              onSortDragOver={handleSortDragOver}
              onSortDrop={handleSortDrop}
              onRemoveProduct={handleRemoveProduct}
            />
          </TabsContent>

          <TabsContent value="design" className="m-0">
            <EditorDesignTab
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
              showPrimaryColorPicker={showPrimaryColorPicker}
              setShowPrimaryColorPicker={setShowPrimaryColorPicker}
              primaryColorPickerRef={primaryColorPickerRef}
              debouncedPrimaryColorChange={debouncedPrimaryColorChange}
              headerTextColor={headerTextColor}
              onHeaderTextColorChange={onHeaderTextColorChange}
              showHeaderTextColorPicker={showHeaderTextColorPicker}
              setShowHeaderTextColorPicker={setShowHeaderTextColorPicker}
              headerTextColorPickerRef={headerTextColorPickerRef}
              debouncedHeaderTextColorChange={debouncedHeaderTextColorChange}
              backgroundColor={backgroundColor}
              onBackgroundColorChange={onBackgroundColorChange}
              showBackgroundColorPicker={showBackgroundColorPicker}
              setShowBackgroundColorPicker={setShowBackgroundColorPicker}
              backgroundColorPickerRef={backgroundColorPickerRef}
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
              products={Array.from(productMap.values())}
              handleUploadClick={handleUploadClick}
              handleFileUpload={handleFileUpload}
              logoInputRef={logoInputRef}
              bgInputRef={bgInputRef}
              coverInputRef={coverInputRef}
              userPlan={userPlan}
              onUpgrade={onUpgrade}
              selectedProductIds={selectedProductIds}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
