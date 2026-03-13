"use client"

import type { Dispatch, SetStateAction, UIEvent } from "react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { cn } from "@/lib/utils"

import { SpreadsheetCell } from "./spreadsheet-cell"
import { getColumnInitialWidth, getResolvedColumnWidth } from "./column-width"
import type { CellField, NewRow, Product, SpreadsheetColumn } from "../types"

interface SpreadsheetTableProps {
  products: Product[]
  newRows: NewRow[]
  deletedIds: Set<string>
  selectedIds: string[]
  columns: SpreadsheetColumn[]
  pageOffset: number
  onSelectedIdsChange: Dispatch<SetStateAction<string[]>>
  getCellValue: (productId: string, field: CellField) => string | number | null
  setCellValue: (productId: string, field: CellField, value: string | number | null) => void
  isCellDirty: (productId: string, field: CellField) => boolean
  getCellError: (productId: string, field: CellField) => string | null
  updateNewRow: (tempId: string, field: string, value: string | number) => void
  sortConfig?: { key: CellField; direction: "asc" | "desc" } | null
  onSort?: (key: CellField) => void
}

interface ProductRowProps {
  product: Product
  idx: number
  isSelected: boolean
  isDeleted: boolean
  columns: SpreadsheetColumn[]
  columnWidths: Record<string, number>
  pageOffset: number
  getCellValue: (productId: string, field: CellField) => string | number | null
  setCellValue: (productId: string, field: CellField, value: string | number | null) => void
  isCellDirty: (productId: string, field: CellField) => boolean
  getCellError: (productId: string, field: CellField) => string | null
  toggleSelect: (id: string) => void
  t: (key: string) => string
}

interface NewProductRowProps {
  row: NewRow
  columns: SpreadsheetColumn[]
  columnWidths: Record<string, number>
  getCellError: (productId: string, field: CellField) => string | null
  updateNewRow: (tempId: string, field: string, value: string | number) => void
  t: (key: string) => string
}

