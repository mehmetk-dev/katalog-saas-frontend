import type { Request, Response } from 'express';

import { supabase } from '../../services/supabase';
import { deleteCache, cacheKeys, cacheTTL, getOrSetCache, setProductsInvalidated } from '../../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../../services/activity-logger';
import { getUserId } from './helpers';
import { cleanupProductPhotos, collectPhotoUrlsFromProducts } from './media';
import { bulkDeleteSchema, bulkImportSchema, reorderSchema, bulkUpdateImagesSchema, bulkPriceUpdateSchema } from './schemas';
import { safeErrorMessage } from '../../utils/safe-error';

const DB_CHUNK_SIZE = 100;
const UPDATE_BATCH_SIZE = 50;
const REORDER_BATCH_SIZE = 200;
const MAX_ACTIVITY_ID_SAMPLE = 100;

const parseCategoryList = (categoryValue?: string | null): string[] => {
    if (!categoryValue) return [];

    const normalized = categoryValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.toLocaleLowerCase('tr-TR'));

    return [...new Set(normalized)];
};

const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
};

const dedupeStrings = (values: string[]): string[] => [...new Set(values)];

const hasDuplicateValues = (values: string[]): boolean => {
    return new Set(values).size !== values.length;
};

const sanitizeCategoryFilterValue = (value: string): string => {
    return value.replace(/[%_*(),."\\]/g, '').trim();
};

const normalizeCategoryToken = (value: string): string => value.toLocaleLowerCase('tr-TR');

const normalizeImageUrls = (images: unknown): string[] => {
    if (!Array.isArray(images)) return [];
    return Array.from(
        new Set(images.filter((image): image is string => typeof image === 'string' && image.trim().length > 0))
    ).slice(0, 20);
};

const mergeImageUrls = (existing: string[], incoming: string[]): string[] => {
    return Array.from(new Set([...existing, ...incoming])).slice(0, 20);
};


export const bulkDeleteProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        const parsed = bulkDeleteSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request body' });
        }

        const ids = dedupeStrings(parsed.data.ids);
        const idChunks = chunkArray(ids, DB_CHUNK_SIZE);

        const products: Array<{ id: string; image_url?: string | null; images?: string[] | null }> = [];

        for (const chunk of idChunks) {
            const { data, error } = await supabase
                .from('products')
                .select('id, image_url, images')
                .in('id', chunk)
                .eq('user_id', userId);

            if (error) throw error;
            if (data?.length) {
                products.push(...data);
            }
        }

        for (const chunk of idChunks) {
            const { error } = await supabase
                .from('products')
                .delete()
                .in('id', chunk)
                .eq('user_id', userId);

            if (error) throw error;
        }

        await Promise.all([
            deleteCache(cacheKeys.products(userId)),
            deleteCache(cacheKeys.stats(userId))
        ]);
        setProductsInvalidated(userId);

        const photoUrls = products.length > 0 ? collectPhotoUrlsFromProducts(products) : [];
        if (photoUrls.length > 0) {
            await cleanupProductPhotos(photoUrls, 'bulkDeleteProducts');
        }

        const { ipAddress, userAgent } = getRequestInfo(req);
        const sampledIds = ids.slice(0, MAX_ACTIVITY_ID_SAMPLE);
        await logActivity({
            userId,
            activityType: 'products_bulk_deleted',
            description: ActivityDescriptions.productsBulkDeleted(ids.length),
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
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};

export const bulkImportProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        const parsed = bulkImportSchema.safeParse(req.body);
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
            getOrSetCache(cacheKeys.user(userId), cacheTTL.user, async () => {
                const { data } = await supabase.from('users').select('plan').eq('id', userId).single();
                return data;
            }),
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        const plan = (user as { plan: string })?.plan || 'free';
        const currentCount = productsCountResult.count || 0;
        const maxProducts = plan === 'pro' ? 999999 : (plan === 'plus' ? 1000 : 50);

        if (currentCount + products.length > maxProducts) {
            return res.status(403).json({
                error: 'Limit Exceeded',
                message: `Bu işlem paket limitinizi aşıyor. (${plan.toUpperCase()} limiti: ${maxProducts}, Mevcut: ${currentCount}, Eklenmek istenen: ${products.length})`
            });
        }

        if (plan === 'free') {
            const { data: existingCategoryRows, error: existingCategoriesError } = await supabase
                .from('products')
                .select('category')
                .eq('user_id', userId)
                .not('category', 'is', null);

            if (existingCategoriesError) throw existingCategoriesError;

            const existingCategories = new Set(
                (existingCategoryRows || []).flatMap((row) => parseCategoryList(row.category as string | null))
            );

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

        const { data, error } = await supabase
            .from('products')
            .insert(productsToInsert)
            .select();

        if (error) throw error;

        await Promise.all([
            deleteCache(cacheKeys.products(userId)),
            deleteCache(cacheKeys.stats(userId))
        ]);
        setProductsInvalidated(userId);

        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'products_imported',
            description: ActivityDescriptions.productsImported(data?.length || 0),
            metadata: { count: data?.length || 0 },
            ipAddress,
            userAgent
        });

        res.status(201).json(data);
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};

