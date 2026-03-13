"use client"

import { useRef, useCallback, memo, useState, useEffect } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { SpreadsheetCell } from "./spreadsheet-cell"
import type { Product, NewRow, CellField, SpreadsheetColumn } from "../types"

interface SpreadsheetTableProps {
  products: Product[]
  newRows: NewRow[]
  deletedIds: Set<string>
  selectedIds: string[]
  columns: SpreadsheetColumn[]
  pageOffset: number
  onSelectedIdsChange: React.Dispatch<React.SetStateAction<string[]>>
  getCellValue: (productId: string, field: CellField) => string | number | null
  setCellValue: (productId: string, field: CellField, value: string | number | null) => void
  isCellDirty: (productId: string, field: CellField) => boolean
  getCellError: (productId: string, field: CellField) => string | null
  updateNewRow: (tempId: string, field: string, value: string | number) => void
  sortConfig?: { key: CellField; direction: "asc" | "desc" } | null
  onSort?: (key: CellField) => void
}

export function SpreadsheetTable({
  products, newRows, deletedIds, selectedIds, columns, pageOffset,
  onSelectedIdsChange, getCellValue, setCellValue, isCellDirty, getCellError, updateNewRow,
  sortConfig, onSort
}: SpreadsheetTableProps) {
  const { t: baseT } = useTranslation()
  const t = useCallback((key: string) => baseT(key) as string, [baseT])
  const tableRef = useRef<HTMLDivElement>(null)

  const allProductIds = products.map(p => p.id)
  const allSelected = allProductIds.length > 0 && allProductIds.every(id => selectedIds.includes(id))

  const toggleSelectAll = useCallback(() => {
    onSelectedIdsChange(prev => {
      const isAllSelected = allProductIds.length > 0 && allProductIds.every(id => prev.includes(id))
      if (isAllSelected) {
        return prev.filter(id => !allProductIds.includes(id)) // Sadece mevcut sayfanın seçimlerini kaldır
      }
      return Array.from(new Set([...prev, ...allProductIds])) // Set kullanarak kopyaları önle
    })
  }, [allProductIds, onSelectedIdsChange])

  const toggleSelect = useCallback((id: string) => {
    onSelectedIdsChange(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    )
  }, [onSelectedIdsChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const inputs = tableRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")
      if (!inputs) return
      const arr = Array.from(inputs)
      const idx = arr.indexOf(e.target as HTMLInputElement)
      const next = e.shiftKey ? idx - 1 : idx + 1
      if (next >= 0 && next < arr.length) arr[next]?.focus()
    }
  }, [])

  // ── Column Resizing Logic ──
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const resizingCol = useRef<string | null>(null)
  const startX = useRef<number>(0)
  const startWidth = useRef<number>(0)

  // Map old tailwind width classes to pixel defaults for initial render
  const getDefaultWidth = (className: string) => {
    if (className.includes("w-48")) return 192
    if (className.includes("w-32")) return 128
    if (className.includes("w-24")) return 96
    if (className.includes("w-[300px]")) return 300
    if (className.includes("w-40")) return 160
    return 150
  }

  const handleResizeStart = (e: React.PointerEvent, colKey: string, currentWidthClass: string) => {
    e.stopPropagation()
    e.preventDefault()
    resizingCol.current = colKey
    startX.current = e.clientX
    startWidth.current = columnWidths[colKey] || getDefaultWidth(currentWidthClass)
    
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!resizingCol.current) return
      const diff = e.clientX - startX.current
      const newWidth = Math.max(60, startWidth.current + diff) // Min 60px limit
      
      setColumnWidths(prev => ({
        ...prev,
        [resizingCol.current as string]: newWidth
      }))
    }

    const handlePointerUp = () => {
      if (resizingCol.current) {
        resizingCol.current = null
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [])

  return (
    <div ref={tableRef} className="flex-1 overflow-auto border rounded-lg bg-background relative shadow-inner" onKeyDown={handleKeyDown}>
      <table className="w-full border-collapse min-w-max">
        {/* Header */}
        <thead className="sticky top-0 z-40 bg-muted dark:bg-slate-900 border-b">
          <tr>
            {/* Checkbox & Row number sticky left */}
            <th className="w-8 min-w-[32px] max-w-[32px] p-0 border-b border-r text-center sticky top-0 left-0 z-50 bg-muted dark:bg-slate-900 dark:border-r-slate-800">
              <div className="flex w-full h-full items-center justify-center min-h-[36px]">
                <div className="w-4 h-4 flex items-center justify-center overflow-hidden">
                  <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px' }} />
                </div>
              </div>
            </th>
            <th className="w-10 min-w-[40px] max-w-[40px] p-0 border-b border-r text-center text-[11px] font-medium text-muted-foreground sticky top-0 left-[31px] z-50 bg-muted dark:bg-slate-900 dark:border-r-slate-800 shadow-[8px_0_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-[8px_0_12px_-6px_rgba(0,0,0,0.7)]">
              {t("excel.columns.row")}
            </th>
            {columns.map((col, idx) => {
              const currentWidth = columnWidths[col.key] || getDefaultWidth(col.width)
              
              return (
                <th
                  key={col.key}
                  className={cn(
                    "px-2 py-2.5 border-b border-r text-left text-xs font-medium text-muted-foreground relative",
                  )}
                  style={{ width: currentWidth, minWidth: currentWidth, maxWidth: currentWidth }}
                >
                  <div 
                    onClick={() => onSort?.(col.key)}
                    className={cn(
                      "flex items-center gap-1.5 w-full h-full",
                      onSort && "cursor-pointer hover:bg-muted-foreground/10 transition-colors select-none group rounded px-1 -ml-1"
                    )}
                  >
                    <span className="truncate">
                      {col.key.startsWith("attr:") ? col.label : t(`excel.${col.label}`)}
                    </span>
                    {onSort && (
                      <span className="shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors ml-auto mr-2">
                        {sortConfig?.key === col.key ? (
                          sortConfig.direction === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                  
                  {/* Invisible Drag Handle */}
                  <div 
                    onPointerDown={(e) => handleResizeStart(e, col.key, col.width)}
                    className="absolute right-0 top-0 w-[5px] h-full cursor-col-resize hover:bg-primary/50 z-20 transition-colors"
                  />
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {/* New rows - Added at TOP so user can immediately see them */}
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

          {/* Existing products */}
          {products.map((product, idx) => {
            const isSelected = selectedIds.includes(product.id)
            const isDeleted = deletedIds.has(product.id)

            return (
              <ProductRow
                key={product.id}
                product={product}
                idx={idx}
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

          {/* Empty state */}
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

// ── Memoized Child Components for Extreme Render Performance ──

const areProductRowsEqual = (prev: any, next: any) => {
  if (prev.product !== next.product) return false
  if (prev.isSelected !== next.isSelected) return false
  if (prev.isDeleted !== next.isDeleted) return false
  if (prev.idx !== next.idx) return false
  if (prev.pageOffset !== next.pageOffset) return false
  
  // Custom deep check for cell evaluations (O(12) per row isn't slow, rendering is slow)
  for (const col of prev.columns) {
    if (prev.columnWidths[col.key] !== next.columnWidths[col.key]) return false
    if (prev.getCellValue(prev.product.id, col.key) !== next.getCellValue(next.product.id, col.key)) return false
    if (prev.isCellDirty(prev.product.id, col.key) !== next.isCellDirty(next.product.id, col.key)) return false
    if (prev.getCellError(prev.product.id, col.key) !== next.getCellError(next.product.id, col.key)) return false
  }
  return true
}

const ProductRow = memo(function ProductRow({
  product, idx, isSelected, isDeleted, columns, columnWidths, pageOffset,
  getCellValue, setCellValue, isCellDirty, getCellError, toggleSelect, t
}: any) {
  return (
    <tr
      className={cn(
        "border-b transition-colors group/row",
        "hover:bg-muted/40 focus-within:bg-muted/40", 
        isDeleted && "bg-red-50/80 hover:bg-red-100/80 dark:bg-red-950/30 dark:hover:bg-red-950/50",
        isSelected && !isDeleted && "bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/40",
      )}
    >
      <td className={cn(
        "w-8 min-w-[32px] max-w-[32px] p-0 border-r text-center align-middle sticky left-0 z-10 transition-colors",
        isDeleted ? "bg-red-50 dark:bg-red-950/80" : (isSelected ? "bg-blue-50 dark:bg-blue-950/80" : "bg-white dark:bg-slate-950 group-hover/row:bg-slate-50 group-focus-within/row:bg-slate-50 dark:group-hover/row:bg-slate-900 dark:group-focus-within/row:bg-slate-900")
      )}>
        <div className="flex items-center justify-center w-full h-full min-h-[32px]">
          <div className="w-4 h-4 flex items-center justify-center overflow-hidden">
            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(product.id)} style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px' }} />
          </div>
        </div>
      </td>
      <td className={cn(
        "w-10 min-w-[40px] max-w-[40px] p-0 border-r text-center text-[11px] text-muted-foreground tabular-nums sticky left-[31px] z-10 transition-colors shadow-[8px_0_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-[8px_0_12px_-6px_rgba(0,0,0,0.7)]",
        isDeleted ? "bg-red-50 dark:bg-red-950/80" : (isSelected ? "bg-blue-50 dark:bg-blue-950/80" : "bg-white dark:bg-slate-950 group-hover/row:bg-slate-50 group-focus-within/row:bg-slate-50 dark:group-hover/row:bg-slate-900 dark:group-focus-within/row:bg-slate-900")
      )}>
        {pageOffset + idx + 1}
      </td>
      {columns.map((col: any) => {
        const errKey = getCellError(product.id, col.key)
        
        let initialW = 150
        if (col.width.includes("w-48")) initialW = 192
        if (col.width.includes("w-32")) initialW = 128
        if (col.width.includes("w-24")) initialW = 96
        if (col.width.includes("w-[300px]")) initialW = 300
        if (col.width.includes("w-40")) initialW = 160
        const currentWidth = columnWidths[col.key] || initialW

        return (
          <td 
            key={col.key} 
            className="border-r p-0 transition-colors"
            style={{ width: currentWidth, minWidth: currentWidth, maxWidth: currentWidth }}
          >
            <SpreadsheetCell
              productId={product.id}
              column={col}
              value={getCellValue(product.id, col.key)}
              isDirty={isCellDirty(product.id, col.key)}
              isDeleted={isDeleted}
              error={errKey ? t(`excel.validation.${errKey}`) : null}
              setCellValue={setCellValue}
              isNewRow={false}
              fieldKey={col.key}
            />
          </td>
        )
      })}
    </tr>
  )
}, areProductRowsEqual)

const areNewProductRowsEqual = (prev: any, next: any) => {
  if (prev.row !== next.row) return false
  for (const col of prev.columns) {
    if (prev.columnWidths[col.key] !== next.columnWidths[col.key]) return false
    if (prev.getCellError(prev.row.tempId, col.key) !== next.getCellError(next.row.tempId, col.key)) return false
  }
  return true
}

const NewProductRow = memo(function NewProductRow({
  row, columns, columnWidths, getCellError, updateNewRow, t
}: any) {
  return (
    <tr className="border-b bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 focus-within:bg-emerald-50 dark:hover:bg-emerald-950/40 dark:focus-within:bg-emerald-950/40 transition-colors group/newrow">
      <td className="w-8 min-w-[32px] max-w-[32px] p-0 border-r text-center align-middle sticky left-0 z-10 bg-emerald-50 dark:bg-emerald-950 group-hover/newrow:bg-emerald-100/90 group-focus-within/newrow:bg-emerald-100/90 dark:group-hover/newrow:bg-emerald-900 dark:group-focus-within/newrow:bg-emerald-900 transition-colors">
        <div className="flex items-center justify-center w-full h-full min-h-[32px]">
          <span className="text-[10px] text-emerald-600 font-medium">+</span>
        </div>
      </td>
      <td className="w-10 min-w-[40px] max-w-[40px] p-0 border-r text-center align-middle sticky left-[31px] z-10 bg-emerald-50 dark:bg-emerald-950 group-hover/newrow:bg-emerald-100/90 group-focus-within/newrow:bg-emerald-100/90 dark:group-hover/newrow:bg-emerald-900 dark:group-focus-within/newrow:bg-emerald-900 transition-colors shadow-[8px_0_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-[8px_0_12px_-6px_rgba(0,0,0,0.7)]">
        <span className="text-[9px] font-bold text-emerald-600 tracking-wider">YENİ</span>
      </td>
      {columns.map((col: any) => {
        const fieldKey = col.key.startsWith("attr:") ? col.key : col.key
        const rawValue = col.key.startsWith("attr:") ? "" : row[fieldKey as keyof NewRow]
        const value = rawValue === undefined ? "" : rawValue
        const errKey = getCellError(row.tempId, col.key)

        let initialW = 150
        if (col.width.includes("w-48")) initialW = 192
        if (col.width.includes("w-32")) initialW = 128
        if (col.width.includes("w-24")) initialW = 96
        if (col.width.includes("w-[300px]")) initialW = 300
        if (col.width.includes("w-40")) initialW = 160
        const currentWidth = columnWidths[col.key] || initialW

        return (
          <td 
            key={col.key} 
            className="border-r p-0 transition-colors"
            style={{ width: currentWidth, minWidth: currentWidth, maxWidth: currentWidth }}
          >
            <SpreadsheetCell
              productId={row.tempId}
              column={col}
              value={value as string | number | null}
              isDirty={false}
              isDeleted={false}
              error={errKey ? t(`excel.validation.${errKey}`) : null}
              isNewRow={true}
              fieldKey={fieldKey}
              updateNewRow={updateNewRow}
            />
          </td>
        )
      })}
    </tr>
  )
}, areNewProductRowsEqual)
