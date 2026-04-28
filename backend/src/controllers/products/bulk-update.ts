import type { Request, Response } from 'express';

import { supabase } from '../../services/supabase';
import { deleteCache, cacheKeys, setProductsInvalidated } from '../../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../../services/activity-logger';
import { getUserId } from './helpers';
import { reorderSchema, bulkUpdateImagesSchema, bulkPriceUpdateSchema, bulkUpdateFieldsSchema } from './schemas';
import { safeErrorMessage } from '../../utils/safe-error';
import { DB_CHUNK_SIZE, UPDATE_BATCH_SIZE, chunkArray, dedupeStrings, hasDuplicateValues, normalizeImageUrls, mergeImageUrls } from './bulk-utils';

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

        // Use RPC for single-query bulk reorder instead of N individual UPDATEs
        const { error: rpcError } = await supabase.rpc('bulk_reorder_products', {
            p_user_id: userId,
            p_updates: order.map(item => ({ id: item.id, order: item.order })),
        });
        if (rpcError) throw rpcError;

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

        const updatedProducts: Array<{ id: string; price: number | null }> = [];

        // Use RPC for single-query bulk update instead of N individual UPDATEs
        const { error: rpcError } = await supabase.rpc('bulk_update_product_prices', {
            p_user_id: userId,
            p_updates: priceUpdates,
        });
        if (rpcError) throw rpcError;

        // Fetch updated products for response
        const { data: fetchedUpdated, error: fetchError } = await supabase
            .from('products')
            .select('id, price')
            .in('id', priceUpdates.map(u => u.id))
            .eq('user_id', userId);
        if (fetchError) throw fetchError;
        if (fetchedUpdated?.length) updatedProducts.push(...fetchedUpdated);

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

export const bulkUpdateFields = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        const parsed = bulkUpdateFieldsSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            return res.status(400).json({ error: issue?.message || 'Invalid request body' });
        }

        const { updates } = parsed.data;
        let succeeded = 0;
        let failed = 0;

        for (const batch of chunkArray(updates, UPDATE_BATCH_SIZE)) {
            const results = await Promise.allSettled(
                batch.map(({ id, ...fields }) => {
                    const updateData: Record<string, unknown> = {};

                    if (fields.name !== undefined) updateData.name = fields.name;
                    if (fields.sku !== undefined) updateData.sku = fields.sku;
                    if (fields.description !== undefined) updateData.description = fields.description;
                    if (fields.price !== undefined) updateData.price = fields.price;
                    if (fields.stock !== undefined) updateData.stock = fields.stock;
                    if (fields.category !== undefined) updateData.category = fields.category;
                    if (fields.product_url !== undefined) updateData.product_url = fields.product_url === '' ? null : fields.product_url;
                    if (fields.custom_attributes !== undefined) updateData.custom_attributes = fields.custom_attributes || [];

                    return supabase
                        .from('products')
                        .update(updateData)
                        .eq('id', id)
                        .eq('user_id', userId);
                })
            );

            succeeded += results.filter(r => r.status === 'fulfilled' && !(r.value as { error?: unknown }).error).length;
            failed += results.length - results.filter(r => r.status === 'fulfilled' && !(r.value as { error?: unknown }).error).length;
        }

        await Promise.all([
            deleteCache(cacheKeys.products(userId)),
            deleteCache(cacheKeys.stats(userId))
        ]);
        setProductsInvalidated(userId);

        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'products_bulk_fields_updated',
            description: ActivityDescriptions.productsBulkFieldsUpdated(succeeded),
            metadata: { updatedCount: succeeded, failedCount: failed },
            ipAddress,
            userAgent
        });

        res.json({ success: true, updatedCount: succeeded, failedCount: failed });
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};
