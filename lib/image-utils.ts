/**
 * Converts an image file to WebP format using the browser's Canvas API.
 * Automatically resizes large images and compresses for optimal upload.
 * 
 * @param file - Original image file
 * @param maxDimension - Maximum width or height (default 1920px)
 * @param quality - WebP quality 0-1 (default 0.75)
 */
export async function convertToWebP(
    file: File,
    maxDimension: number = 1920,
    quality: number = 0.75
): Promise<{ blob: Blob; fileName: string }> {
    // OPTİMİZASYON: Dosya zaten küçükse (250KB altı) veya çok küçükse, işlem yapma.
    if (file.size < 250 * 1024) {
        return {
            blob: file,
            fileName: file.name
        };
    }

    return new Promise((resolve, reject) => {
        // 15 saniyelik güvenlik sınırı
        const timeout = setTimeout(() => {
            console.error(`[convertToWebP] Zaman aşımı: ${file.name}`)
            reject(new Error('TIMEOUT'))
        }, 15000)

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                // ... Boyutlandırma hesapla (mevcut mantık) ...
                let width = img.width;
                let height = img.height;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    clearTimeout(timeout)
                    reject(new Error('Canvas context not available'));
                    return;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                try {
                    canvas.toBlob(
                        (blob) => {
                            clearTimeout(timeout)
                            if (blob) {
                                resolve({ blob, fileName: `${file.name.split('.')[0]}.webp` });
                            } else {
                                reject(new Error('Blob null'));
                            }
                        },
                        'image/webp',
                        quality
                    );
                } catch (e) {
                    clearTimeout(timeout)
                    reject(e);
                }
            };

            img.onerror = () => {
                clearTimeout(timeout)
                reject(new Error('IMG_LOAD_ERR'))
            }
        };

        reader.onerror = () => {
            clearTimeout(timeout)
            reject(new Error('READ_ERR'))
        }
    });
}
