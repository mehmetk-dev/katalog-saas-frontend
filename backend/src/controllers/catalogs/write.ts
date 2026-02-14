import { Request, Response } from 'express';
import { supabase } from '../../services/supabase';
import { deleteCache, cacheKeys, cacheTTL, getOrSetCache } from '../../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../../services/activity-logger';
import { createNotification } from '../notifications';
import { getUserId, getPlanLimits, generateShareSlug, pickDefinedFields } from './helpers';
import type { CatalogUpdatePayload } from './types';

// Fields that require both undefined AND null checks before writing
const FIELDS_WITH_NULL_CHECK = [
    'name', 'layout', 'primary_color', 'is_published', 'share_slug',
    'product_ids', 'show_prices', 'show_descriptions', 'show_attributes',
    'show_sku', 'show_urls', 'columns_per_row', 'background_color',
    'background_image_fit', 'logo_size', 'title_position',
    'product_image_fit', 'header_text_color', 'enable_cover_page',
    'enable_category_dividers',
];

// Fields that only need undefined check (null is a valid value to clear)
const FIELDS_WITHOUT_NULL_CHECK = [
    'description', 'background_gradient', 'background_image',
    'logo_url', 'logo_position', 'cover_image_url',
    'cover_description', 'cover_theme',
];

// All insertable optional fields
const INSERT_OPTIONAL_FIELDS = [
    'primary_color', 'show_prices', 'show_descriptions', 'show_attributes',
    'show_sku', 'show_urls', 'columns_per_row', 'background_color',
    'background_image', 'background_image_fit', 'background_gradient',
    'logo_url', 'logo_position', 'logo_size', 'title_position',
    'product_image_fit', 'header_text_color', 'enable_cover_page',
    'cover_image_url', 'cover_description', 'enable_category_dividers',
    'cover_theme',
];

export const createCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { name: rawName, description, layout, product_ids } = req.body;

        const name = rawName?.trim() || `Yeni Katalog ${new Date().toLocaleDateString('tr-TR')}`;

        // Limit kontrolü ve kullanıcı bilgileri
        const [userData, catalogsCountResult] = await Promise.all([
            getOrSetCache(cacheKeys.user(userId), cacheTTL.user, async () => {
                const { data } = await supabase.from('users').select('plan, full_name, company').eq('id', userId).single();
                return data;
            }),
            supabase.from('catalogs').select('id', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        const typedUserData = userData as { plan: string; full_name?: string; company?: string };
        const plan = typedUserData?.plan || 'free';
        const userName = typedUserData?.company || typedUserData?.full_name || 'user';
        const currentCount = catalogsCountResult.count || 0;
        const { maxCatalogs } = getPlanLimits(plan);

        if (currentCount >= maxCatalogs) {
            return res.status(403).json({
                error: 'Limit Reached',
                message: `Katalog oluşturma limitinize ulaştınız (${plan.toUpperCase()} planı için ${maxCatalogs} adet). Daha fazla oluşturmak için paketinizi yükseltin.`
            });
        }

        const shareSlug = generateShareSlug(userName, name);

        // Build insert data
        const insertData: Record<string, unknown> = {
            user_id: userId,
            name,
            description: description || null,
            layout: layout || 'modern-grid',
            share_slug: shareSlug,
            product_ids: Array.isArray(product_ids) ? product_ids : [],
            is_published: false,
        };

        // Include optional fields only if provided
        for (const key of INSERT_OPTIONAL_FIELDS) {
            if (req.body[key] !== undefined) {
                insertData[key] = req.body[key];
            }
        }

        const { data, error } = await supabase
            .from('catalogs')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            if (error.code === '23505' && error.message.includes('share_slug')) {
                return res.status(409).json({
                    error: 'Bu slug zaten kullanılıyor. Lütfen tekrar deneyin.'
                });
            }
            throw error;
        }

        // Cache'i temizle
        await Promise.all([
            deleteCache(cacheKeys.catalogs(userId)),
            deleteCache(cacheKeys.stats(userId))
        ]);

        // Bildirim gönder
        try {
            const { NotificationTemplates } = await import('../notifications');
            const template = NotificationTemplates.catalogCreated(name, data.id);
            await createNotification(
                userId,
                'catalog_created',
                template.title,
                template.message,
                template.actionUrl
            );
        } catch {
            // Bildirim hatası sessizce geçilir
        }

        // Log activity
        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'catalog_created',
            description: ActivityDescriptions.catalogCreated(name),
            metadata: { catalogId: data.id, catalogName: name },
            ipAddress,
            userAgent
        });

        res.status(201).json(data);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const updateCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const {
            name, cover_description, cover_image_url, share_slug,
        }: CatalogUpdatePayload = req.body;

        // Validate cover_description length (max 500 chars)
        if (cover_description !== undefined && cover_description !== null && cover_description.length > 500) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Kapak açıklaması maksimum 500 karakter olabilir.'
            });
        }

        // Validate cover_image_url format
        if (cover_image_url !== undefined && cover_image_url !== null && cover_image_url.trim() !== '') {
            try {
                new URL(cover_image_url);
            } catch {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Geçersiz kapak görsel URL formatı.'
                });
            }
        }

        // Eski slug'ı bul (cache temizlemek için)
        const { data: oldCatalog } = await supabase
            .from('catalogs')
            .select('share_slug')
            .eq('id', id)
            .single();

        // Build update data dynamically
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
            ...pickDefinedFields(req.body, FIELDS_WITH_NULL_CHECK, FIELDS_WITHOUT_NULL_CHECK),
        };

        const { error, data } = await supabase
            .from('catalogs')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select();

        if (error) {
            console.error('Catalog update error:', error);
            if (error.code === '23505' && error.message.includes('share_slug')) {
                return res.status(409).json({
                    error: 'Bu slug zaten kullanılıyor. Lütfen farklı bir slug seçin.'
                });
            }
            return res.status(500).json({
                error: 'Katalog güncellenirken bir hata oluştu',
                details: error.message
            });
        }

        // Cache'leri temizle
        await Promise.all([
            deleteCache(cacheKeys.catalogs(userId)),
            deleteCache(cacheKeys.catalog(userId, id)),
            deleteCache(cacheKeys.stats(userId)),
            ...(oldCatalog?.share_slug ? [deleteCache(cacheKeys.publicCatalog(oldCatalog.share_slug))] : []),
            ...(share_slug ? [deleteCache(cacheKeys.publicCatalog(share_slug))] : [])
        ]);

        // Log activity
        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'catalog_updated',
            description: ActivityDescriptions.catalogUpdated(name || 'Katalog'),
            metadata: { catalogId: id, updates: Object.keys(req.body) },
            ipAddress,
            userAgent
        });

        res.json({ success: true });
    } catch (error: unknown) {
        console.error('Catalog update exception:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            error: 'Katalog güncellenirken bir hata oluştu',
            message: errorMessage
        });
    }
};

export const deleteCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        const { error } = await supabase
            .from('catalogs')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        // Cache'leri temizle
        await Promise.all([
            deleteCache(cacheKeys.catalogs(userId)),
            deleteCache(cacheKeys.catalog(userId, id)),
            deleteCache(cacheKeys.stats(userId))
        ]);

        // Log activity
        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'catalog_deleted',
            description: 'Bir katalog sildi',
            metadata: { catalogId: id },
            ipAddress,
            userAgent
        });

        res.json({ success: true });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
