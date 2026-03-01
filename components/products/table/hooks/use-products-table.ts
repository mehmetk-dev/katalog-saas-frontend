"use client"

import { useState, useTransition, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"

import { deleteProduct, createProduct, updateProductOrder, checkProductInCatalogs } from "@/lib/actions/products"
import { useTranslation } from "@/lib/contexts/i18n-provider"
import { type Product, type ProductsTableProps } from "../types"

export function useProductsTable({
    products,
    allProducts = products,
    search,
    selectedIds,
    onSelectedIdsChange,
    onDeleted,
    onProductsReorder,
    onReorderSuccess,
}: ProductsTableProps) {
    const { t } = useTranslation()
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deleteCatalogs, setDeleteCatalogs] = useState<{ id: string; name: string }[]>([])
    const [isCheckingCatalogs, setIsCheckingCatalogs] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [isMobile, setIsMobile] = useState(false)
    const [previewProduct, setPreviewProduct] = useState<Product | null>(null)
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [dragOverId, setDragOverId] = useState<string | null>(null)
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

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

    const filteredProducts = useMemo(() => {
        if (!search) return products
        const searchLower = search.toLowerCase()
        return products.filter((product) =>
            product.name.toLowerCase().includes(searchLower) ||
            product.sku?.toLowerCase().includes(searchLower) ||
            product.category?.toLowerCase().includes(searchLower)
        )
    }, [products, search])

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredProducts.length) {
            onSelectedIdsChange([])
        } else {
            onSelectedIdsChange(filteredProducts.map((p) => p.id))
        }
    }

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
                formData.append("name", `${product.name} (Kopyası)`)
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
                onDeleted('') // Trigger parent refresh
                toast.success(t("common.success"))
            } catch {
                toast.error(t("common.error"))
            }
        })
    }

    const handleDragStart = (e: React.DragEvent, productId: string) => {
        e.stopPropagation()
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", productId)
        setDraggingId(productId)
    }

    const handleDragOver = (e: React.DragEvent, productId: string) => {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = "move"
        if (productId !== draggingId) {
            setDragOverId(productId)
        }
    }

    const handleDragLeave = () => {
        setDragOverId(null)
    }

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault()
        e.stopPropagation()
        const sourceId = e.dataTransfer.getData("text/plain")

        if (sourceId === targetId || !onProductsReorder) {
            setDraggingId(null)
            setDragOverId(null)
            return
        }

        const newProducts = [...allProducts]
        const sourceIndex = newProducts.findIndex(p => p.id === sourceId)
        const targetIndex = newProducts.findIndex(p => p.id === targetId)

        if (sourceIndex !== -1 && targetIndex !== -1) {
            const [movedItem] = newProducts.splice(sourceIndex, 1)
            newProducts.splice(targetIndex, 0, movedItem)
            onProductsReorder(newProducts)

            startTransition(async () => {
                try {
                    const orderData = newProducts.map((p, index) => ({ id: p.id, order: index }))
                    await updateProductOrder(orderData)
                    onReorderSuccess?.()
                } catch {
                    if (process.env.NODE_ENV === 'development') console.error("Sıralama kaydedilemedi")
                    toast.error(t("common.error"))
                }
            })
        }

        setDraggingId(null)
        setDragOverId(null)
    }

    const handleDragEnd = () => {
        setDraggingId(null)
        setDragOverId(null)
    }

    return {
        t,
        isPending,
        isMobile,
        filteredProducts,
        allProducts,
        selectedIds,
        deleteId,
        deleteCatalogs,
        previewProduct,
        draggingId,
        dragOverId,
        failedImages,
        setDeleteId,
        setDeleteCatalogs,
        setPreviewProduct,
        toggleSelectAll,
        toggleSelect,
        initiateDelete,
        handleDelete,
        handleDuplicate,
        handleImageError,
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleDragEnd,
    }
}
