import { supabase } from '../../services/supabase';
import { movePhotosToDeletedFolder } from '../../services/cloudinary';

interface ProductMedia {
    image_url?: string | null;
    images?: string[] | null;
}

const resolveStorageProvider = () =>
    process.env.STORAGE_PROVIDER || process.env.NEXT_PUBLIC_STORAGE_PROVIDER || 'supabase';

export const extractSupabasePath = (photoUrl: string, bucketName: string = 'product-images'): string | null => {
    if (!photoUrl) return null;

    try {
        const urlObj = new URL(photoUrl);

        const publicMatch = urlObj.pathname.match(new RegExp(`/storage/v1/object/public/${bucketName}/(.+)`));
        if (publicMatch) {
            return publicMatch[1];
        }

        const signedMatch = urlObj.pathname.match(new RegExp(`/storage/v1/object/sign/${bucketName}/(.+)`));
        if (signedMatch) {
            return signedMatch[1];
        }

        const altMatch = urlObj.pathname.match(new RegExp(`${bucketName}/(.+)`));
        if (altMatch) {
            return altMatch[1];
        }

        return null;
    } catch (error) {
        console.warn('[extractSupabasePath] Invalid URL format:', photoUrl);
        return null;
    }
};

export const deletePhotosFromSupabase = async (
    photoUrls: string[],
    bucketName: string = 'product-images'
): Promise<{ success: number; failed: number }> => {
    if (photoUrls.length === 0) {
        return { success: 0, failed: 0 };
    }

    const paths: string[] = [];

    for (const photoUrl of photoUrls) {
        const path = extractSupabasePath(photoUrl, bucketName);
        if (path) {
            paths.push(path);
        } else {
            console.warn('[deletePhotosFromSupabase] Could not extract path from URL:', photoUrl);
        }
    }

    if (paths.length === 0) {
        return { success: 0, failed: photoUrls.length };
    }

    try {
        const { error } = await supabase.storage
            .from(bucketName)
            .remove(paths);

        if (error) {
            console.error('[deletePhotosFromSupabase] Error deleting photos:', error);
            return { success: 0, failed: paths.length };
        }

        return { success: paths.length, failed: photoUrls.length - paths.length };
    } catch (error: unknown) {
        console.error('[deletePhotosFromSupabase] Exception deleting photos:', error);
        return { success: 0, failed: paths.length };
    }
};

export const normalizeCoverAndImages = (
    rawImages: string[] | null | undefined,
    rawCover: string | null | undefined,
    options?: { allowCoverFallback?: boolean }
): { image_url: string | null; images: string[] } => {
    const uniqueImages = Array.from(new Set((rawImages || []).filter(Boolean)));
    const allowCoverFallback = options?.allowCoverFallback ?? true;

    const cover = (rawCover && rawCover.trim() !== '')
        ? rawCover
        : (allowCoverFallback ? (uniqueImages[0] || null) : null);

    if (!cover) {
        return { image_url: null, images: uniqueImages };
    }

    const ordered = [cover, ...uniqueImages.filter((img) => img !== cover)].slice(0, 20);
    return { image_url: cover, images: ordered };
};

export const collectProductPhotoUrls = (product: ProductMedia): string[] => {
    const photoUrls: string[] = [];
    const seen = new Set<string>();

    const pushUrl = (url?: string | null) => {
        if (!url || seen.has(url)) return;
        seen.add(url);
        photoUrls.push(url);
    };

    pushUrl(product.image_url);

    if (product.images && Array.isArray(product.images)) {
        product.images.forEach((photoUrl) => {
            pushUrl(photoUrl);
        });
    }

    return photoUrls;
};

export const collectPhotoUrlsFromProducts = (products: ProductMedia[]): string[] => {
    const photoUrls: string[] = [];
    const seen = new Set<string>();

    for (const product of products) {
        const urls = collectProductPhotoUrls(product);
        urls.forEach((url) => {
            if (seen.has(url)) return;
            seen.add(url);
            photoUrls.push(url);
        });
    }

    return photoUrls;
};

export const cleanupProductPhotos = async (photoUrls: string[], context: 'deleteProduct' | 'bulkDeleteProducts') => {
    if (photoUrls.length === 0) {
        return;
    }

    const storageProvider = resolveStorageProvider();

    if (storageProvider === 'cloudinary') {
        try {
            const moveResult = await movePhotosToDeletedFolder(photoUrls);

            if (moveResult.failed > 0) {
                console.warn(`[${context}] ${moveResult.failed} fotoğraf deletedproducts klasörüne taşınamadı, ürün yine de silinecek.`);
            }
        } catch (moveError: unknown) {
            console.error(`[${context}] Error moving photos to deletedproducts:`, moveError);
            console.warn(`[${context}] Ürün silme işlemine devam ediliyor (fotoğraflar taşınamadı).`);
        }
        return;
    }

    try {
        const deleteResult = await deletePhotosFromSupabase(photoUrls);

        if (deleteResult.failed > 0) {
            console.warn(`[${context}] ${deleteResult.failed} fotoğraf Supabase'den silinemedi, ürün yine de silinecek.`);
        }
    } catch (deleteError: unknown) {
        console.error(`[${context}] Error deleting photos from Supabase:`, deleteError);
        console.warn(`[${context}] Ürün silme işlemine devam ediliyor (fotoğraflar silinemedi).`);
    }
};
