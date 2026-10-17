"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

import { bulkUpdateFields, getProductsByIds, type BulkFieldUpdate, type Product } from "@/lib/actions/products"
import { getCatalog, updateCatalog } from "@/lib/actions/catalogs"
import { downloadProductsCsv } from "@/components/products/export/download-products-csv"
import type { ProductInlinePatch } from "@/components/products/table/types"

/** Backend bulk-update-fields isteği başına en fazla 500 güncelleme kabul eder */
const BULK_UPDATE_CHUNK = 500
/** by-ids isteği başına en fazla 2000 id */
const BY_IDS_CHUNK = 2000

export type BulkCategoryMode = "add" | "replace" | "remove"
export type BulkStockMode = "set" | "increase" | "decrease"

function chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
    return chunks
}

function splitCategories(category: string | null | undefined): string[] {
    return (category || "").split(",").map((c) => c.trim()).filter(Boolean)
}

/** Ürünün kategori metnini toplu işlem moduna göre yeniden üretir (kategoriler virgülle ayrılır) */
export function applyCategoryChange(current: string | null | undefined, category: string, mode: BulkCategoryMode): string | null {
    const target = category.trim()
    const existing = splitCategories(current)
    let next: string[]
    if (mode === "replace") next = target ? [target] : []
    else if (mode === "add") next = existing.some((c) => c.toLocaleLowerCase("tr-TR") === target.toLocaleLowerCase("tr-TR")) ? existing : [...existing, target]
    else next = existing.filter((c) => c.toLocaleLowerCase("tr-TR") !== target.toLocaleLowerCase("tr-TR"))
    return next.length > 0 ? next.join(", ") : null
}

export function applyStockChange(current: number, amount: number, mode: BulkStockMode): number {
    if (mode === "set") return amount
    if (mode === "increase") return current + amount
    return Math.max(0, current - amount)
}

interface UseProductsExtraActionsParams {
    t: (key: string, params?: Record<string, unknown>) => string
    products: Product[]
    selectedIds: string[]
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
    routerRefresh: () => void
}

/**
 * Satır içi düzenleme ve genişletilmiş toplu işlemler (kategori, stok, kataloğa ekleme, seçilenleri dışa aktarma).
 * Seçim sayfalar arası olabildiği için seçili ürünlerin güncel hali gerekirse sunucudan alınır.
 */
export function useProductsExtraActions({ t, products, selectedIds, setProducts, setSelectedIds, routerRefresh }: UseProductsExtraActionsParams) {
    const [isBulkWorking, setIsBulkWorking] = useState(false)

    const loadSelectedProducts = useCallback(async (): Promise<Product[]> => {
        const onPage = new Map(products.map((p) => [p.id, p]))
        if (selectedIds.every((id) => onPage.has(id))) {
            return selectedIds.map((id) => onPage.get(id)!)
        }
        const loaded: Product[] = []
        for (const ids of chunk(selectedIds, BY_IDS_CHUNK)) {
            loaded.push(...(await getProductsByIds(ids)))
        }
        return loaded
    }, [products, selectedIds])

    /** Güncellemeleri parçalar halinde gönderir ve sayfadaki ürünlere yansıtır */
    const applyUpdates = useCallback(async (updates: BulkFieldUpdate[]) => {
        let failed = 0
        for (const part of chunk(updates, BULK_UPDATE_CHUNK)) {
            const result = await bulkUpdateFields(part)
            failed += result.failedCount || 0
        }
        const byId = new Map(updates.map((u) => [u.id, u]))
        setProducts((prev) => prev.map((p) => {
            const update = byId.get(p.id)
            return update ? { ...p, ...update } as Product : p
        }))
        routerRefresh()
        return { updated: updates.length - failed, failed }
    }, [setProducts, routerRefresh])

    const handleInlineUpdate = useCallback(async (product: Product, patch: ProductInlinePatch) => {
        try {
            const { failed } = await applyUpdates([{ id: product.id, ...patch }])
            if (failed > 0) throw new Error("update failed")
            toast.success(t("products.inlineEdit.saved"))
        } catch (error) {
            toast.error(t("products.inlineEdit.failed"))
            throw error
        }
    }, [applyUpdates, t])

    const runBulk = useCallback(async (work: () => Promise<{ updated: number; failed: number }>, successKey: string) => {
        setIsBulkWorking(true)
        try {
            const { updated, failed } = await work()
            if (failed > 0) toast.warning(t("products.bulkEdit.partial", { updated, failed }))
            else toast.success(t(successKey, { count: updated }))
            setSelectedIds([])
            return true
        } catch {
            toast.error(t("toasts.errorOccurred"))
            return false
        } finally {
            setIsBulkWorking(false)
        }
    }, [setSelectedIds, t])

    const handleBulkCategory = useCallback((category: string, mode: BulkCategoryMode) => runBulk(async () => {
        const selected = await loadSelectedProducts()
        const updates = selected
            .map((p) => ({ id: p.id, before: p.category ?? null, category: applyCategoryChange(p.category, category, mode) }))
            .filter((u) => u.before !== u.category)
            .map(({ id, category: next }) => ({ id, category: next }))
        if (updates.length === 0) return { updated: selected.length, failed: 0 }
        return applyUpdates(updates)
    }, "products.bulkEdit.categoryDone"), [runBulk, loadSelectedProducts, applyUpdates])

    const handleBulkStock = useCallback((amount: number, mode: BulkStockMode) => runBulk(async () => {
        const selected = await loadSelectedProducts()
        const updates = selected
            .map((p) => ({ id: p.id, stock: applyStockChange(p.stock || 0, amount, mode) }))
            .filter((u, index) => u.stock !== selected[index].stock)
        if (updates.length === 0) return { updated: selected.length, failed: 0 }
        return applyUpdates(updates)
    }, "products.bulkEdit.stockDone"), [runBulk, loadSelectedProducts, applyUpdates])

    const handleAddToCatalog = useCallback((catalogId: string) => runBulk(async () => {
        const catalog = await getCatalog(catalogId)
        const existing = new Set(catalog.product_ids || [])
        const added = selectedIds.filter((id) => !existing.has(id))
        if (added.length > 0) {
            await updateCatalog(catalogId, { product_ids: [...(catalog.product_ids || []), ...added] }, { publicSlug: catalog.is_published ? catalog.share_slug : null })
        }
        routerRefresh()
        return { updated: added.length, failed: 0 }
    }, "products.bulkEdit.catalogDone"), [runBulk, selectedIds, routerRefresh])

    const handleExportSelected = useCallback(async () => {
        setIsBulkWorking(true)
        try {
            const selected = await loadSelectedProducts()
            const count = downloadProductsCsv(selected, t)
            toast.success(t("importExport.productsExported", { count }))
        } catch {
            toast.error(t("toasts.processingError"))
        } finally {
            setIsBulkWorking(false)
        }
    }, [loadSelectedProducts, t])

    return {
        isBulkWorking,
        handleInlineUpdate,
        handleBulkCategory,
        handleBulkStock,
        handleAddToCatalog,
        handleExportSelected,
    }
}
