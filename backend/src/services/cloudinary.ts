/**
 * Cloudinary Service
 * Cloudinary Admin API kullanarak fotoğraf yönetimi
 */

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend folder first, then try parent folder
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
const deletedFolder = process.env.CLOUDINARY_DELETED_FOLDER || 'deleted-images';

if (!cloudName || !apiKey || !apiSecret) {
    console.warn('⚠️ Cloudinary credentials missing! Photo deletion will be skipped.');
} else {
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });
}

/**
 * Cloudinary URL'den public_id çıkar
 * Format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
 * veya: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.{format}
 */
export function extractPublicId(photoUrl: string): string | null {
    if (!photoUrl) return null;

    // Cloudinary URL formatını kontrol et
    // Version ile: /image/upload/v1234567890/products/filename.webp
    // Version olmadan: /image/upload/products/filename.webp
    let match = photoUrl.match(/\/image\/upload\/(?:v\d+\/)?(.+)$/);
    if (match && match[1]) {
        // Format uzantısını kaldır (örn: .webp, .jpg)
        const publicId = match[1].replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
        console.log('[extractPublicId] Extracted:', { photoUrl, publicId });
        return publicId;
    }
    
    console.warn('[extractPublicId] Could not extract public_id from URL:', photoUrl);
    return null;
}

/**
 * Fotoğrafı Cloudinary'de deleted-images klasörüne taşı
 */
export async function movePhotoToDeletedFolder(photoUrl: string): Promise<boolean> {
    console.log('[movePhotoToDeletedFolder] Starting:', { photoUrl, deletedFolder, cloudName: !!cloudName, apiKey: !!apiKey, apiSecret: !!apiSecret });
    
    if (!cloudName || !apiKey || !apiSecret) {
        console.warn('[Cloudinary] Credentials missing, skipping photo move');
        return false;
    }

    const publicId = extractPublicId(photoUrl);
    if (!publicId) {
        console.warn('[Cloudinary] Could not extract public_id from URL:', photoUrl);
        return false;
    }

    try {
        // Eğer zaten deleted klasöründeyse, taşıma
        // Not: public_id artık sadece dosya adı olabilir, asset_folder kontrolü yapmalıyız
        // Ama basitlik için public_id'de klasör varsa kontrol edelim
        if (publicId.includes('/') && publicId.startsWith(`${deletedFolder}/`)) {
            console.log(`[Cloudinary] Photo already in ${deletedFolder} folder:`, publicId);
            return true;
        }

        // Dosya adını çıkar (klasör olmadan)
        // Eğer public_id'de klasör varsa (örn: products/filename), sadece dosya adını al
        let fileNameOnly: string;
        if (publicId.includes('/')) {
            // Klasör yapısı var (örn: products/filename)
            const parts = publicId.split('/');
            fileNameOnly = parts[parts.length - 1]; // Son kısım dosya adı
        } else {
            // Klasör yok, direkt dosya adı
            fileNameOnly = publicId;
        }

        // Yeni public_id: deletedFolder ile tam path (rename için gerekli)
        // Upload kodundaki mantık: folder parametresi ayrı, public_id tam path
        const newPublicId = `${deletedFolder}/${fileNameOnly}`;

        // Cloudinary rename API kullanarak taşı
        // invalidate: true - CDN cache'i temizler, değişikliğin hemen görünmesini sağlar
        const result = await cloudinary.uploader.rename(publicId, newPublicId, {
            overwrite: false, // Aynı isimde dosya varsa hata ver
            invalidate: true, // CDN cache'i temizle
        });

        // ÖNEMLİ: Upload kodundaki gibi, asset_folder metadata'sını güncelle
        // Bu, Media Library'de doğru klasörde görünmesini sağlar
        // Not: public_id'de klasör var ama asset_folder metadata'sı da güncellenmeli
        try {
            // Admin API ile asset_folder'ı güncelle
            // newPublicId tam path (deletedFolder/filename), asset_folder'ı da deletedFolder yapıyoruz
            await cloudinary.api.update(newPublicId, {
                asset_folder: deletedFolder, // Media Library'de görünecek klasör
                invalidate: true
            });
            console.log(`[Cloudinary] asset_folder updated to ${deletedFolder} for:`, newPublicId);
        } catch (updateError: any) {
            console.warn(`[Cloudinary] Failed to update asset_folder for ${newPublicId}:`, updateError.message);
            // asset_folder güncelleme hatası olsa bile devam et (public_id zaten değişti)
        }

        // Result'u detaylı logla
        console.log(`[Cloudinary] Photo moved to ${deletedFolder}:`, {
            from: publicId,
            to: newPublicId,
            resultPublicId: result.public_id,
            resultSecureUrl: result.secure_url,
            resultUrl: result.url,
            resultVersion: result.version,
            fullResult: JSON.stringify(result, null, 2)
        });

        // Result'un public_id'si yeni public_id ile eşleşmeli
        if (result.public_id !== newPublicId) {
            console.warn(`[Cloudinary] WARNING: Rename result public_id mismatch! Expected: ${newPublicId}, Got: ${result.public_id}`);
        }

        return true;
    } catch (error: any) {
        // Eğer dosya zaten yoksa veya başka bir hata varsa
        if (error.http_code === 404) {
            console.warn('[Cloudinary] Photo not found (already deleted?):', publicId);
            return false;
        }
        if (error.http_code === 409) {
            // Aynı isimde dosya zaten var
            console.warn(`[Cloudinary] Photo already exists in ${deletedFolder} folder:`, publicId);
            return true; // Zaten taşınmış sayılabilir
        }
        console.error('[Cloudinary] Error moving photo:', error);
        return false;
    }
}

/**
 * Birden fazla fotoğrafı deleted-images klasörüne taşı
 */
export async function movePhotosToDeletedFolder(photoUrls: string[]): Promise<{ success: number; failed: number }> {
    if (photoUrls.length === 0) {
        return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;

    // Paralel olarak taşı (ama rate limit'e dikkat)
    const results = await Promise.allSettled(
        photoUrls.map(url => movePhotoToDeletedFolder(url))
    );

    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
            success++;
        } else {
            failed++;
            console.error(`[Cloudinary] Failed to move photo ${index + 1}:`, photoUrls[index]);
        }
    });

    return { success, failed };
}
