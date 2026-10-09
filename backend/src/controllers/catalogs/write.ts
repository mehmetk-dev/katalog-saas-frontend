import { Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../../services/supabase';
import { deleteCache, cacheKeys, cacheTTL, getOrSetCache } from '../../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../../services/activity-logger';
import { createNotification, NotificationTemplates } from '../notifications';
import { getUserId, getPlanLimits, generateShareSlug, pickDefinedFields } from './helpers';
import { catalogCreateSchema, catalogUpdateSchema } from './schemas';
import { safeErrorMessage } from '../../utils/safe-error';
import type { CatalogUpdatePayload } from './types';
import { findMissingProductIds } from './product-ownership';

const PRODUCT_OWNERSHIP_CHUNK_SIZE = 100;

/** Public katalog + meta (başlık, açıklama, show_in_search) önbellek anahtarlarını siler */
function deletePublicCatalogCache(slug: string): Promise<void>[] {
    const key = cacheKeys.publicCatalog(slug);
    return [deleteCache(key, true), deleteCache(`${key}:meta`, true)];
}
const PRODUCT_OWNERSHIP_CONCURRENCY = 6;

async function getMissingOwnedProductIds(userId: string, productIds: string[]): Promise<string[]> {
    const requestedIds = Array.from(new Set(productIds));
    if (requestedIds.length === 0) return [];

    const chunks: string[][] = [];
    for (let index = 0; index < requestedIds.length; index += PRODUCT_OWNERSHIP_CHUNK_SIZE) {
        chunks.push(requestedIds.slice(index, index + PRODUCT_OWNERSHIP_CHUNK_SIZE));
    }

    const ownedIds: string[] = [];
    for (let index = 0; index < chunks.length; index += PRODUCT_OWNERSHIP_CONCURRENCY) {
        const batch = chunks.slice(index, index + PRODUCT_OWNERSHIP_CONCURRENCY);
        const results = await Promise.all(batch.map(async (chunk) => {
            const { data, error } = await supabase
                .from('products')
                .select('id')
                .eq('user_id', userId)
                .in('id', chunk)
                .limit(chunk.length);

            if (error) throw error;
            return (data || []).map((product) => product.id as string);
        }));
        ownedIds.push(...results.flat());
    }

    return findMissingProductIds(requestedIds, ownedIds);
}

// Fields that require both undefined AND null checks before writing
const FIELDS_WITH_NULL_CHECK = [
    'name', 'layout', 'primary_color', 'is_published', 'share_slug',
    'product_ids', 'show_prices', 'show_descriptions', 'show_attributes',
    'show_sku', 'show_urls', 'columns_per_row', 'background_color',
    'background_image_fit', 'logo_size', 'title_position',
    'product_image_fit', 'header_text_color', 'enable_cover_page',
    'enable_category_dividers', 'show_in_search', 'category_order'
];

// Fields that only need undefined check (null is a valid value to clear)
const FIELDS_WITHOUT_NULL_CHECK = [
    'description', 'background_gradient', 'background_image',
    'logo_url', 'logo_position', 'cover_image_url',
    'cover_description', 'cover_theme',
];

// All insertable optional fields
/** Builder'ın yeni katalog varsayılanıyla aynı nötr koyu (zinc-900) */
const DEFAULT_CATALOG_PRIMARY_COLOR = '#18181b';

const INSERT_OPTIONAL_FIELDS = [
    'primary_color', 'show_prices', 'show_descriptions', 'show_attributes',
    'show_sku', 'show_urls', 'columns_per_row', 'background_color',
    'background_image', 'background_image_fit', 'background_gradient',
    'logo_url', 'logo_position', 'logo_size', 'title_position',
    'product_image_fit', 'header_text_color', 'enable_cover_page',
    'cover_image_url', 'cover_description', 'enable_category_dividers',
    'cover_theme', 'show_in_search', 'category_order'
];

/** Premium (is_pro) şablon kimlikleri; 10 dk önbellekli */
async function getPremiumTemplateIds(): Promise<Set<string>> {
    const ids = await getOrSetCache<string[]>('katalog:templates:premium-ids', 600, async () => {
        const { data, error } = await supabase.from('templates').select('id').eq('is_pro', true);
        if (error) throw error;
        return (data || []).map((row) => String(row.id));
    });
    return new Set(ids);
}

/**
 * Ücretsiz planda premium şablon yalnızca arayüzde engelleniyordu; API'ye doğrudan istekle
 * premium şablonlu katalog oluşturulabiliyordu. Güncellemede yalnızca şablon değişiyorsa
 * kontrol edilir: plan düşürülen kullanıcının premium şablonlu mevcut kataloğu kaydedilmeye
 * devam edebilmeli.
 */
async function isPremiumTemplateBlocked(plan: string, layout: string | null | undefined): Promise<boolean> {
    if (plan !== 'free' || !layout) return false;
    return (await getPremiumTemplateIds()).has(layout);
}

// apiFetch kullanıcıya `error` alanını gösterir
const PREMIUM_TEMPLATE_ERROR = {
    error: 'Bu şablon Plus ve Pro planlarda kullanılabilir.',
    code: 'premium_template',
    message: 'Bu şablon Plus ve Pro planlarda kullanılabilir.',
};

export const createCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        // SECURITY: Validate input with Zod schema
        const parsed = catalogCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Validation Error',
                message: parsed.error.issues[0]?.message || 'Geçersiz istek verisi'
            });
        }
        const { name: rawName, description, layout, product_ids } = parsed.data;

        if (product_ids?.length) {
            const missingProductIds = await getMissingOwnedProductIds(userId, product_ids);
            if (missingProductIds.length > 0) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Bir veya daha fazla ürün geçersiz ya da bu hesaba ait değil.'
                });
            }
        }

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

        if (await isPremiumTemplateBlocked(plan, layout)) {
            return res.status(403).json(PREMIUM_TEMPLATE_ERROR);
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
            // DB sütun varsayılanı hâlâ eski mor (#7c3aed); katalog artık builder'dan önce oluşturulduğu
            // için yeni kataloglar mor açılıyordu. Gönderilmişse aşağıda üzerine yazılır.
            primary_color: DEFAULT_CATALOG_PRIMARY_COLOR,
        };

        // Include optional fields only if provided
        // SECURITY: Use parsed.data (Zod-validated) instead of raw req.body
        for (const key of INSERT_OPTIONAL_FIELDS) {
            if ((parsed.data as Record<string, unknown>)[key] !== undefined) {
                insertData[key] = (parsed.data as Record<string, unknown>)[key];
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
        const errorMessage = safeErrorMessage(error);
        res.status(500).json({ error: errorMessage });
    }
};