export const reorderProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        const parsed = reorderSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request body' });
        }
        const { order } = parsed.data;

        if (hasDuplicateValues(order.map((item) => item.id))) {
            return res.status(400).json({ error: 'Duplicate product ids are not allowed' });
        }

        const updatedAt = new Date().toISOString();
        for (const chunk of chunkArray(order, REORDER_BATCH_SIZE)) {
            const chunkResults = await Promise.all(
                chunk.map((item) =>
                    supabase
                        .from('products')
                        .update({
                            display_order: item.order,
                            updated_at: updatedAt
                        })
                        .eq('id', item.id)
                        .eq('user_id', userId)
                )
            );

            const chunkError = chunkResults.find((result) => result.error)?.error;
            if (chunkError) throw chunkError;
        }

        await Promise.all([
            deleteCache(cacheKeys.products(userId)),
            deleteCache(cacheKeys.stats(userId))
        ]);
        setProductsInvalidated(userId);

        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'products_reordered',
            description: ActivityDescriptions.productsReordered(order.length),
            metadata: { count: order.length },
            ipAddress,
            userAgent
        });

        res.json({ success: true, updated: order.length });
    } catch (error: unknown) {
        const errorMessage = safeErrorMessage(error, 'Sıralama kaydedilemedi');
        console.error('Reorder products error:', errorMessage);
        res.status(500).json({ success: false, message: 'Sıralama kaydedilemedi' });
    }
};

export const bulkUpdatePrices = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        const parsed = bulkPriceUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request body' });
        }
        const { productIds, changeType, changeMode, amount } = parsed.data;

        const uniqueProductIds = dedupeStrings(productIds);
        const idChunks = chunkArray(uniqueProductIds, DB_CHUNK_SIZE);

        const products: Array<{ id: string; price: number | null }> = [];
        for (const chunk of idChunks) {
            const { data, error } = await supabase
                .from('products')
                .select('id, price')
                .in('id', chunk)
                .eq('user_id', userId);

            if (error) throw error;
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
            } else {
                newPrice = changeType === 'increase' ? newPrice + amount : newPrice - amount;
            }

            newPrice = Math.max(0, newPrice);
            newPrice = Math.round(newPrice * 100) / 100;

            return { id: product.id, price: newPrice };
        });

        const updatedAt = new Date().toISOString();
        const updatedProducts: Array<{ id: string; price: number | null }> = [];

        for (const chunk of chunkArray(priceUpdates, UPDATE_BATCH_SIZE)) {
            const chunkResults = await Promise.all(
                chunk.map((update) =>
                    supabase
                        .from('products')
                        .update({ price: update.price, updated_at: updatedAt })
                        .eq('id', update.id)
                        .eq('user_id', userId)
                        .select('id, price')
                        .single()
                )
            );

            const chunkError = chunkResults.find((result) => result.error)?.error;
            if (chunkError) throw chunkError;

            chunkResults.forEach((result) => {
                if (result.data) {
                    updatedProducts.push(result.data);
                }
            });
        }

        await Promise.all([
            deleteCache(cacheKeys.products(userId)),
            deleteCache(cacheKeys.stats(userId))
        ]);
        setProductsInvalidated(userId);

        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'products_prices_bulk_updated',
            description: ActivityDescriptions.productsPricesBulkUpdated(updatedProducts.length),
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
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};

export const renameCategory = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

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

        const { data, error: rpcError } = await supabase.rpc('batch_rename_category', {
            p_user_id: userId,
            p_old_name: oldName,
            p_new_name: newName
        });

        if (rpcError) throw rpcError;

        await Promise.all([
            deleteCache(cacheKeys.products(userId)),
            deleteCache(cacheKeys.stats(userId))
        ]);
        setProductsInvalidated(userId);

        res.json(data || []);
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};

