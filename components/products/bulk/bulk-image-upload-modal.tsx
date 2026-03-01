"use client"

import * as React from "react"
import { Image as ImageIcon, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

import { ImageCard } from "./bulk-image-upload/image-card"
import { findBestProductMatch } from "./bulk-image-upload/matcher"
import { uploadMatchedImages } from "./bulk-image-upload/upload-service"
import { type BulkImageUploadModalProps, type ImageFile } from "./bulk-image-upload/types"

const MAX_FILE_SIZE = 5 * 1024 * 1024

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

export function BulkImageUploadModal({ open, onOpenChange, products, onSuccess }: BulkImageUploadModalProps) {
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
                    toast.error(`${file.name} çok büyük (Max 5MB).`)
                    continue
                }

                // Magic bytes doğrulaması — uzantı spoofing koruması
                const isValid = await validateImageMagicBytes(file)
                if (!isValid) {
                    toast.error(`${file.name} geçersiz dosya formatı.`)
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
        [products],
    )

    const openFileDialog = React.useCallback(
        async (mode: "bulk" | "more") => {
            await refreshSession()
            const target = mode === "bulk" ? bulkInputRef.current : addMoreInputRef.current
            target?.click()
        },
        [refreshSession],
    )

    const handleUpload = React.useCallback(async () => {
        const pendingMatched = images.filter((img) => img.status === "pending" && img.matchedProductId)
        if (!pendingMatched.length) {
            toast.error("Yüklenecek uygun ve eşleşmiş fotoğraf bulunamadı.")
            return
        }

        setIsUploading(true)
        const toastId = toast.loading(`${pendingMatched.length} fotoğraf yükleniyor...`)

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
                    toast.loading(`${processed}/${total} işlendi...`, { id: toastId })
                },
                onBeforeDatabaseSync: () => {
                    toast.loading("Veritabanı güncelleniyor...", { id: toastId })
                },
            })

            if (result.successCount > 0) {
                toast.success(`${result.successCount} fotoğraf yüklendi.`, { id: toastId })
                if (result.successCount === result.total) {
                    setTimeout(() => onSuccess(), 500)
                }
            } else {
                toast.error("Yükleme başarısız.", { id: toastId })
            }
        } catch (error) {
            console.error(error)
            toast.error("Genel bir hata oluştu.", { id: toastId })
        } finally {
            setIsUploading(false)
            uploadAbortControllerRef.current = null
        }
    }, [images, onSuccess])

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
                        <ImageIcon className="w-5 h-5 text-violet-600" />
                        Toplu Fotoğraf Yükle & Eşleştir
                    </DialogTitle>
                    <DialogDescription>
                        Fotoğrafları sürükleyip bırakın. İsimleri ürün kodu (SKU) veya adıyla eşleşenler otomatik bağlanır.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                    {!images.length ? (
                        <div
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center border-2 border-dashed m-6 rounded-xl transition-colors",
                                dragActive ? "border-violet-500 bg-violet-50" : "border-slate-300 hover:border-slate-400",
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
                                if (event.dataTransfer.files?.length) {
                                    handleFiles(event.dataTransfer.files)
                                }
                            }}
                            onClick={() => void openFileDialog("bulk")}
                        >
                            <div className="flex flex-col items-center gap-4 text-center p-8">
                                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-slate-900">Fotoğrafları Buraya Bırakın</h3>
                                    <p className="text-slate-500 mt-1">veya dosya seçmek için tıklayın</p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="mt-2"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        void openFileDialog("bulk")
                                    }}
                                >
                                    Bilgisayardan Seç
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
                            <div className="px-6 py-3 bg-white border-b flex items-center justify-between text-sm">
                                <div className="text-slate-600">
                                    <strong>{images.length}</strong> fotoğraf seçildi • <strong>{matchedCount}</strong> eşleşme bulundu
                                </div>

                                <Button variant="ghost" size="sm" onClick={() => void openFileDialog("more")}>
                                    <Upload className="w-4 h-4 mr-2" /> Daha Fazla Ekle
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

                <DialogFooter className="px-6 py-4 border-t bg-white">
                    <div className="flex-1 flex items-center justify-end gap-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
                            İptal
                        </Button>

                        <Button
                            onClick={handleUpload}
                            disabled={pendingMatchedCount === 0 || isUploading}
                            className="bg-violet-600 hover:bg-violet-700 min-w-[140px]"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Yükleniyor...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Yüklemeyi Başlat
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
