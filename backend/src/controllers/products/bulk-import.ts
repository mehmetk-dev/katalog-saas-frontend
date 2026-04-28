import type { Request, Response } from 'express';

import { supabase } from '../../services/supabase';
import { deleteCache, cacheKeys, cacheTTL, getOrSetCache, setProductsInvalidated } from '../../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../../services/activity-logger';
import { getUserId } from './helpers';
import { bulkImportSchema } from './schemas';
import { safeErrorMessage } from '../../utils/safe-error';
import { DB_CHUNK_SIZE, chunkArray, parseCategoryList } from './bulk-utils';

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

        const insertedProducts: Record<string, unknown>[] = [];
        const insertedIds: string[] = [];
        let chunkError: unknown = null;

        for (const chunk of chunkArray(productsToInsert, DB_CHUNK_SIZE)) {
            const { data, error } = await supabase
                .from('products')
                .insert(chunk)
                .select();

            if (error) {
                chunkError = error;
                // Best-effort rollback: delete already-inserted products from previous chunks
                if (insertedIds.length > 0) {
                    for (const rollbackChunk of chunkArray(insertedIds, DB_CHUNK_SIZE)) {
                        await supabase.from('products').delete().in('id', rollbackChunk).eq('user_id', userId);
                    }
                }
                break;
            }
            if (data?.length) {
                insertedProducts.push(...data);
                for (const row of data) {
                    if (typeof row.id === 'string') insertedIds.push(row.id);
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
            deleteCache(cacheKeys.products(userId)),
            deleteCache(cacheKeys.stats(userId))
        ]);
        setProductsInvalidated(userId);

        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'products_imported',
            description: ActivityDescriptions.productsImported(insertedProducts.length),
            metadata: { count: insertedProducts.length },
            ipAddress,
            userAgent
        });

        res.status(201).json(insertedProducts);
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};
