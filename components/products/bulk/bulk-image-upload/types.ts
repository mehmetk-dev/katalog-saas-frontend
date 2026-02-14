import { type Product } from "@/lib/actions/products"

export interface BulkImageUploadModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    products: Product[]
    onSuccess: () => void
}

export type ImageUploadStatus = "pending" | "uploading" | "success" | "error"

export interface ImageFile {
    file: File
    id: string
    preview: string
    status: ImageUploadStatus
    matchedProductId: string | null
    error?: string
}
