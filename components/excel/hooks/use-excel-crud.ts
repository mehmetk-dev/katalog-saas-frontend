"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

import { bulkImportProducts, bulkUpdateFields, deleteProducts } from "@/lib/actions/products"
import type { Product, BulkFieldUpdate, CustomAttribute } from "@/lib/actions/products"
import type { EditedCells, NewRow, CellField } from "../types"

interface UseExcelCrudParams {
  editedCells: EditedCells
  newRows: NewRow[]
  deletedIds: Set<string>
  canSave: boolean
  discardAll: () => void
  refreshData: () => Promise<void>
  t: (key: string, params?: Record<string, unknown>) => string
  getCachedProduct: (productId: string) => Product | undefined
}

type PrimitiveField = Exclude<CellField, `attr:${string}`>
const NEW_ROWS_BULK_CHUNK_SIZE = 200

const primitiveFieldUpdaters: Record<PrimitiveField, (update: BulkFieldUpdate, value: string | number | null) => void> = {
  name: (update, value) => {
    update.name = value as string
  },
  sku: (update, value) => {
    update.sku = value as string | null
  },
  price: (update, value) => {
    update.price = Number(value) || 0
  },
  stock: (update, value) => {
    update.stock = Number(value) || 0
  },
  category: (update, value) => {
    update.category = value as string | null
  },
  description: (update, value) => {
    update.description = value as string | null
  },
  product_url: (update, value) => {
    update.product_url = value as string | null
  },
}

function isCustomAttributeField(field: string): field is `attr:${string}` {
  return field.startsWith("attr:")
}

export function useExcelCrud({
  editedCells, newRows, deletedIds, canSave, discardAll, refreshData, t, getCachedProduct
}: UseExcelCrudParams) {
  const [isSaving, setIsSaving] = useState(false)

  const buildUpdates = useCallback((): BulkFieldUpdate[] => {
    const updates: BulkFieldUpdate[] = []

    editedCells.forEach((fields, productId) => {
      const product = getCachedProduct(productId)
      if (!product) return

      const update: BulkFieldUpdate = { id: productId }
      let hasCustomAttrChange = false
      const customAttrs = [...((product.custom_attributes as CustomAttribute[]) || [])]

      fields.forEach((value, field) => {
        if (isCustomAttributeField(field)) {
          const attrName = field.slice(5)
          hasCustomAttrChange = true
          const idx = customAttrs.findIndex(a => a.name === attrName)
          if (idx >= 0) {
            customAttrs[idx] = { ...customAttrs[idx], value: String(value ?? "") }
          } else {
            customAttrs.push({ name: attrName, value: String(value ?? "") })
          }
          return
        }

        const applyFieldUpdate = primitiveFieldUpdaters[field as PrimitiveField]
        if (applyFieldUpdate) {
          applyFieldUpdate(update, value)
        }
      })

      if (hasCustomAttrChange) update.custom_attributes = customAttrs
      updates.push(update)
    })

    return updates
  }, [editedCells, getCachedProduct])

  const saveAll = useCallback(async (): Promise<boolean> => {
    if (!canSave) return false
    setIsSaving(true)

    try {
      let totalUpdated = 0
      let totalAdded = 0
      let totalDeleted = 0

      // 1. Update existing products
      const updates = buildUpdates()
      if (updates.length > 0) {
        const result = await bulkUpdateFields(updates)
        totalUpdated += result.updatedCount
      }

      // 2. Create new rows (batch import for lower request overhead)
      const normalizedNewRows = newRows
        .filter((row) => row.name && row.name.trim().length >= 2)
        .map((row, index) => ({
          name: row.name.trim(),
          sku: row.sku || null,
          description: row.description || null,
          price: Number(row.price) || 0,
          stock: Number(row.stock) || 0,
          category: row.category || null,
          image_url: null,
          images: [] as string[],
          product_url: row.product_url || null,
          custom_attributes: (row.custom_attributes || []) as CustomAttribute[],
          order: index,
        }))

      for (let i = 0; i < normalizedNewRows.length; i += NEW_ROWS_BULK_CHUNK_SIZE) {
        const chunk = normalizedNewRows.slice(i, i + NEW_ROWS_BULK_CHUNK_SIZE)
        if (chunk.length === 0) continue
        await bulkImportProducts(chunk)
        totalAdded += chunk.length
      }

      // 3. Delete marked products
      const idsToDelete = Array.from(deletedIds)
      if (idsToDelete.length > 0) {
        await deleteProducts(idsToDelete)
        totalDeleted += idsToDelete.length
      }

      discardAll()
      await refreshData()

      const msgs: string[] = []
      if (totalAdded > 0) msgs.push(t("excel.added", { count: totalAdded }))
      if (totalUpdated > 0) msgs.push(t("excel.updated", { count: totalUpdated }))
      if (totalDeleted > 0) msgs.push(t("excel.deletedSuccess", { count: totalDeleted }))

      if (msgs.length > 0) {
        toast.success(msgs.join(", "))
      } else {
        toast.success(t("excel.saved"))
      }

      return true
    } catch {
      toast.error(t("common.error"))
      return false
    } finally {
      setIsSaving(false)
    }
  }, [canSave, buildUpdates, newRows, deletedIds, discardAll, t, refreshData])

  return { isSaving, saveAll }
}
