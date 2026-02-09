"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateImages = exports.checkProductsInCatalogs = exports.checkProductInCatalogs = exports.deleteCategoryFromProducts = exports.renameCategory = exports.bulkUpdatePrices = exports.reorderProducts = exports.bulkImportProducts = exports.bulkDeleteProducts = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProduct = exports.getProducts = void 0;
const zod_1 = require("zod");
const supabase_1 = require("../services/supabase");
const redis_1 = require("../services/redis");
const activity_logger_1 = require("../services/activity-logger");
const cloudinary_1 = require("../services/cloudinary");
/**
 * Supabase URL'den dosya path'ini çıkar
 */
function extractSupabasePath(photoUrl, bucketName = 'product-images') {
    if (!photoUrl)
        return null;
    try {
        const urlObj = new URL(photoUrl);
        // Public URL formatı: /storage/v1/object/public/{bucket}/{path}
        const publicMatch = urlObj.pathname.match(new RegExp(`/storage/v1/object/public/${bucketName}/(.+)`));
        if (publicMatch) {
            return publicMatch[1];
        }
        // Signed URL formatı: /storage/v1/object/sign/{bucket}/{path}
        const signedMatch = urlObj.pathname.match(new RegExp(`/storage/v1/object/sign/${bucketName}/(.+)`));
        if (signedMatch) {
            return signedMatch[1];
        }
        // Alternatif format: {bucket}/{path}
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
}
/**
 * Supabase storage'dan fotoğrafları sil
 */
async function deletePhotosFromSupabase(photoUrls, bucketName = 'product-images') {
    if (photoUrls.length === 0) {
        return { success: 0, failed: 0 };
    }
    const paths = [];
    for (const photoUrl of photoUrls) {
        const path = extractSupabasePath(photoUrl, bucketName);
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
}
const customAttributeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    value: zod_1.z.string(),
    unit: zod_1.z.string().optional(),
}).passthrough();
const createProductSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(200),
    sku: zod_1.z.string().max(100).optional().nullable(),
    description: zod_1.z.string().max(5000).optional().nullable(),
    price: zod_1.z.number().finite().min(0).max(1000000000),
    stock: zod_1.z.number().int().min(0).max(10000000),
    category: zod_1.z.string().max(200).optional().nullable(),
    image_url: zod_1.z.union([zod_1.z.string().url(), zod_1.z.literal('')]).optional().nullable(),
    images: zod_1.z.array(zod_1.z.string().url()).max(20).optional(),
    product_url: zod_1.z.union([zod_1.z.string().url(), zod_1.z.literal('')]).optional().nullable(),
    custom_attributes: zod_1.z.array(customAttributeSchema).optional().nullable(),
});
const updateProductSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(200).optional().nullable(),
    sku: zod_1.z.string().max(100).optional().nullable(),
    description: zod_1.z.string().max(5000).optional().nullable(),
    price: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).refine((v) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= 0 && n <= 1000000000;
    }, 'price must be a valid non-negative number').optional().nullable(),
    stock: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).refine((v) => {
        const n = Number(v);
        return Number.isInteger(n) && n >= 0 && n <= 10000000;
    }, 'stock must be a valid non-negative integer').optional().nullable(),
    category: zod_1.z.string().max(200).optional().nullable(),
    image_url: zod_1.z.union([zod_1.z.string().url(), zod_1.z.literal('')]).optional().nullable(),
    images: zod_1.z.array(zod_1.z.string().url()).max(20).optional(),
    product_url: zod_1.z.union([zod_1.z.string().url(), zod_1.z.literal('')]).optional().nullable(),
    custom_attributes: zod_1.z.array(customAttributeSchema).optional().nullable(),
    display_order: zod_1.z.number().int().optional().nullable(),
    is_active: zod_1.z.boolean().optional().nullable(),
});
const normalizeCoverAndImages = (rawImages, rawCover) => {
    const uniqueImages = Array.from(new Set((rawImages || []).filter(Boolean)));
    const cover = (rawCover && rawCover.trim() !== '')
        ? rawCover
        : (uniqueImages[0] || null);
    if (!cover) {
        return { image_url: null, images: uniqueImages };
    }
    const ordered = [cover, ...uniqueImages.filter((img) => img !== cover)].slice(0, 20);
    return { image_url: cover, images: ordered };
};
// Helper to get user ID from request (attached by auth middleware)
const getUserId = (req) => req.user.id;
const getProducts = async (req, res) => {
    try {
        const userId = getUserId(req);
        // Pagination & Filter params
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 50;
        const category = req.query.category;
        const search = req.query.search;
        // Validation
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 12;
        if (limit > 2000)
            limit = 2000; // Max limit protection (increased for builder support)
        const params = { page, limit, category, search };
        const cacheKey = redis_1.cacheKeys.products(userId, params);
        const result = await (0, redis_1.getOrSetCache)(cacheKey, redis_1.cacheTTL.products, async () => {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            let query = supabase_1.supabase
                .from('products')
                .select('*', { count: 'exact' })
                .eq('user_id', userId);
            if (category && category !== 'all') {
                query = query.ilike('category', `%${category}%`);
            }
            if (search) {
                query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
            }
            // Sıralama: display_order (manuel sıra), yoksa created_at
            const { data, error, count } = await query
                .order('display_order', { ascending: true, nullsFirst: false })
                .order('created_at', { ascending: false })
                .range(from, to);
            if (error)
                throw error;
            const products = (data || []).map((p) => ({
                ...p,
                order: p.display_order ?? p.order ?? 0
            }));
            return {
                products,
                metadata: {
                    total: count || 0,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            };
        });
        res.json(result);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.getProducts = getProducts;
const getProduct = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const cacheKey = redis_1.cacheKeys.product(userId, id);
        const product = await (0, redis_1.getOrSetCache)(cacheKey, redis_1.cacheTTL.products, async () => {
            const { data, error } = await supabase_1.supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .eq('user_id', userId)
                .single();
            if (error)
                throw error;
            return data;
        });
        if (!product) {
            return res.status(404).json({ error: 'Ürün bulunamadı veya yetkiniz yok.' });
        }
        res.json(product);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.getProduct = getProduct;
const createProduct = async (req, res) => {
    try {
        const userId = getUserId(req);
        const parsed = createProductSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            return res.status(400).json({ error: issue?.message || 'Invalid request body' });
        }
        const { name, sku, description, price, stock, category, image_url, images, product_url, custom_attributes } = parsed.data;
        // Limit kontrolü
        const [user, productsCountResult] = await Promise.all([
            (0, redis_1.getOrSetCache)(redis_1.cacheKeys.user(userId), redis_1.cacheTTL.user, async () => {
                const { data } = await supabase_1.supabase.from('users').select('plan').eq('id', userId).single();
                return data;
            }),
            supabase_1.supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', userId)
        ]);
        const plan = user?.plan || 'free';
        const currentCount = productsCountResult.count || 0;
        const maxProducts = plan === 'pro' ? 999999 : (plan === 'plus' ? 1000 : 50);
        if (currentCount >= maxProducts) {
            return res.status(403).json({
                error: 'Limit Reached',
                message: `Ürün ekleme limitinize ulaştınız (${plan.toUpperCase()} planı için ${maxProducts} adet). Daha fazla eklemek için paketinizi yükseltin.`
            });
        }
        const { data, error } = await supabase_1.supabase
            .from('products')
            .insert({
            user_id: userId,
            name,
            sku,
            description,
            price,
            stock,
            category,
            image_url: image_url === '' ? null : image_url,
            images: images || [],
            product_url: product_url === '' ? null : product_url,
            custom_attributes: custom_attributes || []
        })
            .select()
            .single();
        if (error)
            throw error;
        // Cache'i temizle (Tüm listeyi ve bu spesifik ürünü temizle)
        await Promise.all([
            (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.product(userId, data.id))
        ]);
        (0, redis_1.setProductsInvalidated)(userId);
        // Log activity
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'product_created',
            description: activity_logger_1.ActivityDescriptions.productCreated(name || 'Yeni Ürün'),
            metadata: { productId: data.id, productName: name },
            ipAddress,
            userAgent
        });
        res.status(201).json(data);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const parsed = updateProductSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            return res.status(400).json({ error: issue?.message || 'Invalid request body' });
        }
        const { name, sku, description, price, stock, category, image_url, images, product_url, custom_attributes, display_order, is_active } = parsed.data;
        const { data: existingProduct, error: existingProductError } = await supabase_1.supabase
            .from('products')
            .select('images, image_url')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (existingProductError)
            throw existingProductError;
        const mergedImages = images ?? existingProduct?.images ?? [];
        const mergedCover = image_url === undefined
            ? (existingProduct?.image_url ?? null)
            : (image_url === '' ? null : image_url);
        const normalizedMedia = normalizeCoverAndImages(mergedImages, mergedCover);
        const updateData = {
            updated_at: new Date().toISOString(),
            image_url: normalizedMedia.image_url,
            images: normalizedMedia.images,
        };
        if (name !== undefined)
            updateData.name = name;
        if (sku !== undefined)
            updateData.sku = sku;
        if (description !== undefined)
            updateData.description = description;
        if (price !== undefined)
            updateData.price = Number(price);
        if (stock !== undefined)
            updateData.stock = Number(stock);
        if (category !== undefined)
            updateData.category = category;
        if (product_url !== undefined)
            updateData.product_url = product_url === '' ? null : product_url;
        if (custom_attributes !== undefined)
            updateData.custom_attributes = custom_attributes || [];
        if (display_order !== undefined)
            updateData.display_order = display_order;
        if (is_active !== undefined)
            updateData.is_active = is_active;
        const { error } = await supabase_1.supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            throw error;
        // Cache bypass penceresini önce aç (eski cache yarışını engelle)
        (0, redis_1.setProductsInvalidated)(userId);
        // Cache'i temizle
        await Promise.all([
            (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.product(userId, id))
        ]);
        // Log activity
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'product_updated',
            description: activity_logger_1.ActivityDescriptions.productUpdated(name || 'Ürün'),
            metadata: { productId: id, productName: name },
            ipAddress,
            userAgent
        });
        res.json({ success: true });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        // ÖNCE: Ürünü çek (fotoğrafları almak için)
        const { data: product, error: fetchError } = await supabase_1.supabase
            .from('products')
            .select('id, name, image_url, images')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (fetchError)
            throw fetchError;
        if (!product) {
            return res.status(404).json({ error: 'Ürün bulunamadı' });
        }
        // Fotoğrafları topla
        const photoUrls = [];
        // image_url varsa ekle
        if (product.image_url) {
            photoUrls.push(product.image_url);
        }
        // images array'i varsa ekle
        if (product.images && Array.isArray(product.images)) {
            product.images.forEach((photoUrl) => {
                // image_url ile aynı değilse ekle (duplicate önleme)
                if (photoUrl && photoUrl !== product.image_url) {
                    photoUrls.push(photoUrl);
                }
            });
        }
        // Storage provider'ı belirle
        const storageProvider = process.env.STORAGE_PROVIDER || process.env.NEXT_PUBLIC_STORAGE_PROVIDER || 'supabase';
        // Fotoğrafları işle
        if (photoUrls.length > 0) {
            if (storageProvider === 'cloudinary') {
                // Cloudinary: deletedproducts klasörüne taşı
                try {
                    const moveResult = await (0, cloudinary_1.movePhotosToDeletedFolder)(photoUrls);
                    if (moveResult.failed > 0) {
                        console.warn(`[deleteProduct] ${moveResult.failed} fotoğraf deletedproducts klasörüne taşınamadı, ürün yine de silinecek.`);
                    }
                }
                catch (moveError) {
                    console.error('[deleteProduct] Error moving photos to deletedproducts:', moveError);
                    console.warn('[deleteProduct] Ürün silme işlemine devam ediliyor (fotoğraflar taşınamadı).');
                }
            }
            else {
                // Supabase: direkt sil
                try {
                    const deleteResult = await deletePhotosFromSupabase(photoUrls);
                    if (deleteResult.failed > 0) {
                        console.warn(`[deleteProduct] ${deleteResult.failed} fotoğraf Supabase'den silinemedi, ürün yine de silinecek.`);
                    }
                }
                catch (deleteError) {
                    console.error('[deleteProduct] Error deleting photos from Supabase:', deleteError);
                    console.warn('[deleteProduct] Ürün silme işlemine devam ediliyor (fotoğraflar silinemedi).');
                }
            }
        }
        // ŞİMDİ: Ürünü sil
        const { error } = await supabase_1.supabase
            .from('products')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            throw error;
        // Cache'i temizle
        await (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId));
        (0, redis_1.setProductsInvalidated)(userId);
        // Log activity
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'product_deleted',
            description: 'Bir ürün sildi',
            metadata: {
                productId: id,
                photosCount: photoUrls.length
            },
            ipAddress,
            userAgent
        });
        res.json({
            success: true,
            deletedPhotosCount: photoUrls.length
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.deleteProduct = deleteProduct;
const bulkDeleteProducts = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { ids } = req.body;
        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'ids must be an array' });
        }
        // ÖNCE: Ürünleri çek (fotoğrafları almak için)
        const { data: products, error: fetchError } = await supabase_1.supabase
            .from('products')
            .select('id, name, image_url, images')
            .in('id', ids)
            .eq('user_id', userId);
        if (fetchError)
            throw fetchError;
        // Fotoğrafları topla
        const photoUrls = [];
        const storageProvider = process.env.STORAGE_PROVIDER || process.env.NEXT_PUBLIC_STORAGE_PROVIDER || 'supabase';
        // Her ürün için fotoğrafları topla
        if (products && products.length > 0) {
            for (const product of products) {
                // image_url varsa ekle
                if (product.image_url) {
                    photoUrls.push(product.image_url);
                }
                // images array'i varsa ekle
                if (product.images && Array.isArray(product.images)) {
                    product.images.forEach((photoUrl) => {
                        if (photoUrl && photoUrl !== product.image_url) {
                            photoUrls.push(photoUrl);
                        }
                    });
                }
            }
            // Fotoğrafları işle
            if (photoUrls.length > 0) {
                if (storageProvider === 'cloudinary') {
                    // Cloudinary: deletedproducts klasörüne taşı
                    try {
                        const moveResult = await (0, cloudinary_1.movePhotosToDeletedFolder)(photoUrls);
                        if (moveResult.failed > 0) {
                            console.warn(`[bulkDeleteProducts] ${moveResult.failed} fotoğraf deletedproducts klasörüne taşınamadı, ürünler yine de silinecek.`);
                        }
                    }
                    catch (moveError) {
                        console.error('[bulkDeleteProducts] Error moving photos to deletedproducts:', moveError);
                        console.warn('[bulkDeleteProducts] Ürün silme işlemine devam ediliyor (fotoğraflar taşınamadı).');
                    }
                }
                else {
                    // Supabase: direkt sil
                    try {
                        const deleteResult = await deletePhotosFromSupabase(photoUrls);
                        if (deleteResult.failed > 0) {
                            console.warn(`[bulkDeleteProducts] ${deleteResult.failed} fotoğraf Supabase'den silinemedi, ürünler yine de silinecek.`);
                        }
                    }
                    catch (deleteError) {
                        console.error('[bulkDeleteProducts] Error deleting photos from Supabase:', deleteError);
                        console.warn('[bulkDeleteProducts] Ürün silme işlemine devam ediliyor (fotoğraflar silinemedi).');
                    }
                }
            }
        }
        // ŞİMDİ: Ürünleri sil
        const { error } = await supabase_1.supabase
            .from('products')
            .delete()
            .in('id', ids)
            .eq('user_id', userId);
        if (error)
            throw error;
        // Cache'i temizle
        await (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId));
        (0, redis_1.setProductsInvalidated)(userId);
        res.json({
            success: true,
            deletedPhotosCount: photoUrls.length
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.bulkDeleteProducts = bulkDeleteProducts;
const bulkImportProducts = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { products } = req.body;
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'products array is required' });
        }
        // Add user_id to each product and filter invalid fields if needed
        const productsToInsert = products.map((p) => {
            const product = {
                user_id: userId,
                name: p.name,
                sku: p.sku || null,
                description: p.description || null,
                price: p.price || 0,
                stock: p.stock || 0,
                category: p.category || null,
                image_url: p.image_url || null,
                custom_attributes: p.custom_attributes || []
            };
            // images ve product_url opsiyonel - varsa ekle
            if (p.images && Array.isArray(p.images)) {
                product.images = p.images;
            }
            if (p.product_url) {
                product.product_url = p.product_url;
            }
            return product;
        });
        const { data, error } = await supabase_1.supabase
            .from('products')
            .insert(productsToInsert)
            .select();
        if (error)
            throw error;
        // Cache'i temizle
        await (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId));
        (0, redis_1.setProductsInvalidated)(userId);
        // Log activity
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'products_imported',
            description: activity_logger_1.ActivityDescriptions.productsImported(data?.length || 0),
            metadata: { count: data?.length || 0 },
            ipAddress,
            userAgent
        });
        res.status(201).json(data);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.bulkImportProducts = bulkImportProducts;
