import type { Request, Response } from 'express';

import { supabase } from '../../services/supabase';
import { deleteCache, cacheKeys, cacheTTL, getOrSetCache, setProductsInvalidated } from '../../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../../services/activity-logger';
import { getUserId } from './helpers';
import { createProductSchema, updateProductSchema } from './schemas';
import { cleanupProductPhotos, collectProductPhotoUrls, normalizeCoverAndImages } from './media';

export const createProduct = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const parsed = createProductSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            return res.status(400).json({ error: issue?.message || 'Invalid request body' });
        }
        const { name, sku, description, price, stock, category, image_url, images, product_url, custom_attributes } = parsed.data;

        const [user, productsCountResult] = await Promise.all([
            getOrSetCache(cacheKeys.user(userId), cacheTTL.user, async () => {
                const { data } = await supabase.from('users').select('plan').eq('id', userId).single();
                return data;
            }),
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        const plan = (user as { plan: string })?.plan || 'free';
        const currentCount = productsCountResult.count || 0;
        const maxProducts = plan === 'pro' ? 999999 : (plan === 'plus' ? 1000 : 50);

        if (currentCount >= maxProducts) {
            return res.status(403).json({
                error: 'Limit Reached',
                message: `Ürün ekleme limitinize ulaştınız (${plan.toUpperCase()} planı için ${maxProducts} adet). Daha fazla eklemek için paketinizi yükseltin.`
            });
        }

        const { data, error } = await supabase
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

        if (error) throw error;

        await Promise.all([
            deleteCache(cacheKeys.products(userId)),
            deleteCache(cacheKeys.product(userId, data.id))
        ]);
        setProductsInvalidated(userId);

        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'product_created',
            description: ActivityDescriptions.productCreated(name || 'Yeni Ürün'),
            metadata: { productId: data.id, productName: name },
            ipAddress,
            userAgent
        });

        res.status(201).json(data);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const parsed = updateProductSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            return res.status(400).json({ error: issue?.message || 'Invalid request body' });
        }
        const {
            name,
            sku,
            description,
            price,
            stock,
            category,
            image_url,
            images,
            product_url,
            custom_attributes,
            display_order,
            is_active
        } = parsed.data;

        const { data: existingProduct, error: existingProductError } = await supabase
            .from('products')
            .select('images, image_url')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (existingProductError) throw existingProductError;

        const mergedImages = images ?? existingProduct?.images ?? [];
        const mergedCover = image_url === undefined
            ? (existingProduct?.image_url ?? null)
            : (image_url === '' ? null : image_url);

        const allowCoverFallback = image_url === undefined ? true : (image_url !== '' && image_url !== null);
        const normalizedMedia = normalizeCoverAndImages(mergedImages, mergedCover, { allowCoverFallback });

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
            image_url: normalizedMedia.image_url,
            images: normalizedMedia.images,
        };

        if (name !== undefined) updateData.name = name;
        if (sku !== undefined) updateData.sku = sku;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = Number(price);
        if (stock !== undefined) updateData.stock = Number(stock);
        if (category !== undefined) updateData.category = category;
        if (product_url !== undefined) updateData.product_url = product_url === '' ? null : product_url;
        if (custom_attributes !== undefined) updateData.custom_attributes = custom_attributes || [];
        if (display_order !== undefined) updateData.display_order = display_order;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        setProductsInvalidated(userId);

        await Promise.all([
            deleteCache(cacheKeys.products(userId)),
            deleteCache(cacheKeys.product(userId, id))
        ]);

        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'product_updated',
            description: ActivityDescriptions.productUpdated(name || 'Ürün'),
            metadata: { productId: id, productName: name },
            ipAddress,
            userAgent
        });

        res.json({ success: true });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('id, name, image_url, images')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (fetchError) throw fetchError;
        if (!product) {
            return res.status(404).json({ error: 'Ürün bulunamadı' });
        }

        const photoUrls = collectProductPhotoUrls(product);

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        await deleteCache(cacheKeys.products(userId));
        setProductsInvalidated(userId);

        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
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

        await cleanupProductPhotos(photoUrls, 'deleteProduct');

        res.json({
            success: true,
            deletedPhotosCount: photoUrls.length
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
