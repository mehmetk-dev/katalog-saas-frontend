"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback, useTransition } from "react"
import dynamic from "next/dynamic"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebouncedCallback } from "@/lib/hooks/use-debounce"
import { useAllProductIds, useInfiniteProducts } from "@/lib/hooks/use-products"
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

import { DesignToolsProvider, type DesignSource } from "./design-sections/design-context"
import type { DraftSetters } from "@/components/builder/builder-utils"

// ─── Component ────────────────────────────────────────────────────────────────

/** Ürün seçici, kullanıcının Ürünler sayfasında belirlediği manuel sırayı izler */
const PICKER_SORT = { sortBy: "display_order", sortOrder: "asc" } as const

/** FIX(F2): CatalogEditor now reads all data from BuilderContext via useBuilder().
 *  No props needed — eliminates 60+ prop drilling. */
export function CatalogEditor() {
  const { state, initialProductsResponse, userPlan } = useBuilder()

  // İçerik sekmesinin kullandıkları; tasarım ayarlarını bölümler kendileri okur (DesignToolsProvider)
  const {
    selectedProductIds, handleSelectedProductIdsChange: onSelectedProductIdsChange,
    upsertLoadedProducts,
    selectedProductIdSet,
    productMap,
  } = state

  const { t: baseT } = useTranslation()
  const t = useCallback((key: string, params?: Record<string, unknown>) => baseT(key, params) as string, [baseT])

  // Tasarım bölümlerinin kaynağı: builder taslağı + setter'lar (otomatik kayıt / geri al buradan)
  const { draft, setShowUpgradeModal } = state
  const designProducts = useMemo(() => Array.from(productMap.values()), [productMap])
  const designSource = useMemo<DesignSource>(() => ({
    draft,
    setters: state as unknown as DraftSetters,
    edit: state.editDraft,
    products: designProducts,
    userPlan,
    onUpgrade: () => setShowUpgradeModal(true),
  }), [draft, state, designProducts, userPlan, setShowUpgradeModal])

  // Yeni (boş) katalogda ilk karar şablon: o bölüm açık başlar. Dolu katalogda tüm bölümler
  // kapalı başlar; Tasarım sekmesi kısa bir başlık listesi olarak açılır, 16 şablon önizlemesi
  // diğer ayarları aşağı itmez.
  const [initialOpenSections] = useState((): Record<string, boolean> =>
    selectedProductIds.length === 0 ? { template: true } : {}
  )

  // ─── Local State ──────────────────────────────────────────────────────────
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  // ─── Search & Filter ──────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const itemsPerPage = 24

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
    limit: itemsPerPage,
    category: selectedCategory === "all" ? undefined : selectedCategory,
    search: debouncedSearchQuery.trim() || undefined,
    ...PICKER_SORT,
  }), [itemsPerPage, selectedCategory, debouncedSearchQuery])

  const initialQueryData = useMemo(() => {
    const isInitialQuery = selectedCategory === "all" && !debouncedSearchQuery.trim()
    return isInitialQuery ? initialProductsResponse : undefined
  }, [selectedCategory, debouncedSearchQuery, initialProductsResponse])

  // Builder SSR'dan gelen ilk sayfayla açılır; sonraki sayfalar liste sonuna kaydırınca yüklenir
  const productsQuery = useInfiniteProducts(productsParams, initialQueryData)
  // PERF(O2): Tüm ürün ID'lerini sadece "Tümünü Seç" butonu etkileşime girince çek.
  // İlk builder açılışında 10k ürün için 10 seri sunucu çağrısını engelliyor.
  const allProductIdFilters = useMemo(() => ({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    search: debouncedSearchQuery.trim() || undefined,
    ...PICKER_SORT,
  }), [selectedCategory, debouncedSearchQuery])
  const allProductIdsQuery = useAllProductIds(allProductIdFilters, undefined, { enabled: false })
  const refetchAllProductIds = allProductIdsQuery.refetch
  const prefetchAllProductIds = useCallback(async () => {
    const result = await refetchAllProductIds()
    if (result.error) throw result.error
    return result.data || []
  }, [refetchAllProductIds])
  const firstPage = productsQuery.data?.pages[0]
  const allProductIds = useMemo(() => allProductIdsQuery.data || [], [allProductIdsQuery.data])
  const pagedProducts = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.products) || [],
    [productsQuery.data]
  )
  const totalFilteredProducts = firstPage?.metadata.total || 0
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = productsQuery
  const loadMoreProducts = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  useEffect(() => {
    if (pagedProducts.length > 0) {
      upsertLoadedProducts(pagedProducts)
    }
  }, [pagedProducts, upsertLoadedProducts])

  // ─── Derived Data ─────────────────────────────────────────────────────────
  // PERF(Y1): selectedProductIdSet artık context state'inden geliyor (tek kaynak).
  const categories = firstPage?.allCategories || []

  // PERF(Y6): productMap.has(id) zaten O(1) — ayrı Set allocate etmeye gerek yok.
  const validProductIds = useMemo(() => {
    return selectedProductIds.filter(id => productMap.has(id))
  }, [selectedProductIds, productMap])

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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    // Sekme değişince açık bölümler ve süren yüklemeler korunsun diye sağlayıcı editör seviyesinde
    <DesignToolsProvider source={designSource} initialOpenSections={initialOpenSections}>
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
              totalProductCount={totalFilteredProducts}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              categories={categories}
              allProductIds={allProductIds}
              visibleProducts={pagedProducts}
              selectedProductIds={selectedProductIds}
              selectedProductIdSet={selectedProductIdSet}
              validProductIds={validProductIds}
              onSelectedProductIdsChange={onSelectedProductIdsChange}
              toggleProduct={toggleProduct}
              onPrefetchAllProductIds={prefetchAllProductIds}
              hasMoreProducts={!!hasNextPage}
              isLoadingMoreProducts={isFetchingNextPage}
              onLoadMoreProducts={loadMoreProducts}
              productMap={productMap}
              isLoadingProducts={productsQuery.isLoading || (productsQuery.isFetching && !isFetchingNextPage) || isFilterPending}
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
            {activeTab === 'design' && <EditorDesignTab />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
    </DesignToolsProvider>
  )
}
