"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishCatalog = void 0;
const supabase_1 = require("../../services/supabase");
const redis_1 = require("../../services/redis");
const activity_logger_1 = require("../../services/activity-logger");
const notifications_1 = require("../notifications");
const helpers_1 = require("./helpers");
const schemas_1 = require("./schemas");
const safe_error_1 = require("../../utils/safe-error");
const publishCatalog = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const { id } = req.params;
        // SECURITY: Validate input with Zod schema
        const parsed = schemas_1.catalogPublishSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Validation Error',
                message: parsed.error.issues[0]?.message || 'is_published alanı zorunludur'
            });
        }
        const { is_published } = parsed.data;
        const { data: catalog } = await supabase_1.supabase
            .from('catalogs')
            .select('share_slug')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        const { error } = await supabase_1.supabase
            .from('catalogs')
            .update({
            is_published,
            updated_at: new Date().toISOString()
        })
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            throw error;
        // Cache'leri temizle
        await Promise.all([
            (0, redis_1.deleteCache)(redis_1.cacheKeys.catalogs(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.catalog(userId, id)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.stats(userId)),
            ...(catalog?.share_slug ? [(0, redis_1.deleteCache)(redis_1.cacheKeys.publicCatalog(catalog.share_slug))] : [])
        ]);
        // Log activity
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: is_published ? 'catalog_published' : 'catalog_unpublished',
            description: is_published ? 'Katalog yayınladı' : 'Katalog yayından kaldırdı',
            metadata: { catalogId: id, shareSlug: catalog?.share_slug },
            ipAddress,
            userAgent
        });
        // Yayınlandığında bildirim gönder
        if (is_published && catalog?.share_slug) {
            const { data: catalogData } = await supabase_1.supabase
                .from('catalogs')
                .select('name')
                .eq('id', id)
                .single();
            const catalogName = catalogData?.name || 'Katalog';
            const publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/catalog/${catalog.share_slug}`;
            await (0, notifications_1.createNotification)(userId, 'catalog_created', `"${catalogName}" Yayında! 🎉`, `Katalogonuz başarıyla yayınlandı. Artık müşterileriniz ile paylaşabilirsiniz.`, `/catalog/${catalog.share_slug}`, { catalogId: id, publicUrl });
        }
        res.json({ success: true });
    }
    catch (error) {
        const errorMessage = (0, safe_error_1.safeErrorMessage)(error);
        res.status(500).json({ error: errorMessage });
    }
};
exports.publishCatalog = publishCatalog;
