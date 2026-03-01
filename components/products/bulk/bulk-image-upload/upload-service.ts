import { bulkUpdateProductImages } from "@/lib/actions/products"
import { optimizeImage } from "@/lib/utils/image-utils"
import { storage } from "@/lib/storage"
import { type ImageFile } from "./types"

const CONCURRENCY = 3
const MAX_RETRIES = 3
const TIMEOUT_MS = 60_000

type Status = ImageFile["status"]

interface UploadParams {
    images: ImageFile[]
    signal: AbortSignal
    onImageStatusChange: (imageId: string, status: Status, error?: string) => void
    onProgress: (processed: number, total: number) => void
    onBeforeDatabaseSync: () => void
}

const sleep = (ms: number, signal: AbortSignal): Promise<void> =>
    new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, ms)
        const onAbort = () => {
            clearTimeout(timeoutId)
            reject(new Error("Upload cancelled"))
        }
        signal.addEventListener("abort", onAbort, { once: true })
    })

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']

async function uploadSingleImageWithRetry(image: ImageFile, signal: AbortSignal): Promise<string> {
    const rawExt = (image.file.name.split(".").pop() || "").toLowerCase()
    const extension = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (signal.aborted) throw new Error("Upload cancelled")

        try {
            if (attempt > 0) {
                await sleep(1000 * 2 ** (attempt - 1), signal)
            }

            let fileToUpload = image.file
            try {
                const { blob } = await optimizeImage(image.file, {
                    maxWidth: 2000,
                    maxHeight: 2000,
                    quality: 0.8,
                })
                fileToUpload = new File([blob], image.file.name.replace(/\.[^.]+$/, ".webp"), {
                    type: "image/webp",
                })
            } catch (error) {
                console.warn("[BulkUpload] Optimization failed, uploading original:", error)
            }

            const uploadPromise = storage.upload(fileToUpload, {
                path: "products",
                contentType: fileToUpload.type || "image/jpeg",
                cacheControl: "3600",
                fileName,
                signal,
            })

            const timeoutPromise = new Promise<never>((_, reject) => {
                const timerId = setTimeout(() => reject(new Error("UPLOAD_TIMEOUT")), TIMEOUT_MS)
                // Upload bittiğinde timeout'u temizle — memory leak önlenir
                uploadPromise.finally(() => clearTimeout(timerId))
            })

            const result = (await Promise.race([uploadPromise, timeoutPromise])) as { url: string } | null
            if (result?.url) return result.url

            throw new Error("URL missing")
        } catch (error) {
            if ((error as Error).message === "Upload cancelled" || signal.aborted) throw error
            if (attempt === MAX_RETRIES - 1) throw error
        }
    }

    throw new Error("Max retries reached")
}

export async function uploadMatchedImages({
    images,
    signal,
    onImageStatusChange,
    onProgress,
    onBeforeDatabaseSync,
}: UploadParams): Promise<{ successCount: number; total: number }> {
    const imagesToUpload = images.filter((img) => img.status === "pending" && img.matchedProductId)
    const productUpdates = new Map<string, string[]>()
    let successCount = 0

    for (let i = 0; i < imagesToUpload.length; i += CONCURRENCY) {
        if (signal.aborted) break

        const chunk = imagesToUpload.slice(i, i + CONCURRENCY)
        await Promise.all(
            chunk.map(async (img) => {
                if (signal.aborted) return
                onImageStatusChange(img.id, "uploading")

                try {
                    const url = await uploadSingleImageWithRetry(img, signal)
                    onImageStatusChange(img.id, "success")

                    const productId = img.matchedProductId!
                    const current = productUpdates.get(productId) || []
                    productUpdates.set(productId, [...current, url])
                    successCount++
                } catch (error) {
                    onImageStatusChange(img.id, "error", (error as Error).message)
                }
            }),
        )

        onProgress(Math.min(i + CONCURRENCY, imagesToUpload.length), imagesToUpload.length)
    }

    if (productUpdates.size > 0 && !signal.aborted) {
        onBeforeDatabaseSync()
        await bulkUpdateProductImages(
            Array.from(productUpdates.entries()).map(([productId, urls]) => ({
                productId,
                images: urls,
            })),
        )
    }

    return { successCount, total: imagesToUpload.length }
}
