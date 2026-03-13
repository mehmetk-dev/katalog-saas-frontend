"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import type { Product, ProductsResponse } from "@/lib/actions/products"
import type { CellField } from "./types"
import { ProGate } from "./pro-gate"
import { ExcelToolbar } from "./toolbar/excel-toolbar"
import { SaveBar } from "./toolbar/save-bar"
import { SpreadsheetTable } from "./table/spreadsheet-table"
import { UnsavedDialog } from "./toolbar/unsaved-dialog"
import { useSpreadsheet } from "./hooks/use-spreadsheet"
import { useExcelCrud } from "./hooks/use-excel-crud"
import { useExcelProducts } from "./hooks/use-excel-products"

interface ExcelPageClientProps {
  initialProducts: Product[]
  initialMetadata: ProductsResponse["metadata"]
  userPlan: "free" | "plus" | "pro"
}

export function ExcelPageClient({ initialProducts, initialMetadata, userPlan }: ExcelPageClientProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const tFn = useCallback((key: string, params?: Record<string, unknown>) => {
    const result = t(key, params)
    return typeof result === "string" ? result : key
  }, [t])

  if (userPlan !== "pro") {
    return <ProGate onUpgrade={() => router.push("/dashboard/settings?tab=billing")} />
  }

  return <ExcelPageContent initialProducts={initialProducts} initialMetadata={initialMetadata} tFn={tFn} />
}

interface ExcelPageContentProps {
  initialProducts: Product[]
  initialMetadata: ProductsResponse["metadata"]
  tFn: (key: string, params?: Record<string, unknown>) => string
}

function ExcelPageContent({ initialProducts, initialMetadata, tFn }: ExcelPageContentProps) {
  const { t } = useTranslation()
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
  } = useExcelProducts({
    initialProducts,
    initialMetadata,
  })

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingPage, setPendingPage] = useState<number | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: CellField; direction: "asc" | "desc" } | null>(null)

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
    t: tFn,
    getCachedProduct: spreadsheet.getCachedProduct,
  })

  const sortedProducts = useMemo(() => {
    if (!sortConfig) {
      return products
    }

    const getSortableValue = (product: Product, field: CellField): string | number => {
      if (field.startsWith("attr:")) {
        const attrName = field.slice(5)
        const attr = product.custom_attributes?.find((item) => item.name === attrName)
        return attr?.value || ""
      }

      const rawValue = product[field as keyof Product]
      if (rawValue === null || rawValue === undefined) {
        return ""
      }

      if (typeof rawValue === "number") {
        return rawValue
      }

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

      if (aText < bText) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (aText > bText) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
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

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page)
    setSelectedIds([])
    router.push(`/dashboard/excel?page=${page}`, { scroll: false })
  }, [router, setCurrentPage])

  const handlePageChange = useCallback((page: number) => {
    if (spreadsheet.isDirty) {
      setPendingPage(page)
      setShowUnsavedDialog(true)
      return
    }

    goToPage(page)
  }, [spreadsheet.isDirty, goToPage])

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

  const pageOffset = (metadata.page - 1) * metadata.limit

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)]">
      <div className="px-4 py-3 border-b">
        <h1 className="text-lg font-semibold">{t("excel.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("excel.description")}</p>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <ExcelToolbar
            selectedCount={selectedIds.length}
            totalCount={metadata.total}
            search={search}
            onSearchChange={setSearch}
            onAddRow={spreadsheet.addEmptyRow}
            onDeleteSelected={handleDeleteSelected}
            onClearSelection={() => setSelectedIds([])}
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
            <div className="flex items-center justify-between px-4 py-3 border-t bg-background">
              <span className="text-sm text-muted-foreground">
                {t("products.showing")} {pageOffset + 1}-{Math.min(pageOffset + metadata.limit, metadata.total)} / {metadata.total}
                {isLoading ? ` · ${t("common.loading")}` : ""}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                  className="px-3 py-1.5 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ‹
                </button>

                <span className="px-3 py-1.5 text-sm tabular-nums">
                  {metadata.page} / {metadata.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= metadata.totalPages || isLoading}
                  className="px-3 py-1.5 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
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