const reorderProducts = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { order } = req.body;
        if (!Array.isArray(order)) {
            return res.status(400).json({ error: 'order must be an array' });
        }
        // Batched update using Promise.all since RPC might be missing
        const updatePromises = order.map(item => supabase_1.supabase
            .from('products')
            .update({
            display_order: item.order,
            updated_at: new Date().toISOString()
        })
            .eq('id', item.id)
            .eq('user_id', userId));
        await Promise.all(updatePromises);
        // Cache'i temizle
        await (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId));
        (0, redis_1.setProductsInvalidated)(userId);
        res.json({ success: true, updated: order.length });
    }
    catch (error) {
        // Hata detayını string olarak al (Supabase hatası obje olabilir)
        const errorMessage = error instanceof Error
            ? error.message
            : (typeof error === 'object' ? JSON.stringify(error) : String(error));
        console.error('Reorder products error:', errorMessage);
        res.status(500).json({ success: false, message: 'Sıralama kaydedilemedi', error: errorMessage });
    }
};
exports.reorderProducts = reorderProducts;
const bulkUpdatePrices = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { productIds, changeType, changeMode, amount } = req.body;
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ error: 'productIds array is required' });
        }
        if (!['increase', 'decrease'].includes(changeType)) {
            return res.status(400).json({ error: 'changeType must be increase or decrease' });
        }
        if (!['percentage', 'fixed'].includes(changeMode)) {
            return res.status(400).json({ error: 'changeMode must be percentage or fixed' });
        }
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'amount must be a positive number' });
        }
        // Önce mevcut ürünleri al
        const { data: products, error: fetchError } = await supabase_1.supabase
            .from('products')
            .select('*')
            .in('id', productIds)
            .eq('user_id', userId);
        if (fetchError)
            throw fetchError;
        if (!products || products.length === 0) {
            return res.status(404).json({ error: 'No products found' });
        }
        // N+1 FIX: Önce tüm yeni fiyatları hesapla
        const priceUpdates = products.map(product => {
            let newPrice = Number(product.price) || 0;
            if (changeMode === 'percentage') {
                const changeAmount = (newPrice * amount) / 100;
                newPrice = changeType === 'increase' ? newPrice + changeAmount : newPrice - changeAmount;
            }
            else {
                newPrice = changeType === 'increase' ? newPrice + amount : newPrice - amount;
            }
            // Fiyat negatif olamaz
            newPrice = Math.max(0, newPrice);
            // 2 ondalık basamağa yuvarla
            newPrice = Math.round(newPrice * 100) / 100;
            return { id: product.id, price: newPrice };
        });
        // N+1 FIX: RPC function ile tek seferde batch update
        // Supabase otomatik olarak JavaScript array'i JSONB'ye serialize eder
        const { data, error: rpcError } = await supabase_1.supabase.rpc('batch_update_product_prices', {
            p_user_id: userId,
            p_updates: priceUpdates
        });
        if (rpcError)
            throw rpcError;
        // Cache'i temizle
        await (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId));
        (0, redis_1.setProductsInvalidated)(userId);
        // RPC'den dönen data formatını uyumlu hale getir
        const updatedProducts = (data || []).map((item) => ({
            id: item.id,
            price: item.price,
            ...products.find(p => p.id === item.id)
        }));
        res.json(updatedProducts);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.bulkUpdatePrices = bulkUpdatePrices;
