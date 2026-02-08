/**
 * Optimize and convert image to WebP format using Canvas API.
 * Resizes the image if it exceeds maxDimensions.
 */
export async function optimizeImage(
    file: File,
    options: {
        quality?: number,
        maxWidth?: number,
        maxHeight?: number
    } = {}
): Promise<{ blob: Blob, fileName: string }> {
    const {
        quality = 0.8,
        maxWidth = 2000,
        maxHeight = 2000
    } = options

    // Don't process very small files unless we want to force WebP
    if (file.size < 20 * 1024 && file.type === 'image/webp') {
        return { blob: file, fileName: file.name }
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                let width = img.width
                let height = img.height

                // Calculate aspect ratio for resizing
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height)
                    width = Math.round(width * ratio)
                    height = Math.round(height * ratio)
                }

                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Canvas context not available'))
                    return
                }

                // Smooth resizing
                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = 'high'
                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob((blob) => {
                    if (blob) {
                        // Keep original filename but change extension to .webp
                        const nameWithoutExt = file.name.replace(/\.[^.]+$/, '')
                        const newFileName = `${nameWithoutExt}.webp`
                        resolve({ blob, fileName: newFileName })
                    } else {
                        reject(new Error('Canvas conversion failed'))
                    }
                }, 'image/webp', quality)
            }
            img.onerror = () => reject(new Error('Image load failed'))
            img.src = e.target?.result as string
        }
        reader.onerror = () => reject(new Error('File read failed'))
        reader.readAsDataURL(file)
    })
}

/**
 * Backward compatibility alias
 */

/**
 * Generates an optimized Cloudinary URL with specified width and quality.
 * Handles both raw URLs and existing transformation params.
 */
export function getCloudinaryResizedUrl(url: string, width: number): string {
    if (!url || !url.includes('cloudinary.com')) return url;

    try {
        // If it's already a transformed URL, we might want to replace or strictly we just append params if it was raw.
        // Simple heuristic: inject w_{width},f_auto,q_auto after /upload/
        const parts = url.split('/upload/');
        if (parts.length < 2) return url;

        const [base, rest] = parts;
        // Check if there are existing params in 'rest'
        // Cloudinary params start with typical letters like w_, h_, c_, etc.
        // We will prepend our params.

        return `${base}/upload/w_${width},c_limit,f_auto,q_auto/${rest}`;
    } catch {
        return url;
    }
}
