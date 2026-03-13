"use client"

import { memo, useState, useEffect, useRef, useCallback } from "react"

import { cn } from "@/lib/utils"
import type { CellField, SpreadsheetColumn } from "../types"

interface SpreadsheetCellProps {
  productId: string
  column: SpreadsheetColumn
  value: string | number | null
  isDirty: boolean
  isDeleted: boolean
  error: string | null
  tabIndex?: number
  isNewRow?: boolean
  fieldKey?: string
  setCellValue?: (productId: string, field: CellField, value: string | number | null) => void
  updateNewRow?: (tempId: string, field: string, value: string | number) => void
}

export const SpreadsheetCell = memo(function SpreadsheetCell({
  productId, column, value, isDirty, isDeleted, error, tabIndex,
  isNewRow, fieldKey, setCellValue, updateNewRow
}: SpreadsheetCellProps) {
  const displayValue = value === null || value === undefined ? "" : String(value)

  // ─ Local State for 60fps Typing (Zero-Lag) ─
  const [localValue, setLocalValue] = useState(displayValue)
  const isEditing = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync with prop when NOT actively typing (e.g., discard, bulk update, save)
  useEffect(() => {
    if (!isEditing.current) {
      setLocalValue(displayValue)
    }
  }, [displayValue])

  const commitChange = useCallback((raw: string) => {
    let parsedValue: string | number | null = raw || null
    if (column.type === "number") {
      if (raw === "" || raw === "-") {
        parsedValue = raw as unknown as number
      } else {
        const n = Number(raw)
        if (!isNaN(n)) parsedValue = n
      }
    }

    if (isNewRow && updateNewRow && fieldKey) {
      updateNewRow(productId, fieldKey, parsedValue as string | number)
    } else if (setCellValue) {
      setCellValue(productId, column.key, parsedValue)
    }
  }, [column.type, column.key, isNewRow, updateNewRow, fieldKey, productId, setCellValue])

  const handleChange = (raw: string) => {
    setLocalValue(raw) // Instant visual update

    // Debounce the heavy lifting (parent state + validation limits) so typing never lags
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      commitChange(raw)
    }, 250)
  }

  const handleFocus = () => {
    isEditing.current = true
  }

  const handleBlur = () => {
    isEditing.current = false
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    // Always ensure the final typed value is committed
    if (localValue !== displayValue) {
      commitChange(localValue)
    }
  }

  const baseClasses = cn(
    "w-full border-0 bg-transparent px-2 py-2 md:py-1.5 text-[15px] md:text-sm outline-none",
    "focus:ring-2 focus:ring-inset focus:ring-primary/40",
    "transition-colors duration-150 text-ellipsis overflow-hidden whitespace-nowrap",
    isDirty && !error && "bg-amber-50 dark:bg-amber-900/20",
    error && "bg-red-50 dark:bg-red-950/30",
    isDeleted && "opacity-40 line-through pointer-events-none",
  )

  return (
    <div className="relative group">
      {column.type === "textarea" ? (
        <textarea
          value={localValue}
          onChange={e => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={isDeleted}
          tabIndex={tabIndex}
          rows={1}
          className={cn(baseClasses, "resize-none min-h-[32px] leading-tight")}
        />
      ) : (
        <input
          type={column.type === "number" ? "number" : "text"}
          value={localValue}
          onChange={e => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={isDeleted}
          tabIndex={tabIndex}
          step={column.type === "number" ? "any" : undefined}
          className={baseClasses}
        />
      )}

      {error && (
        <div className={cn(
          "absolute left-0 top-full z-20 px-2 py-1 text-[11px] text-red-600 dark:text-red-400",
          "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded shadow-sm",
          "whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
        )}>
          {error}
        </div>
      )}
    </div>
  )
})
