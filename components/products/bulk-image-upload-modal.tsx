"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { Upload, X, Check, AlertCircle, Image as ImageIcon, Loader2, ArrowRight, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { type Product, updateProduct } from "@/lib/actions/products"
import { useAsyncTimeout } from "@/lib/hooks/use-async-timeout"

interface BulkImageUploadModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    products: Product[]
    onSuccess: () => void
}

interface ImageFile {
    file: File
    id: string
    preview: string
    status: 'pending' | 'uploading' | 'success' | 'error'
    matchedProductId: string | null
    error?: string
}

export function BulkImageUploadModal({ open, onOpenChange, products, onSuccess }: BulkImageUploadModalProps) {
    const [images, setImages] = useState<ImageFile[]>([])
    const [dragActive, setDragActive] = useState(false)
    const [autoUploadPending, setAutoUploadPending] = useState(false)

    // Merkezi timeout hook'u
    const uploadTimeout = useAsyncTimeout({
        totalTimeoutMs: 120000, // 120 saniye (toplu yükleme daha uzun sürebilir)
        stuckTimeoutMs: 20000, // 20 saniye ilerleme yoksa
        timeoutMessage: "Yükleme zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.",
        showToast: true
    })

    // Cleanup object URLs on unmount
    React.useEffect(() => {
        return () => {
            images.forEach(img => URL.revokeObjectURL(img.preview))
        }
    }, [])

    // Otomatik yükleme: Yeni fotoğraflar eklendiğinde eşleşenler için otomatik yükle
    React.useEffect(() => {
        if (autoUploadPending && !uploadTimeout.isLoading && images.length > 0 && !uploadTimeout.hasTimeout) {
            const hasMatchedPending = images.some(img => img.matchedProductId && img.status === 'pending')
            if (hasMatchedPending) {
                // Kısa bir gecikme ile yüklemeyi başlat (UI güncellemesi için)
                const timer = setTimeout(() => {
                    handleUpload()
                }, 500)
                return () => clearTimeout(timer)
            }
            setAutoUploadPending(false)
        }
    }, [autoUploadPending, uploadTimeout.isLoading, images, uploadTimeout.hasTimeout])

    // Türkçe karakterleri normalize et
    const normalizeText = (text: string): string => {
        return text
            .toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/İ/g, 'i')
            .replace(/Ğ/g, 'g')
            .replace(/Ü/g, 'u')
            .replace(/Ş/g, 's')
            .replace(/Ö/g, 'o')
            .replace(/Ç/g, 'c')
    }

    // Metni kelimelere ayır (-, _, boşluk, sayılar hariç)
    const tokenize = (text: string): string[] => {
        const normalized = normalizeText(text)
        // Tire, alt çizgi, boşluk ve sayılarla böl, boş stringleri filtrele
        return normalized
            .split(/[-_\s.]+/)
            .filter(word => word.length > 1 && !/^\d+$/.test(word)) // 1 karakterden uzun ve sadece rakam olmayan
    }

    // İki kelime listesi arasındaki eşleşme puanını hesapla
    const calculateMatchScore = (productTokens: string[], fileTokens: string[]): number => {
        if (productTokens.length === 0 || fileTokens.length === 0) return 0

        let matchedWords = 0
        let consecutiveBonus = 0
        let lastMatchIndex = -2

        // Her ürün kelimesi için dosya kelimelerinde ara
        for (let i = 0; i < productTokens.length; i++) {
            const productWord = productTokens[i]

            // Dosya kelimelerinde bu kelimeyi ara
            const fileIndex = fileTokens.findIndex((fileWord, idx) => {
                // Tam eşleşme veya başlangıç eşleşmesi (min 3 karakter)
                if (fileWord === productWord) return true
                if (productWord.length >= 3 && fileWord.startsWith(productWord)) return true
                if (fileWord.length >= 3 && productWord.startsWith(fileWord)) return true
                return false
            })

            if (fileIndex !== -1) {
                matchedWords++
                // Ardışık eşleşmelere bonus ver
                if (fileIndex === lastMatchIndex + 1) {
                    consecutiveBonus += 0.5
                }
                lastMatchIndex = fileIndex
            }
        }

        if (matchedWords === 0) return 0

        // Puanlama: eşleşen kelime oranı + ardışıklık bonusu
        const matchRatio = matchedWords / productTokens.length
        const score = matchRatio + consecutiveBonus

        // Minimum 2 kelime eşleşmesi gerekli (tek kelimelik ürünler hariç)
        if (productTokens.length > 1 && matchedWords < 2) {
            return 0
        }

        // Çok kısa eşleşmeleri düşük puanla
        if (matchedWords === 1 && productTokens.length === 1 && productTokens[0].length < 4) {
            return score * 0.5
        }

        return score
    }

    // En iyi eşleşen ürünü bul
    const findBestMatch = (fileName: string): string | null => {
        const fileTokens = tokenize(fileName)

        if (fileTokens.length === 0) return null

        let bestMatch: { productId: string; score: number } | null = null

        for (const product of products) {
            // 1. Tam SKU eşleşmesi (en yüksek öncelik)
            if (product.sku) {
                const normalizedSku = normalizeText(product.sku)
                const normalizedFileName = normalizeText(fileName)
                if (normalizedFileName === normalizedSku || normalizedFileName.startsWith(normalizedSku + '-') || normalizedFileName.startsWith(normalizedSku + '_')) {
                    return product.id
                }
            }

            // 2. Tam isim eşleşmesi
            const normalizedName = normalizeText(product.name)
            const normalizedFileName = normalizeText(fileName)
            if (normalizedFileName === normalizedName) {
                return product.id
            }

            // 3. Kelime bazlı puanlama
            const productTokens = tokenize(product.name)
            const score = calculateMatchScore(productTokens, fileTokens)

            // SKU tokenlarını da kontrol et
            let skuScore = 0
            if (product.sku) {
                const skuTokens = tokenize(product.sku)
                skuScore = calculateMatchScore(skuTokens, fileTokens)
            }

            const finalScore = Math.max(score, skuScore)

            // Minimum eşleşme eşiği: %60 veya 2 kelime
            if (finalScore >= 0.6 || (finalScore > 0 && productTokens.length <= 2)) {
                if (!bestMatch || finalScore > bestMatch.score) {
                    bestMatch = { productId: product.id, score: finalScore }
                }
            }
        }

        return bestMatch?.productId || null
    }

    const handleFiles = useCallback((files: FileList) => {
        const newImages: ImageFile[] = []

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return

            // Dosya adından uzantıyı çıkar
            const fileNameWithoutExt = file.name.split('.').slice(0, -1).join('.')

            // Akıllı eşleştirme algoritması
            const matchedId = findBestMatch(fileNameWithoutExt)

            newImages.push({
                file,
                id: Math.random().toString(36).substring(7),
                preview: URL.createObjectURL(file),
                status: 'pending',
                matchedProductId: matchedId
            })
        })

        if (newImages.length > 0) {
            setImages(prev => [...prev, ...newImages])
            // Eşleşen fotoğraflar varsa otomatik yüklemeyi tetikle
            const hasMatched = newImages.some(img => img.matchedProductId)
            if (hasMatched) {
                setAutoUploadPending(true)
            }
        }
    }, [products])

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files)
        }
    }

    const handleUpload = async () => {
        if (images.length === 0) return

        await uploadTimeout.execute(async () => {
            const supabase = createClient()
            const totalImages = images.length
            let uploadedCount = 0

            const productUpdates = new Map<string, string[]>() // productId -> newImageUrls

            for (let i = 0; i < images.length; i++) {
                const img = images[i]
                if (img.status === 'success') {
                    uploadedCount++
                    uploadTimeout.setProgress(Math.round((uploadedCount / totalImages) * 100))
                    continue
                }

                // Skip if no match
                if (!img.matchedProductId) {
                    setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'error', error: "Ürün eşleşmedi" } : p))
                    uploadedCount++
                    uploadTimeout.setProgress(Math.round((uploadedCount / totalImages) * 100))
                    continue
                }

                const product = products.find(p => p.id === img.matchedProductId)
                if (!product) {
                    setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'error', error: "Ürün bulunamadı" } : p))
                    uploadedCount++
                    uploadTimeout.setProgress(Math.round((uploadedCount / totalImages) * 100))
                    continue
                }

                // Calculate limit - count existing images + already uploaded in this session
                const currentImages = product.images || (product.image_url ? [product.image_url] : []);
                const alreadyUploadedForThis = productUpdates.get(product.id)?.length || 0;

                if (currentImages.length + alreadyUploadedForThis >= 5) {
                    setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'error', error: "5 resim limiti dolu" } : p))
                    uploadedCount++
                    uploadTimeout.setProgress(Math.round((uploadedCount / totalImages) * 100))
                    continue
                }

                setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'uploading' } : p))

                try {
                    // 1. WebP Conversion
                    const { convertToWebP } = await import("@/lib/image-utils")
                    const { blob } = await convertToWebP(img.file)

                    // 2. Upload
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.webp`
                    const filePath = `${fileName}`

                    const { error: uploadError } = await supabase.storage
                        .from('product-images')
                        .upload(filePath, blob, {
                            contentType: 'image/webp'
                        })

                    if (uploadError) throw uploadError

                    const { data: { publicUrl } } = supabase.storage
                        .from('product-images')
                        .getPublicUrl(filePath)

                    // Queue for update
                    const existing = productUpdates.get(product.id) || []
                    productUpdates.set(product.id, [...existing, publicUrl])

                    // Success state for image
                    setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'success' } : p))

                } catch (error: any) {
                    console.error('Image upload error:', error)
                    setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'error', error: error.message || 'Yükleme hatası' } : p))
                }

                uploadedCount++
                uploadTimeout.setProgress(Math.round((uploadedCount / totalImages) * 100))
            }

            // Batch update products
            try {
                for (const [productId, newUrls] of productUpdates.entries()) {
                    const product = products.find(p => p.id === productId)
                    if (product) {
                        const currentImages = product.images || (product.image_url ? [product.image_url] : []);
                        const allImages = [...currentImages, ...newUrls].slice(0, 5); // Ensure max 5

                        // Use supabase directly
                        const { error } = await supabase
                            .from('products')
                            .update({
                                images: allImages,
                                image_url: allImages[0] // Ensure cover is set if it was empty, or keep first
                            })
                            .eq('id', productId)

                        if (error) {
                            console.error('Product update error:', error)
                        }
                    }
                }
            } catch (error) {
                console.error('Batch update error:', error)
                toast.error("Bazı ürünler güncellenemedi")
            }

            setAutoUploadPending(false)
            toast.success("İşlem tamamlandı")
            onSuccess()
        })
    }

    const removeImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id))
    }

    const handleMatchChange = (imgId: string, productId: string) => {
        setImages(prev => prev.map(img => img.id === imgId ? { ...img, matchedProductId: productId === "none" ? null : productId } : img))
    }

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
                    {/* Drop Zone */}
                    {!images.length ? (
                        <div
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center border-2 border-dashed m-6 rounded-xl transition-colors",
                                dragActive ? "border-violet-500 bg-violet-50" : "border-slate-300 hover:border-slate-400"
                            )}
                            onDragEnter={() => setDragActive(true)}
                            onDragLeave={() => setDragActive(false)}
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                            onDrop={handleDrop}
                        >
                            <div className="flex flex-col items-center gap-4 text-center p-8">
                                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-slate-900">Fotoğrafları Buraya Bırakın</h3>
                                    <p className="text-slate-500 mt-1">veya dosya seçmek için tıklayın</p>
                                </div>
                                <Button variant="outline" className="mt-2" onClick={() => document.getElementById('bulk-upload-input')?.click()}>
                                    Bilgisayardan Seç
                                </Button>
                                <input
                                    id="bulk-upload-input"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Header Stats */}
                            <div className="px-6 py-3 bg-white border-b flex items-center justify-between text-sm">
                                <div className="text-slate-600">
                                    <strong>{images.length}</strong> fotoğraf seçildi • <strong>{images.filter(i => i.matchedProductId).length}</strong> eşleşme bulundu
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => document.getElementById('add-more-input')?.click()}>
                                    <Upload className="w-4 h-4 mr-2" /> Daha Fazla Ekle
                                </Button>
                                <input
                                    id="add-more-input"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                                />
                            </div>

                            <ScrollArea className="flex-1 p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {images.map((img, index) => {
                                        const matchedProduct = products.find(p => p.id === img.matchedProductId)
                                        const isError = img.status === 'error'
                                        const isSuccess = img.status === 'success'

                                        let isOverLimit = false
                                        let existingImages: string[] = []
                                        let pendingBefore = 0

                                        if (matchedProduct) {
                                            existingImages = matchedProduct.images || (matchedProduct.image_url ? [matchedProduct.image_url] : [])
                                            pendingBefore = images.slice(0, index).filter(i => i.matchedProductId === matchedProduct.id).length
                                            if (existingImages.length + pendingBefore >= 5) {
                                                isOverLimit = true
                                            }
                                        }

                                        return (
                                            <div key={img.id} className={cn(
                                                "bg-white rounded-xl border shadow-sm p-4 flex gap-4 relative group items-start min-h-[9rem] transition-all hover:shadow-md",
                                                isSuccess && "border-green-200 bg-green-50/50",
                                                isError && "border-red-200 bg-red-50/50",
                                                isOverLimit && !isError && "border-amber-200 bg-amber-50/30"
                                            )}>
                                                {/* Image Preview */}
                                                <div className="w-24 h-24 shrink-0 bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200">
                                                    <img src={img.preview} className="w-full h-full object-cover" alt="Preview" />
                                                    {img.status === 'uploading' && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0 flex flex-col gap-2">
                                                    <div>
                                                        <p className="text-xs font-medium truncate text-slate-700" title={img.file.name}>{img.file.name}</p>
                                                        <p className="text-[10px] text-slate-400 truncate">{(img.file.size / 1024).toFixed(0)} KB</p>
                                                    </div>

                                                    {/* Match Selector */}
                                                    <div className="w-full">
                                                        <div className="flex items-center gap-1 mb-1 justify-between">
                                                            {matchedProduct ? (
                                                                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                                                    <Check className="w-3 h-3" />
                                                                    Eşleşti
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    Eşleşme Yok
                                                                </div>
                                                            )}

                                                            {isOverLimit && (
                                                                <div className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                                                    Limit Dolu
                                                                </div>
                                                            )}
                                                        </div>

                                                        <select
                                                            className={cn(
                                                                "w-full text-xs h-8 rounded-md border bg-white px-2 outline-none focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer",
                                                                matchedProduct ? "border-emerald-200 text-emerald-700" : "border-slate-200 text-slate-700"
                                                            )}
                                                            value={img.matchedProductId || "none"}
                                                            onChange={(e) => handleMatchChange(img.id, e.target.value)}
                                                            disabled={isSuccess || uploadTimeout.isLoading}
                                                        >
                                                            <option value="none">Seçim Yapılmadı</option>
                                                            {products.map(p => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.sku ? `[${p.sku}] ` : ''}{p.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Existing Images Preview & Counter */}
                                                    {matchedProduct && (
                                                        <div className="flex gap-1 mt-1 items-center">
                                                            {existingImages.length > 0 && existingImages.slice(0, 3).map((url, i) => (
                                                                <div key={i} className="w-5 h-5 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                                                                    <img src={url} className="w-full h-full object-cover opacity-70" alt={`Mevcut ${i}`} />
                                                                </div>
                                                            ))}
                                                            {existingImages.length > 3 && (
                                                                <div className="w-5 h-5 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-[8px] text-slate-500 shrink-0">
                                                                    +{existingImages.length - 3}
                                                                </div>
                                                            )}

                                                            <div className={cn(
                                                                "text-[10px] font-medium ml-1 px-1.5 py-0.5 rounded-full border",
                                                                isOverLimit
                                                                    ? "text-red-600 bg-red-50 border-red-100"
                                                                    : "text-slate-500 bg-slate-50 border-slate-100"
                                                            )}>
                                                                {existingImages.length + pendingBefore + 1}/5
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <button
                                                    onClick={() => removeImage(img.id)}
                                                    disabled={uploadTimeout.isLoading}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-white border rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-red-500 z-10"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>

                                                {isError && (
                                                    <div className="absolute bottom-2 right-2 text-xs text-red-600 bg-white px-2 py-1 rounded shadow-sm border border-red-100">
                                                        {img.error || "Hata oluştu"}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-white">
                    <div className="flex-1 flex items-center gap-4">
                        {uploadTimeout.isLoading && (
                            <div className="flex-1 max-w-sm">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Yükleniyor...</span>
                                    <span>{uploadTimeout.progress}%</span>
                                </div>
                                <Progress value={uploadTimeout.progress} className="h-2" />
                            </div>
                        )}
                        {uploadTimeout.hasTimeout && (
                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">Zaman aşımı! Bağlantınızı kontrol edin.</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploadTimeout.isLoading}>
                            İptal
                        </Button>
                        {uploadTimeout.hasTimeout ? (
                            <Button
                                onClick={() => {
                                    uploadTimeout.reset()
                                    handleUpload()
                                }}
                                className="bg-amber-600 hover:bg-amber-700 gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Tekrar Dene
                            </Button>
                        ) : (
                            <Button
                                onClick={handleUpload}
                                disabled={images.length === 0 || uploadTimeout.isLoading}
                                className="bg-violet-600 hover:bg-violet-700 gap-2"
                            >
                                {uploadTimeout.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                {images.filter(i => i.matchedProductId).length} Fotoğrafı Yükle & Kaydet
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