const renameCategory = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { oldName, newName } = req.body;
        if (!oldName || !newName) {
            return res.status(400).json({ error: 'oldName and newName are required' });
        }
        // N+1 FIX: RPC function ile tek seferde batch category rename
        const { data, error: rpcError } = await supabase_1.supabase.rpc('batch_rename_category', {
            p_user_id: userId,
            p_old_name: oldName,
            p_new_name: newName
        });
        if (rpcError)
            throw rpcError;
        // Cache'i temizle
        await (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId));
        (0, redis_1.setProductsInvalidated)(userId);
        res.json(data || []);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.renameCategory = renameCategory;
const deleteCategoryFromProducts = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { categoryName } = req.body;
        if (!categoryName) {
            return res.status(400).json({ error: 'categoryName is required' });
        }
        // Bu kategoriye sahip tüm ürünleri bul
        const { data: products, error: fetchError } = await supabase_1.supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .ilike('category', `%${categoryName}%`);
        if (fetchError)
            throw fetchError;
        if (!products || products.length === 0) {
            return res.json([]);
        }
        // N+1 FIX: Önce tüm kategori güncellemelerini hesapla
        const categoryUpdates = products.map(product => {
            // Kategori virgülle ayrılmış olabilir, silinen kategoriyi çıkar
            const categories = (product.category || '').split(',').map((c) => c.trim());
            const updatedCategories = categories.filter((c) => c !== categoryName);
            const newCategory = updatedCategories.length > 0 ? updatedCategories.join(', ') : null;
            return { id: product.id, newCategory };
        });
        // N+1 FIX: Tüm update'leri paralel olarak çalıştır
        const updatePromises = categoryUpdates.map(({ id, newCategory }) => supabase_1.supabase
            .from('products')
            .update({ category: newCategory })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single());
        const results = await Promise.all(updatePromises);
        const updatedProducts = results
            .filter(r => !r.error && r.data)
            .map(r => r.data);
        // Cache'i temizle
        await (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId));
        (0, redis_1.setProductsInvalidated)(userId);
        // Log activity
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'category_deleted',
            description: activity_logger_1.ActivityDescriptions.categoryDeleted(categoryName),
            metadata: { categoryName, affectedProducts: updatedProducts.length },
            ipAddress,
            userAgent
        });
        res.json(updatedProducts);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.deleteCategoryFromProducts = deleteCategoryFromProducts;
