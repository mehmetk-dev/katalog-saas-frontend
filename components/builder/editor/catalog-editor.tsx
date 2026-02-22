"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback, useTransition } from "react"
import type { Product } from "@/lib/actions/products"
import type { Catalog } from "@/lib/actions/catalogs"
import { useTranslation } from "@/lib/i18n-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebouncedCallback } from "@/lib/hooks/use-debounce"
import { useEditorUpload } from "@/lib/hooks/use-editor-upload"

import { EditorContentTab } from "./editor-content-tab"
import { EditorDesignTab } from "./editor-design-tab"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatalogEditorProps {
  products: Product[]
  totalProductCount?: number
  isProductListTruncated?: boolean
  selectedProductIds: string[]
  onSelectedProductIdsChange: (ids: string[]) => void
  description: string
  onDescriptionChange: (desc: string) => void
  layout: string
  onLayoutChange: (layout: string) => void
  primaryColor: string
  onPrimaryColorChange: (color: string) => void
  showPrices: boolean
  onShowPricesChange: (show: boolean) => void
  showDescriptions: boolean
  onShowDescriptionsChange: (show: boolean) => void
  userPlan: string
  onUpgrade: () => void
  columnsPerRow?: number
  onColumnsPerRowChange?: (columns: number) => void
  backgroundColor?: string
  onBackgroundColorChange?: (color: string) => void
  backgroundImage?: string | null
  onBackgroundImageChange?: (url: string | null) => void
  backgroundGradient?: string | null
  onBackgroundGradientChange?: (gradient: string | null) => void
  backgroundImageFit?: Catalog['background_image_fit']
  onBackgroundImageFitChange?: (fit: NonNullable<Catalog['background_image_fit']>) => void
  logoUrl?: string | null
  onLogoUrlChange?: (url: string | null) => void
  logoPosition?: Catalog['logo_position']
  onLogoPositionChange?: (position: NonNullable<Catalog['logo_position']>) => void
  logoSize?: Catalog['logo_size']
  onLogoSizeChange?: (size: NonNullable<Catalog['logo_size']>) => void
  titlePosition?: Catalog['title_position']
  onTitlePositionChange?: (position: NonNullable<Catalog['title_position']>) => void
  productImageFit?: NonNullable<Catalog['product_image_fit']>
  onProductImageFitChange?: (fit: NonNullable<Catalog['product_image_fit']>) => void
  headerTextColor?: string
  onHeaderTextColorChange?: (color: string) => void
  showAttributes?: boolean
  onShowAttributesChange?: (show: boolean) => void
  showSku?: boolean
  onShowSkuChange?: (show: boolean) => void
  showUrls?: boolean
  onShowUrlsChange?: (show: boolean) => void
  // Storytelling Catalog Props
  enableCoverPage?: boolean
  onEnableCoverPageChange?: (enable: boolean) => void
  coverImageUrl?: string | null
  onCoverImageUrlChange?: (url: string | null) => void
  coverDescription?: string | null
  onCoverDescriptionChange?: (desc: string | null) => void
  enableCategoryDividers?: boolean
  onEnableCategoryDividersChange?: (enable: boolean) => void
  coverTheme?: string
  onCoverThemeChange?: (theme: string) => void
  showInSearch?: boolean
  onShowInSearchChange?: (show: boolean) => void
  catalogName: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse color string to RGB components */
export const parseColor = (color: string) => {
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] ? parseFloat(match[4]) : 1
      }
    }
  } else if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return { r, g, b, a: 1 }
  }
  return { r: 124, g: 58, b: 237, a: 1 }
}

/** Convert RGB values to hex string */
export const rgbToHex = (r: number, g: number, b: number) => {
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')}`
}

/** Get available column options per layout/template */
const getAvailableColumns = (layout: string) => {
  switch (layout) {
    case 'bold':
    case 'catalog-pro':
    case 'luxury':
    case 'minimalist':
    case 'clean-white':
    case 'elegant-cards':
    case 'magazine':
    case 'fashion-lookbook':
      return [2]
    case 'modern-grid':
    case 'product-tiles': return [3]
    case 'retail':
    case 'tech-modern':
      return [2, 3]
    case 'compact-list':
    case 'industrial':
    case 'classic-catalog':
    case 'showcase':
      return [1]
    default:
      return [2, 3]
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CatalogEditor({
  products,
  totalProductCount,
  isProductListTruncated = false,
  selectedProductIds,
  onSelectedProductIdsChange,
  description,
  onDescriptionChange,
  layout,
  onLayoutChange,
  primaryColor,
  onPrimaryColorChange,
  showPrices,
  onShowPricesChange,
  showDescriptions,
  onShowDescriptionsChange,
  userPlan,
  onUpgrade,
  columnsPerRow = 3,
  onColumnsPerRowChange,
  backgroundColor = '#ffffff',
  onBackgroundColorChange,
  backgroundImage = null,
  onBackgroundImageChange,
  backgroundImageFit = 'cover',
  onBackgroundImageFitChange,
  backgroundGradient = null,
  onBackgroundGradientChange,
  logoUrl = null,
  onLogoUrlChange,
  logoPosition = 'header-left',
  onLogoPositionChange,
  logoSize: _logoSize = 'medium',
  onLogoSizeChange: _onLogoSizeChange,
  titlePosition = 'left',
  onTitlePositionChange,
  showAttributes = false,
  onShowAttributesChange,
  showSku = true,
  onShowSkuChange,
  showUrls = false,
  onShowUrlsChange,
  headerTextColor = '#ffffff',
  onHeaderTextColorChange,
  productImageFit = 'cover',
  onProductImageFitChange,
  enableCoverPage = false,
  onEnableCoverPageChange,
  coverImageUrl = null,
  onCoverImageUrlChange,
  coverDescription = null,
  onCoverDescriptionChange,
  enableCategoryDividers = false,
  onEnableCategoryDividersChange,
  coverTheme = 'modern',
  onCoverThemeChange,
  showInSearch: _showInSearch = true,
  onShowInSearchChange: _onShowInSearchChange,
  catalogName,
}: CatalogEditorProps) {
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
  })

  // ─── Search & Pagination ──────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)

  useEffect(() => {
    const calculateItemsPerPage = () => {
      const width = window.innerWidth
      let cols = 5
      if (width < 640) cols = 2
      else if (width < 768) cols = 3
      else if (width < 1024) cols = 4
      setItemsPerPage(cols * 3)
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

  const productMap = useMemo(() => {
    const map = new Map<string, Product>()
    for (const p of products) map.set(p.id, p)
    return map
  }, [products])

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
  const availableColumns = getAvailableColumns(layout)

  useEffect(() => {
    if (availableColumns.length > 0 && !availableColumns.includes(columnsPerRow!) && onColumnsPerRowChange) {
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
              totalProductCount={totalProductCount}
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
