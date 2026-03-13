"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { getProducts, type Product, type ProductsResponse } from "@/lib/actions/products"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import type { ExcelAiIntent } from "@/lib/excel-ai/types"
import type { CellField } from "./types"
import { buildBulkChangesFromIntent, collectExistingCategories } from "./ai/bulk-changes"
import { ExcelChatPanel } from "./ai/excel-chat-panel"
import { useExcelCrud } from "./hooks/use-excel-crud"
import { useExcelProducts } from "./hooks/use-excel-products"
import { useSpreadsheet } from "./hooks/use-spreadsheet"
import { ProGate } from "./pro-gate"
import { SpreadsheetTable } from "./table/spreadsheet-table"
import { ExcelToolbar } from "./toolbar/excel-toolbar"
import { SaveBar } from "./toolbar/save-bar"
import { UnsavedDialog } from "./toolbar/unsaved-dialog"

interface ExcelPageClientProps {
  initialProducts: Product[]
  initialMetadata: ProductsResponse["metadata"]
  userPlan: "free" | "plus" | "pro"
}

interface ExcelPageContentProps {
  initialProducts: Product[]
  initialMetadata: ProductsResponse["metadata"]
  tFn: (key: string, params?: Record<string, unknown>) => string
}

const AI_ALL_SCOPE_PAGE_SIZE = 500
const AI_ALL_SCOPE_MAX_PRODUCTS = 5000

export function ExcelPageClient({ initialProducts, initialMetadata, userPlan }: ExcelPageClientProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const tFn = useCallback(
    (key: string, params?: Record<string, unknown>) => {
      const result = t(key, params)
      return typeof result === "string" ? result : key
    },
    [t],
  )

  if (userPlan !== "pro") {
    return <ProGate onUpgrade={() => router.push("/dashboard/settings?tab=billing")} />
  }

  return <ExcelPageContent initialProducts={initialProducts} initialMetadata={initialMetadata} tFn={tFn} />
}

