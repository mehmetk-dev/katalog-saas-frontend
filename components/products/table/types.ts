import { type CatalogReference, type Product, type ProductMove } from "@/lib/actions/products"
import type { ProductColumn } from "@/components/products/hooks/use-product-columns"

export type { Product, ProductMove, ProductColumn }

/** Satır içinde düzenlenebilen alanlar */
export type ProductInlinePatch = { price?: number; stock?: number }

/** Manuel sıralama ayarları; yalnızca "Manuel sıra" görünümünde etkin olmalı. */
export interface ProductsTableReorder {
    enabled: boolean
    onMove: (move: ProductMove) => void
    /** "En üste/alta taşı" bu sayfada kalıyor mu bilmek için */
    isFirstPage: boolean
    isLastPage: boolean
}

export interface ProductsTableProps {
    products: Product[]
    selectedIds: string[]
    onSelectedIdsChange: (ids: string[]) => void
    onEdit: (product: Product) => void
    onDeleted: (id: string) => void
    onSaved?: (product: Product) => void
    viewMode?: "grid" | "list"
    reorder?: ProductsTableReorder
    /** Liste görünümünde sütun başlığından sıralama */
    sort?: ProductsTableSort
    /** Filtreye uyan tüm ürünler (sayfalar dahil); "Tüm N ürünü seç" bağlantısı için */
    selectAll?: ProductsTableSelectAll
    /** Liste görünümünde gösterilecek sütunlar */
    visibleColumns?: ProductColumn[]
    /** Fiyat/stok hücresinde yerinde düzenleme; verilmezse hücreler salt okunur */
    onInlineUpdate?: (product: Product, patch: ProductInlinePatch) => Promise<void>
}

export interface ProductsTableSelectAll {
    totalCount: number
    onSelectAll: (checked: boolean) => void
}

/** Liste başlığındaki seçim kutusu: yalnızca bu sayfadaki ürünler */
export interface ProductsPageSelection {
    checked: boolean | "indeterminate"
    onToggle: (checked: boolean) => void
}

export type SortableColumn = "name" | "price" | "stock" | "category"

export interface ProductsTableSort {
    field: string
    order: "asc" | "desc"
    onSort: (field: SortableColumn) => void
}

export type DropPosition = "before" | "after"

export interface DropTarget {
    id: string
    position: DropPosition
}

export interface ProductViewProps {
    products: Product[]
    selectedIds: string[]
    isMobile: boolean
    isPending: boolean
    canReorder: boolean
    isFirstPage: boolean
    isLastPage: boolean
    draggingId: string | null
    dropTarget: DropTarget | null
    failedImages: Set<string>
    deleteId: string | null
    deleteCatalogs: { id: string; name: string }[]
    previewProduct: Product | null
    toggleSelect: (id: string) => void
    onEdit: (product: Product) => void
    handleDuplicate: (product: Product) => void
    initiateDelete: (id: string) => void
    handleDelete: (id: string) => void
    handleDragStart: (e: React.DragEvent, productId: string) => void
    handleDragOver: (e: React.DragEvent, productId: string, axis: "x" | "y") => void
    handleDrop: (e: React.DragEvent) => void
    handleDragEnd: () => void
    handleHandleKeyDown: (e: React.KeyboardEvent, productId: string) => void
    moveProduct: (productId: string, direction: "up" | "down" | "top" | "bottom") => void
    handleImageError: (imageUrl: string) => void
    setPreviewProduct: (product: Product | null) => void
    setDeleteId: (id: string | null) => void
    setDeleteCatalogs: (catalogs: { id: string; name: string }[]) => void
    t: (key: string, params?: Record<string, unknown>) => string
    sort?: ProductsTableSort
    pageSelection: ProductsPageSelection
    visibleColumns: ProductColumn[]
    /** Ürün id → içinde bulunduğu kataloglar; null = yükleniyor / sütun kapalı */
    productCatalogs: Map<string, CatalogReference[]> | null
    onInlineUpdate?: (product: Product, patch: ProductInlinePatch) => Promise<void>
}
