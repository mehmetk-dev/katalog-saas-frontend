"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateImages = exports.deleteCategoryFromProducts = exports.renameCategory = exports.bulkUpdatePrices = exports.reorderProducts = exports.bulkImportProducts = exports.bulkDeleteProducts = void 0;
const supabase_1 = require("../../services/supabase");
const redis_1 = require("../../services/redis");
const activity_logger_1 = require("../../services/activity-logger");
const helpers_1 = require("./helpers");
const media_1 = require("./media");
const bulkDeleteProducts = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const { ids } = req.body;
        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'ids must be an array' });
        }
        const { data: products, error: fetchError } = await supabase_1.supabase
            .from('products')
            .select('id, name, image_url, images')
            .in('id', ids)
            .eq('user_id', userId);
        if (fetchError)
            throw fetchError;
        const { error } = await supabase_1.supabase
            .from('products')
            .delete()
            .in('id', ids)
            .eq('user_id', userId);
        if (error)
            throw error;
        await (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId));
        (0, redis_1.setProductsInvalidated)(userId);
        const photoUrls = products && products.length > 0 ? (0, media_1.collectPhotoUrlsFromProducts)(products) : [];
        if (photoUrls.length > 0) {
            await (0, media_1.cleanupProductPhotos)(photoUrls, 'bulkDeleteProducts');
        }
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'products_bulk_deleted',
            description: activity_logger_1.ActivityDescriptions.productsBulkDeleted(ids.length),
            metadata: { ids, photosCount: photoUrls.length },
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
exports.bulkDeleteProducts = bulkDeleteProducts;
const bulkImportProducts = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const { products } = req.body;
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'products array is required' });
        }
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
        await (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId));
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.bulkImportProducts = bulkImportProducts;
const reorderProducts = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const { order } = req.body;
        if (!Array.isArray(order)) {
            return res.status(400).json({ error: 'order must be an array' });
        }
        const updatePromises = order.map(item => supabase_1.supabase
            .from('products')
            .update({
            display_order: item.order,
            updated_at: new Date().toISOString()
        })
            .eq('id', item.id)
            .eq('user_id', userId));
        await Promise.all(updatePromises);
        await (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId));
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
        const userId = (0, helpers_1.getUserId)(req);
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
        const priceUpdates = products.map(product => {
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
        const { data, error: rpcError } = await supabase_1.supabase.rpc('batch_update_product_prices', {
            p_user_id: userId,
            p_updates: priceUpdates
        });
        if (rpcError)
            throw rpcError;
        await (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId));
        (0, redis_1.setProductsInvalidated)(userId);
        const updatedProducts = (data || []).map((item) => ({
            id: item.id,
            price: item.price,
            ...products.find(p => p.id === item.id)
        }));
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.bulkUpdatePrices = bulkUpdatePrices;
const renameCategory = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const { oldName, newName } = req.body;
        if (!oldName || !newName) {
            return res.status(400).json({ error: 'oldName and newName are required' });
        }
        const { data, error: rpcError } = await supabase_1.supabase.rpc('batch_rename_category', {
            p_user_id: userId,
            p_old_name: oldName,
            p_new_name: newName
        });
        if (rpcError)
            throw rpcError;
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
        const userId = (0, helpers_1.getUserId)(req);
        const { categoryName } = req.body;
        if (!categoryName) {
            return res.status(400).json({ error: 'categoryName is required' });
        }
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
        const categoryUpdates = products.map(product => {
            const categories = (product.category || '').split(',').map((c) => c.trim());
            const updatedCategories = categories.filter((c) => c !== categoryName);
            const newCategory = updatedCategories.length > 0 ? updatedCategories.join(', ') : null;
            return { id: product.id, newCategory };
        });
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
        await (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId));
        (0, redis_1.setProductsInvalidated)(userId);
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
const bulkUpdateImages = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const { updates } = req.body;
        if (!Array.isArray(updates)) {
            return res.status(400).json({ error: 'updates must be an array' });
        }
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
