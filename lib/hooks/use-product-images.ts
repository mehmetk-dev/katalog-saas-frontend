"use client"

import { useState, useRef, useCallback } from "react"
import { toast } from "sonner"
import { storage } from "@/lib/storage"
import { optimizeImage } from "@/lib/utils/image-utils"
import type { Product } from "@/lib/actions/products"

// ─── Types ──────────────────────────────────────────────────────────
export interface PendingImage {
    file: File
    previewUrl: string
    uploadId: string
}

interface UseProductImagesOptions {
    maxImages?: number
    maxFileSize?: number
    t: (key: string, params?: Record<string, unknown>) => string
}

// ─── Hook ───────────────────────────────────────────────────────────
export function useProductImages({ maxImages = 5, maxFileSize = 5 * 1024 * 1024, t }: UseProductImagesOptions) {
    const [activeImageUrl, setActiveImageUrl] = useState("")
    const [additionalImages, setAdditionalImages] = useState<string[]>([])
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
    const [isUploading, setIsUploading] = useState(false)

    const blobUrlsRef = useRef<string[]>([])
    const abortControllers = useRef<Map<string, AbortController>>(new Map())
    const timeoutIds = useRef<Map<string, NodeJS.Timeout>>(new Map())
    const toastIdRef = useRef<string | number | null>(null)

    // ─── Helpers ────────────────────────────────────────────────────────
    const revokeBlobUrl = useCallback((url: string) => {
        if (url.startsWith("blob:")) {
            URL.revokeObjectURL(url)
            blobUrlsRef.current = blobUrlsRef.current.filter((u) => u !== url)
        }
    }, [])

    const cancelAllUploads = useCallback(() => {
        abortControllers.current.forEach((c) => c.abort())
        abortControllers.current.clear()
        timeoutIds.current.forEach((id) => clearTimeout(id))
        timeoutIds.current.clear()
    }, [])

    // ─── Actions ────────────────────────────────────────────────────────
    const setCover = useCallback((url: string) => setActiveImageUrl(url), [])

    const removeImage = useCallback((index: number) => {
        setAdditionalImages((prev) => {
            const urlToRemove = prev[index]
            if (!urlToRemove) return prev

            // Clean pending & blob
            setPendingImages((p) => p.filter((pi) => pi.previewUrl !== urlToRemove))
            revokeBlobUrl(urlToRemove)

            const next = prev.filter((_, i) => i !== index)
            setActiveImageUrl((curr) => (curr === urlToRemove ? next[0] || "" : curr))
            return next
        })
    }, [revokeBlobUrl])

    const addFiles = useCallback((files: FileList) => {
        const savedCount = additionalImages.filter((u) => !u.startsWith("blob:")).length
        const allowed = maxImages - savedCount - pendingImages.length
        if (allowed <= 0) {
            toast.error(t("toasts.maxPhotosReached"))
            return
        }

        const accepted = Array.from(files).slice(0, allowed).filter((f) => {
            if (f.size > maxFileSize) {
                toast.error(`${f.name} çok büyük (Max ${maxFileSize / 1024 / 1024}MB).`)
                return false
            }
            return true
        })

        const newPending: PendingImage[] = accepted.map((file) => {
            const previewUrl = URL.createObjectURL(file)
            blobUrlsRef.current.push(previewUrl)
            return { file, previewUrl, uploadId: `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` }
        })

        setPendingImages((prev) => [...prev, ...newPending])
        setAdditionalImages((prev) => [...prev, ...newPending.map((p) => p.previewUrl)].slice(0, maxImages))

        if (!activeImageUrl && newPending.length > 0) {
            setActiveImageUrl(newPending[0].previewUrl)
        }
    }, [additionalImages, pendingImages.length, maxImages, maxFileSize, activeImageUrl, t])

    const refreshSession = useCallback(async () => {
        try {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            await supabase.auth.refreshSession()
        } catch { /* silent */ }
    }, [])

    // ─── Single Image Upload (with retry) ──────────────────────────────
    const uploadOne = useCallback(async (file: File, uploadId: string, signal?: AbortSignal): Promise<string> => {
        const MAX_RETRIES = 3
        const TIMEOUT_MS = 60_000

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            if (signal?.aborted) throw new Error("Upload cancelled")

            // Exponential backoff for retries
            if (attempt > 0) {
                const wait = 1000 * 2 ** (attempt - 1)
                await new Promise<void>((resolve, reject) => {
                    const timer = setTimeout(resolve, wait)
                    const check = setInterval(() => {
                        if (signal?.aborted) { clearInterval(check); clearTimeout(timer); reject(new Error("Upload cancelled")) }
                    }, 100)
                    setTimeout(() => clearInterval(check), wait)
                })
            }

            let timeoutTimer: NodeJS.Timeout | null = null
            try {
                // Optimize before upload
                let optimized = file
                try {
                    const { blob } = await optimizeImage(file, { maxWidth: 2000, maxHeight: 2000, quality: 0.8 })
                    optimized = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" })
                } catch { /* use original */ }

                const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

                const uploadPromise = storage.upload(optimized, {
                    path: "products",
                    contentType: optimized.type || "image/jpeg",
                    cacheControl: "3600",
                    fileName,
                    signal,
                })

                const timeoutPromise = new Promise<never>((_, reject) => {
                    timeoutTimer = setTimeout(() => reject(new Error("UPLOAD_TIMEOUT")), TIMEOUT_MS)
                    timeoutIds.current.set(uploadId, timeoutTimer)
                })

                const result = await Promise.race([uploadPromise, timeoutPromise]) as { url: string }
                if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutIds.current.delete(uploadId) }

                if (result?.url) return result.url
                throw new Error("Upload succeeded but URL missing")
            } catch (err) {
                if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutIds.current.delete(uploadId) }
                const msg = err instanceof Error ? err.message : String(err)
                if (msg === "Upload cancelled" || signal?.aborted) throw err
                if (attempt === MAX_RETRIES - 1) throw err
            }
        }
        throw new Error("Unexpected retry loop exit")
    }, [])

    // ─── Upload All Pending ─────────────────────────────────────────────
    const uploadPending = useCallback(async (): Promise<{ finalUrls: string[]; urlMap: Map<string, string> }> => {
        const snap = [...pendingImages]
        const currentUrls = [...additionalImages]

        if (snap.length === 0) {
            return { finalUrls: currentUrls.filter((u) => !u.startsWith("blob:")).slice(0, maxImages), urlMap: new Map() }
        }

        setIsUploading(true)
        const toastId = `img-upload-${Date.now()}`
        toastIdRef.current = toastId
        toast.loading(`Fotoğraflar yükleniyor (0/${snap.length})...`, { id: toastId })

        const mainAbort = new AbortController()
        abortControllers.current.set("main", mainAbort)
        const safetyTimer = setTimeout(() => mainAbort.abort(), 300_000)

        try {
            const uploaded: string[] = []
            const successPreviews: string[] = []
            const urlMap = new Map<string, string>()

            for (let i = 0; i < snap.length; i++) {
                if (mainAbort.signal.aborted) break
                const { file, previewUrl, uploadId } = snap[i]

                try {
                    toast.loading(`Yükleniyor (${i + 1}/${snap.length})...`, { id: toastId })
                    const publicUrl = await uploadOne(file, uploadId, mainAbort.signal)

                    uploaded.push(publicUrl)
                    successPreviews.push(previewUrl)
                    urlMap.set(previewUrl, publicUrl)

                    // Replace preview with real URL in state
                    setAdditionalImages((prev) => {
                        const idx = prev.indexOf(previewUrl)
                        if (idx >= 0) { const n = [...prev]; n[idx] = publicUrl; return n }
                        return prev.includes(publicUrl) ? prev : [...prev, publicUrl].slice(0, maxImages)
                    })
                    setActiveImageUrl((curr) => (curr === previewUrl ? publicUrl : curr))
                } catch {
                    // Remove failed preview
                    revokeBlobUrl(previewUrl)
                    setAdditionalImages((prev) => prev.filter((u) => u !== previewUrl))
                    setPendingImages((prev) => prev.filter((p) => p.uploadId !== uploadId))
                }
            }

            setPendingImages((prev) => prev.filter((p) => !successPreviews.includes(p.previewUrl)))

            const existing = currentUrls.filter((u) => !u.startsWith("blob:"))
            const finalUrls = [...existing, ...uploaded].slice(0, maxImages)
            setAdditionalImages(finalUrls)

            if (uploaded.length > 0) {
                toast.success(`${uploaded.length} fotoğraf yüklendi.`, { id: toastId })
            } else {
                toast.error("Fotoğraf yüklenemedi. İşlem durduruldu.", { id: toastId })
                throw new Error("No images uploaded")
            }

            return { finalUrls, urlMap }
        } finally {
            clearTimeout(safetyTimer)
            cancelAllUploads()
            setIsUploading(false)
        }
    }, [pendingImages, additionalImages, maxImages, uploadOne, revokeBlobUrl, cancelAllUploads])

    // ─── Reset (modal open/close) ──────────────────────────────────────
    const lastProductIdRef = useRef<string | null>(null)

    const initFromProduct = useCallback((product: Product | null) => {
        const pid = product?.id ?? null
        if (lastProductIdRef.current === pid) return
        lastProductIdRef.current = pid

        let images: string[] = []
        if (product?.images?.length) {
            images = [...product.images]
        } else if (product?.image_url) {
            images = [product.image_url]
            // Legacy additional_images in custom_attributes
            const legacy = product.custom_attributes?.find((a) => a.name === "additional_images")?.value
            if (legacy) {
                try {
                    const parsed = JSON.parse(legacy)
                    if (Array.isArray(parsed)) parsed.forEach((img: string) => { if (img && img !== product.image_url && !images.includes(img)) images.push(img) })
                } catch { /* ignore */ }
            }
        }

        const valid = images.filter((i): i is string => typeof i === "string" && i.length > 0)
        setAdditionalImages(valid)
        setActiveImageUrl(product?.image_url || valid[0] || "")
        setPendingImages([])
    }, [])

    const cleanup = useCallback(() => {
        cancelAllUploads()
        blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u))
        blobUrlsRef.current = []
        pendingImages.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl))
        setPendingImages([])
        setAdditionalImages([])
        setActiveImageUrl("")
        setIsUploading(false)
        if (toastIdRef.current) { toast.dismiss(toastIdRef.current); toastIdRef.current = null }
        lastProductIdRef.current = null
    }, [cancelAllUploads, pendingImages])

    return {
        activeImageUrl,
        additionalImages,
        pendingImages,
        isUploading,
        setCover,
        removeImage,
        addFiles,
        refreshSession,
        uploadPending,
        initFromProduct,
        cleanup,
    }
}
