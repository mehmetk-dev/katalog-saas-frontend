"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = void 0;
const supabase_1 = require("../../services/supabase");
const redis_1 = require("../../services/redis");
const activity_logger_1 = require("../../services/activity-logger");
const helpers_1 = require("./helpers");
const schemas_1 = require("./schemas");
const media_1 = require("./media");
const createProduct = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const parsed = schemas_1.createProductSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            return res.status(400).json({ error: issue?.message || 'Invalid request body' });
        }
        const { name, sku, description, price, stock, category, image_url, images, product_url, custom_attributes } = parsed.data;
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
        await Promise.all([
            (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.product(userId, data.id))
        ]);
        (0, redis_1.setProductsInvalidated)(userId);
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
        const userId = (0, helpers_1.getUserId)(req);
        const { id } = req.params;
        const parsed = schemas_1.updateProductSchema.safeParse(req.body);
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
        const allowCoverFallback = image_url === undefined ? true : (image_url !== '' && image_url !== null);
        const normalizedMedia = (0, media_1.normalizeCoverAndImages)(mergedImages, mergedCover, { allowCoverFallback });
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
        (0, redis_1.setProductsInvalidated)(userId);
        await Promise.all([
            (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.product(userId, id))
        ]);
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
        const userId = (0, helpers_1.getUserId)(req);
        const { id } = req.params;
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
        const photoUrls = (0, media_1.collectProductPhotoUrls)(product);
        const { error } = await supabase_1.supabase
            .from('products')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            throw error;
        await (0, redis_1.deleteCache)(redis_1.cacheKeys.products(userId));
        (0, redis_1.setProductsInvalidated)(userId);
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
        await (0, media_1.cleanupProductPhotos)(photoUrls, 'deleteProduct');
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
