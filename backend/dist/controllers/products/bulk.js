"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateImages = exports.deleteCategoryFromProducts = exports.renameCategory = exports.bulkUpdatePrices = exports.reorderProducts = exports.bulkImportProducts = exports.bulkDeleteProducts = void 0;
const supabase_1 = require("../../services/supabase");
const redis_1 = require("../../services/redis");
const activity_logger_1 = require("../../services/activity-logger");
const helpers_1 = require("./helpers");
const media_1 = require("./media");
const schemas_1 = require("./schemas");
const safe_error_1 = require("../../utils/safe-error");
const DB_CHUNK_SIZE = 100;
const UPDATE_BATCH_SIZE = 50;
const REORDER_BATCH_SIZE = 200;
const MAX_ACTIVITY_ID_SAMPLE = 100;
const parseCategoryList = (categoryValue) => {
    if (!categoryValue)
        return [];
    const normalized = categoryValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.toLocaleLowerCase('tr-TR'));
    return [...new Set(normalized)];
};
const chunkArray = (items, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
};
const dedupeStrings = (values) => [...new Set(values)];
const hasDuplicateValues = (values) => {
    return new Set(values).size !== values.length;
};
const sanitizeCategoryFilterValue = (value) => {
    return value.replace(/[%_*(),."\\]/g, '').trim();
};
const normalizeCategoryToken = (value) => value.toLocaleLowerCase('tr-TR');
const normalizeImageUrls = (images) => {
    if (!Array.isArray(images))
        return [];
    return Array.from(new Set(images.filter((image) => typeof image === 'string' && image.trim().length > 0))).slice(0, 20);
};
const mergeImageUrls = (existing, incoming) => {
    return Array.from(new Set([...existing, ...incoming])).slice(0, 20);
};
const bulkDeleteProducts = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const parsed = schemas_1.bulkDeleteSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request body' });
        }
        const ids = dedupeStrings(parsed.data.ids);
        const idChunks = chunkArray(ids, DB_CHUNK_SIZE);
        const products = [];
        for (const chunk of idChunks) {
            const { data, error } = await supabase_1.supabase
                .from('products')
                .select('id, image_url, images')
                .in('id', chunk)
                .eq('user_id', userId);
            if (error)
                throw error;
            if (data?.length) {
                products.push(...data);
            }
        }
        for (const chunk of idChunks) {
            const { error } = await supabase_1.supabase
                .from('products')
                .delete()
                .in('id', chunk)
                .eq('user_id', userId);
            if (error)
                throw error;
        }
        await Promise.all([
            (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.stats(userId))
        ]);
        (0, redis_1.setProductsInvalidated)(userId);
        const photoUrls = products.length > 0 ? (0, media_1.collectPhotoUrlsFromProducts)(products) : [];
        if (photoUrls.length > 0) {
            await (0, media_1.cleanupProductPhotos)(photoUrls, 'bulkDeleteProducts');
        }
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        const sampledIds = ids.slice(0, MAX_ACTIVITY_ID_SAMPLE);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'products_bulk_deleted',
            description: activity_logger_1.ActivityDescriptions.productsBulkDeleted(ids.length),
            metadata: {
                requestedCount: ids.length,
                deletedCount: products.length,
                idsSample: sampledIds,
                idsTruncated: ids.length > sampledIds.length,
                photosCount: photoUrls.length
            },
            ipAddress,
            userAgent
        });
        res.json({
            success: true,
            requestedCount: ids.length,
            deletedCount: products.length,
            deletedPhotosCount: photoUrls.length
        });
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
};
exports.bulkDeleteProducts = bulkDeleteProducts;
const bulkImportProducts = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const parsed = schemas_1.bulkImportSchema.safeParse(req.body);
        if (!parsed.success) {
            const firstError = parsed.error.issues[0];
            return res.status(400).json({
                error: 'Validation Error',
                message: firstError?.message || 'Invalid product data',
                path: firstError?.path?.join('.')
            });
        }
        const { products } = parsed.data;
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
        if (currentCount + products.length > maxProducts) {
            return res.status(403).json({
                error: 'Limit Exceeded',
                message: `Bu işlem paket limitinizi aşıyor. (${plan.toUpperCase()} limiti: ${maxProducts}, Mevcut: ${currentCount}, Eklenmek istenen: ${products.length})`
            });
        }
        if (plan === 'free') {
            const { data: existingCategoryRows, error: existingCategoriesError } = await supabase_1.supabase
                .from('products')
                .select('category')
                .eq('user_id', userId)
                .not('category', 'is', null);
            if (existingCategoriesError)
                throw existingCategoriesError;
            const existingCategories = new Set((existingCategoryRows || []).flatMap((row) => parseCategoryList(row.category)));
            const importsContainNewCategory = products.some((product) => {
                const requestedCategories = parseCategoryList(product.category || null);
                return requestedCategories.some((category) => !existingCategories.has(category));
            });
            if (importsContainNewCategory) {
                return res.status(403).json({
                    error: 'Category Plan Restricted',
                    message: 'Yeni kategori oluşturma özelliği yalnızca Plus ve Pro planlarda kullanılabilir.'
                });
            }
        }
        const productsToInsert = products.map((p) => ({
            user_id: userId,
            name: p.name,
            sku: p.sku || null,
            description: p.description || null,
            price: p.price || 0,
            stock: p.stock || 0,
            category: p.category || null,
            image_url: p.image_url || null,
            images: p.images || [],
            product_url: p.product_url || null,
            custom_attributes: p.custom_attributes || [],
        }));
        const { data, error } = await supabase_1.supabase
            .from('products')
            .insert(productsToInsert)
            .select();
        if (error)
            throw error;
        await Promise.all([
            (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.stats(userId))
        ]);
        (0, redis_1.setProductsInvalidated)(userId);
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
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
};
exports.bulkImportProducts = bulkImportProducts;
const reorderProducts = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const parsed = schemas_1.reorderSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request body' });
        }
        const { order } = parsed.data;
        if (hasDuplicateValues(order.map((item) => item.id))) {
            return res.status(400).json({ error: 'Duplicate product ids are not allowed' });
        }
        const updatedAt = new Date().toISOString();
        for (const chunk of chunkArray(order, REORDER_BATCH_SIZE)) {
            const chunkResults = await Promise.all(chunk.map((item) => supabase_1.supabase
                .from('products')
                .update({
                display_order: item.order,
                updated_at: updatedAt
            })
                .eq('id', item.id)
                .eq('user_id', userId)));
            const chunkError = chunkResults.find((result) => result.error)?.error;
            if (chunkError)
                throw chunkError;
        }
        await Promise.all([
            (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.stats(userId))
        ]);
        (0, redis_1.setProductsInvalidated)(userId);
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'products_reordered',
            description: activity_logger_1.ActivityDescriptions.productsReordered(order.length),
            metadata: { count: order.length },
            ipAddress,
            userAgent
        });
        res.json({ success: true, updated: order.length });
    }
    catch (error) {
        const errorMessage = (0, safe_error_1.safeErrorMessage)(error, 'Sıralama kaydedilemedi');
        console.error('Reorder products error:', errorMessage);
        res.status(500).json({ success: false, message: 'Sıralama kaydedilemedi' });
    }
};
exports.reorderProducts = reorderProducts;
const bulkUpdatePrices = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const parsed = schemas_1.bulkPriceUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request body' });
        }
        const { productIds, changeType, changeMode, amount } = parsed.data;
        const uniqueProductIds = dedupeStrings(productIds);
        const idChunks = chunkArray(uniqueProductIds, DB_CHUNK_SIZE);
        const products = [];
        for (const chunk of idChunks) {
            const { data, error } = await supabase_1.supabase
                .from('products')
                .select('id, price')
                .in('id', chunk)
                .eq('user_id', userId);
            if (error)
                throw error;
            if (data?.length) {
                products.push(...data);
            }
        }
        if (products.length === 0) {
            return res.status(404).json({ error: 'No products found' });
        }
        const priceUpdates = products.map((product) => {
            let newPrice = Number(product.price) || 0;
            if (changeMode === 'percentage') {
                const changeAmount = (newPrice * amount) / 100;
                newPrice = changeType === 'increase' ? newPrice + changeAmount : newPrice - changeAmount;
            }
            else {
                newPrice = changeType === 'increase' ? newPrice + amount : newPrice - amount;
            }
            newPrice = Math.max(0, newPrice);
            newPrice = Math.round(newPrice * 100) / 100;
            return { id: product.id, price: newPrice };
        });
        const updatedAt = new Date().toISOString();
        const updatedProducts = [];
        for (const chunk of chunkArray(priceUpdates, UPDATE_BATCH_SIZE)) {
            const chunkResults = await Promise.all(chunk.map((update) => supabase_1.supabase
                .from('products')
                .update({ price: update.price, updated_at: updatedAt })
                .eq('id', update.id)
                .eq('user_id', userId)
                .select('id, price')
                .single()));
            const chunkError = chunkResults.find((result) => result.error)?.error;
            if (chunkError)
                throw chunkError;
            chunkResults.forEach((result) => {
                if (result.data) {
                    updatedProducts.push(result.data);
                }
            });
        }
        await Promise.all([
            (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.stats(userId))
        ]);
        (0, redis_1.setProductsInvalidated)(userId);
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'products_prices_bulk_updated',
            description: activity_logger_1.ActivityDescriptions.productsPricesBulkUpdated(updatedProducts.length),
            metadata: {
                count: updatedProducts.length,
                changeType,
                changeMode,
                amount
            },
            ipAddress,
            userAgent
        });
        res.json(updatedProducts);
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
};
exports.bulkUpdatePrices = bulkUpdatePrices;
const renameCategory = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const oldName = typeof req.body?.oldName === 'string' ? req.body.oldName.trim() : '';
        const newName = typeof req.body?.newName === 'string' ? req.body.newName.trim() : '';
        if (!oldName || !newName) {
            return res.status(400).json({ error: 'oldName and newName are required' });
        }
        if (oldName.length > 200 || newName.length > 200) {
            return res.status(400).json({ error: 'Category name is too long' });
        }
        if (normalizeCategoryToken(oldName) === normalizeCategoryToken(newName)) {
            return res.status(400).json({ error: 'Old and new category names must be different' });
        }
        const { data, error: rpcError } = await supabase_1.supabase.rpc('batch_rename_category', {
            p_user_id: userId,
            p_old_name: oldName,
            p_new_name: newName
        });
        if (rpcError)
            throw rpcError;
        await Promise.all([
            (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.stats(userId))
        ]);
        (0, redis_1.setProductsInvalidated)(userId);
        res.json(data || []);
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
};
exports.renameCategory = renameCategory;
const deleteCategoryFromProducts = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const rawCategoryName = typeof req.body?.categoryName === 'string' ? req.body.categoryName.trim() : '';
        if (!rawCategoryName) {
            return res.status(400).json({ error: 'categoryName is required' });
        }
        if (rawCategoryName.length > 200) {
            return res.status(400).json({ error: 'Category name is too long' });
        }
        const sanitizedCategoryName = sanitizeCategoryFilterValue(rawCategoryName);
        if (!sanitizedCategoryName) {
            return res.status(400).json({ error: 'categoryName contains only invalid characters' });
        }
        const normalizedTarget = normalizeCategoryToken(sanitizedCategoryName);
        const { data: products, error: fetchError } = await supabase_1.supabase
            .from('products')
            .select('id, category')
            .eq('user_id', userId)
            .ilike('category', `%${sanitizedCategoryName}%`);
        if (fetchError)
            throw fetchError;
        if (!products || products.length === 0) {
            return res.json([]);
        }
        const categoryUpdates = products
            .map((product) => {
            const categories = (product.category || '').split(',').map((c) => c.trim()).filter(Boolean);
            const updatedCategories = categories.filter((c) => normalizeCategoryToken(c) !== normalizedTarget);
            if (updatedCategories.length === categories.length) {
                return null;
            }
            const newCategory = updatedCategories.length > 0 ? updatedCategories.join(', ') : null;
            return { id: product.id, newCategory };
        })
            .filter((entry) => entry !== null);
        if (categoryUpdates.length === 0) {
            return res.json([]);
        }
        const updatedAt = new Date().toISOString();
        const updatedProducts = [];
        for (const chunk of chunkArray(categoryUpdates, UPDATE_BATCH_SIZE)) {
            const chunkResults = await Promise.all(chunk.map(({ id, newCategory }) => supabase_1.supabase
                .from('products')
                .update({ category: newCategory, updated_at: updatedAt })
                .eq('id', id)
                .eq('user_id', userId)
                .select('id, category')
                .single()));
            const chunkError = chunkResults.find((result) => result.error)?.error;
            if (chunkError)
                throw chunkError;
            chunkResults.forEach((result) => {
                if (result.data) {
                    updatedProducts.push(result.data);
                }
            });
        }
        await Promise.all([
            (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.stats(userId))
        ]);
        (0, redis_1.setProductsInvalidated)(userId);
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'category_deleted',
            description: activity_logger_1.ActivityDescriptions.categoryDeleted(rawCategoryName),
            metadata: { categoryName: rawCategoryName, affectedProducts: updatedProducts.length },
            ipAddress,
            userAgent
        });
        res.json(updatedProducts);
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
};
exports.deleteCategoryFromProducts = deleteCategoryFromProducts;
const bulkUpdateImages = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const parsed = schemas_1.bulkUpdateImagesSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request body' });
        }
        const { updates, mergeWithExisting = false } = parsed.data;
        if (hasDuplicateValues(updates.map((update) => update.productId))) {
            return res.status(400).json({ error: 'Duplicate productId values are not allowed' });
        }
        const existingImagesByProductId = new Map();
        if (mergeWithExisting) {
            const productIds = dedupeStrings(updates.map((update) => update.productId));
            for (const chunk of chunkArray(productIds, DB_CHUNK_SIZE)) {
                const { data, error } = await supabase_1.supabase
                    .from('products')
                    .select('id, images, image_url')
                    .in('id', chunk)
                    .eq('user_id', userId);
                if (error)
                    throw error;
                for (const row of data || []) {
                    const rowId = typeof row.id === 'string' ? row.id : '';
                    if (!rowId)
                        continue;
                    const existingImages = normalizeImageUrls(row.images);
                    if (existingImages.length > 0) {
                        existingImagesByProductId.set(rowId, existingImages);
                        continue;
                    }
                    const fallbackImage = typeof row.image_url === 'string'
                        ? (row.image_url || '').trim()
                        : '';
                    if (fallbackImage) {
                        existingImagesByProductId.set(rowId, [fallbackImage]);
                    }
                }
            }
        }
        const updatedAt = new Date().toISOString();
        const results = [];
        for (const chunk of chunkArray(updates, UPDATE_BATCH_SIZE)) {
            const chunkResults = await Promise.all(chunk.map(async ({ productId, images }) => {
                const incomingImages = normalizeImageUrls(images);
                const normalizedImages = mergeWithExisting
                    ? mergeImageUrls(existingImagesByProductId.get(productId) || [], incomingImages)
                    : incomingImages;
                const result = await supabase_1.supabase
                    .from('products')
                    .update({
                    images: normalizedImages,
                    image_url: normalizedImages.length > 0 ? normalizedImages[0] : null,
                    updated_at: updatedAt
                })
                    .eq('id', productId)
                    .eq('user_id', userId)
                    .select('id')
                    .single();
                return {
                    productId,
                    success: !result.error,
                    error: result.error?.message
                };
            }));
            results.push(...chunkResults);
        }
        await Promise.all([
            (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.stats(userId))
        ]);
        (0, redis_1.setProductsInvalidated)(userId);
        const successCount = results.filter((result) => result.success).length;
        res.json({
            success: true,
            count: updates.length,
            successCount,
            failureCount: updates.length - successCount,
            results
        });
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
};
exports.bulkUpdateImages = bulkUpdateImages;