export const deleteCategoryFromProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

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

        const { data: products, error: fetchError } = await supabase
            .from('products')
            .select('id, category')
            .eq('user_id', userId)
            .ilike('category', `%${sanitizedCategoryName}%`);

        if (fetchError) throw fetchError;

        if (!products || products.length === 0) {
            return res.json([]);
        }

        const categoryUpdates = products
            .map((product) => {
                const categories = (product.category || '').split(',').map((c: string) => c.trim()).filter(Boolean);
                const updatedCategories = categories.filter((c: string) => normalizeCategoryToken(c) !== normalizedTarget);

                if (updatedCategories.length === categories.length) {
                    return null;
                }

                const newCategory = updatedCategories.length > 0 ? updatedCategories.join(', ') : null;
                return { id: product.id, newCategory };
            })
            .filter((entry): entry is { id: string; newCategory: string | null } => entry !== null);

        if (categoryUpdates.length === 0) {
            return res.json([]);
        }

        const updatedAt = new Date().toISOString();
        const updatedProducts: Array<{ id: string; category: string | null }> = [];

        for (const chunk of chunkArray(categoryUpdates, UPDATE_BATCH_SIZE)) {
            const chunkResults = await Promise.all(
                chunk.map(({ id, newCategory }) =>
                    supabase
                        .from('products')
                        .update({ category: newCategory, updated_at: updatedAt })
                        .eq('id', id)
                        .eq('user_id', userId)
                        .select('id, category')
                        .single()
                )
            );

            const chunkError = chunkResults.find((result) => result.error)?.error;
            if (chunkError) throw chunkError;

            chunkResults.forEach((result) => {
                if (result.data) {
                    updatedProducts.push(result.data);
                }
            });
        }

        await Promise.all([
            deleteCache(cacheKeys.products(userId)),
            deleteCache(cacheKeys.stats(userId))
        ]);
        setProductsInvalidated(userId);

        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'category_deleted',
            description: ActivityDescriptions.categoryDeleted(rawCategoryName),
            metadata: { categoryName: rawCategoryName, affectedProducts: updatedProducts.length },
            ipAddress,
            userAgent
        });

        res.json(updatedProducts);
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};

export const bulkUpdateImages = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        const parsed = bulkUpdateImagesSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request body' });
        }
        const { updates, mergeWithExisting = false } = parsed.data;

        if (hasDuplicateValues(updates.map((update) => update.productId))) {
            return res.status(400).json({ error: 'Duplicate productId values are not allowed' });
        }

        const existingImagesByProductId = new Map<string, string[]>();
        if (mergeWithExisting) {
            const productIds = dedupeStrings(updates.map((update) => update.productId));

            for (const chunk of chunkArray(productIds, DB_CHUNK_SIZE)) {
                const { data, error } = await supabase
                    .from('products')
                    .select('id, images, image_url')
                    .in('id', chunk)
                    .eq('user_id', userId);

                if (error) throw error;

                for (const row of data || []) {
                    const rowId = typeof row.id === 'string' ? row.id : '';
                    if (!rowId) continue;

                    const existingImages = normalizeImageUrls((row as { images?: unknown }).images);
                    if (existingImages.length > 0) {
                        existingImagesByProductId.set(rowId, existingImages);
                        continue;
                    }

                    const fallbackImage = typeof (row as { image_url?: unknown }).image_url === 'string'
                        ? ((row as { image_url?: string }).image_url || '').trim()
                        : '';
                    if (fallbackImage) {
                        existingImagesByProductId.set(rowId, [fallbackImage]);
                    }
                }
            }
        }

        const updatedAt = new Date().toISOString();
        const results: Array<{ productId: string; success: boolean; error?: string }> = [];

        for (const chunk of chunkArray(updates, UPDATE_BATCH_SIZE)) {
            const chunkResults = await Promise.all(
                chunk.map(async ({ productId, images }) => {
                    const incomingImages = normalizeImageUrls(images);
                    const normalizedImages = mergeWithExisting
                        ? mergeImageUrls(existingImagesByProductId.get(productId) || [], incomingImages)
                        : incomingImages;

                    const result = await supabase
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
                })
            );

            results.push(...chunkResults);
        }

        await Promise.all([
            deleteCache(cacheKeys.products(userId)),
            deleteCache(cacheKeys.stats(userId))
        ]);
        setProductsInvalidated(userId);

        const successCount = results.filter((result) => result.success).length;

        res.json({
            success: true,
            count: updates.length,
            successCount,
            failureCount: updates.length - successCount,
            results
        });
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};

