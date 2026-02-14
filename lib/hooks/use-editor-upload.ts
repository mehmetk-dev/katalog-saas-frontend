"use client"

import { useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { storage } from "@/lib/storage"

interface UseEditorUploadOptions {
    onLogoUrlChange?: (url: string | null) => void
    onCoverImageUrlChange?: (url: string | null) => void
    onBackgroundImageChange?: (url: string | null) => void
    backgroundImage?: string | null
}

export function useEditorUpload({
    onLogoUrlChange,
    onCoverImageUrlChange,
    onBackgroundImageChange,
    backgroundImage,
}: UseEditorUploadOptions) {
    const logoInputRef = useRef<HTMLInputElement>(null)
    const bgInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)

    // Upload işlemlerini iptal etmek için ref'ler
    const uploadAbortControllers = useRef<Map<string, AbortController>>(new Map())
    const uploadTimeoutIds = useRef<Map<string, NodeJS.Timeout>>(new Map())

    // Component unmount olduğunda tüm toast'ları ve upload'ları temizle
    useEffect(() => {
        const controllers = uploadAbortControllers.current
        const timeouts = uploadTimeoutIds.current

        return () => {
            controllers.forEach(controller => controller.abort())
            timeouts.forEach(timeout => clearTimeout(timeout))
            toast.dismiss()
        }
    }, [])

    // Sayfa açıldığında oturumu arka planda tazele
    useEffect(() => {
        const refreshSessionInBackground = async () => {
            try {
                const { createClient } = await import("@/lib/supabase/client")
                const supabase = createClient()
                await supabase.auth.refreshSession()
            } catch {
                // Silent error
            }
        }
        refreshSessionInBackground()
    }, [])

    // Fotoğraf yükleme alanına tıklandığında session check
    const handleUploadClick = useCallback(async () => {
        try {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            await supabase.auth.getSession()
        } catch (e) {
            console.error('[useEditorUpload] handleUploadClick session check error:', e)
        }
    }, [])

    // Tekil dosya yükleme ve Retry mantığı
    const uploadFileWithRetry = useCallback(async (
        file: File,
        type: 'logo' | 'bg' | 'cover',
        parentSignal?: AbortSignal,
        onProgress?: (status: string) => void
    ): Promise<string> => {
        const MAX_RETRIES = 3
        const TIMEOUT_MS = type === 'bg' ? 120000 : 30000

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            if (parentSignal?.aborted) throw new Error('Upload cancelled')

            const currentAttemptController = new AbortController()
            let timeoutId: NodeJS.Timeout | null = null

            try {
                if (attempt > 0) {
                    const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
                    onProgress?.(`Tekrar deneniyor (${attempt + 1}/${MAX_RETRIES})...`)

                    await new Promise<void>((resolve, reject) => {
                        const checkInterval = setInterval(() => {
                            if (parentSignal?.aborted) {
                                clearInterval(checkInterval)
                                reject(new Error('Upload cancelled'))
                            }
                        }, 100)
                        setTimeout(() => { clearInterval(checkInterval); resolve(); }, waitTime)
                    })
                }

                if (parentSignal?.aborted) {
                    throw new Error('Upload cancelled')
                }
                onProgress?.(attempt > 0 ? `Yükleniyor (Deneme ${attempt + 1})...` : 'Yükleniyor...')

                const fileExtension = file.name.split('.').pop() || 'jpg'
                const fileName = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExtension}`
                const folder = type === 'logo' ? 'company-logos' : (type === 'cover' ? 'catalog-covers' : 'catalog-backgrounds')

                const uploadPromise = storage.upload(file, {
                    path: folder,
                    contentType: file.type || 'image/jpeg',
                    cacheControl: '3600',
                    fileName,
                    signal: currentAttemptController.signal,
                })

                const timeoutPromise = new Promise<never>((_, reject) => {
                    timeoutId = setTimeout(() => {
                        console.warn(`[useEditorUpload] ⏱️ Attempt ${attempt + 1} timeout (${TIMEOUT_MS / 1000}s)`)
                        currentAttemptController.abort()
                        reject(new Error('UPLOAD_TIMEOUT'))
                    }, TIMEOUT_MS)
                })

                if (parentSignal) {
                    parentSignal.addEventListener('abort', () => currentAttemptController.abort())
                }

                const result = (await Promise.race([uploadPromise, timeoutPromise])) as { url: string }

                if (timeoutId) clearTimeout(timeoutId)

                if (result?.url) return result.url
                throw new Error('URL dönmedi')

            } catch (error: unknown) {
                if (timeoutId) clearTimeout(timeoutId)
                currentAttemptController.abort()

                const errorMessage = error instanceof Error ? error.message : String(error)

                if (errorMessage === 'Upload cancelled' || parentSignal?.aborted) {
                    throw new Error('Upload cancelled')
                }

                if (attempt === MAX_RETRIES - 1) throw error
            }
        }
        throw new Error("Yükleme başarıyla tamamlanamadı.")
    }, [])

    // Logo/BG/Cover Upload Logic
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bg' | 'cover') => {
        const file = e.target.files?.[0]
        if (!file) return

        const limit = type === 'logo' ? 2 : 10
        if (file.size > limit * 1024 * 1024) {
            toast.error(`Dosya çok büyük. Maksimum ${limit}MB yüklenebilir.`)
            if (e.target) e.target.value = ''
            return
        }

        const uploadKey = `${type}-upload`
        const existingController = uploadAbortControllers.current.get(uploadKey)
        if (existingController) {
            existingController.abort()
        }

        const abortController = new AbortController()
        uploadAbortControllers.current.set(uploadKey, abortController)

        const existingTimeout = uploadTimeoutIds.current.get(uploadKey)
        if (existingTimeout) {
            clearTimeout(existingTimeout)
            uploadTimeoutIds.current.delete(uploadKey)
        }

        const typeLabel = type === 'logo' ? 'Logo' : (type === 'cover' ? 'Kapak' : 'Arka plan')
        const toastId = `upload-${type}-${Date.now()}`
        toast.loading(`${typeLabel} hazırlanıyor...`, { id: toastId })

        try {
            toast.loading(`${typeLabel} gönderiliyor...`, { id: toastId })

            const publicUrl = await uploadFileWithRetry(file, type, abortController.signal, (status) => {
                toast.loading(`${typeLabel}: ${status}`, { id: toastId })
            })

            if (type === 'logo') {
                onLogoUrlChange?.(publicUrl)
                try {
                    const { updateUserLogo } = await import("@/lib/actions/auth")
                    await updateUserLogo(publicUrl)
                } catch (syncError) {
                    console.warn("[useEditorUpload] Logo sync to profile failed:", syncError)
                }
            } else if (type === 'cover') {
                onCoverImageUrlChange?.(publicUrl)
            } else {
                onBackgroundImageChange?.(publicUrl)
            }

            toast.success(`${typeLabel} yüklendi.`, { id: toastId })
        } catch (error: unknown) {
            console.error(`[useEditorUpload] ❌ Error:`, error)

            const errorMessage = error instanceof Error ? error.message : String(error)

            if (errorMessage === 'Upload cancelled' || abortController.signal.aborted) {
                toast.dismiss(toastId)
                return
            }

            let userMessage = "Yükleme başarısız."
            if (errorMessage === 'SESSION_TIMEOUT') userMessage = "Oturum doğrulanamadı, lütfen tekrar deneyin."
            else if (errorMessage === 'UPLOAD_TIMEOUT') userMessage = "İşlem çok uzun sürdü, bağlantınızı kontrol edin."
            else if (errorMessage.includes('too large')) userMessage = "Dosya boyutu çok büyük."
            else userMessage = `Hata: ${errorMessage.substring(0, 40)}`

            toast.error(userMessage, { id: toastId })
        } finally {
            uploadAbortControllers.current.delete(uploadKey)
            if (e.target) e.target.value = ''
        }
    }, [onLogoUrlChange, onCoverImageUrlChange, onBackgroundImageChange, uploadFileWithRetry])

    // Arka plan resmi kaldırıldığında devam eden upload'ları iptal et
    useEffect(() => {
        if (backgroundImage === null) {
            const bgUploadKey = 'bg-upload'
            const controller = uploadAbortControllers.current.get(bgUploadKey)
            if (controller) {
                controller.abort()
                uploadAbortControllers.current.delete(bgUploadKey)
            }

            const timeout = uploadTimeoutIds.current.get(bgUploadKey)
            if (timeout) {
                clearTimeout(timeout)
                uploadTimeoutIds.current.delete(bgUploadKey)
            }
        }
    }, [backgroundImage])

    return {
        logoInputRef,
        bgInputRef,
        coverInputRef,
        handleUploadClick,
        handleFileUpload,
    }
}
