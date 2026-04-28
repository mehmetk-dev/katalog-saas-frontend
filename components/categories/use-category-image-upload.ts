"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { getSessionSafe } from "@/lib/supabase/client"
import { storage } from "@/lib/storage"
import { optimizeImage } from "@/lib/utils/image-utils"
import { useTranslation } from "@/lib/contexts/i18n-provider"

interface UseCategoryImageUploadOptions {
    onSuccess: (url: string) => void
}

export function useCategoryImageUpload({ onSuccess }: UseCategoryImageUploadOptions) {
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { t } = useTranslation()

    // Upload işlemlerini iptal etmek için ref'ler
    const uploadAbortController = useRef<AbortController | null>(null)
    const uploadTimeoutId = useRef<NodeJS.Timeout | null>(null)

    // Component unmount olduğunda tüm toast'ları ve upload'ları temizle
    useEffect(() => {
        return () => {
            if (uploadAbortController.current) uploadAbortController.current.abort()
            if (uploadTimeoutId.current) clearTimeout(uploadTimeoutId.current)
            toast.dismiss()
        }
    }, [])

    // Fotoğraf yükleme alanına tıklandığında (daha dosya seçilmeden) oturumu tazele (Just-in-Time)
    const _handleUploadClick = async () => {
        try {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            const { error } = await supabase.auth.refreshSession()
            if (error) console.error('[Categories] Pre-upload session refresh failed:', error)
        } catch (e) {
            console.error('[Categories] handleUploadClick error:', e)
        }
    }

    // YENİ: Tekil dosya yükleme ve Retry (Yeniden Deneme) mantığı
    const uploadCategoryImageWithRetry = async (file: File, signal?: AbortSignal): Promise<string> => {
        const MAX_RETRIES = 3
        const TIMEOUT_MS = 60000 // 60 Saniye

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            // İptal kontrolü
            if (signal?.aborted) {
                throw new Error('Upload cancelled')
            }

            let timeoutId: NodeJS.Timeout | null = null

            let retryToastId: string | number | null = null

            try {
                // 1. Bekleme Süresi (Exponential Backoff - İlk denemede beklemez)
                if (attempt > 0) {
                    const waitTime = 1000 * Math.pow(2, attempt - 1)
                    retryToastId = toast.loading(t('toasts.retryingConnection', { attempt: attempt + 1, max: MAX_RETRIES }) as string)

                    await new Promise<void>((resolve, reject) => {
                        const checkInterval = setInterval(() => {
                            if (signal?.aborted) {
                                clearInterval(checkInterval)
                                if (retryToastId) toast.dismiss(retryToastId)
                                reject(new Error('Upload cancelled'))
                            }
                        }, 100)

                        setTimeout(() => {
                            clearInterval(checkInterval)
                            if (retryToastId) toast.dismiss(retryToastId)
                            resolve()
                        }, waitTime)
                    })
                }

                if (signal?.aborted) {
                    throw new Error('Upload cancelled')
                }

                // 2. Dosya adı oluştur
                const fileExtension = file.name.split('.').pop() || 'jpg'
                const fileName = `category-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`

                // 2. OPTİMİZASYON: Cloudinary'ye gitmeden önce resmi küçült ve WebP'ye çevir
                let fileToUpload = file
                try {
                    const { blob } = await optimizeImage(file, { maxWidth: 2000, maxHeight: 2000, quality: 0.8 })
                    fileToUpload = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' })
                } catch (optError) {
                    console.warn('[Categories] Optimization failed, sending original:', optError)
                }

                // 3. YARIŞ BAŞLASIN: Upload vs Timeout
                const uploadPromise = storage.upload(fileToUpload, {
                    path: 'categories',
                    contentType: fileToUpload.type || 'image/jpeg',
                    cacheControl: '3600',
                    fileName,
                    signal,
                })

                // Timeout promise'i (temizlenebilir)
                const timeoutPromise = new Promise<never>((_, reject) => {
                    timeoutId = setTimeout(() => {
                        console.error(`[Categories] ⏱️ Upload timeout for ${file.name} after ${TIMEOUT_MS / 1000} seconds`)
                        reject(new Error('UPLOAD_TIMEOUT'))
                    }, TIMEOUT_MS)

                    // Timeout ID'yi kaydet (temizlemek için)
                    uploadTimeoutId.current = timeoutId
                })

                const result = await Promise.race([uploadPromise, timeoutPromise]) as { url: string } | null

                // Timeout'u temizle (başarılı olduysa)
                if (timeoutId) {
                    clearTimeout(timeoutId)
                    uploadTimeoutId.current = null
                    timeoutId = null
                }
                // Retry toast'unu kapat
                if (retryToastId) {
                    toast.dismiss(retryToastId)
                    retryToastId = null
                }

                // 4. Sonuç Kontrolü
                if (result && result.url) {
                    return result.url // Başarılı! URL'i döndür ve fonksiyondan çık.
                } else {
                    throw new Error('Upload successful but URL is missing')
                }

            } catch (error: unknown) {
                // Timeout'u temizle (hata durumunda)
                if (timeoutId) {
                    clearTimeout(timeoutId)
                    uploadTimeoutId.current = null
                    timeoutId = null
                }
                // Retry toast'unu kapat
                if (retryToastId) {
                    toast.dismiss(retryToastId)
                    retryToastId = null
                }

                // İptal hatası ise direkt fırlat
                if ((error as Error).message === 'Upload cancelled' || signal?.aborted) {
                    throw error
                }

                console.error(`[Categories] ❌ Attempt ${attempt + 1} failed:`, (error as Error).message)

                // Eğer son denemeyse hatayı fırlat ki ana fonksiyon yakalasın
                if (attempt === MAX_RETRIES - 1) {
                    throw error
                }
                // Değilse döngü başa döner ve tekrar dener
            }
        }
        throw new Error('Unexpected retry loop exit')
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error(t('toasts.invalidImageFile'))
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error(t('toasts.imageSizeLimit', { size: '5' }))
            return
        }

        // Önceki upload'ı iptal et
        if (uploadAbortController.current) {
            uploadAbortController.current.abort()
        }
        if (uploadTimeoutId.current) {
            clearTimeout(uploadTimeoutId.current)
            uploadTimeoutId.current = null
        }

        // Yeni AbortController oluştur
        const abortController = new AbortController()
        uploadAbortController.current = abortController

        setIsUploadingImage(true)

        try {
            // 0. Oturum Kontrolü (Daha dayanıklı)
            const session = await getSessionSafe()
            if (!session?.access_token) {
                toast.error(t('auth.sessionExpired') as string)
                return
            }

            // YUKARIDAKİ AKILLI FONKSİYONU ÇAĞIRIYORUZ
            const publicUrl = await uploadCategoryImageWithRetry(file, abortController.signal)

            onSuccess(publicUrl)
            toast.success(t('toasts.imageUploaded'))
        } catch (error: unknown) {
            // İptal hatası ise sessizce geç
            if ((error as Error).message === 'Upload cancelled' || abortController.signal.aborted) {
                return
            }

            console.error('Upload error:', error)

            const errorMessage = (error as Error).message?.includes('UPLOAD_TIMEOUT') || (error as Error).message?.includes('timeout')
                ? t('auth.timeout')
                : t('toasts.imageUploadFailed')

            toast.error(errorMessage)
        } finally {
            // Cleanup
            uploadAbortController.current = null
            if (uploadTimeoutId.current) {
                clearTimeout(uploadTimeoutId.current)
                uploadTimeoutId.current = null
            }

            setIsUploadingImage(false)
            if (e.target) e.target.value = ''
        }
    }

    return {
        isUploadingImage,
        fileInputRef,
        handleImageUpload,
    }
}
