"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import type { Product, CellField, EditedCells, ValidationErrors, CellError, SpreadsheetColumn, NewRow } from "../types"

// ── Validation ──────────────────────────────────────────
function validateCell(field: CellField, value: string | number | null): string | null {
  const str = value === null ? "" : String(value)

  switch (field) {
    case "name":
      if (!str || str.trim().length < 2) return "nameRequired"
      if (str.length > 200) return "nameMax"
      return null
    case "price": {
      if (str === "" || str === null) return null
      const n = Number(value)
      if (isNaN(n) || n < 0) return "priceInvalid"
      if (n > 1_000_000_000) return "priceMax"
      return null
    }
    case "stock": {
      if (str === "" || str === null) return null
      const n = Number(value)
      if (isNaN(n) || !Number.isInteger(n) || n < 0) return "stockInvalid"
      return null
    }
    case "product_url":
      if (!str || str.trim() === "") return null
      try { new URL(str); return null }
      catch { return "urlInvalid" }
    case "sku":
      if (str.length > 100) return "skuMax"
      return null
    case "description":
      if (str.length > 5000) return "descriptionMax"
      return null
    default:
      return null
  }
}

function createEmptyRow(): NewRow {
  return {
    tempId: crypto.randomUUID(),
    name: "",
    sku: "",
    price: 0,
    stock: 0,
    category: "",
    description: "",
    product_url: "",
    custom_attributes: [],
  }
}

