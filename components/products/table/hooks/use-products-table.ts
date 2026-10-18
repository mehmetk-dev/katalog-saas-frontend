"use client"

import { useState, useTransition, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"

import { deleteProduct, createProduct, checkProductInCatalogs } from "@/lib/actions/products"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { type DropTarget, type Product, type ProductsTableProps } from "../types"

export function useProductsTable({
    products,
    selectedIds,
    onSelectedIdsChange,
    onDeleted,
    onSaved,
    reorder,
}: ProductsTableProps) {
    const { t } = useTranslation()
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deleteCatalogs, setDeleteCatalogs] = useState<{ id: string; name: string }[]>([])
    const [isCheckingCatalogs, setIsCheckingCatalogs] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [isMobile, setIsMobile] = useState(false)
    const [previewProduct, setPreviewProduct] = useState<Product | null>(null)
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
    // Klavyeyle taşındıktan sonra odak aynı ürünün tutamacında kalsın
    const refocusIdRef = useRef<string | null>(null)

    const canReorder = !!reorder?.enabled && products.length > 0

    const handleImageError = useCallback((imageUrl: string) => {
        setFailedImages((prev: Set<string>) => {
            if (prev.has(imageUrl)) return prev
            const newSet = new Set(prev)
            newSet.add(imageUrl)
            return newSet
        })
    }, [])

    useEffect(() => {
        const mql = window.matchMedia('(max-width: 767px)')
        setIsMobile(mql.matches)
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [])

    useEffect(() => {
        const id = refocusIdRef.current
        if (!id) return
        refocusIdRef.current = null
        document.querySelector<HTMLElement>(`[data-reorder-handle="${CSS.escape(id)}"]`)?.focus()
    }, [products])

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectedIdsChange(selectedIds.filter((i) => i !== id))
        } else {
            onSelectedIdsChange([...selectedIds, id])
        }
    }

    const initiateDelete = async (id: string) => {
        setIsCheckingCatalogs(true)
        try {
            const result = await checkProductInCatalogs(id)
            setDeleteCatalogs(result.catalogs)
            setDeleteId(id)
        } catch {
            setDeleteCatalogs([])
            setDeleteId(id)
        } finally {
            setIsCheckingCatalogs(false)
        }
    }

    const handleDelete = (id: string) => {
        startTransition(async () => {
            try {
                await deleteProduct(id)
                onDeleted(id)
                setDeleteId(null)
                setDeleteCatalogs([])
                toast.success(t("common.success"))
            } catch {
                toast.error(t("common.error"))
            }
        })
    }

    const handleDuplicate = (product: Product) => {
        startTransition(async () => {
            try {
                const formData = new FormData()
                formData.append("name", t("products.copyName", { name: product.name }))
                if (product.sku) formData.append("sku", product.sku)
                if (product.description) formData.append("description", product.description)
                formData.append("price", product.price.toString())
                formData.append("stock", product.stock.toString())
                if (product.category) formData.append("category", product.category)
                if (product.image_url) formData.append("image_url", product.image_url)
                if (product.images?.length) formData.append("images", JSON.stringify(product.images))
                if (product.product_url) formData.append("product_url", product.product_url)
                if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
                    formData.append("custom_attributes", JSON.stringify(product.custom_attributes))
                }
                const newProduct = await createProduct(formData)
                onSaved?.(newProduct)
                toast.success(t("common.success"))
            } catch {
                toast.error(t("common.error"))
            }
        })
    }

    /** Menü/klavye ile taşıma: yukarı/aşağı bu sayfadaki komşuya göre, en üst/alt tüm listeye göre. */
    const moveProduct = (productId: string, direction: "up" | "down" | "top" | "bottom") => {
        if (!canReorder || !reorder) return
        const index = products.findIndex((p) => p.id === productId)
        if (index === -1) return

        if (direction === "top") {
            if (reorder.isFirstPage && index === 0) return
            reorder.onMove({ id: productId, position: "first" })
        } else if (direction === "bottom") {
            if (reorder.isLastPage && index === products.length - 1) return
            reorder.onMove({ id: productId, position: "last" })
        } else if (direction === "up") {
            if (index === 0) return
            reorder.onMove({ id: productId, position: "before", targetId: products[index - 1].id })
        } else {
            if (index === products.length - 1) return
            reorder.onMove({ id: productId, position: "after", targetId: products[index + 1].id })
        }
    }

    const handleHandleKeyDown = (e: React.KeyboardEvent, productId: string) => {
        const directions: Record<string, "up" | "down" | "top" | "bottom"> = {
            ArrowUp: "up",
            ArrowLeft: "up",
            ArrowDown: "down",
            ArrowRight: "down",
            Home: "top",
            End: "bottom",
        }
        const direction = directions[e.key]
        if (!direction) return
        e.preventDefault()
        refocusIdRef.current = productId
        moveProduct(productId, direction)
    }

    const resetDrag = () => {
        setDraggingId(null)
        setDropTarget(null)
    }

    const handleDragStart = (e: React.DragEvent, productId: string) => {
        if (!canReorder) return
        e.stopPropagation()
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", productId)
        // Sürüklenen görüntü yalnızca tutamaç değil, tüm satır/kart olsun. Görüntü tutulan noktadan
        // yakalanır; sabit bir nokta verilince kart imlecin altında kayıyordu (ızgarada tutamaç sağ üstte)
        const row = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-product-row]")
        if (row) {
            const rect = row.getBoundingClientRect()
            const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width)
            const y = Math.min(Math.max(e.clientY - rect.top, 0), rect.height)
            e.dataTransfer.setDragImage(row, x, y)
        }
        setDraggingId(productId)
    }

    const handleDragOver = (e: React.DragEvent, productId: string, axis: "x" | "y") => {
        if (!draggingId) return
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"

        if (productId === draggingId) {
            if (dropTarget) setDropTarget(null)
            return
        }

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const isAfter = axis === "y"
            ? e.clientY > rect.top + rect.height / 2
            : e.clientX > rect.left + rect.width / 2
        const position = isAfter ? "after" : "before"
        if (dropTarget?.id !== productId || dropTarget.position !== position) {
            setDropTarget({ id: productId, position })
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const sourceId = draggingId
        const target = dropTarget
        resetDrag()
        if (!sourceId || !target || !reorder || sourceId === target.id) return

        // Ürün zaten oraya bırakılınca duracağı yerdeyse istek atma
        const sourceIndex = products.findIndex((p) => p.id === sourceId)
        const targetIndex = products.findIndex((p) => p.id === target.id)
        if (sourceIndex === -1 || targetIndex === -1) return
        if (target.position === "before" && targetIndex === sourceIndex + 1) return
        if (target.position === "after" && targetIndex === sourceIndex - 1) return

        reorder.onMove({ id: sourceId, position: target.position, targetId: target.id })
    }

    return {
        t,
        isPending,
        isCheckingCatalogs,
        isMobile,
        canReorder,
        isFirstPage: reorder?.isFirstPage ?? true,
        isLastPage: reorder?.isLastPage ?? true,
        selectedIds,
        deleteId,
        deleteCatalogs,
        previewProduct,
        draggingId,
        dropTarget,
        failedImages,
        setDeleteId,
        setDeleteCatalogs,
        setPreviewProduct,
        toggleSelect,
        initiateDelete,
        handleDelete,
        handleDuplicate,
        handleImageError,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd: resetDrag,
        handleHandleKeyDown,
        moveProduct,
    }
}
