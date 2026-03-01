import type { Request, Response } from 'express';

import { supabase } from '../../services/supabase';
import { deleteCache, cacheKeys, cacheTTL, getOrSetCache, setProductsInvalidated } from '../../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../../services/activity-logger';
import { getUserId } from './helpers';
import { createProductSchema, updateProductSchema } from './schemas';
import { cleanupProductPhotos, collectProductPhotoUrls, normalizeCoverAndImages } from './media';
import { safeErrorMessage } from '../../utils/safe-error';

const parseCategoryList = (categoryValue?: string | null): string[] => {
    if (!categoryValue) return [];

    const normalized = categoryValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.toLocaleLowerCase('tr-TR'));

    return [...new Set(normalized)];
};

const ensureFreePlanCannotCreateCategory = async (params: {
    userId: string;
    plan: string;
    incomingCategory?: string | null;
}): Promise<{ allowed: true } | { allowed: false; message: string }> => {
    const { userId, plan, incomingCategory } = params;

    if (plan !== 'free') return { allowed: true };

    const requestedCategories = parseCategoryList(incomingCategory);
    if (requestedCategories.length === 0) return { allowed: true };

    const { data: existingCategoryRows, error } = await supabase
        .from('products')
        .select('category')
        .eq('user_id', userId)
        .not('category', 'is', null);

    if (error) {
        return { allowed: false, message: 'Kategori kontrolü sırasında bir hata oluştu.' };
    }

    const existingCategories = new Set(
        (existingCategoryRows || []).flatMap((row) => parseCategoryList(row.category as string | null))
    );

    const hasNewCategory = requestedCategories.some((category) => !existingCategories.has(category));
    if (hasNewCategory) {
        return {
            allowed: false,
            message: 'Yeni kategori oluşturma özelliği yalnızca Plus ve Pro planlarda kullanılabilir.'
        };
    }

    return { allowed: true };
};

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

        const categoryCheck = await ensureFreePlanCannotCreateCategory({
            userId,
            plan,
            incomingCategory: category
        });

        if (!categoryCheck.allowed) {
            return res.status(403).json({
                error: 'Category Plan Restricted',
                message: categoryCheck.message
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
            deleteCache(cacheKeys.product(userId, data.id)),
            deleteCache(cacheKeys.stats(userId))
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
        res.status(500).json({ error: safeErrorMessage(error) });
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

        const user = await getOrSetCache(cacheKeys.user(userId), cacheTTL.user, async () => {
            const { data } = await supabase.from('users').select('plan').eq('id', userId).single();
            return data;
        });

        const plan = (user as { plan: string })?.plan || 'free';

        if (category !== undefined) {
            const categoryCheck = await ensureFreePlanCannotCreateCategory({
                userId,
                plan,
                incomingCategory: category
            });

            if (!categoryCheck.allowed) {
                return res.status(403).json({
                    error: 'Category Plan Restricted',
                    message: categoryCheck.message
                });
            }
        }

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
            deleteCache(cacheKeys.product(userId, id)),
            deleteCache(cacheKeys.stats(userId))
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
        res.status(500).json({ error: safeErrorMessage(error) });
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

        await Promise.all([
            deleteCache(cacheKeys.products(userId)),
            deleteCache(cacheKeys.stats(userId))
        ]);
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
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};
