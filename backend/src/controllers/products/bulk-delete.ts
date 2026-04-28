import type { Request, Response } from 'express';

import { supabase } from '../../services/supabase';
import { deleteCache, cacheKeys, setProductsInvalidated } from '../../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../../services/activity-logger';
import { getUserId } from './helpers';
import { cleanupProductPhotos, collectPhotoUrlsFromProducts } from './media';
import { bulkDeleteSchema } from './schemas';
import { safeErrorMessage } from '../../utils/safe-error';
import { DB_CHUNK_SIZE, MAX_ACTIVITY_ID_SAMPLE, chunkArray, dedupeStrings } from './bulk-utils';

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

        // Remove deleted product IDs from all catalogs' product_ids arrays (single batch RPC)
        const { error: catalogCleanupError } = await supabase.rpc('remove_products_from_catalogs', {
            p_product_ids: ids,
            p_user_id: userId,
        });
        if (catalogCleanupError) {
            console.error('Failed to cleanup catalog references for bulk deleted products:', catalogCleanupError);
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
