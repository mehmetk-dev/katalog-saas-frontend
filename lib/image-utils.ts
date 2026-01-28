/**
 * Image Utilities
 * Shared image processing functions.
 */

/**
 * Converts an image file to WebP format using Canvas API.
 * This is a client-side utility.
 */
export async function convertToWebP(file: File, quality: number = 0.8): Promise<{ blob: Blob, fileName: string }> {
    // If file is already webp or too small, return as is (optional optimization)
    if (file.type === 'image/webp' || file.size < 50 * 1024) {
        return { blob: file, fileName: file.name }
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Canvas context not available'))
                    return
                }

                ctx.drawImage(img, 0, 0)

                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFileName = file.name.replace(/\.[^.]+$/, '.webp')
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
