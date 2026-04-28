import type { Request, Response } from 'express';

import { supabase } from '../../services/supabase';
import { deleteCache, cacheKeys, setProductsInvalidated } from '../../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../../services/activity-logger';
import { getUserId } from './helpers';
import { safeErrorMessage } from '../../utils/safe-error';
import { UPDATE_BATCH_SIZE, chunkArray, normalizeCategoryToken, sanitizeCategoryFilterValue } from './bulk-utils';

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

        const updatedProducts: Array<{ id: string; category: string | null }> = [];

        for (const chunk of chunkArray(categoryUpdates, UPDATE_BATCH_SIZE)) {
            const chunkResults = await Promise.all(
                chunk.map(({ id, newCategory }) =>
                    supabase
                        .from('products')
                        .update({ category: newCategory })
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
