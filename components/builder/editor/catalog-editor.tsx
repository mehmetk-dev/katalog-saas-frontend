"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback, useTransition } from "react"
import dynamic from "next/dynamic"
import type { Product } from "@/lib/actions/products"
import type { Catalog } from "@/lib/actions/catalogs"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebouncedCallback } from "@/lib/hooks/use-debounce"
import { useEditorUpload } from "@/lib/hooks/use-editor-upload"

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
// ─── Mevcut Şablon Sütun Ayarları (Doğrulanmış Grid Yapıları) ─────────────────
// - modern-grid (Modern Izgara): 2 veya 3 sütun
// - compact-list (Kompakt Liste): Sadece 1 sütun (Sabit)
// - list (Liste): Sadece 1 sütun (Sabit)
// - classic-catalog (Klasik Katalog): Sadece 1 sütun (Sabit)
// - industrial (Endüstriyel): Sadece 1 sütun (Sabit)
// - registry (Kayıt / Satır): Sadece 1 sütun (Sabit)
// - showcase (Vitrin): Sadece 2 sütun (Sabit - Sağda 1 sütun dikey liste, Solda Kapak)
// - minimalist (Minimalist): Sadece 2 sütun (Sabit)
// - elegant-cards (Zarif Kartlar): Sadece 2 sütun (Sabit)
// - catalog-pro (Katalog Pro): Sadece 2 sütun (Sabit)
// - magazine (Dergi): 2 veya 3 sütun
// - luxury (Lüks Katalog): 2 veya 3 sütun
// - product-tiles (Ürün Döşemeleri): 2 veya 3 sütun
// - bold (Kalın): 2 veya 3 sütun
// - fashion-lookbook (Moda Lookbook): 2 veya 3 sütun
// - clean-white (Temiz Beyaz): 2 veya 3 sütun
// - retail (Perakende): 2 veya 3 sütun
// - tech-modern (Teknoloji Modern): 2 veya 3 sütun
//
// NOT: Hiçbir standart şablon 4 veya 5 sütun seçeneği sunmamaktadır. Düzenler grid-cols-2 ve grid-cols-3 kullanılarak yazılmıştır.
const getAvailableColumns = (layout: string): number[] => {
  switch (layout) {
    case 'compact-list':
    case 'list':
    case 'classic-catalog':
    case 'industrial':
    case 'registry':
      return [1]
    case 'showcase':
    case 'minimalist':
    case 'elegant-cards':
    case 'catalog-pro':
      return [2] // Vitrin, Minimalist, Zarif Kartlar ve Katalog Pro sadece 2 sütunlu tasarımları destekler
    case 'product-tiles':
      return [3] // Ürün Karoları sadece 3 sütunlu yapıyı destekler
    case 'modern-grid':
    case 'magazine':
    case 'luxury':
    case 'bold':
    case 'fashion-lookbook':
    case 'clean-white':
    case 'retail':
    case 'tech-modern':
    default:
      // Diğer çoğu şablon 2 veya 3 sütun düzenini destekler.
      return [2, 3]
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/** FIX(F2): CatalogEditor now reads all data from BuilderContext via useBuilder().
 *  No props needed — eliminates 60+ prop drilling. */
export function CatalogEditor() {
  const { state, products, productTotalCount, isProductListTruncated, userPlan } = useBuilder()

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
  } = state

  const onUpgrade = useCallback(() => setShowUpgradeModal(true), [setShowUpgradeModal])
  const onBackgroundImageFitChange = useCallback((v: NonNullable<Catalog['background_image_fit']>) => setBackgroundImageFit(v), [setBackgroundImageFit])
  const onLogoPositionChange = useCallback((v: NonNullable<Catalog['logo_position']>) => setLogoPosition(v), [setLogoPosition])
  const onLogoSizeChange = useCallback((v: NonNullable<Catalog['logo_size']>) => setLogoSize(v), [setLogoSize])
  const onTitlePositionChange = useCallback((v: NonNullable<Catalog['title_position']>) => setTitlePosition(v), [setTitlePosition])

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
  const [itemsPerPage, setItemsPerPage] = useState(18)

  useEffect(() => {
    const calculateItemsPerPage = () => {
      const width = window.innerWidth
      // CSS breakpointleri ile tam senkronize: grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6
      let cols = 2
      let rows = 4
      if (width >= 1536) { cols = 6; rows = 3; }       // 2xl: 6 sütun * 3 satır = 18 ürün
      else if (width >= 1280) { cols = 5; rows = 2; }  // xl: 5 sütun * 2 satır = 10 ürün (Dikeyden tasarruf)
      else if (width >= 1024) { cols = 4; rows = 2; }  // lg: 4 sütun * 2 satır = 8 ürün
      else if (width >= 640) { cols = 3; rows = 3; }   // sm: 3 sütun * 3 satır = 9 ürün

      setItemsPerPage(cols * rows)
    }
    calculateItemsPerPage()
    window.addEventListener('resize', calculateItemsPerPage)
    return () => window.removeEventListener('resize', calculateItemsPerPage)
  }, [])

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

  // ─── Derived Data ─────────────────────────────────────────────────────────
  const selectedProductIdSet = useMemo(() => new Set(selectedProductIds), [selectedProductIds])

  const categories = useMemo(() =>
    [...new Set(products.map(p => p.category).filter(Boolean))] as string[],
    [products]
  )

  const productIdSet = useMemo(() => new Set(products.map(p => p.id)), [products])
  const validProductIds = useMemo(() => {
    return selectedProductIds.filter(id => productIdSet.has(id))
  }, [selectedProductIds, productIdSet])

  const filteredProducts = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase()
    return products.filter(p => {
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory
      const matchesSearch = !query || p.name.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [products, selectedCategory, debouncedSearchQuery])

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const visibleProducts = useMemo(() =>
    filteredProducts.slice(startIndex, startIndex + itemsPerPage),
    [filteredProducts, startIndex, itemsPerPage]
  )

  useEffect(() => { setCurrentPage(1) }, [selectedCategory, debouncedSearchQuery])

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

  // PERF(P5): productMap reused from useBuilderState — no duplicate computation
  const { productMap } = state

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
              availableProductCount={products.length}
              totalProductCount={productTotalCount}
              isProductListTruncated={isProductListTruncated}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              categories={categories}
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
              products={products}
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