// ── Hook ────────────────────────────────────────────────
export function useSpreadsheet(products: Product[]) {
  const [editedCells, setEditedCells] = useState<EditedCells>(new Map())
  const [newRows, setNewRows] = useState<NewRow[]>([])
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  const productCacheRef = useRef<Map<string, Product>>(new Map())

  useEffect(() => {
    if (!products.length) return
    const next = new Map(productCacheRef.current)
    products.forEach((product) => {
      next.set(product.id, product)
    })
    productCacheRef.current = next
  }, [products])

  const productMap = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]))
  }, [products])

  // ── Columns ──
  const customColumns = useMemo<SpreadsheetColumn[]>(() => {
    const names = new Set<string>()
    productMap.forEach((p) => {
      p.custom_attributes?.forEach(attr => {
        if (attr.name && attr.name.trim()) names.add(attr.name.trim())
      })
    })
    return Array.from(names).sort().map(name => ({
      key: `attr:${name}` as CellField,
      label: name,
      type: "text" as const,
      width: "w-32",
      editable: true,
    }))
  }, [productMap])

  const allColumns = useMemo<SpreadsheetColumn[]>(() => [
    { key: "name", label: "columns.name", type: "text", width: "w-48 min-w-[192px]", editable: true },
    { key: "sku", label: "columns.sku", type: "text", width: "w-28 min-w-[112px]", editable: true },
    { key: "price", label: "columns.price", type: "number", width: "w-24 min-w-[96px]", editable: true },
    { key: "stock", label: "columns.stock", type: "number", width: "w-20 min-w-[80px]", editable: true },
    { key: "category", label: "columns.category", type: "text", width: "w-32 min-w-[128px]", editable: true },
    { key: "description", label: "columns.description", type: "text", width: "w-48 min-w-[192px]", editable: true },
    { key: "product_url", label: "columns.productUrl", type: "text", width: "w-36 min-w-[144px]", editable: true },
    ...customColumns,
  ], [customColumns])

  // ── Cell Operations ──
  const getOriginalValue = useCallback((productId: string, field: CellField): string | number | null => {
    const product = productCacheRef.current.get(productId)
    if (!product) return null

    if (field.startsWith("attr:")) {
      const attrName = field.slice(5)
      const attr = product.custom_attributes?.find(a => a.name === attrName)
      return attr ? (attr.unit ? `${attr.value} ${attr.unit}` : attr.value) : ""
    }

    const val = product[field as keyof Product]
    if (val === undefined || val === null) return null
    return val as string | number
  }, [])

  const getCellValue = useCallback((productId: string, field: CellField): string | number | null => {
    const edited = editedCells.get(productId)?.get(field)
    if (edited !== undefined) return edited
    return getOriginalValue(productId, field)
  }, [editedCells, getOriginalValue])

  const setCellValue = useCallback((productId: string, field: CellField, value: string | number | null) => {
    setEditedCells(prev => {
      const next = new Map(prev)
      const productEdits = new Map(next.get(productId) || [])
      const original = getOriginalValue(productId, field)
      const normalizedValue = value === "" ? null : value

      // Same as original → remove edit
      if (normalizedValue === original || String(normalizedValue) === String(original)) {
        productEdits.delete(field)
        if (productEdits.size === 0) next.delete(productId)
        else next.set(productId, productEdits)
      } else {
        productEdits.set(field, value)
        next.set(productId, productEdits)
      }
      return next
    })
  }, [getOriginalValue])

  const isCellDirty = useCallback((productId: string, field: CellField): boolean => {
    return editedCells.get(productId)?.has(field) ?? false
  }, [editedCells])

  // ── Validation ──
  const validationErrors = useMemo<ValidationErrors>(() => {
    const errors: ValidationErrors = new Map()

    editedCells.forEach((fields, productId) => {
      const cellErrors: CellError[] = []
      fields.forEach((value, field) => {
        const error = validateCell(field as CellField, value)
        if (error) cellErrors.push({ field: field as CellField, message: error })
      })
      if (cellErrors.length > 0) errors.set(productId, cellErrors)
    })

    newRows.forEach(row => {
      const cellErrors: CellError[] = []
      const nameErr = validateCell("name", row.name)
      // Yeni eklenen satırda isim tamamen boşsa (kullanıcı henüz yazmadıysa) hatayı görsel olarak gösterme
      if (nameErr && row.name !== "") cellErrors.push({ field: "name", message: nameErr })
      
      const priceErr = validateCell("price", row.price)
      if (priceErr) cellErrors.push({ field: "price", message: priceErr })
      
      const stockErr = validateCell("stock", row.stock)
      if (stockErr) cellErrors.push({ field: "stock", message: stockErr })
      
      if (cellErrors.length > 0) errors.set(row.tempId, cellErrors)
    })

    return errors
  }, [editedCells, newRows])

  const getCellError = useCallback((productId: string, field: CellField): string | null => {
    const errors = validationErrors.get(productId)
    if (!errors) return null
    const err = errors.find(e => e.field === field)
    return err?.message ?? null
  }, [validationErrors])

  // ── Computed ──
  const isDirty = editedCells.size > 0 || newRows.length > 0 || deletedIds.size > 0
  const dirtyProductCount = editedCells.size
  const hasErrors = validationErrors.size > 0
  const errorCount = Array.from(validationErrors.values()).reduce((sum, errs) => sum + errs.length, 0)
  
  // Eğer henüz tam doldurulmamış yeni bir alan varsa kaydetmeyi kapalı tut
  const hasIncompleteNewRows = newRows.some(r => !r.name || r.name.trim().length < 2)
  const canSave = isDirty && !hasErrors && !hasIncompleteNewRows

  // ── CRUD Operations ──
  const addEmptyRow = useCallback(() => {
    setNewRows(prev => [...prev, createEmptyRow()])
  }, [])

  const updateNewRow = useCallback((tempId: string, field: string, value: string | number) => {
    setNewRows(prev => prev.map(row =>
      row.tempId === tempId ? { ...row, [field]: value } : row
    ))
  }, [])

  const removeNewRow = useCallback((tempId: string) => {
    setNewRows(prev => prev.filter(row => row.tempId !== tempId))
  }, [])

  const markForDeletion = useCallback((ids: string[]) => {
    setDeletedIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.add(id))
      return next
    })
  }, [])

  const unmarkDeletion = useCallback((id: string) => {
    setDeletedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  // ── AI-Ready: Bulk Changes ──
  const applyBulkChanges = useCallback((changes: Array<{
    productId: string
    field: CellField
    value: string | number | null
  }>) => {
    setEditedCells(prev => {
      const next = new Map(prev)
      for (const { productId, field, value } of changes) {
        const productEdits = new Map(next.get(productId) || [])
        productEdits.set(field, value)
        next.set(productId, productEdits)
      }
      return next
    })
  }, [])

  // ── Discard ──
  const discardAll = useCallback(() => {
    setEditedCells(new Map())
    setNewRows([])
    setDeletedIds(new Set())
  }, [])

  return {
    // State
    editedCells, newRows, deletedIds,
    // Computed
    isDirty, dirtyProductCount, hasErrors, errorCount, canSave,
    // Columns
    customColumns, allColumns,
    productMap,
    getCachedProduct: (productId: string) => productCacheRef.current.get(productId),
    // Cell ops
    getCellValue, setCellValue, isCellDirty, getCellError,
    // CRUD
    addEmptyRow, updateNewRow, removeNewRow, markForDeletion, unmarkDeletion,
    // AI-ready
    applyBulkChanges,
    // Reset
    discardAll,
  }
}
