"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { Upload, X, Check, AlertCircle, Image as ImageIcon, Loader2, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import NextImage from "next/image"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type Product, bulkUpdateProductImages } from "@/lib/actions/products"
import { useAsyncTimeout } from "@/lib/hooks/use-async-timeout"
import { cn } from "@/lib/utils"
import { storage } from "@/lib/storage"

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
    const [isUploading, setIsUploading] = useState(false)

    // Merkezi timeout hook'u (Legacy - kaldırılacak)
    const uploadTimeout = useAsyncTimeout({
        totalTimeoutMs: 300000,
        stuckTimeoutMs: 60000,
        timeoutMessage: "Zaman aşımı",
        showToast: false
    })

    // Upload işlemlerini iptal etmek için ref'ler
    const uploadAbortControllers = React.useRef<Map<string, AbortController>>(new Map())
    const uploadTimeoutIds = React.useRef<Map<string, NodeJS.Timeout>>(new Map())

    // cancel fonksiyonunu ref ile sakla (dependency sorununu önlemek için)
    const cancelRef = React.useRef(uploadTimeout.cancel)
    React.useEffect(() => {
        cancelRef.current = uploadTimeout.cancel
    }, [uploadTimeout.cancel])

    const imagesRef = React.useRef<ImageFile[]>([])
    React.useEffect(() => { imagesRef.current = images }, [images])

    // Modal kapandığında state'i temizle
    React.useEffect(() => {
        if (!open) {
            // 1. Devam eden upload'ları iptal et
            uploadAbortControllers.current.forEach((controller) => {
                controller.abort()
            })
            uploadAbortControllers.current.clear()

            // 2. Tüm timeout'ları temizle
            uploadTimeoutIds.current.forEach((timeoutId) => {
                clearTimeout(timeoutId)
            })
            uploadTimeoutIds.current.clear()

            // 3. Object URL'leri temizle (Ref üzerinden güvenli)
            imagesRef.current.forEach(img => URL.revokeObjectURL(img.preview))

            // 4. State'i sıfırla
            setImages([])
            cancelRef.current()
        }
    }, [open])

    // Ürünleri isimlerine göre alfabetik sırala (A'dan Z'ye)
    const sortedProducts = React.useMemo(() => {
        return [...products].sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }))
    }, [products])

    // handleOpenChange sadece parent'a bildirim yapar
    const handleOpenChange = React.useCallback((isOpen: boolean) => {
        onOpenChange(isOpen)
    }, [onOpenChange])

    // Cleanup object URLs on unmount (Strict Mode safe)
    React.useEffect(() => {
        return () => {
            imagesRef.current.forEach(img => URL.revokeObjectURL(img.preview))
        }
    }, [])

    const normalizeText = (text: string): string => {
        if (!text) return ''
        // Türkçe locale ile küçük harfe çevir
        return text.toLocaleLowerCase('tr')
            .replace(/i̇/g, 'i') // Bazı durumlarda i̇ (decomposed) karakterini düzelt
            .replace(/[^a-z0-9\s-_]/g, ' ') // Güvenli olmayan karakterleri boşluk yap
            .replace(/\s+/g, ' ') // Mükerrer boşlukları temizle
            .trim()
    }

    // Metni kelimelere ayır - DÜZELTILMIŞ VERSİYON
    const tokenize = useCallback((text: string): string[] => {
        const normalized = normalizeText(text)
        if (!normalized) return []

        // Tire, alt çizgi, boşluk, nokta ve parantezlerle böl
        return normalized
            .split(/[-_\s.()[\]{}]+/)
            .filter(word => {
                // Boş, çok kısa veya sadece rakamdan oluşan kelimeleri filtrele
                if (!word || word.length < 2) return false
                if (/^\d+$/.test(word)) return false
                // Tek harflik kelimeler de kabul edilmez
                return true
            })
    }, [])

    // İki kelime arasındaki benzerlik skoru (0-1)
    const wordSimilarity = (word1: string, word2: string): number => {
        if (word1 === word2) return 1

        // Kısa kelimelerde kesin eşleşme gerekli
        if (word1.length < 4 || word2.length < 4) {
            return word1 === word2 ? 1 : 0
        }

        // Başlangıç eşleşmesi (en az 4 karakter)
        const minLen = Math.min(word1.length, word2.length)
        if (minLen >= 4) {
            if (word1.startsWith(word2) || word2.startsWith(word1)) {
                // Ne kadar benzer o kadar yüksek puan
                return minLen / Math.max(word1.length, word2.length)
            }
        }

        return 0
    }

    const calculateMatchScore = useCallback((productTokens: string[], fileTokens: string[]): number => {
        if (productTokens.length === 0 || fileTokens.length === 0) return 0

        let totalScore = 0
        let matchedCount = 0
        const usedProductTokens = new Set<number>()

        // Her dosya kelimesi için ürün kelimelerinde en iyi eşleşmeyi bul
        for (let fi = 0; fi < fileTokens.length; fi++) {
            const fileWord = fileTokens[fi]
            let bestSimilarity = 0
            let bestMatchIdx = -1

            for (let pi = 0; pi < productTokens.length; pi++) {
                if (usedProductTokens.has(pi)) continue // Daha önce eşleşmiş ürün kelimesini atla

                const similarity = wordSimilarity(fileWord, productTokens[pi])
                if (similarity > bestSimilarity) {
                    bestSimilarity = similarity
                    bestMatchIdx = pi
                }
            }

            if (bestSimilarity >= 0.8) { // Minimum %80 benzerlik
                matchedCount++
                totalScore += bestSimilarity
                usedProductTokens.add(bestMatchIdx)
            }
        }

        if (matchedCount === 0) return 0

        // Dosya kelimelerinin ne kadarı eşleşti
        const fileMatchRatio = matchedCount / fileTokens.length
        const avgSimilarity = totalScore / matchedCount

        // ÖZEL DURUM: Dosya adı kısa (1-2 kelime) ve tam eşleşme varsa
        if (fileTokens.length <= 2 && matchedCount >= 1 && avgSimilarity >= 0.95) {
            if (wordSimilarity(fileTokens[0], productTokens[0]) >= 0.9) {
                return 0.9
            }
            return 0.8
        }

        if (fileMatchRatio < 0.5) {
            return 0
        }

        return fileMatchRatio * avgSimilarity
    }, [])

    // En iyi eşleşen ürünü bul - DÜZELTILMIŞ
    const findBestMatch = useCallback((fileName: string): string | null => {
        const normalizedFileName = normalizeText(fileName)
        const fileTokens = tokenize(fileName)

        if (!normalizedFileName) return null

        let bestMatch: { productId: string; score: number } | null = null
        const MIN_SCORE = 0.70 // Minimum %70 eşleşme skoru gerekli

        for (const product of products) {
            // 1. TAM SKU EŞLEŞMESİ (en yüksek öncelik)
            if (product.sku) {
                const normalizedSku = normalizeText(product.sku)
                if (normalizedSku && normalizedSku.length >= 2) {
                    // Dosya adı SKU ile başlıyorsa veya tam eşleşiyorsa
                    if (normalizedFileName === normalizedSku) {
                        return product.id // Kesin eşleşme
                    }
                    // SKU ile başlayıp tire veya alt çizgi ile devam ediyorsa
                    if (normalizedFileName.startsWith(normalizedSku + '-') ||
                        normalizedFileName.startsWith(normalizedSku + '_') ||
                        normalizedFileName.startsWith(normalizedSku + ' ')) {
                        return product.id // Kesin eşleşme
                    }
                    // SKU dosya adının içinde tam olarak geçiyorsa
                    const skuPattern = new RegExp(`(^|[-_ ])${normalizedSku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[-_ ])`)
                    if (skuPattern.test(normalizedFileName)) {
                        return product.id // Kesin eşleşme
                    }
                }
            }

            // 2. TAM İSİM EŞLEŞMESİ
            const normalizedName = normalizeText(product.name)
            if (normalizedFileName === normalizedName) {
                return product.id // Kesin eşleşme
            }

            // 3. KELIME BAZLI PUANLAMA
            const productTokens = tokenize(product.name)
            if (productTokens.length === 0 || fileTokens.length === 0) continue

            const score = calculateMatchScore(productTokens, fileTokens)

            // Minimum skor kontrolü
            if (score >= MIN_SCORE) {
                if (!bestMatch || score > bestMatch.score) {
                    bestMatch = { productId: product.id, score }
                }
            }
        }

        return bestMatch?.productId || null
    }, [products, calculateMatchScore, tokenize])

    const handleFiles = useCallback((files: FileList) => {
        const newImages: ImageFile[] = []
        const MAX_SIZE = 5 * 1024 * 1024 // 5MB

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return

            if (file.size > MAX_SIZE) {
                toast.error(`${file.name} çok büyük (Max 5MB).`)
                return
            }

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
        }
    }, [findBestMatch])

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files)
        }
    }

    const handleUpload = async () => {
        const imagesToUpload = images.filter(img => img.status === 'pending' && img.matchedProductId)
        if (imagesToUpload.length === 0) {
            toast.error("Yüklenecek uygun ve eşleşmiş fotoğraf bulunamadı.")
            return
        }

        setIsUploading(true)
        const toastId = toast.loading(`${imagesToUpload.length} fotoğraf yükleniyor...`)

        // Upload Helper
        const uploadSingleImageWithRetry = async (img: ImageFile, signal?: AbortSignal): Promise<string> => {
            const MAX_RETRIES = 3
            const TIMEOUT_MS = 20000 // 20 sn
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${img.file.name.split('.').pop() || 'jpg'}`

            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                if (signal?.aborted) throw new Error('Upload cancelled')

                let timeoutId: NodeJS.Timeout | null = null
                try {
                    // Simple upload
                    const uploadPromise = storage.upload(img.file, {
                        path: 'products',
                        contentType: img.file.type || 'image/jpeg',
                        cacheControl: '3600',
                        fileName,
                        signal,
                    })

                    const timeoutPromise = new Promise<never>((_, reject) => {
                        timeoutId = setTimeout(() => reject(new Error('UPLOAD_TIMEOUT')), TIMEOUT_MS)
                    })

                    const result = await Promise.race([uploadPromise, timeoutPromise]) as { url: string } | null
                    if (timeoutId) clearTimeout(timeoutId)

                    if (result?.url) return result.url
                    throw new Error('URL missing')

                } catch (err: unknown) {
                    if (timeoutId) clearTimeout(timeoutId)
                    if ((err as Error).message === 'Upload cancelled' || signal?.aborted) throw err

                    if (attempt === MAX_RETRIES - 1) throw err
                    // Wait before retry
                    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)))
                }
            }
            throw new Error('Max retries reached')
        }

        const productUpdates = new Map<string, string[]>()
        let successCount = 0

        const mainAbortController = new AbortController()
        uploadAbortControllers.current.set('main-upload', mainAbortController)

        try {
            // Chunked Execution
            const CONCURRENCY = 3
            for (let i = 0; i < imagesToUpload.length; i += CONCURRENCY) {
                if (mainAbortController.signal.aborted) break

                const chunk = imagesToUpload.slice(i, i + CONCURRENCY)

                await Promise.all(chunk.map(async (img) => {
                    if (mainAbortController.signal.aborted) return

                    // Update status to uploading
                    setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'uploading' } : p))

                    try {
                        const matchId = img.matchedProductId!
                        const url = await uploadSingleImageWithRetry(img, mainAbortController.signal)

                        // Success
                        setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'success' } : p))

                        const currentList = productUpdates.get(matchId) || []
                        productUpdates.set(matchId, [...currentList, url])
                        successCount++

                    } catch (err: unknown) {
                        console.error("Upload error for " + img.file.name, err)
                        setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'error', error: (err as Error).message } : p))
                    }
                }))

                // Update Progress Toast
                toast.loading(`${Math.min(i + CONCURRENCY, imagesToUpload.length)}/${imagesToUpload.length} işlendi...`, { id: toastId })
            }

            // DB Sync
            if (productUpdates.size > 0 && !mainAbortController.signal.aborted) {
                toast.loading("Veritabanı güncelleniyor...", { id: toastId })
                const updatesArray = Array.from(productUpdates.entries()).map(([productId, newUrls]) => ({
                    productId,
                    images: newUrls
                }))
                await bulkUpdateProductImages(updatesArray)
            }

            if (successCount > 0) {
                toast.success(`${successCount} fotoğraf yüklendi.`, { id: toastId })
                if (successCount === imagesToUpload.length) {
                    // Wait a bit then close if fully successful
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
            uploadAbortControllers.current.delete('main-upload')
        }
    }

    const removeImage = (id: string) => {
        setImages(prev => {
            const target = prev.find(i => i.id === id)
            if (target) URL.revokeObjectURL(target.preview)
            return prev.filter(img => img.id !== id)
        })
    }

    const handleMatchChange = (imgId: string, productId: string) => {
        setImages(prev => prev.map(img => img.id === imgId ? { ...img, matchedProductId: productId === "none" ? null : productId } : img))
    }

    // Fotoğraf yükleme alanına tıklandığında (daha dosya seçilmeden) oturumu tazele (Just-in-Time)
    const handleUploadClick = async () => {
        const supabase = createClient()
        const { error } = await supabase.auth.refreshSession()
        if (error) console.error('[BulkUpload] Pre-upload session refresh failed:', error)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] flex flex-col p-0 gap-0 sm:max-w-[95vw]">
                {/* ... DialogHeader ... */}
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
                            onClick={() => {
                                handleUploadClick()
                                document.getElementById('bulk-upload-input')?.click()
                            }} // Drop alanına tıklanınca refresh yap ve dosya seçiciyi aç
                        >
                            <div className="flex flex-col items-center gap-4 text-center p-8">
                                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-slate-900">Fotoğrafları Buraya Bırakın</h3>
                                    <p className="text-slate-500 mt-1">veya dosya seçmek için tıklayın</p>
                                </div>
                                <Button variant="outline" className="mt-2" onClick={(e) => {
                                    e.stopPropagation() // Parent div click eventini engelle
                                    handleUploadClick()
                                    document.getElementById('bulk-upload-input')?.click()
                                }}>
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
                                <Button variant="ghost" size="sm" onClick={() => {
                                    handleUploadClick()
                                    document.getElementById('add-more-input')?.click()
                                }}>
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

                                        const existingImages = matchedProduct?.images || (matchedProduct?.image_url ? [matchedProduct.image_url] : [])

                                        // SADECE bekleyen veya yüklenenleri say (UI için doğru limit gösterimi)
                                        const pendingBefore = images
                                            .slice(0, index)
                                            .filter(i => i.matchedProductId === img.matchedProductId && (i.status === 'pending' || i.status === 'uploading'))
                                            .length

                                        const isOverLimit = existingImages.length + pendingBefore >= 5

                                        return (
                                            <div key={img.id} className={cn(
                                                "bg-white rounded-xl border shadow-sm p-4 flex gap-4 relative group items-start min-h-[9rem] transition-all hover:shadow-md",
                                                isSuccess && "border-green-200 bg-green-50/50",
                                                isError && "border-red-200 bg-red-50/50",
                                                isOverLimit && !isError && "border-amber-200 bg-amber-50/30"
                                            )}>
                                                {/* Image Preview */}
                                                <div className="relative w-24 h-24 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                                    <NextImage src={img.preview} fill className="object-cover" alt="Preview" unoptimized />
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

                                                        <ProductSelector
                                                            allProducts={sortedProducts}
                                                            selectedProductId={img.matchedProductId || "none"}
                                                            onSelect={(productId) => handleMatchChange(img.id, productId)}
                                                            disabled={isSuccess || isUploading}
                                                            matchedProduct={matchedProduct}
                                                        />
                                                    </div>

                                                    {/* Existing Images Preview & Counter */}
                                                    {matchedProduct && (
                                                        <div className="flex gap-1 mt-1 items-center">
                                                            {existingImages.length > 0 && existingImages.slice(0, 3).map((url, i) => (
                                                                <div key={i} className="relative w-5 h-5 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                                                                    <NextImage src={url} fill className="object-cover opacity-70" alt={`Mevcut ${i}`} unoptimized />
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
                                                    disabled={isUploading}
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
                    <div className="flex-1 flex items-center justify-end gap-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
                            İptal
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={images.filter(i => i.status === 'pending' && i.matchedProductId).length === 0 || isUploading}
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

interface ProductSelectorProps {
    allProducts: Product[]
    selectedProductId: string
    onSelect: (id: string) => void
    disabled: boolean
    matchedProduct?: Product
}

function ProductSelector({ allProducts, selectedProductId, onSelect, disabled, matchedProduct }: ProductSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const filteredProducts = React.useMemo(() => {
        if (!search) return allProducts.slice(0, 50)
        const s = search.toLocaleLowerCase('tr')
        return allProducts.filter(p =>
            p.name.toLocaleLowerCase('tr').includes(s) ||
            (p.sku && p.sku.toLocaleLowerCase('tr').includes(s))
        ).slice(0, 50)
    }, [allProducts, search])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full h-8 px-2 justify-between bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                        matchedProduct && "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800",
                        disabled && "opacity-70 cursor-not-allowed"
                    )}
                    disabled={disabled}
                >
                    <span className="text-xs truncate font-medium">
                        {matchedProduct
                            ? (matchedProduct.name + (matchedProduct.sku ? ` [${matchedProduct.sku}]` : ""))
                            : "Ürün Seçilmedi"}
                    </span>
                    <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 shadow-xl z-[200]" align="start" side="bottom">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 p-2 border-b bg-white sticky top-0 z-10">
                        <input
                            autoFocus
                            className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-md outline-none focus:border-violet-500/50 transition-all font-medium placeholder:text-slate-400"
                            placeholder="Ürün adı veya SKU ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div
                        className="max-h-[300px] overflow-y-auto p-1 bg-slate-50/50"
                        onWheel={(e) => e.stopPropagation()}
                    >
                        <button
                            className="w-full px-3 py-2 text-xs font-semibold text-slate-500 text-left hover:bg-slate-100 rounded-md transition-colors flex items-center mb-1"
                            onClick={() => { onSelect("none"); setOpen(false) }}
                        >
                            <X className="w-3 h-3 mr-2" />
                            Seçimi Kaldır
                        </button>

                        {filteredProducts.map(p => (
                            <button
                                key={p.id}
                                className={cn(
                                    "w-full px-3 py-2.5 text-xs text-left hover:bg-white hover:shadow-sm rounded-md transition-all mb-1 flex flex-col gap-0.5",
                                    selectedProductId === p.id ? "bg-violet-600 text-white shadow-md font-bold" : "text-slate-700"
                                )}
                                onClick={() => { onSelect(p.id); setOpen(false) }}
                            >
                                <span className="truncate">{p.name}</span>
                                {p.sku && (
                                    <span className={cn(
                                        "text-[10px] truncate",
                                        selectedProductId === p.id ? "text-white/80" : "text-slate-400"
                                    )}>
                                        SKU: {p.sku}
                                    </span>
                                )}
                            </button>
                        ))}

                        {filteredProducts.length === 0 && (
                            <div className="px-3 py-8 text-xs text-center text-slate-400 italic bg-white rounded-md border border-dashed border-slate-200 m-1">
                                Eşleşen ürün bulunamadı.
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

