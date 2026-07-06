"use strict";
/**
 * Cloudinary Service
 * Cloudinary Admin API kullanarak fotoğraf yönetimi
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPublicId = extractPublicId;
exports.movePhotoToDeletedFolder = movePhotoToDeletedFolder;
exports.movePhotosToDeletedFolder = movePhotosToDeletedFolder;
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env from backend folder first, then try parent folder
dotenv_1.default.config();
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env.local') });
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
const deletedFolder = process.env.CLOUDINARY_DELETED_FOLDER || 'deleted-images';
if (!cloudName || !apiKey || !apiSecret) {
    console.warn('⚠️ Cloudinary credentials missing! Photo deletion will be skipped.');
}
else {
    cloudinary_1.v2.config({
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
function extractPublicId(photoUrl) {
    if (!photoUrl)
        return null;
    // Cloudinary URL formatını analiz et
    // Format: /image/upload/[transformations]/[version/]/[folder/]/filename.ext
    // 1. /upload/ kısmından sonrasını al
    const parts = photoUrl.split('/image/upload/');
    if (parts.length < 2) {
        console.warn('[extractPublicId] Invalid Cloudinary URL format:', photoUrl);
        return null;
    }
    let remainingPath = parts[1];
    // 2. Uzantıyı kaldır (.jpg, .webp vb.)
    remainingPath = remainingPath.replace(/\.[^/.]+$/, "");
    // 3. Path'i parçalara böl
    let segments = remainingPath.split('/');
    // 4. Transformasyonları ve Versiyonu Temizle
    // Genellikle ilk segmentler transformasyon olabilir (f_auto, w_100 vb.)
    // Versiyon 'v' ile başlar ve sayı içerir (v123456)
    const cleanSegments = [];
    let isFolderReached = false;
    for (const segment of segments) {
        // Eğer bir klasör/dosya yapısına ulaştığımızı düşünüyorsak, geri kalan her şeyi ekle
        if (isFolderReached) {
            cleanSegments.push(segment);
            continue;
        }
        // Versiyonu atla (v1234...)
        if (segment.match(/^v\d+$/)) {
            continue;
        }
        // Transformasyonları atla (virgül, eşittir içerir veya bilinen prefixler)
        // Örn: f_auto, q_auto, w_1600, c_limit
        if (segment.includes(',') || segment.includes('_') || segment.startsWith('f_') || segment.startsWith('q_')) {
            // Ancak segment 'products' veya 'categories' ise (folder name), bu bir transformasyon değildir!
            // Bu basit kontrol, klasör isimlerinde _ kullanmıyorsak çalışır. 
            // Ama kullanıcı products_2024 diyebilir. 
            // Cloudinary'de standart folder isimleri transformasyon parametreleriyle çakışmaz genelde.
            // Daha güvenli kontrol: Bilinen transformasyon parametreleri
            const isTransformation = segment.split(',').every(part => {
                return /^[a-z]+_[a-zA-Z0-9_\.]+$/.test(part) || // w_500, c_limit
                    /^[a-z]+$/.test(part); // short flags (rare)
            });
            // Eğer bu segment 'products', 'categories' veya 'deleted-images' ise transformasyon değildir
            if (['products', 'categories', 'deleted-images'].includes(segment)) {
                cleanSegments.push(segment);
                isFolderReached = true; // Klasöre girdik, artık atlama yapma
                continue;
            }
            // Basit heuristic: Eğer virgül varsa kesin transformasyondur
            if (segment.includes(','))
                continue;
            // Eğer alt tire var ama bilinen folder değilse ve sayı içeriyorsa muhtemelen transformasyondur
            // Ama "my_folder" da olabilir.
            // Burada en güvenli yol: Klasörlerin "products" ve "categories" olduğunu biliyoruz.
            // Genelleştirilmiş çözüm için: "v" versiyonundan önceki her şeyi (eğer folder değilse) transformasyon say.
            // Şimdilik sadece transformasyon gibi görünenleri atlayalım
            if (segment.startsWith('f_') || segment.startsWith('q_') || segment.startsWith('w_') || segment.startsWith('h_') || segment.startsWith('c_')) {
                continue;
            }
        }
        // Buraya geldiyse path parçasıdır (folder veya file)
        cleanSegments.push(segment);
        isFolderReached = true; // İlk folder/file'ı bulduk, sonrakiler de path'in parçasıdır
    }
    if (cleanSegments.length === 0) {
        console.warn('[extractPublicId] Could not recognize public_id segments:', photoUrl);
        return null; // Fallback
    }
    return cleanSegments.join('/');
}
/**
 * Fotoğrafı Cloudinary'de deleted-images klasörüne taşı
 */
