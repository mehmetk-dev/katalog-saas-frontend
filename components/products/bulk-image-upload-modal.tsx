"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { Upload, X, Check, AlertCircle, Image as ImageIcon, Loader2, ArrowRight, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import NextImage from "next/image"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Progress } from "@/components/ui/progress"
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

    // Merkezi timeout hook'u
    const uploadTimeout = useAsyncTimeout({
        totalTimeoutMs: 300000, // 5 dakika (sunucu yavaş bağlantılarda)
        stuckTimeoutMs: 60000, // 60 saniye ilerleme yoksa
        timeoutMessage: "Yükleme zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.",
        showToast: true
    })

    // Upload işlemlerini iptal etmek için ref'ler
    const uploadAbortControllers = React.useRef<Map<string, AbortController>>(new Map())
    const uploadTimeoutIds = React.useRef<Map<string, NodeJS.Timeout>>(new Map())

    // cancel fonksiyonunu ref ile sakla (dependency sorununu önlemek için)
    const cancelRef = React.useRef(uploadTimeout.cancel)
    React.useEffect(() => {
        cancelRef.current = uploadTimeout.cancel
    }, [uploadTimeout.cancel])

    // Modal kapandığında state'i temizle
    React.useEffect(() => {
        if (!open && !uploadTimeout.isLoading) {
            // Devam eden upload'ları iptal et
            uploadAbortControllers.current.forEach((controller) => {
                controller.abort()
            })
            uploadAbortControllers.current.clear()
            
            // Tüm timeout'ları temizle
            uploadTimeoutIds.current.forEach((timeoutId) => {
                clearTimeout(timeoutId)
            })
            uploadTimeoutIds.current.clear()
            
            setImages(prev => {
                prev.forEach(img => URL.revokeObjectURL(img.preview))
                return []
            })
            cancelRef.current()
        }
    }, [open, uploadTimeout.isLoading])

    // Ürünleri isimlerine göre alfabetik sırala (A'dan Z'ye)
    const sortedProducts = React.useMemo(() => {
        return [...products].sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }))
    }, [products])

    // handleOpenChange sadece parent'a bildirim yapar
    const handleOpenChange = React.useCallback((isOpen: boolean) => {
        onOpenChange(isOpen)
    }, [onOpenChange])

    // Cleanup object URLs on unmount
    React.useEffect(() => {
        return () => {
            setImages(prev => {
                prev.forEach(img => URL.revokeObjectURL(img.preview))
                return []
            })
        }
    }, [])

    // Türkçe karakterleri normalize et - DÜZELTILMIŞ VERSİYON
    const normalizeText = (text: string): string => {
        if (!text) return ''

        // Önce toLowerCase yapmadan Türkçe büyük harfleri dönüştür
        const normalized = text
            // Büyük Türkçe harfler
            .replace(/İ/g, 'i')  // Büyük İ -> i
            .replace(/I/g, 'i')  // I harfi de i'ye (Türkçe'de I = ı ama dosya adlarında genelde i olarak kullanılır)
            .replace(/Ğ/g, 'g')
            .replace(/Ü/g, 'u')
            .replace(/Ş/g, 's')
            .replace(/Ö/g, 'o')
            .replace(/Ç/g, 'c')
            // Küçük Türkçe harfler
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')

        // Şimdi lowercase yap
        return normalized.toLowerCase().trim()
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

    // İki kelime listesi arasındaki eşleşme puanını hesapla - DÜZELTILMIŞ
    const calculateMatchScore = useCallback((productTokens: string[], fileTokens: string[]): number => {
        if (productTokens.length === 0 || fileTokens.length === 0) return 0

        let totalScore = 0
        let matchedCount = 0
        const usedFileTokens = new Set<number>()

        // Her dosya kelimesi için ürün kelimelerinde en iyi eşleşmeyi bul
        // (Ters yönde - dosya kelimelerini ürünle eşleştir)
        for (let fi = 0; fi < fileTokens.length; fi++) {
            const fileWord = fileTokens[fi]
            let bestSimilarity = 0

            for (let pi = 0; pi < productTokens.length; pi++) {
                const similarity = wordSimilarity(fileWord, productTokens[pi])
                if (similarity > bestSimilarity) {
                    bestSimilarity = similarity
                }
            }

            if (bestSimilarity >= 0.8) { // Minimum %80 benzerlik
                matchedCount++
                totalScore += bestSimilarity
                usedFileTokens.add(fi)
            }
        }

        if (matchedCount === 0) return 0

        // Dosya kelimelerinin ne kadarı eşleşti
        const fileMatchRatio = matchedCount / fileTokens.length
        const avgSimilarity = totalScore / matchedCount

        // ÖZEL DURUM: Dosya adı kısa (1-2 kelime) ve tam eşleşme varsa
        // Örnek: "LUPİN (5).jpg" -> ["lupin"] ürün "LUPİN YATAK ODASI" ile eşleşmeli
        if (fileTokens.length <= 2 && matchedCount >= 1 && avgSimilarity >= 0.95) {
            // 1-2 kelimelik dosya adının ilk kelimesi ürünün ilk kelimesiyle eşleşiyorsa yüksek puan
            if (wordSimilarity(fileTokens[0], productTokens[0]) >= 0.9) {
                return 0.9 // Yüksek güven
            }
            return 0.8 // Orta güven
        }

        // Normal durumlar için dosya kelimelerinin çoğunluğu eşleşmeli
        if (fileMatchRatio < 0.5) {
            return 0
        }

        // Final skor
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
        if (images.length === 0) return

        console.log(`[BulkUpload] Starting upload for ${images.length} images...`)

        await uploadTimeout.execute(async () => {
            const supabase = createClient()

            // Get session for UID (RLS requirement)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                toast.error("Oturum bulunamadı. Lütfen tekrar giriş yapın.")
                return
            }
            const userId = session.user.id

            const imagesToUpload = images.filter(img => img.status === 'pending' && img.matchedProductId)
            const totalImages = imagesToUpload.length

            if (totalImages === 0) {
                toast.error("Yüklenecek uygun fotoğraf bulunamadı. Lütfen ürünlerle eşleştiğinden emin olun.")
                return
            }

            console.log(`[BulkUpload] Found ${totalImages} pending images with matches. Starting parallel upload...`)

            let successCount = 0
            let completedCount = 0
            const productUpdates = new Map<string, string[]>() // productId -> newImageUrls

            // Ana AbortController oluştur (tüm upload'lar için)
            const mainAbortController = new AbortController()
            uploadAbortControllers.current.set('main-upload', mainAbortController)

            // YENİ: Tekil dosya yükleme ve Retry (Yeniden Deneme) mantığı
            const uploadSingleImageWithRetry = async (img: ImageFile, signal?: AbortSignal): Promise<string> => {
                const MAX_RETRIES = 3
                const TIMEOUT_MS = 30000 // 30 Saniye
                const uploadKey = img.id

                for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                    // İptal kontrolü
                    if (signal?.aborted || uploadTimeout.checkCancelled()) {
                        console.log(`[BulkUpload] 🛑 Upload cancelled for ${img.file.name}`)
                        throw new Error('Upload cancelled')
                    }

                    let timeoutId: NodeJS.Timeout | null = null

                    try {
                        // 1. Bekleme Süresi (Exponential Backoff - İlk denemede beklemez)
                        if (attempt > 0) {
                            const waitTime = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s...
                            console.log(`[BulkUpload] 🔄 Retry attempt ${attempt + 1}/${MAX_RETRIES} for ${img.file.name}. Waiting ${waitTime}ms`)
                            
                            // Bekleme sırasında da iptal kontrolü
                            await new Promise<void>((resolve, reject) => {
                                const checkInterval = setInterval(() => {
                                    if (signal?.aborted || uploadTimeout.checkCancelled()) {
                                        clearInterval(checkInterval)
                                        reject(new Error('Upload cancelled'))
                                    }
                                }, 100)
                                
                                setTimeout(() => {
                                    clearInterval(checkInterval)
                                    resolve()
                                }, waitTime)
                            })
                        }

                        // İptal kontrolü (bekleme sonrası)
                        if (signal?.aborted || uploadTimeout.checkCancelled()) {
                            console.log(`[BulkUpload] 🛑 Upload cancelled for ${img.file.name} after wait`)
                            throw new Error('Upload cancelled')
                        }

                        // 2. Dosya adı oluştur
                        const fileExtension = img.file.name.split('.').pop() || 'jpg'
                        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`

                        // 3. YARIŞ BAŞLASIN: Upload vs Timeout
                        // Hangisi önce biterse o kazanır. 1 saniye bekleme şartı yok.
                        const uploadPromise = storage.upload(img.file, {
                            path: 'products',
                            contentType: img.file.type || 'image/jpeg',
                            cacheControl: '3600',
                            fileName,
                        })

                        // Timeout promise'i (temizlenebilir)
                        const timeoutPromise = new Promise<never>((_, reject) => {
                            timeoutId = setTimeout(() => {
                                console.error(`[BulkUpload] ⏱️ Upload timeout for ${img.file.name} after ${TIMEOUT_MS/1000} seconds`)
                                reject(new Error('UPLOAD_TIMEOUT'))
                            }, TIMEOUT_MS)
                            
                            // Timeout ID'yi kaydet (temizlemek için)
                            uploadTimeoutIds.current.set(uploadKey, timeoutId)
                        })

                        const result: any = await Promise.race([uploadPromise, timeoutPromise])

                        // Timeout'u temizle (başarılı olduysa)
                        if (timeoutId) {
                            clearTimeout(timeoutId)
                            uploadTimeoutIds.current.delete(uploadKey)
                            timeoutId = null
                        }

                        // 4. Sonuç Kontrolü
                        if (result && result.url) {
                            return result.url // Başarılı! URL'i döndür ve fonksiyondan çık.
                        } else {
                            throw new Error('Upload successful but URL is missing')
                        }

                    } catch (error: any) {
                        // Timeout'u temizle (hata durumunda)
                        if (timeoutId) {
                            clearTimeout(timeoutId)
                            uploadTimeoutIds.current.delete(uploadKey)
                            timeoutId = null
                        }

                        // İptal hatası ise direkt fırlat
                        if (error.message === 'Upload cancelled' || signal?.aborted || uploadTimeout.checkCancelled()) {
                            console.log(`[BulkUpload] 🛑 Upload cancelled for ${img.file.name}`)
                            throw error
                        }

                        console.error(`[BulkUpload] ❌ Attempt ${attempt + 1} failed:`, error.message)
                        
                        // Eğer son denemeyse hatayı fırlat ki ana fonksiyon yakalasın
                        if (attempt === MAX_RETRIES - 1) {
                            throw error
                        }
                        // Değilse döngü başa döner ve tekrar dener
                    }
                }
                throw new Error('Unexpected retry loop exit')
            }

            // Helper function for individual upload attempt
            const uploadFile = async (img: ImageFile) => {
                if (uploadTimeout.checkCancelled()) return

                const product = products.find(p => p.id === img.matchedProductId)
                if (!product) {
                    setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'error', error: "Ürün bulunamadı" } : p))
                    completedCount++
                    return
                }

                // Limit kontrolü (Batch içinde yarışı önlemek için anlık map kontrolü yapıyoruz)
                const currentImages = product.images || (product.image_url ? [product.image_url] : []);
                const alreadyQueued = productUpdates.get(product.id)?.length || 0;

                if (currentImages.length + alreadyQueued >= 5) {
                    setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'error', error: "5 resim limiti dolu" } : p))
                    completedCount++
                    return
                }

                setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'uploading' } : p))

                // İptal kontrolü
                if (mainAbortController.signal.aborted || uploadTimeout.checkCancelled()) {
                    console.log(`[BulkUpload] 🛑 Upload cancelled, stopping at image ${img.file.name}`)
                    return
                }

                try {
                    // YUKARIDAKİ AKILLI FONKSİYONU ÇAĞIRIYORUZ
                    const publicUrl = await uploadSingleImageWithRetry(img, mainAbortController.signal)

                    // Başarılı Kuyruğa Ekle
                    const existing = productUpdates.get(product.id) || []
                    productUpdates.set(product.id, [...existing, publicUrl])

                    setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'success' } : p))
                    successCount++
                    
                    console.log(`[BulkUpload] ✅ Upload successful for ${img.file.name}, URL:`, publicUrl)

                } catch (itemError: any) {
                    // İptal hatası ise sessizce geç
                    if (itemError.message === 'Upload cancelled' || mainAbortController.signal.aborted || uploadTimeout.checkCancelled()) {
                        console.log(`[BulkUpload] 🛑 Upload cancelled for ${img.file.name}, silently ignoring`)
                        // Timeout'u temizle
                        const timeoutId = uploadTimeoutIds.current.get(img.id)
                        if (timeoutId) {
                            clearTimeout(timeoutId)
                            uploadTimeoutIds.current.delete(img.id)
                        }
                        return
                    }

                    console.error(`[BulkUpload] ❌ ${img.file.name} tamamen başarısız oldu:`, itemError)
                    
                    let msg = 'Yükleme hatası'
                    if (itemError.message === 'UPLOAD_TIMEOUT' || itemError.message === 'TIMEOUT') {
                        msg = 'Zaman aşımı (tüm denemeler başarısız)'
                    } else if (itemError.message?.includes('timeout')) {
                        msg = itemError.message
                    } else if (itemError.message) {
                        msg = itemError.message.length > 50 ? itemError.message.substring(0, 50) + '...' : itemError.message
                    }
                    setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'error', error: msg } : p))
                    // Bir dosya patlasa bile diğerlerine devam etsin diye throw yapmıyoruz
                } finally {
                    // Progress güncelle
                    completedCount++
                    uploadTimeout.setProgress(Math.round((completedCount / totalImages) * 100))
                }
            }

            // Concurrency Control: Aynı anda en fazla 3 dosya yükle (Browser limitlerine takılmamak ve kilitlenmemek için)
            const CONCURRENCY_LIMIT = 3
            for (let i = 0; i < imagesToUpload.length; i += CONCURRENCY_LIMIT) {
                if (uploadTimeout.checkCancelled() || mainAbortController.signal.aborted) {
                    console.log(`[BulkUpload] 🛑 Upload cancelled, stopping at chunk ${i / CONCURRENCY_LIMIT + 1}`)
                    break
                }
                const chunk = imagesToUpload.slice(i, i + CONCURRENCY_LIMIT)
                await Promise.all(chunk.map(img => uploadFile(img)))
            }

            // Cleanup: AbortController ve timeout'ları temizle
            mainAbortController.abort()
            uploadAbortControllers.current.delete('main-upload')
            uploadTimeoutIds.current.forEach((timeoutId) => {
                clearTimeout(timeoutId)
            })
            uploadTimeoutIds.current.clear()

            // 4. Final: Ürün İmajlarını Toplu Güncelle (DB Sync)
            if (productUpdates.size > 0 && !uploadTimeout.checkCancelled() && !mainAbortController.signal.aborted) {
                const updatesArray = Array.from(productUpdates.entries()).map(([productId, newUrls]) => {
                    const product = products.find(p => p.id === productId)
                    const currentImages = product?.images || (product?.image_url ? [product.image_url] : [])
                    return {
                        productId,
                        images: [...currentImages, ...newUrls].slice(0, 5)
                    }
                })

                await bulkUpdateProductImages(updatesArray)

                if (successCount === totalImages) {
                    toast.success("Tüm fotoğraflar başarıyla yüklendi.")
                    onSuccess()
                } else if (successCount > 0) {
                    toast.warning(`${successCount} fotoğraf yüklendi, ${totalImages - successCount} hata oluştu.`)
                    onSuccess()
                }
            } else if (totalImages > 0 && successCount === 0) {
                toast.error("Fotoğraflar yüklenemedi. Lütfen isimleri ve 5 resim limitini kontrol edin.")
            }
        })
    }

    const removeImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id))
    }

    const handleMatchChange = (imgId: string, productId: string) => {
        setImages(prev => prev.map(img => img.id === imgId ? { ...img, matchedProductId: productId === "none" ? null : productId } : img))
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
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
                                                            {sortedProducts.map(p => (
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
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>
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
