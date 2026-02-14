import { type Product } from "@/lib/actions/products"

export type { Product }

export interface ProductsTableProps {
    products: Product[]
    allProducts?: Product[]
    search: string
    selectedIds: string[]
    onSelectedIdsChange: (ids: string[]) => void
    onEdit: (product: Product) => void
    onDeleted: (id: string) => void
    viewMode?: "grid" | "list"
    onProductsReorder?: (products: Product[]) => void
    onReorderSuccess?: () => void
}

export interface ProductViewProps {
    products: Product[]
    filteredProducts: Product[]
    allProducts: Product[]
    selectedIds: string[]
    isMobile: boolean
    isPending: boolean
    draggingId: string | null
    dragOverId: string | null
    failedImages: Set<string>
    deleteId: string | null
    deleteCatalogs: { id: string; name: string }[]
    previewProduct: Product | null
    toggleSelectAll: () => void
    toggleSelect: (id: string) => void
    onEdit: (product: Product) => void
    handleDuplicate: (product: Product) => void
    initiateDelete: (id: string) => void
    handleDelete: (id: string) => void
    handleDragStart: (e: React.DragEvent, productId: string) => void
    handleDragOver: (e: React.DragEvent, productId: string) => void
    handleDragLeave: () => void
    handleDrop: (e: React.DragEvent, targetId: string) => void
    handleDragEnd: () => void
    handleImageError: (imageUrl: string) => void
    setPreviewProduct: (product: Product | null) => void
    setDeleteId: (id: string | null) => void
    setDeleteCatalogs: (catalogs: { id: string; name: string }[]) => void
    t: (key: string) => string
}
