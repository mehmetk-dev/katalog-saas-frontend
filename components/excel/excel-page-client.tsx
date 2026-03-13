"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { useTranslation } from "@/lib/contexts/i18n-provider"
import { getProducts } from "@/lib/actions/products"
import type { Product, ProductsResponse } from "@/lib/actions/products"
import type { CellField } from "./types"
import { ProGate } from "./pro-gate"
import { ExcelToolbar } from "./toolbar/excel-toolbar"
import { SaveBar } from "./toolbar/save-bar"
import { SpreadsheetTable } from "./table/spreadsheet-table"
import { UnsavedDialog } from "./toolbar/unsaved-dialog"
import { useSpreadsheet } from "./hooks/use-spreadsheet"
import { useExcelCrud } from "./hooks/use-excel-crud"

interface ExcelPageClientProps {
  initialProducts: Product[]
  initialMetadata: ProductsResponse["metadata"]
  userPlan: "free" | "plus" | "pro"
}

export function ExcelPageClient({ initialProducts, initialMetadata, userPlan }: ExcelPageClientProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tFn = useCallback((key: string, params?: Record<string, unknown>) => {
    const result = t(key, params)
    return typeof result === "string" ? result : key
  }, [t])

  // Pro gate
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
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [metadata, setMetadata] = useState(initialMetadata)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingPage, setPendingPage] = useState<number | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: CellField; direction: "asc" | "desc" } | null>(null)

  const handleSort = useCallback((key: CellField) => {
    setSortConfig(current => {
      if (current && current.key === key) {
        if (current.direction === "asc") return { key, direction: "desc" }
        return null // Reset sorting after desc
      }
      return { key, direction: "asc" }
    })
  }, [])

  const spreadsheet = useSpreadsheet(products)
  const refreshData = useCallback(async () => {
    try {
      const res = await getProducts({ page: metadata.page, limit: metadata.limit })
      if (res) {
        setProducts(res.products)
        setMetadata(res.metadata)
      }
    } catch (e) {
      console.error("Failed to refresh table data:", e)
    }
  }, [metadata.page, metadata.limit])

  const crud = useExcelCrud({
    products,
    editedCells: spreadsheet.editedCells,
    newRows: spreadsheet.newRows,
    deletedIds: spreadsheet.deletedIds,
    canSave: spreadsheet.canSave,
    discardAll: spreadsheet.discardAll,
    refreshData,
    t: tFn,
  })

  // Filtered and Sorted products
  const filteredProducts = useMemo(() => {
    let result = products

    if (search.trim()) {
      const q = search.toLowerCase()
      result = products.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      )
    }

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        let valA: any = ""
        let valB: any = ""

        if (sortConfig.key.startsWith("attr:")) {
          const attrName = sortConfig.key.slice(5)
          valA = (a.custom_attributes as any)?.find((attr: any) => attr.name === attrName)?.value || ""
          valB = (b.custom_attributes as any)?.find((attr: any) => attr.name === attrName)?.value || ""
        } else {
          valA = a[sortConfig.key as keyof Product]
          valB = b[sortConfig.key as keyof Product]
        }

        if (valA === null || valA === undefined) valA = ""
        if (valB === null || valB === undefined) valB = ""

        if (typeof valA === "number" && typeof valB === "number") {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA
        }

        const strA = String(valA).toLowerCase()
        const strB = String(valB).toLowerCase()

        if (strA < strB) return sortConfig.direction === "asc" ? -1 : 1
        if (strA > strB) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [products, search, sortConfig])

  // beforeunload
  useEffect(() => {
    if (!spreadsheet.isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [spreadsheet.isDirty])

  // Page change handler
  const handlePageChange = useCallback(async (page: number) => {
    if (spreadsheet.isDirty) {
      setPendingPage(page)
      setShowUnsavedDialog(true)
      return
    }
    await goToPage(page)
  }, [spreadsheet.isDirty])

  const goToPage = async (page: number) => {
    try {
      const res = await getProducts({ page, limit: 100 })
      if (res) {
        setProducts(res.products)
        setMetadata(res.metadata)
        setSelectedIds([])
        setSearch("")
      }
      router.push(`/dashboard/excel?page=${page}`, { scroll: false })
    } catch {
      // Keep current state
    }
  }

  const handleConfirmLeave = useCallback(() => {
    spreadsheet.discardAll()
    setShowUnsavedDialog(false)
    if (pendingPage !== null) {
      goToPage(pendingPage)
      setPendingPage(null)
    }
  }, [spreadsheet, pendingPage])

  const handleDeleteSelected = useCallback(() => {
    // New rows → remove directly
    const newRowIds = spreadsheet.newRows.map(r => r.tempId)
    const existingIds: string[] = []

    selectedIds.forEach(id => {
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
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h1 className="text-lg font-semibold">{t("excel.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("excel.description")}</p>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Main area */}
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
              onSave={crud.saveAll}
              onDiscard={spreadsheet.discardAll}
            />
          )}

          <SpreadsheetTable
            products={filteredProducts}
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

          {/* Pagination */}
          {metadata.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-background">
              <span className="text-sm text-muted-foreground">
                {t("products.showing")} {pageOffset + 1}-{Math.min(pageOffset + metadata.limit, metadata.total)} / {metadata.total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(metadata.page - 1)}
                  disabled={metadata.page <= 1}
                  className="px-3 py-1.5 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <span className="px-3 py-1.5 text-sm tabular-nums">
                  {metadata.page} / {metadata.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(metadata.page + 1)}
                  disabled={metadata.page >= metadata.totalPages}
                  className="px-3 py-1.5 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right panel — AI (Faz 2) */}
        {/* <AIPanel /> */}
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
