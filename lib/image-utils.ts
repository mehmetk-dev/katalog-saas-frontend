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
        // 20 saniyelik güvenlik sınırı (FileReader + Image load + Canvas işlemleri için)
        const timeout = setTimeout(() => {
            console.error(`[convertToWebP] Zaman aşımı: ${file.name}`)
            reject(new Error('TIMEOUT'))
        }, 20000)

        let isResolved = false
        const cleanup = () => {
            if (!isResolved) {
                clearTimeout(timeout)
                isResolved = true
            }
        }

        const reader = new FileReader();
        
        // FileReader timeout kontrolü
        const readerTimeout = setTimeout(() => {
            if (!isResolved) {
                cleanup()
                reject(new Error('FileReader timeout'))
            }
        }, 10000) // 10 saniye FileReader için

        reader.readAsDataURL(file);

        reader.onload = (event) => {
            clearTimeout(readerTimeout)
            if (isResolved) return

            const img = new Image();
            
            // Image load timeout kontrolü
            const imgTimeout = setTimeout(() => {
                if (!isResolved) {
                    return
                }
                cleanup()
                reject(new Error('Image load timeout'))
            }, 8000) // 8 saniye image load için

            img.src = event.target?.result as string;

            img.onload = () => {
                clearTimeout(imgTimeout)
                if (isResolved) return

                try {
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
                        cleanup()
                        reject(new Error('Canvas context not available'));
                        return;
                    }

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (isResolved) return
                            cleanup()
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
                    cleanup()
                    reject(e instanceof Error ? e : new Error('Canvas processing error'));
                }
            };

            img.onerror = () => {
                clearTimeout(imgTimeout)
                if (isResolved) return
                cleanup()
                reject(new Error('Image load failed'))
            }
        };

        reader.onerror = () => {
            clearTimeout(readerTimeout)
            if (isResolved) return
            cleanup()
            reject(new Error('File read failed'))
        }
    });
}
