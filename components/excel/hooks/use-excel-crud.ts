"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { bulkUpdateFields, createProduct, deleteProducts } from "@/lib/actions/products"
import type { Product, BulkFieldUpdate, CustomAttribute } from "@/lib/actions/products"
import type { EditedCells, NewRow, CellField } from "../types"

interface UseExcelCrudParams {
  products: Product[]
  editedCells: EditedCells
  newRows: NewRow[]
  deletedIds: Set<string>
  canSave: boolean
  discardAll: () => void
  refreshData: () => Promise<void>
  t: (key: string, params?: Record<string, unknown>) => string
}

export function useExcelCrud({
  products, editedCells, newRows, deletedIds, canSave, discardAll, refreshData, t
}: UseExcelCrudParams) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const buildUpdates = useCallback((): BulkFieldUpdate[] => {
    const updates: BulkFieldUpdate[] = []

    editedCells.forEach((fields, productId) => {
      const product = products.find(p => p.id === productId)
      if (!product) return

      const update: BulkFieldUpdate = { id: productId }
      let hasCustomAttrChange = false
      const customAttrs = [...((product.custom_attributes as CustomAttribute[]) || [])]

      fields.forEach((value, field) => {
        if ((field as CellField).startsWith("attr:")) {
          const attrName = field.slice(5)
          hasCustomAttrChange = true
          const idx = customAttrs.findIndex(a => a.name === attrName)
          if (idx >= 0) {
            customAttrs[idx] = { ...customAttrs[idx], value: String(value ?? "") }
          } else {
            customAttrs.push({ name: attrName, value: String(value ?? "") })
          }
        } else if (field === "price") {
          update.price = Number(value) || 0
        } else if (field === "stock") {
          update.stock = Number(value) || 0
        } else if (field === "name") {
          update.name = value as string
        } else if (field === "sku") {
          update.sku = value as string | null
        } else if (field === "description") {
          update.description = value as string | null
        } else if (field === "category") {
          update.category = value as string | null
        } else if (field === "product_url") {
          update.product_url = value as string | null
        }
      })

      if (hasCustomAttrChange) update.custom_attributes = customAttrs
      updates.push(update)
    })

    return updates
  }, [editedCells, products])

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

      // 2. Create new rows
      for (const row of newRows) {
        if (!row.name || row.name.trim().length < 2) continue
        const formData = new FormData()
        formData.append("name", row.name)
        formData.append("sku", row.sku || "")
        formData.append("price", String(row.price || 0))
        formData.append("stock", String(row.stock || 0))
        formData.append("category", row.category || "")
        formData.append("description", row.description || "")
        formData.append("product_url", row.product_url || "")
        formData.append("custom_attributes", JSON.stringify(row.custom_attributes || []))
        await createProduct(formData)
        totalAdded++
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
  }, [canSave, buildUpdates, newRows, deletedIds, discardAll, router, t])

  return { isSaving, saveAll }
}