export const updateCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        // SECURITY: Validate input with Zod schema
        const parsed = catalogUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Validation Error',
                message: parsed.error.issues[0]?.message || 'Geçersiz istek verisi'
            });
        }
        const { name, cover_description, cover_image_url, share_slug, product_ids } = parsed.data;

        if (product_ids?.length) {
            const missingProductIds = await getMissingOwnedProductIds(userId, product_ids);
            if (missingProductIds.length > 0) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Bir veya daha fazla ürün geçersiz ya da bu hesaba ait değil.'
                });
            }
        }

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
            .select('share_slug, layout')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        const nextLayout = (parsed.data as { layout?: string }).layout;
        if (nextLayout && nextLayout !== oldCatalog?.layout) {
            const userData = await getOrSetCache(cacheKeys.user(userId), cacheTTL.user, async () => {
                const { data } = await supabase.from('users').select('plan, full_name, company').eq('id', userId).single();
                return data;
            }) as { plan?: string } | null;
            if (await isPremiumTemplateBlocked(userData?.plan || 'free', nextLayout)) {
                return res.status(403).json(PREMIUM_TEMPLATE_ERROR);
            }
        }

        // Build update data dynamically
        // SECURITY: Use parsed.data (Zod-validated) instead of raw req.body
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
            ...pickDefinedFields(parsed.data as Record<string, unknown>, FIELDS_WITH_NULL_CHECK, FIELDS_WITHOUT_NULL_CHECK),
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
                error: 'Katalog güncellenirken bir hata oluştu'
            });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Katalog bulunamadı veya yetkiniz yok.' });
        }

        // Cache'leri temizle
        await Promise.all([
            deleteCache(cacheKeys.catalogs(userId)),
            deleteCache(cacheKeys.catalog(userId, id), true),
            deleteCache(cacheKeys.stats(userId)),
            ...(oldCatalog?.share_slug ? deletePublicCatalogCache(oldCatalog.share_slug) : []),
            ...(share_slug ? deletePublicCatalogCache(share_slug) : [])
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
        const errorMessage = safeErrorMessage(error, 'Katalog güncellenirken bir hata oluştu');
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

        const { data: deleted, error } = await supabase
            .from('catalogs')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
            .select('share_slug');

        if (error) throw error;

        // Cache'leri temizle — public kopya da silinmeli, yoksa silinen katalog TTL boyunca açık kalır
        const deletedSlugs = (deleted || []).map((row) => row.share_slug as string | null).filter((slug): slug is string => !!slug);
        await Promise.all([
            deleteCache(cacheKeys.catalogs(userId)),
            deleteCache(cacheKeys.catalog(userId, id), true),
            deleteCache(cacheKeys.stats(userId)),
            ...deletedSlugs.flatMap(deletePublicCatalogCache),
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
        const errorMessage = safeErrorMessage(error);
        res.status(500).json({ error: errorMessage });
    }
};

const duplicateCatalogSchema = z.object({
    name: z.string().trim().min(1).max(255).optional(),
});

/** Kopyada aynen taşınan alanlar (yayın durumu, slug ve istatistikler hariç) */
const DUPLICATE_COPIED_FIELDS = ['description', 'layout', 'template_id', 'product_ids', ...INSERT_OPTIONAL_FIELDS];

export const duplicateCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        const parsed = duplicateCatalogSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Validation Error',
                message: parsed.error.issues[0]?.message || 'Geçersiz istek verisi'
            });
        }

        const [sourceResult, userData, catalogsCountResult] = await Promise.all([
            supabase.from('catalogs').select('*').eq('id', id).eq('user_id', userId).maybeSingle(),
            getOrSetCache(cacheKeys.user(userId), cacheTTL.user, async () => {
                const { data } = await supabase.from('users').select('plan, full_name, company').eq('id', userId).single();
                return data;
            }),
            supabase.from('catalogs').select('id', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        if (sourceResult.error) throw sourceResult.error;
        const source = sourceResult.data as Record<string, unknown> | null;
        if (!source) {
            return res.status(404).json({ error: 'Catalog not found' });
        }

        const typedUserData = userData as { plan: string; full_name?: string; company?: string };
        const plan = typedUserData?.plan || 'free';
        const { maxCatalogs } = getPlanLimits(plan);
        if ((catalogsCountResult.count || 0) >= maxCatalogs) {
            return res.status(403).json({
                error: 'Limit Reached',
                message: `Katalog oluşturma limitinize ulaştınız (${plan.toUpperCase()} planı için ${maxCatalogs} adet). Daha fazla oluşturmak için paketinizi yükseltin.`
            });
        }

        const name = parsed.data.name || `${String(source.name || 'Katalog')} (kopya)`;
        const userName = typedUserData?.company || typedUserData?.full_name || 'user';

        const insertData: Record<string, unknown> = {
            user_id: userId,
            name,
            share_slug: generateShareSlug(userName, name),
            is_published: false,
        };
        for (const key of DUPLICATE_COPIED_FIELDS) {
            if (source[key] !== undefined) insertData[key] = source[key];
        }

        const { data, error } = await supabase
            .from('catalogs')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            if (error.code === '23505' && error.message.includes('share_slug')) {
                return res.status(409).json({ error: 'Bu slug zaten kullanılıyor. Lütfen tekrar deneyin.' });
            }
            throw error;
        }

        await Promise.all([
            deleteCache(cacheKeys.catalogs(userId)),
            deleteCache(cacheKeys.stats(userId))
        ]);

        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'catalog_created',
            description: ActivityDescriptions.catalogCreated(name),
            metadata: { catalogId: data.id, catalogName: name, duplicatedFrom: id },
            ipAddress,
            userAgent
        });

        res.status(201).json(data);
    } catch (error: unknown) {
        const errorMessage = safeErrorMessage(error);
        res.status(500).json({ error: errorMessage });
    }
};
