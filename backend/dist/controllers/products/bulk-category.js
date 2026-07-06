"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategoryFromProducts = exports.renameCategory = void 0;
const supabase_1 = require("../../services/supabase");
const redis_1 = require("../../services/redis");
const activity_logger_1 = require("../../services/activity-logger");
const helpers_1 = require("./helpers");
const safe_error_1 = require("../../utils/safe-error");
const bulk_utils_1 = require("./bulk-utils");
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
        if ((0, bulk_utils_1.normalizeCategoryToken)(oldName) === (0, bulk_utils_1.normalizeCategoryToken)(newName)) {
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
        const sanitizedCategoryName = (0, bulk_utils_1.sanitizeCategoryFilterValue)(rawCategoryName);
        if (!sanitizedCategoryName) {
            return res.status(400).json({ error: 'categoryName contains only invalid characters' });
        }
        const normalizedTarget = (0, bulk_utils_1.normalizeCategoryToken)(sanitizedCategoryName);
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
            const updatedCategories = categories.filter((c) => (0, bulk_utils_1.normalizeCategoryToken)(c) !== normalizedTarget);
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
        const updatedProducts = [];
        for (const chunk of (0, bulk_utils_1.chunkArray)(categoryUpdates, bulk_utils_1.UPDATE_BATCH_SIZE)) {
            const chunkResults = await Promise.all(chunk.map(({ id, newCategory }) => supabase_1.supabase
                .from('products')
                .update({ category: newCategory })
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
