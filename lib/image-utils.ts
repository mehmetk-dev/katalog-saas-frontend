/**
 * Converts an image file to WebP format using the browser's Canvas API.
 * This helps reduce file size without significant quality loss.
 */
export async function convertToWebP(file: File, quality: number = 0.8): Promise<{ blob: Blob; fileName: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }
                ctx.drawImage(img, 0, 0);
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
