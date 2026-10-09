"use client"

import * as React from "react"
import { Image as ImageIcon, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { useAllProducts } from "@/lib/hooks/use-products"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/contexts/i18n-provider"

import { ImageCard } from "./bulk-image-upload/image-card"
import { findBestProductMatch } from "./bulk-image-upload/matcher"
import { uploadMatchedImages } from "./bulk-image-upload/upload-service"
import { type BulkImageUploadModalProps, type ImageFile } from "./bulk-image-upload/types"

/** Ham dosya sınırı: yüklemeden önce sıkıştırıldığı için telefon fotoğrafları kabul edilir (önceden 5 MB) */
const MAX_FILE_SIZE = 20 * 1024 * 1024

/** Magic bytes doğrulaması — dosya uzantısı spoofing'e karşı koruma */
async function validateImageMagicBytes(file: File): Promise<boolean> {
    try {
        const buffer = await file.slice(0, 12).arrayBuffer()
        const bytes = new Uint8Array(buffer)
        // JPEG: FF D8 FF
        if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true
        // PNG: 89 50 4E 47
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true
        // WebP: RIFF....WEBP
        if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
            bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true
        // GIF: 47 49 46 38
        if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true
        return false
    } catch {
        return false
    }
}

export function BulkImageUploadModal({ open, onOpenChange, products: pageProducts, onSuccess }: BulkImageUploadModalProps) {
    const { t } = useTranslation()
    // Dosya adları sadece sayfadaki 12 ürünle değil, bütün envanterle eşleştirilmeli
    const allProductsQuery = useAllProducts({ enabled: open })
    const products = allProductsQuery.data ?? pageProducts
    const isLoadingProducts = open && allProductsQuery.isLoading
    const [images, setImages] = React.useState<ImageFile[]>([])
    const [dragActive, setDragActive] = React.useState(false)
    const [isUploading, setIsUploading] = React.useState(false)

    const imagesRef = React.useRef<ImageFile[]>([])
    const uploadAbortControllerRef = React.useRef<AbortController | null>(null)
    const dragCounterRef = React.useRef(0)
    const bulkInputRef = React.useRef<HTMLInputElement>(null)
    const addMoreInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        imagesRef.current = images
    }, [images])

    const sortedProducts = React.useMemo(
        () => [...products].sort((a, b) => a.name.localeCompare(b.name, "tr", { sensitivity: "base" })),
        [products],
    )

    const resetState = React.useCallback(() => {
        uploadAbortControllerRef.current?.abort()
        uploadAbortControllerRef.current = null

        imagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview))
        setImages([])
        setDragActive(false)
        dragCounterRef.current = 0
    }, [])

    React.useEffect(() => {
        if (!open) resetState()
    }, [open, resetState])

    React.useEffect(() => () => resetState(), [resetState])

    const refreshSession = React.useCallback(async () => {
        const supabase = createClient()
        const { error } = await supabase.auth.refreshSession()
        if (error) console.error("[BulkUpload] Pre-upload session refresh failed:", error)
    }, [])

    const handleFiles = React.useCallback(
        async (files: FileList) => {
            const nextImages: ImageFile[] = []

            for (const file of Array.from(files)) {
                if (!file.type.startsWith("image/")) continue
                if (file.size > MAX_FILE_SIZE) {
                    toast.error(t("bulkImages.tooLarge", { name: file.name, max: MAX_FILE_SIZE / 1024 / 1024 }))
                    continue
                }

                // Magic bytes doğrulaması — uzantı spoofing koruması
                const isValid = await validateImageMagicBytes(file)
                if (!isValid) {
                    toast.error(t("bulkImages.invalidFormat", { name: file.name }))
                    continue
                }

                const fileNameWithoutExt = file.name.split(".").slice(0, -1).join(".")
                const matchedProductId = findBestProductMatch(fileNameWithoutExt, products)

                nextImages.push({
                    file,
                    id: crypto.randomUUID(),
                    preview: URL.createObjectURL(file),
                    status: "pending",
                    matchedProductId,
                })
            }

            if (nextImages.length) {
                setImages((prev) => [...prev, ...nextImages])
            }
        },
        [products, t],
    )

    const openFileDialog = React.useCallback(
        async (mode: "bulk" | "more") => {
            if (isLoadingProducts) return
            await refreshSession()
            const target = mode === "bulk" ? bulkInputRef.current : addMoreInputRef.current
            target?.click()
        },
        [refreshSession, isLoadingProducts],
    )

    const handleUpload = React.useCallback(async () => {
        const pendingMatched = images.filter((img) => img.status === "pending" && img.matchedProductId)
        if (!pendingMatched.length) {
            toast.error(t("bulkImages.nothingToUpload"))
            return
        }

        setIsUploading(true)
        const toastId = toast.loading(t("bulkImages.uploading", { count: pendingMatched.length }))

        const abortController = new AbortController()
        uploadAbortControllerRef.current = abortController

        try {
            const result = await uploadMatchedImages({
                images,
                signal: abortController.signal,
                onImageStatusChange: (id, status, error) => {
                    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, status, error } : img)))
                },
                onProgress: (processed, total) => {
                    toast.loading(t("bulkImages.progress", { processed, total }), { id: toastId })
                },
                onBeforeDatabaseSync: () => {
                    toast.loading(t("bulkImages.saving"), { id: toastId })
                },
            })

            if (result.successCount > 0) {
                toast.success(t("bulkImages.uploaded", { count: result.successCount }), { id: toastId })
                if (result.successCount === result.total) {
                    setTimeout(() => onSuccess(), 500)
                }
            } else {
                toast.error(t("bulkImages.failed"), { id: toastId })
            }
        } catch (error) {
            console.error(error)
            toast.error(t("bulkImages.unexpected"), { id: toastId })
        } finally {
            setIsUploading(false)
            uploadAbortControllerRef.current = null
        }
    }, [images, onSuccess, t])

    const removeImage = React.useCallback((id: string) => {
        setImages((prev) => {
            const target = prev.find((img) => img.id === id)
            if (target) URL.revokeObjectURL(target.preview)
            return prev.filter((img) => img.id !== id)
        })
    }, [])

    const updateImageMatch = React.useCallback((imageId: string, productId: string) => {
        setImages((prev) =>
            prev.map((img) => (img.id === imageId ? { ...img, matchedProductId: productId === "none" ? null : productId } : img)),
        )
    }, [])

    const pendingMatchedCount = images.filter((img) => img.status === "pending" && img.matchedProductId).length
    const matchedCount = images.filter((img) => img.matchedProductId).length

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] flex flex-col p-0 gap-0 sm:max-w-[95vw]">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        {t("bulkImages.title")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("bulkImages.description")}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col overflow-hidden bg-muted/50">
                    {!images.length ? (
                        <div
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center border-2 border-dashed m-6 rounded-xl transition-colors",
                                dragActive ? "border-primary bg-accent" : "border-border hover:border-ring",
                            )}
                            onDragEnter={(event) => {
                                event.preventDefault()
                                dragCounterRef.current += 1
                                setDragActive(true)
                            }}
                            onDragOver={(event) => event.preventDefault()}
                            onDragLeave={(event) => {
                                event.preventDefault()
                                dragCounterRef.current -= 1
                                if (dragCounterRef.current <= 0) {
                                    dragCounterRef.current = 0
                                    setDragActive(false)
                                }
                            }}
                            onDrop={(event) => {
                                event.preventDefault()
                                dragCounterRef.current = 0
                                setDragActive(false)
                                if (event.dataTransfer.files?.length && !isLoadingProducts) {
                                    handleFiles(event.dataTransfer.files)
                                }
                            }}
                            onClick={() => void openFileDialog("bulk")}
                        >
                            <div className="flex flex-col items-center gap-4 text-center p-8">
                                <div className="w-16 h-16 bg-card rounded-full shadow-sm flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-foreground">{t("bulkImages.dropTitle")}</h3>
                                    <p className="text-muted-foreground mt-1">{t("bulkImages.dropDesc")}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="mt-2"
                                    disabled={isLoadingProducts}
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        void openFileDialog("bulk")
                                    }}
                                >
                                    {isLoadingProducts && <Loader2 className="size-4 animate-spin" />}
                                    {isLoadingProducts ? t("bulkImages.loadingProducts") : t("bulkImages.choose")}
                                </Button>
                                <input
                                    ref={bulkInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) => event.target.files && handleFiles(event.target.files)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 py-3 bg-card border-b flex items-center justify-between text-sm">
                                <div className="text-muted-foreground">
                                    {t("bulkImages.summary", { count: images.length, matched: matchedCount })}
                                </div>

                                <Button variant="ghost" size="sm" onClick={() => void openFileDialog("more")}>
                                    <Upload className="w-4 h-4 mr-2" /> {t("bulkImages.addMore")}
                                </Button>
                                <input
                                    ref={addMoreInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) => event.target.files && handleFiles(event.target.files)}
                                />
                            </div>

                            <ScrollArea className="flex-1 p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {images.map((image, index) => (
                                        <ImageCard
                                            key={image.id}
                                            image={image}
                                            index={index}
                                            images={images}
                                            products={products}
                                            sortedProducts={sortedProducts}
                                            isUploading={isUploading}
                                            onRemove={removeImage}
                                            onMatchChange={updateImageMatch}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-card">
                    <div className="flex-1 flex items-center justify-end gap-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
                            {t("common.cancel")}
                        </Button>

                        <Button
                            onClick={handleUpload}
                            disabled={pendingMatchedCount === 0 || isUploading}
                            className="bg-primary hover:bg-primary/90 min-w-[140px]"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t("bulkImages.uploadingShort")}
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    {t("bulkImages.start")}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
