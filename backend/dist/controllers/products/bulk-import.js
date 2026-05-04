"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkImportProducts = void 0;
const supabase_1 = require("../../services/supabase");
const redis_1 = require("../../services/redis");
const activity_logger_1 = require("../../services/activity-logger");
const helpers_1 = require("./helpers");
const schemas_1 = require("./schemas");
const safe_error_1 = require("../../utils/safe-error");
const bulk_utils_1 = require("./bulk-utils");
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
            const existingCategories = new Set((existingCategoryRows || []).flatMap((row) => (0, bulk_utils_1.parseCategoryList)(row.category)));
            const importsContainNewCategory = products.some((product) => {
                const requestedCategories = (0, bulk_utils_1.parseCategoryList)(product.category || null);
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
        const insertedProducts = [];
        const insertedIds = [];
        let chunkError = null;
        for (const chunk of (0, bulk_utils_1.chunkArray)(productsToInsert, bulk_utils_1.DB_CHUNK_SIZE)) {
            const { data, error } = await supabase_1.supabase
                .from('products')
                .insert(chunk)
                .select();
            if (error) {
                chunkError = error;
                // Best-effort rollback: delete already-inserted products from previous chunks
                if (insertedIds.length > 0) {
                    for (const rollbackChunk of (0, bulk_utils_1.chunkArray)(insertedIds, bulk_utils_1.DB_CHUNK_SIZE)) {
                        await supabase_1.supabase.from('products').delete().in('id', rollbackChunk).eq('user_id', userId);
                    }
                }
                break;
            }
            if (data?.length) {
                insertedProducts.push(...data);
                for (const row of data) {
                    if (typeof row.id === 'string')
                        insertedIds.push(row.id);
                }
            }
        }
        if (chunkError) {
            // Return partial failure info instead of generic 500
            return res.status(207).json({
                error: 'Partial import failure',
                message: `${insertedIds.length} products imported before failure, rolled back.`,
                attemptedCount: productsToInsert.length,
                rolledBackCount: insertedIds.length,
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
            activityType: 'products_imported',
            description: activity_logger_1.ActivityDescriptions.productsImported(insertedProducts.length),
            metadata: { count: insertedProducts.length },
            ipAddress,
            userAgent
        });
        res.status(201).json(insertedProducts);
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
};
exports.bulkImportProducts = bulkImportProducts;
