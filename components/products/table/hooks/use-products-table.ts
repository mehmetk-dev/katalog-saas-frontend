"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { deleteProduct, createProduct, updateProductOrder, checkProductInCatalogs } from "@/lib/actions/products"
import { useTranslation } from "@/lib/i18n-provider"
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
    const [, setIsCheckingCatalogs] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [isMobile, setIsMobile] = useState(false)
    const [previewProduct, setPreviewProduct] = useState<Product | null>(null)
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [dragOverId, setDragOverId] = useState<string | null>(null)
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

    const handleImageError = useCallback((imageUrl: string) => {
        setFailedImages((prev: Set<string>) => {
            const newSet = new Set(prev)
            newSet.add(imageUrl)
            return newSet
        })
    }, [])

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const filteredProducts = search
        ? products.filter((product) =>
            product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.sku?.toLowerCase().includes(search.toLowerCase()) ||
            product.category?.toLowerCase().includes(search.toLowerCase())
        )
        : products

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
                if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
                    formData.append("custom_attributes", JSON.stringify(product.custom_attributes))
                }
                await createProduct(formData)
                window.location.reload()
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
                    console.error("Sıralama kaydedilemedi")
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
