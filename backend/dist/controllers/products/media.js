"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupProductPhotos = exports.collectPhotoUrlsFromProducts = exports.collectProductPhotoUrls = exports.normalizeCoverAndImages = exports.deletePhotosFromSupabase = exports.extractSupabasePath = void 0;
const supabase_1 = require("../../services/supabase");
const cloudinary_1 = require("../../services/cloudinary");
const resolveStorageProvider = () => process.env.STORAGE_PROVIDER || process.env.NEXT_PUBLIC_STORAGE_PROVIDER || 'supabase';
const extractSupabasePath = (photoUrl, bucketName = 'product-images') => {
    if (!photoUrl)
        return null;
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
    }
    catch (error) {
        console.warn('[extractSupabasePath] Invalid URL format:', photoUrl);
        return null;
    }
};
exports.extractSupabasePath = extractSupabasePath;
const deletePhotosFromSupabase = async (photoUrls, bucketName = 'product-images') => {
    if (photoUrls.length === 0) {
        return { success: 0, failed: 0 };
    }
    const paths = [];
    for (const photoUrl of photoUrls) {
        const path = (0, exports.extractSupabasePath)(photoUrl, bucketName);
        if (path) {
            paths.push(path);
        }
        else {
            console.warn('[deletePhotosFromSupabase] Could not extract path from URL:', photoUrl);
        }
    }
    if (paths.length === 0) {
        return { success: 0, failed: photoUrls.length };
    }
    try {
        const { error } = await supabase_1.supabase.storage
            .from(bucketName)
            .remove(paths);
        if (error) {
            console.error('[deletePhotosFromSupabase] Error deleting photos:', error);
            return { success: 0, failed: paths.length };
        }
        return { success: paths.length, failed: photoUrls.length - paths.length };
    }
    catch (error) {
        console.error('[deletePhotosFromSupabase] Exception deleting photos:', error);
        return { success: 0, failed: paths.length };
    }
};
exports.deletePhotosFromSupabase = deletePhotosFromSupabase;
const normalizeCoverAndImages = (rawImages, rawCover, options) => {
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
exports.normalizeCoverAndImages = normalizeCoverAndImages;
const collectProductPhotoUrls = (product) => {
    const photoUrls = [];
    const seen = new Set();
    const pushUrl = (url) => {
        if (!url || seen.has(url))
            return;
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
exports.collectProductPhotoUrls = collectProductPhotoUrls;
const collectPhotoUrlsFromProducts = (products) => {
    const photoUrls = [];
    const seen = new Set();
    for (const product of products) {
        const urls = (0, exports.collectProductPhotoUrls)(product);
        urls.forEach((url) => {
            if (seen.has(url))
                return;
            seen.add(url);
            photoUrls.push(url);
        });
    }
    return photoUrls;
};
exports.collectPhotoUrlsFromProducts = collectPhotoUrlsFromProducts;
const cleanupProductPhotos = async (photoUrls, context) => {
    if (photoUrls.length === 0) {
        return;
    }
    const storageProvider = resolveStorageProvider();
    if (storageProvider === 'cloudinary') {
        try {
            const moveResult = await (0, cloudinary_1.movePhotosToDeletedFolder)(photoUrls);
            if (moveResult.failed > 0) {
                console.warn(`[${context}] ${moveResult.failed} fotoğraf deletedproducts klasörüne taşınamadı, ürün yine de silinecek.`);
            }
        }
        catch (moveError) {
            console.error(`[${context}] Error moving photos to deletedproducts:`, moveError);
            console.warn(`[${context}] Ürün silme işlemine devam ediliyor (fotoğraflar taşınamadı).`);
        }
        return;
    }
    try {
        const deleteResult = await (0, exports.deletePhotosFromSupabase)(photoUrls);
        if (deleteResult.failed > 0) {
            console.warn(`[${context}] ${deleteResult.failed} fotoğraf Supabase'den silinemedi, ürün yine de silinecek.`);
        }
    }
    catch (deleteError) {
        console.error(`[${context}] Error deleting photos from Supabase:`, deleteError);
        console.warn(`[${context}] Ürün silme işlemine devam ediliyor (fotoğraflar silinemedi).`);
    }
};
exports.cleanupProductPhotos = cleanupProductPhotos;