async function movePhotoToDeletedFolder(photoUrl) {
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
            return true;
        }
        // Dosya adını çıkar (klasör olmadan)
        // Eğer public_id'de klasör varsa (örn: products/filename), sadece dosya adını al
        let fileNameOnly;
        if (publicId.includes('/')) {
            // Klasör yapısı var (örn: products/filename)
            const parts = publicId.split('/');
            fileNameOnly = parts[parts.length - 1]; // Son kısım dosya adı
        }
        else {
            // Klasör yok, direkt dosya adı
            fileNameOnly = publicId;
        }
        // Yeni public_id: deletedFolder ile tam path (rename için gerekli)
        // Upload kodundaki mantık: folder parametresi ayrı, public_id tam path
        const newPublicId = `${deletedFolder}/${fileNameOnly}`;
        // Cloudinary rename API kullanarak taşı
        // invalidate: true - CDN cache'i temizler, değişikliğin hemen görünmesini sağlar
        const result = await cloudinary_1.v2.uploader.rename(publicId, newPublicId, {
            overwrite: false, // Aynı isimde dosya varsa hata ver
            invalidate: true, // CDN cache'i temizle
        });
        // ÖNEMLİ: Upload kodundaki gibi, asset_folder metadata'sını güncelle
        // Bu, Media Library'de doğru klasörde görünmesini sağlar
        // Not: public_id'de klasör var ama asset_folder metadata'sı da güncellenmeli
        try {
            // Admin API ile asset_folder'ı güncelle
            // newPublicId tam path (deletedFolder/filename), asset_folder'ı da deletedFolder yapıyoruz
            await cloudinary_1.v2.api.update(newPublicId, {
                asset_folder: deletedFolder, // Media Library'de görünecek klasör
                invalidate: true
            });
        }
        catch (updateError) {
            const updateMsg = updateError instanceof Error ? updateError.message : String(updateError);
            console.warn(`[Cloudinary] Failed to update asset_folder for ${newPublicId}:`, updateMsg);
            // asset_folder güncelleme hatası olsa bile devam et (public_id zaten değişti)
        }
        // Result'un public_id'si yeni public_id ile eşleşmeli
        if (result.public_id !== newPublicId) {
            console.warn(`[Cloudinary] WARNING: Rename result public_id mismatch! Expected: ${newPublicId}, Got: ${result.public_id}`);
        }
        return true;
    }
    catch (error) {
        // Eğer dosya zaten yoksa veya başka bir hata varsa
        const httpCode = error?.http_code;
        if (httpCode === 404) {
            console.warn('[Cloudinary] Photo not found (already deleted?):', publicId);
            return false;
        }
        if (httpCode === 409) {
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
async function movePhotosToDeletedFolder(photoUrls) {
    if (photoUrls.length === 0) {
        return { success: 0, failed: 0 };
    }
    let success = 0;
    let failed = 0;
    // Paralel olarak taşı (ama rate limit'e dikkat)
    const results = await Promise.allSettled(photoUrls.map(url => movePhotoToDeletedFolder(url)));
    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
            success++;
        }
        else {
            failed++;
            console.error(`[Cloudinary] Failed to move photo ${index + 1}:`, photoUrls[index]);
        }
    });
    return { success, failed };
}
