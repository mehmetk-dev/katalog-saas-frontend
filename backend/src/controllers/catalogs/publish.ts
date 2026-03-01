import { Request, Response } from 'express';
import { supabase } from '../../services/supabase';
import { deleteCache, cacheKeys } from '../../services/redis';
import { logActivity, getRequestInfo } from '../../services/activity-logger';
import { createNotification } from '../notifications';
import { getUserId } from './helpers';
import { catalogPublishSchema } from './schemas';
import { safeErrorMessage } from '../../utils/safe-error';

export const publishCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        // SECURITY: Validate input with Zod schema
        const parsed = catalogPublishSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Validation Error',
                message: parsed.error.issues[0]?.message || 'is_published alanı zorunludur'
            });
        }
        const { is_published } = parsed.data;

        const { data: catalog } = await supabase
            .from('catalogs')
            .select('share_slug')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        const { error } = await supabase
            .from('catalogs')
            .update({
                is_published,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        // Cache'leri temizle
        await Promise.all([
            deleteCache(cacheKeys.catalogs(userId)),
            deleteCache(cacheKeys.catalog(userId, id)),
            deleteCache(cacheKeys.stats(userId)),
            ...(catalog?.share_slug ? [deleteCache(cacheKeys.publicCatalog(catalog.share_slug))] : [])
        ]);

        // Log activity
        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: is_published ? 'catalog_published' : 'catalog_unpublished',
            description: is_published ? 'Katalog yayınladı' : 'Katalog yayından kaldırdı',
            metadata: { catalogId: id, shareSlug: catalog?.share_slug },
            ipAddress,
            userAgent
        });

        // Yayınlandığında bildirim gönder
        if (is_published && catalog?.share_slug) {
            const { data: catalogData } = await supabase
                .from('catalogs')
                .select('name')
                .eq('id', id)
                .single();

            const catalogName = catalogData?.name || 'Katalog';
            const publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/catalog/${catalog.share_slug}`;

            await createNotification(
                userId,
                'catalog_created',
                `"${catalogName}" Yayında! 🎉`,
                `Katalogonuz başarıyla yayınlandı. Artık müşterileriniz ile paylaşabilirsiniz.`,
                `/catalog/${catalog.share_slug}`,
                { catalogId: id, publicUrl }
            );
        }

        res.json({ success: true });
    } catch (error: unknown) {
        const errorMessage = safeErrorMessage(error);
        res.status(500).json({ error: errorMessage });
    }
};
