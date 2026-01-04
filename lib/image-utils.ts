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
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                // Boyutlandırma hesapla
                let width = img.width;
                let height = img.height;

                // Büyük resimleri küçült
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
                    reject(new Error('Canvas context not available'));
                    return;
                }

                // Yüksek kaliteli scaling için
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                            resolve({
                                blob,
                                fileName: `${nameWithoutExt}.webp`,
                            });
                        } else {
                            reject(new Error('WebP conversion failed'));
                        }
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Image loading failed'));
        };
        reader.onerror = () => reject(new Error('File reading failed'));
    });
}
