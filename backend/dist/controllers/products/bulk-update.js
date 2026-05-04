"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateFields = exports.bulkUpdateImages = exports.bulkUpdatePrices = exports.reorderProducts = void 0;
const supabase_1 = require("../../services/supabase");
const redis_1 = require("../../services/redis");
const activity_logger_1 = require("../../services/activity-logger");
const helpers_1 = require("./helpers");
const schemas_1 = require("./schemas");
const safe_error_1 = require("../../utils/safe-error");
const bulk_utils_1 = require("./bulk-utils");
const reorderProducts = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const parsed = schemas_1.reorderSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request body' });
        }
        const { order } = parsed.data;
        if ((0, bulk_utils_1.hasDuplicateValues)(order.map((item) => item.id))) {
            return res.status(400).json({ error: 'Duplicate product ids are not allowed' });
        }
        // Use RPC for single-query bulk reorder instead of N individual UPDATEs
        const { error: rpcError } = await supabase_1.supabase.rpc('bulk_reorder_products', {
            p_user_id: userId,
            p_updates: order.map(item => ({ id: item.id, order: item.order })),
        });
        if (rpcError)
            throw rpcError;
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
        const uniqueProductIds = (0, bulk_utils_1.dedupeStrings)(productIds);
        const idChunks = (0, bulk_utils_1.chunkArray)(uniqueProductIds, bulk_utils_1.DB_CHUNK_SIZE);
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
        const updatedProducts = [];
        // Use RPC for single-query bulk update instead of N individual UPDATEs
        const { error: rpcError } = await supabase_1.supabase.rpc('bulk_update_product_prices', {
            p_user_id: userId,
            p_updates: priceUpdates,
        });
        if (rpcError)
            throw rpcError;
        // Fetch updated products for response
        const { data: fetchedUpdated, error: fetchError } = await supabase_1.supabase
            .from('products')
            .select('id, price')
            .in('id', priceUpdates.map(u => u.id))
            .eq('user_id', userId);
        if (fetchError)
            throw fetchError;
        if (fetchedUpdated?.length)
            updatedProducts.push(...fetchedUpdated);
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
const bulkUpdateImages = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const parsed = schemas_1.bulkUpdateImagesSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request body' });
        }
        const { updates, mergeWithExisting = false } = parsed.data;
        if ((0, bulk_utils_1.hasDuplicateValues)(updates.map((update) => update.productId))) {
            return res.status(400).json({ error: 'Duplicate productId values are not allowed' });
        }
        const existingImagesByProductId = new Map();
        if (mergeWithExisting) {
            const productIds = (0, bulk_utils_1.dedupeStrings)(updates.map((update) => update.productId));
            for (const chunk of (0, bulk_utils_1.chunkArray)(productIds, bulk_utils_1.DB_CHUNK_SIZE)) {
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
                    const existingImages = (0, bulk_utils_1.normalizeImageUrls)(row.images);
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
        const results = [];
        for (const chunk of (0, bulk_utils_1.chunkArray)(updates, bulk_utils_1.UPDATE_BATCH_SIZE)) {
            const chunkResults = await Promise.all(chunk.map(async ({ productId, images }) => {
                const incomingImages = (0, bulk_utils_1.normalizeImageUrls)(images);
                const normalizedImages = mergeWithExisting
                    ? (0, bulk_utils_1.mergeImageUrls)(existingImagesByProductId.get(productId) || [], incomingImages)
                    : incomingImages;
                const result = await supabase_1.supabase
                    .from('products')
                    .update({
                    images: normalizedImages,
                    image_url: normalizedImages.length > 0 ? normalizedImages[0] : null,
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
const bulkUpdateFields = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const parsed = schemas_1.bulkUpdateFieldsSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            return res.status(400).json({ error: issue?.message || 'Invalid request body' });
        }
        const { updates } = parsed.data;
        let succeeded = 0;
        let failed = 0;
        for (const batch of (0, bulk_utils_1.chunkArray)(updates, bulk_utils_1.UPDATE_BATCH_SIZE)) {
            const results = await Promise.allSettled(batch.map(({ id, ...fields }) => {
                const updateData = {};
                if (fields.name !== undefined)
                    updateData.name = fields.name;
                if (fields.sku !== undefined)
                    updateData.sku = fields.sku;
                if (fields.description !== undefined)
                    updateData.description = fields.description;
                if (fields.price !== undefined)
                    updateData.price = fields.price;
                if (fields.stock !== undefined)
                    updateData.stock = fields.stock;
                if (fields.category !== undefined)
                    updateData.category = fields.category;
                if (fields.product_url !== undefined)
                    updateData.product_url = fields.product_url === '' ? null : fields.product_url;
                if (fields.custom_attributes !== undefined)
                    updateData.custom_attributes = fields.custom_attributes || [];
                return supabase_1.supabase
                    .from('products')
                    .update(updateData)
                    .eq('id', id)
                    .eq('user_id', userId);
            }));
            succeeded += results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
            failed += results.length - results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
        }
        await Promise.all([
            (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.stats(userId))
        ]);
        (0, redis_1.setProductsInvalidated)(userId);
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'products_bulk_fields_updated',
            description: activity_logger_1.ActivityDescriptions.productsBulkFieldsUpdated(succeeded),
            metadata: { updatedCount: succeeded, failedCount: failed },
            ipAddress,
            userAgent
        });
        res.json({ success: true, updatedCount: succeeded, failedCount: failed });
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
};
exports.bulkUpdateFields = bulkUpdateFields;
