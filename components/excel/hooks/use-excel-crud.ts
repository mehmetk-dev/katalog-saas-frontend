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
  clearEditedCells: () => void
  removeNewRows: (tempIds: string[]) => void
  clearDeletions: () => void
  refreshData: () => Promise<void>
  applyLocalCommit?: (payload: { updates: BulkFieldUpdate[]; deletedIds: string[] }) => void
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
  editedCells, newRows, deletedIds, canSave, discardAll, clearEditedCells, removeNewRows, clearDeletions, refreshData, applyLocalCommit, t, getCachedProduct
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

    let totalUpdated = 0
    let totalAdded = 0
    let totalDeleted = 0
    const updates = buildUpdates()
    const idsToDelete = Array.from(deletedIds)

    try {
      // 1. Update existing products
      if (updates.length > 0) {
        const result = await bulkUpdateFields(updates)
        totalUpdated += result.updatedCount
        applyLocalCommit?.({ updates, deletedIds: [] })
        clearEditedCells()
      }

      // 2. Create new rows (batch import for lower request overhead)
      const rowsToCreate = newRows.filter((row) => row.name && row.name.trim().length >= 2)
      for (let i = 0; i < rowsToCreate.length; i += NEW_ROWS_BULK_CHUNK_SIZE) {
        const chunkRows = rowsToCreate.slice(i, i + NEW_ROWS_BULK_CHUNK_SIZE)
        const chunk = chunkRows.map((row, index) => ({
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
          order: i + index,
        }))
        await bulkImportProducts(chunk)
        totalAdded += chunk.length
        removeNewRows(chunkRows.map((row) => row.tempId))
      }

      // 3. Delete marked products
      if (idsToDelete.length > 0) {
        await deleteProducts(idsToDelete)
        totalDeleted += idsToDelete.length
        applyLocalCommit?.({ updates: [], deletedIds: idsToDelete })
        clearDeletions()
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
    } catch (error: unknown) {
      const apiError = error as { status?: number; details?: { error?: string; message?: string; attemptedCount?: number; rolledBackCount?: number } }
      if (apiError.status === 207) {
        const attempted = apiError.details?.attemptedCount ?? 0
        const rolledBack = apiError.details?.rolledBackCount ?? 0
        toast.error(
          t("excel.partialFailure", { attempted, rolledBack }) ||
          `${rolledBack}/${attempted} ürün geri alındı. İçe aktarım başarısız.`
        )
      } else if (totalUpdated + totalAdded + totalDeleted > 0) {
        // Bir kısmı kaydedildi; kaydedilenler bekleyen listeden düştü, tekrar kaydet yalnızca kalanları gönderir
        toast.error(t("excel.partiallySaved", { updated: totalUpdated, added: totalAdded }))
      } else {
        toast.error(t("common.error"))
      }
      if (totalUpdated + totalAdded + totalDeleted > 0) await refreshData().catch(() => undefined)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [canSave, buildUpdates, newRows, deletedIds, applyLocalCommit, clearEditedCells, removeNewRows, clearDeletions, discardAll, t, refreshData])

  return { isSaving, saveAll }
}