export function SpreadsheetTable({
  products,
  newRows,
  deletedIds,
  selectedIds,
  columns,
  pageOffset,
  onSelectedIdsChange,
  getCellValue,
  setCellValue,
  isCellDirty,
  getCellError,
  updateNewRow,
  sortConfig,
  onSort,
}: SpreadsheetTableProps) {
  const { t: baseT } = useTranslation()
  const t = useCallback((key: string) => baseT(key) as string, [baseT])
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const allProductIds = useMemo(() => products.map((product) => product.id), [products])
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allSelected = allProductIds.length > 0 && allProductIds.every((id) => selectedIdSet.has(id))

  const toggleSelectAll = useCallback(() => {
    onSelectedIdsChange((prev) => {
      const prevSet = new Set(prev)
      const isAllSelected = allProductIds.length > 0 && allProductIds.every((id) => prevSet.has(id))

      if (isAllSelected) {
        const next = prev.filter((id) => !allProductIds.includes(id))
        return next
      }

      return Array.from(new Set([...prev, ...allProductIds]))
    })
  }, [allProductIds, onSelectedIdsChange])

  const toggleSelect = useCallback((id: string) => {
    onSelectedIdsChange((prev) => (prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]))
  }, [onSelectedIdsChange])

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const resizingColumnKeyRef = useRef<string | null>(null)
  const resizeStartXRef = useRef(0)
  const resizeStartWidthRef = useRef(0)

  const handleResizeStart = useCallback((e: React.PointerEvent, colKey: string, currentWidthClass: string) => {
    e.stopPropagation()
    e.preventDefault()

    resizingColumnKeyRef.current = colKey
    resizeStartXRef.current = e.clientX
    resizeStartWidthRef.current = columnWidths[colKey] || getColumnInitialWidth(currentWidthClass)

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [columnWidths])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const resizingKey = resizingColumnKeyRef.current
      if (!resizingKey) return

      const diff = e.clientX - resizeStartXRef.current
      const newWidth = Math.max(60, resizeStartWidthRef.current + diff)

      setColumnWidths((prev) => ({
        ...prev,
        [resizingKey]: newWidth,
      }))
    }

    const handlePointerUp = () => {
      if (!resizingColumnKeyRef.current) return

      resizingColumnKeyRef.current = null
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [])

  const ROW_HEIGHT = 36
  const OVERSCAN = 10
  const VIRTUALIZE_THRESHOLD = 80
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(540)

  const totalProductRows = products.length
  const shouldVirtualize = totalProductRows > VIRTUALIZE_THRESHOLD
  const visibleRowCount = Math.max(1, Math.ceil(viewportHeight / ROW_HEIGHT))
  const startRow = shouldVirtualize ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN) : 0
  const endRow = shouldVirtualize
    ? Math.min(totalProductRows, startRow + visibleRowCount + OVERSCAN * 2)
    : totalProductRows
  const visibleProducts = shouldVirtualize ? products.slice(startRow, endRow) : products
  const topSpacerHeight = shouldVirtualize ? startRow * ROW_HEIGHT : 0
  const bottomSpacerHeight = shouldVirtualize ? (totalProductRows - endRow) * ROW_HEIGHT : 0

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    if (!shouldVirtualize) return
    setScrollTop(e.currentTarget.scrollTop)
  }, [shouldVirtualize])

  useEffect(() => {
    const container = tableContainerRef.current
    if (!container) return

    const updateViewport = () => {
      setViewportHeight(container.clientHeight || 540)
    }

    updateViewport()
    window.addEventListener("resize", updateViewport)
    return () => window.removeEventListener("resize", updateViewport)
  }, [])

  useEffect(() => {
    if (!shouldVirtualize) {
      setScrollTop(0)
    }
  }, [shouldVirtualize, products.length])

  return (
    <div
      ref={tableContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-auto border rounded-lg bg-background relative shadow-inner"
    >
      <table className="w-full border-collapse min-w-max">
        <thead className="sticky top-0 z-40 bg-muted dark:bg-slate-900 border-b">
          <tr>
            <th className="w-8 min-w-[32px] max-w-[32px] p-0 border-b border-r text-center sticky top-0 left-0 z-50 bg-muted dark:bg-slate-900 dark:border-r-slate-800">
              <div className="flex w-full h-full items-center justify-center min-h-[36px]">
                <div className="w-4 h-4 flex items-center justify-center overflow-hidden">
                  <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} style={{ width: "16px", height: "16px", minWidth: "16px", minHeight: "16px" }} />
                </div>
              </div>
            </th>
            <th className="w-10 min-w-[40px] max-w-[40px] p-0 border-b border-r text-center text-[11px] font-medium text-muted-foreground sticky top-0 left-[31px] z-50 bg-muted dark:bg-slate-900 dark:border-r-slate-800 shadow-[8px_0_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-[8px_0_12px_-6px_rgba(0,0,0,0.7)]">
              {t("excel.columns.row")}
            </th>
            {columns.map((column) => {
              const currentWidth = getResolvedColumnWidth(column, columnWidths)

              return (
                <th
                  key={column.key}
                  className="px-2 py-2.5 border-b border-r text-left text-xs font-medium text-muted-foreground relative"
                  style={{ width: currentWidth, minWidth: currentWidth, maxWidth: currentWidth }}
                >
                  <div
                    onClick={() => onSort?.(column.key)}
                    className={cn(
                      "flex items-center gap-1.5 w-full h-full",
                      onSort && "cursor-pointer hover:bg-muted-foreground/10 transition-colors select-none group rounded px-1 -ml-1",
                    )}
                  >
                    <span className="truncate">{column.key.startsWith("attr:") ? column.label : t(`excel.${column.label}`)}</span>
                    {onSort && (
                      <span className="shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors ml-auto mr-2">
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>

                  <div
                    onPointerDown={(e) => handleResizeStart(e, column.key, column.width)}
                    className="absolute right-0 top-0 w-[5px] h-full cursor-col-resize hover:bg-primary/50 z-20 transition-colors"
                  />
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {newRows.map((row) => (
            <NewProductRow
              key={row.tempId}
              row={row}
              columns={columns}
              columnWidths={columnWidths}
              getCellError={getCellError}
              updateNewRow={updateNewRow}
              t={t}
            />
          ))}

          {topSpacerHeight > 0 && (
            <tr aria-hidden="true">
              <td colSpan={columns.length + 2} style={{ height: topSpacerHeight, padding: 0, border: 0 }} />
            </tr>
          )}

          {visibleProducts.map((product, idx) => {
            const isSelected = selectedIdSet.has(product.id)
            const isDeleted = deletedIds.has(product.id)
            const actualIndex = shouldVirtualize ? startRow + idx : idx

            return (
              <ProductRow
                key={product.id}
                product={product}
                idx={actualIndex}
                isSelected={isSelected}
                isDeleted={isDeleted}
                columns={columns}
                columnWidths={columnWidths}
                pageOffset={pageOffset}
                getCellValue={getCellValue}
                setCellValue={setCellValue}
                isCellDirty={isCellDirty}
                getCellError={getCellError}
                toggleSelect={toggleSelect}
                t={t}
              />
            )
          })}

          {bottomSpacerHeight > 0 && (
            <tr aria-hidden="true">
              <td colSpan={columns.length + 2} style={{ height: bottomSpacerHeight, padding: 0, border: 0 }} />
            </tr>
          )}

          {products.length === 0 && newRows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 2} className="px-4 py-12 text-center text-muted-foreground">
                {t("products.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

const ProductRow = memo(function ProductRow({
  product,
  idx,
  isSelected,
  isDeleted,
  columns,
  columnWidths,
  pageOffset,
  getCellValue,
  setCellValue,
  isCellDirty,
  getCellError,
  toggleSelect,
  t,
}: ProductRowProps) {
  return (
    <tr
      className={cn(
        "border-b transition-colors group/row",
        "hover:bg-muted/40 focus-within:bg-muted/40",
        isDeleted && "bg-red-50/80 hover:bg-red-100/80 dark:bg-red-950/30 dark:hover:bg-red-950/50",
        isSelected && !isDeleted && "bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/40",
      )}
    >
      <td
        className={cn(
          "w-8 min-w-[32px] max-w-[32px] p-0 border-r text-center align-middle sticky left-0 z-10 transition-colors",
          isDeleted
            ? "bg-red-50 dark:bg-red-950/80"
            : isSelected
              ? "bg-blue-50 dark:bg-blue-950/80"
              : "bg-white dark:bg-slate-950 group-hover/row:bg-slate-50 group-focus-within/row:bg-slate-50 dark:group-hover/row:bg-slate-900 dark:group-focus-within/row:bg-slate-900",
        )}
      >
        <div className="flex items-center justify-center w-full h-full min-h-[32px]">
          <div className="w-4 h-4 flex items-center justify-center overflow-hidden">
            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(product.id)} style={{ width: "16px", height: "16px", minWidth: "16px", minHeight: "16px" }} />
          </div>
        </div>
      </td>

      <td
        className={cn(
          "w-10 min-w-[40px] max-w-[40px] p-0 border-r text-center text-[11px] text-muted-foreground tabular-nums sticky left-[31px] z-10 transition-colors shadow-[8px_0_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-[8px_0_12px_-6px_rgba(0,0,0,0.7)]",
          isDeleted
            ? "bg-red-50 dark:bg-red-950/80"
            : isSelected
              ? "bg-blue-50 dark:bg-blue-950/80"
              : "bg-white dark:bg-slate-950 group-hover/row:bg-slate-50 group-focus-within/row:bg-slate-50 dark:group-hover/row:bg-slate-900 dark:group-focus-within/row:bg-slate-900",
        )}
      >
        {pageOffset + idx + 1}
      </td>

      {columns.map((column) => {
        const errorKey = getCellError(product.id, column.key)
        const currentWidth = getResolvedColumnWidth(column, columnWidths)

        return (
          <td
            key={column.key}
            className="border-r p-0 transition-colors"
            style={{ width: currentWidth, minWidth: currentWidth, maxWidth: currentWidth }}
          >
            <SpreadsheetCell
              productId={product.id}
              column={column}
              value={getCellValue(product.id, column.key)}
              isDirty={isCellDirty(product.id, column.key)}
              isDeleted={isDeleted}
              error={errorKey ? t(`excel.validation.${errorKey}`) : null}
              setCellValue={setCellValue}
              isNewRow={false}
              fieldKey={column.key}
            />
          </td>
        )
      })}
    </tr>
  )
}, areProductRowsEqual)

function areProductRowsEqual(prev: ProductRowProps, next: ProductRowProps): boolean {
  if (prev.product !== next.product) return false
  if (prev.isSelected !== next.isSelected) return false
  if (prev.isDeleted !== next.isDeleted) return false
  if (prev.idx !== next.idx) return false
  if (prev.pageOffset !== next.pageOffset) return false
  if (prev.columns !== next.columns) return false

  for (const column of prev.columns) {
    if (prev.columnWidths[column.key] !== next.columnWidths[column.key]) return false
    if (prev.getCellValue(prev.product.id, column.key) !== next.getCellValue(next.product.id, column.key)) return false
    if (prev.isCellDirty(prev.product.id, column.key) !== next.isCellDirty(next.product.id, column.key)) return false
    if (prev.getCellError(prev.product.id, column.key) !== next.getCellError(next.product.id, column.key)) return false
  }

  return true
}

const NewProductRow = memo(function NewProductRow({
  row,
  columns,
  columnWidths,
  getCellError,
  updateNewRow,
  t,
}: NewProductRowProps) {
  return (
    <tr className="border-b bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 focus-within:bg-emerald-50 dark:hover:bg-emerald-950/40 dark:focus-within:bg-emerald-950/40 transition-colors group/newrow">
      <td className="w-8 min-w-[32px] max-w-[32px] p-0 border-r text-center align-middle sticky left-0 z-10 bg-emerald-50 dark:bg-emerald-950 group-hover/newrow:bg-emerald-100/90 group-focus-within/newrow:bg-emerald-100/90 dark:group-hover/newrow:bg-emerald-900 dark:group-focus-within/newrow:bg-emerald-900 transition-colors">
        <div className="flex items-center justify-center w-full h-full min-h-[32px]">
          <span className="text-[10px] text-emerald-600 font-medium">+</span>
        </div>
      </td>

      <td className="w-10 min-w-[40px] max-w-[40px] p-0 border-r text-center align-middle sticky left-[31px] z-10 bg-emerald-50 dark:bg-emerald-950 group-hover/newrow:bg-emerald-100/90 group-focus-within/newrow:bg-emerald-100/90 dark:group-hover/newrow:bg-emerald-900 dark:group-focus-within/newrow:bg-emerald-900 transition-colors shadow-[8px_0_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-[8px_0_12px_-6px_rgba(0,0,0,0.7)]">
        <span className="text-[9px] font-bold text-emerald-600 tracking-wider">YENI</span>
      </td>

      {columns.map((column) => {
        const fieldKey = column.key
        const value = fieldKey.startsWith("attr:") ? "" : row[fieldKey as keyof NewRow] ?? ""
        const errorKey = getCellError(row.tempId, column.key)
        const currentWidth = getResolvedColumnWidth(column, columnWidths)

        return (
          <td
            key={column.key}
            className="border-r p-0 transition-colors"
            style={{ width: currentWidth, minWidth: currentWidth, maxWidth: currentWidth }}
          >
            <SpreadsheetCell
              productId={row.tempId}
              column={column}
              value={value as string | number | null}
              isDirty={false}
              isDeleted={false}
              error={errorKey ? t(`excel.validation.${errorKey}`) : null}
              isNewRow
              fieldKey={fieldKey}
              updateNewRow={updateNewRow}
            />
          </td>
        )
      })}
    </tr>
  )
}, areNewProductRowsEqual)

function areNewProductRowsEqual(prev: NewProductRowProps, next: NewProductRowProps): boolean {
  if (prev.row !== next.row) return false
  if (prev.columns !== next.columns) return false

  for (const column of prev.columns) {
    if (prev.columnWidths[column.key] !== next.columnWidths[column.key]) return false
    if (prev.getCellError(prev.row.tempId, column.key) !== next.getCellError(next.row.tempId, column.key)) return false
  }

  return true
}