// Ürünün hangi kataloglarda olduğunu kontrol et
const checkProductInCatalogs = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        // Bu ürünü içeren katalogları bul
        const { data: catalogs, error } = await supabase_1.supabase
            .from('catalogs')
            .select('id, name')
            .eq('user_id', userId)
            .contains('product_ids', [id]);
        if (error)
            throw error;
        res.json({
            isInCatalogs: (catalogs?.length || 0) > 0,
            catalogs: catalogs || [],
            count: catalogs?.length || 0
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.checkProductInCatalogs = checkProductInCatalogs;
// Birden fazla ürünün kataloglarda olup olmadığını kontrol et
const checkProductsInCatalogs = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { productIds } = req.body;
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.json({ productsInCatalogs: [], catalogs: [] });
        }
        // Kullanıcının tüm kataloglarını al
        const { data: catalogs, error } = await supabase_1.supabase
            .from('catalogs')
            .select('id, name, product_ids')
            .eq('user_id', userId);
        if (error)
            throw error;
        // Hangi ürünler kataloglarda var
        const productsInCatalogs = [];
        for (const productId of productIds) {
            const catalogsContaining = catalogs?.filter(c => c.product_ids?.includes(productId)).map(c => ({ id: c.id, name: c.name })) || [];
            if (catalogsContaining.length > 0) {
                productsInCatalogs.push({
                    productId,
                    catalogs: catalogsContaining
                });
            }
        }
        res.json({
            productsInCatalogs,
            hasAnyInCatalogs: productsInCatalogs.length > 0
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.checkProductsInCatalogs = checkProductsInCatalogs;
const bulkUpdateImages = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { updates } = req.body;
        if (!Array.isArray(updates)) {
            return res.status(400).json({ error: 'updates must be an array' });
        }
        // N+1 FIX: Tüm update'leri paralel olarak çalıştır
        const updatePromises = updates.map(({ productId, images }) => supabase_1.supabase
            .from('products')
            .update({
            images: images || [],
            image_url: (images && images.length > 0) ? images[0] : null,
            updated_at: new Date().toISOString()
        })
            .eq('id', productId)
            .eq('user_id', userId)
            .select()
            .single()
            .then(result => ({
            productId,
            success: !result.error,
            error: result.error?.message
        })));
        const results = await Promise.all(updatePromises);
        // Cache'i sadece bir kez temizle!
        await (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId));
        (0, redis_1.setProductsInvalidated)(userId);
        res.json({ success: true, count: updates.length, results });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.bulkUpdateImages = bulkUpdateImages;
