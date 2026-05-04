"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeleteProducts = void 0;
const supabase_1 = require("../../services/supabase");
const redis_1 = require("../../services/redis");
const activity_logger_1 = require("../../services/activity-logger");
const helpers_1 = require("./helpers");
const media_1 = require("./media");
const schemas_1 = require("./schemas");
const safe_error_1 = require("../../utils/safe-error");
const bulk_utils_1 = require("./bulk-utils");
const bulkDeleteProducts = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const parsed = schemas_1.bulkDeleteSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request body' });
        }
        const ids = (0, bulk_utils_1.dedupeStrings)(parsed.data.ids);
        const idChunks = (0, bulk_utils_1.chunkArray)(ids, bulk_utils_1.DB_CHUNK_SIZE);
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
        // Remove deleted product IDs from all catalogs' product_ids arrays (single batch RPC)
        const { error: catalogCleanupError } = await supabase_1.supabase.rpc('remove_products_from_catalogs', {
            p_product_ids: ids,
            p_user_id: userId,
        });
        if (catalogCleanupError) {
            console.error('Failed to cleanup catalog references for bulk deleted products:', catalogCleanupError);
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
        const sampledIds = ids.slice(0, bulk_utils_1.MAX_ACTIVITY_ID_SAMPLE);
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