function ExcelPageContent({ initialProducts, initialMetadata, tFn }: ExcelPageContentProps) {
  const { t, language } = useTranslation()
  const router = useRouter()

  const {
    products,
    metadata,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    isLoading,
    refreshCurrentPage,
    applyLocalCommit,
  } = useExcelProducts({
    initialProducts,
    initialMetadata,
  })

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingPage, setPendingPage] = useState<number | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: CellField; direction: "asc" | "desc" } | null>(null)
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true)

  const handleSort = useCallback((key: CellField) => {
    setSortConfig((current) => {
      if (current && current.key === key) {
        if (current.direction === "asc") {
          return { key, direction: "desc" }
        }
        return null
      }

      return { key, direction: "asc" }
    })
  }, [])

  const spreadsheet = useSpreadsheet(products)

  const crud = useExcelCrud({
    editedCells: spreadsheet.editedCells,
    newRows: spreadsheet.newRows,
    deletedIds: spreadsheet.deletedIds,
    canSave: spreadsheet.canSave,
    discardAll: spreadsheet.discardAll,
    refreshData: refreshCurrentPage,
    applyLocalCommit,
    t: tFn,
    getCachedProduct: spreadsheet.getCachedProduct,
  })

  const sortedProducts = useMemo(() => {
    if (!sortConfig) return products

    const getSortableValue = (product: Product, field: CellField): string | number => {
      if (field.startsWith("attr:")) {
        const attrName = field.slice(5)
        const attr = product.custom_attributes?.find((item) => item.name === attrName)
        return attr?.value || ""
      }

      const rawValue = product[field as keyof Product]
      if (rawValue === null || rawValue === undefined) return ""
      if (typeof rawValue === "number") return rawValue
      return String(rawValue)
    }

    return [...products].sort((a, b) => {
      const aValue = getSortableValue(a, sortConfig.key)
      const bValue = getSortableValue(b, sortConfig.key)

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
      }

      const aText = String(aValue).toLowerCase()
      const bText = String(bValue).toLowerCase()

      if (aText < bText) return sortConfig.direction === "asc" ? -1 : 1
      if (aText > bText) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })
  }, [products, sortConfig])

  useEffect(() => {
    if (!spreadsheet.isDirty) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }

    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [spreadsheet.isDirty])

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(page)
      setSelectedIds([])
      router.push(`/dashboard/excel?page=${page}`, { scroll: false })
    },
    [router, setCurrentPage],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      if (spreadsheet.isDirty) {
        setPendingPage(page)
        setShowUnsavedDialog(true)
        return
      }

      goToPage(page)
    },
    [spreadsheet.isDirty, goToPage],
  )

  const handleConfirmLeave = useCallback(() => {
    spreadsheet.discardAll()
    setShowUnsavedDialog(false)

    if (pendingPage !== null) {
      goToPage(pendingPage)
      setPendingPage(null)
    }
  }, [spreadsheet, pendingPage, goToPage])

  const handleDeleteSelected = useCallback(() => {
    const newRowIds = spreadsheet.newRows.map((row) => row.tempId)
    const existingIds: string[] = []

    selectedIds.forEach((id) => {
      if (newRowIds.includes(id)) {
        spreadsheet.removeNewRow(id)
      } else {
        existingIds.push(id)
      }
    })

    if (existingIds.length > 0) {
      spreadsheet.markForDeletion(existingIds)
    }

    setSelectedIds([])
  }, [selectedIds, spreadsheet])

  const loadAllProductsForAi = useCallback(async (): Promise<Product[]> => {
    const firstPage = await getProducts({
      page: 1,
      limit: AI_ALL_SCOPE_PAGE_SIZE,
      search: search || undefined,
    })

    if (firstPage.metadata.total > AI_ALL_SCOPE_MAX_PRODUCTS) {
      throw new Error(`Too many products for all-scope AI action (${firstPage.metadata.total}).`)
    }

    const allProducts = [...firstPage.products]

    for (let page = 2; page <= firstPage.metadata.totalPages; page += 1) {
      const response = await getProducts({
        page,
        limit: AI_ALL_SCOPE_PAGE_SIZE,
        search: search || undefined,
      })
      allProducts.push(...response.products)
    }

    return allProducts
  }, [search])

  const resolveScopeProducts = useCallback(
    async (scope: ExcelAiIntent["scope"]): Promise<Product[]> => {
      if (scope === "selected") {
        const selectedSet = new Set(selectedIds)
        return products.filter((product) => selectedSet.has(product.id))
      }

      if (scope === "all") {
        return loadAllProductsForAi()
      }

      return products
    },
    [selectedIds, products, loadAllProductsForAi],
  )

  const handleApplyAiIntent = useCallback(
    async (intent: ExcelAiIntent): Promise<{ changedCells: number; targetProducts: number }> => {
      const scopeProducts = await resolveScopeProducts(intent.scope)

      if (scopeProducts.length === 0) {
        const message = language === "tr" ? "Bu kapsamda ürün bulunamadı." : "No products found for this scope."
        throw new Error(message)
      }

      spreadsheet.primeProductCache(scopeProducts)

      const existingCategories = collectExistingCategories(scopeProducts.length > 0 ? scopeProducts : products)
      const changes = await buildBulkChangesFromIntent({
        products: scopeProducts,
        operations: intent.operations,
        getCellValue: spreadsheet.getCellValue,
        language,
        existingCategories,
      })

      if (changes.length === 0) {
        const message = language === "tr" ? "Uygulanabilir değişiklik üretilmedi." : "No applicable changes were generated."
        throw new Error(message)
      }

      spreadsheet.applyBulkChanges(changes)

      const successText =
        language === "tr"
          ? `${changes.length} hücrede yerel değişiklik oluşturuldu. Kaydetmeden veritabanı değişmez.`
          : `${changes.length} local cell edits created. Database will not change until Save.`

      toast.success(successText)

      return {
        changedCells: changes.length,
        targetProducts: scopeProducts.length,
      }
    },
    [resolveScopeProducts, spreadsheet, language, products],
  )

  const pageOffset = (metadata.page - 1) * metadata.limit

  return (
    <div className="-mt-1 flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b px-4 pb-2 pt-1.5">
        <h1 className="text-lg font-semibold">{t("excel.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("excel.description")}</p>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ExcelToolbar
            selectedCount={selectedIds.length}
            totalCount={metadata.total}
            search={search}
            onSearchChange={setSearch}
            onAddRow={spreadsheet.addEmptyRow}
            onDeleteSelected={handleDeleteSelected}
            onClearSelection={() => setSelectedIds([])}
            onOpenAI={() => setIsAiPanelOpen((prev) => !prev)}
            isAIActive={isAiPanelOpen}
          />

          {spreadsheet.isDirty && (
            <SaveBar
              editedCount={spreadsheet.dirtyProductCount}
              newCount={spreadsheet.newRows.length}
              deletedCount={spreadsheet.deletedIds.size}
              errorCount={spreadsheet.errorCount}
              canSave={spreadsheet.canSave}
              isSaving={crud.isSaving}
              onSave={() => {
                void crud.saveAll()
              }}
              onDiscard={spreadsheet.discardAll}
            />
          )}

          <SpreadsheetTable
            products={sortedProducts}
            newRows={spreadsheet.newRows}
            deletedIds={spreadsheet.deletedIds}
            selectedIds={selectedIds}
            columns={spreadsheet.allColumns}
            pageOffset={pageOffset}
            sortConfig={sortConfig}
            onSort={handleSort}
            onSelectedIdsChange={setSelectedIds}
            getCellValue={spreadsheet.getCellValue}
            setCellValue={spreadsheet.setCellValue}
            isCellDirty={spreadsheet.isCellDirty}
            getCellError={spreadsheet.getCellError}
            updateNewRow={spreadsheet.updateNewRow}
          />

          {metadata.totalPages > 1 && (
            <div className="flex items-center justify-between border-t bg-background px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {t("products.showing")} {pageOffset + 1}-{Math.min(pageOffset + metadata.limit, metadata.total)} / {metadata.total}
                {isLoading ? ` - ${t("common.loading")}` : ""}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                  className="rounded border px-3 py-1.5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {"<"}
                </button>

                <span className="px-3 py-1.5 text-sm tabular-nums">
                  {metadata.page} / {metadata.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= metadata.totalPages || isLoading}
                  className="rounded border px-3 py-1.5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {">"}
                </button>
              </div>
            </div>
          )}
        </div>

        {isAiPanelOpen && (
          <aside className="hidden min-w-[340px] overflow-hidden border-l lg:flex lg:w-[380px]">
            <ExcelChatPanel
              language={language}
              selectedCount={selectedIds.length}
              visibleCount={products.length}
              totalCount={metadata.total}
              search={search}
              onApplyIntent={handleApplyAiIntent}
            />
          </aside>
        )}
      </div>

      <UnsavedDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        dirtyCount={spreadsheet.dirtyProductCount + spreadsheet.newRows.length + spreadsheet.deletedIds.size}
        onConfirmLeave={handleConfirmLeave}
      />
    </div>
  )
}
