import { Request, Response } from 'express';

import { supabase } from '../services/supabase';
import { getCache, setCache, deleteCache, cacheKeys, cacheTTL, getOrSetCache } from '../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../services/activity-logger';

const getUserId = (req: Request) => (req as any).user.id;

export const getCatalogs = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const cacheKey = cacheKeys.catalogs(userId);

        const data = await getOrSetCache(cacheKey, cacheTTL.catalogs, async () => {
            const { data, error } = await supabase
                .from('catalogs')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data;
        });

        // Get user plan to mark disabled catalogs
        const user = await getOrSetCache(cacheKeys.user(userId), cacheTTL.user, async () => {
            const { data } = await supabase.from('users').select('plan').eq('id', userId).single();
            return data;
        });

        const plan = user?.plan || 'free';
        const maxCatalogs = plan === 'pro' ? 999999 : (plan === 'plus' ? 10 : 1);

        // Mark catalogs beyond the limit as disabled
        const catalogsWithStatus = data.map((catalog: any, index: number) => ({
            ...catalog,
            is_disabled: index >= maxCatalogs
        }));

        res.json(catalogsWithStatus);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const cacheKey = cacheKeys.catalog(userId, id);

        const data = await getOrSetCache(cacheKey, cacheTTL.catalogs, async () => {
            const { data, error } = await supabase
                .from('catalogs')
                .select('*')
                .eq('id', id)
                .eq('user_id', userId)
                .single();

            if (error) throw new Error('Catalog not found');
            return data;
        });

        // Limit kontrolü: Bu katalog erişilebilir mi?
        // Tüm kataloglarını çekip sırasına bakalım (getCatalogs'daki mantıkla aynı)
        const allCatalogs = await getOrSetCache(cacheKeys.catalogs(userId), cacheTTL.catalogs, async () => {
            const { data } = await supabase.from('catalogs').select('id').eq('user_id', userId).order('updated_at', { ascending: false });
            return data || [];
        });

        const user = await getOrSetCache(cacheKeys.user(userId), cacheTTL.user, async () => {
            const { data } = await supabase.from('users').select('plan').eq('id', userId).single();
            return data;
        });

        const plan = user?.plan || 'free';
        const maxCatalogs = plan === 'pro' ? 999999 : (plan === 'plus' ? 10 : 1);

        const catalogIndex = allCatalogs.findIndex((c: any) => c.id === id);
        if (catalogIndex >= maxCatalogs) {
            return res.status(403).json({
                error: 'Limit Reached',
                message: 'Bu kataloğa erişmek için planınızı yükseltmeniz gerekmektedir.'
            });
        }

        res.json(data);
    } catch (error: any) {
        const status = error.message === 'Catalog not found' ? 404 : 500;
        res.status(status).json({ error: error.message });
    }
};

// Hardcoded templates - cache'lenir
const TEMPLATES = [
    // Ücretsiz şablonlar
    { id: "modern-grid", name: "Modern Izgara", layout: "modern-grid", is_premium: false, description: "Görsel ürünler için temiz ızgara düzeni" },
    { id: "compact-list", name: "Kompakt Liste", layout: "compact-list", is_premium: false, description: "Geniş envanterler için sık listeleme" },
    { id: "clean-white", name: "Temiz Beyaz", layout: "clean-white", is_premium: false, description: "Minimalist beyaz tasarım" },
    { id: "product-tiles", name: "Ürün Karoları", layout: "product-tiles", is_premium: false, description: "Kompakt 3x4 karo görünümü" },
    // Pro şablonlar
    { id: "magazine", name: "Dergi", layout: "magazine", is_premium: true, description: "Büyük görsellere sahip editoryal stil" },
    { id: "minimalist", name: "Minimalist", layout: "minimalist", is_premium: true, description: "Temel boşluklar ve tipografi" },
    { id: "bold", name: "Kalın", layout: "bold", is_premium: true, description: "Yüksek kontrast ve güçlü yazı tipleri" },
    { id: "elegant-cards", name: "Zarif Kartlar", layout: "elegant-cards", is_premium: true, description: "Lüks kart tasarımı, taş tonları" },
    { id: "classic-catalog", name: "Klasik Katalog", layout: "classic-catalog", is_premium: true, description: "Profesyonel iş kataloğu formatı" },
    { id: "showcase", name: "Vitrin", layout: "showcase", is_premium: true, description: "Spotlight layout, koyu tema" },
    { id: "catalog-pro", name: "Katalog Pro", layout: "catalog-pro", is_premium: true, description: "3 sütunlu profesyonel görünüm" },
    { id: "retail", name: "Perakende", layout: "retail", is_premium: true, description: "Fiyat listesi mağaza formatı" },
    { id: "tech-modern", name: "Teknoloji", layout: "tech-modern", is_premium: true, description: "Koyu tema, tech ürünleri için" },
    { id: "fashion-lookbook", name: "Moda Lookbook", layout: "fashion-lookbook", is_premium: true, description: "Hero layout, moda kataloğu" },
    { id: "industrial", name: "Endüstriyel", layout: "industrial", is_premium: true, description: "Teknik ürünler için kompakt" },
    { id: "luxury", name: "Lüks Koleksiyon", layout: "luxury", is_premium: true, description: "Premium ürünler için altın tema" },
];

export const getTemplates = async (req: Request, res: Response) => {
    try {
        // Templates statik ama gelecekte DB'den gelebilir diye cacheKey hazır
        const cacheKey = cacheKeys.templates();
        const data = await getOrSetCache(cacheKey, cacheTTL.templates, async () => {
            return TEMPLATES;
        });
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { name, description, template_id, layout } = req.body;

        // Limit kontrolü
        const [user, catalogsCountResult] = await Promise.all([
            getOrSetCache(cacheKeys.user(userId), cacheTTL.user, async () => {
                const { data } = await supabase.from('users').select('plan').eq('id', userId).single();
                return data;
            }),
            supabase.from('catalogs').select('id', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        const plan = user?.plan || 'free';
        const currentCount = catalogsCountResult.count || 0;
        const maxCatalogs = plan === 'pro' ? 999999 : (plan === 'plus' ? 10 : 1);

        if (currentCount >= maxCatalogs) {
            return res.status(403).json({
                error: 'Limit Reached',
                message: `Katalog oluşturma limitinize ulaştınız (${plan.toUpperCase()} planı için ${maxCatalogs} adet). Daha fazla oluşturmak için paketinizi yükseltin.`
            });
        }

        // Generate unique share slug
        const shareSlug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

        const { data, error } = await supabase
            .from('catalogs')
            .insert({
                user_id: userId,
                name,
                description: description || null,
                // template_id is UUID type, but we use string identifiers, so skip it
                // The layout field is sufficient to identify the template
                layout: layout || template_id || 'grid',
                share_slug: shareSlug,
                product_ids: []
            })
            .select()
            .single();

        if (error) throw error;

        // Cache'i temizle
        await deleteCache(cacheKeys.catalogs(userId));

        // Bildirim gönder
        try {
            const { createNotification, NotificationTemplates } = await import('./notifications');
            const template = NotificationTemplates.catalogCreated(name, data.id);
            await createNotification(
                userId,
                'catalog_created',
                template.title,
                template.message,
                template.actionUrl
            );
        } catch (notifError) {
            console.error('Notification error:', notifError);
            // Bildirim hatası ana işlemi etkilemesin
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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const updates = req.body;

        const { error } = await supabase
            .from('catalogs')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        // Cache'leri temizle
        await deleteCache(cacheKeys.catalogs(userId));
        await deleteCache(cacheKeys.catalog(userId, id));

        // Log activity
        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'catalog_updated',
            description: ActivityDescriptions.catalogUpdated(updates.name || 'Katalog'),
            metadata: { catalogId: id, updates: Object.keys(updates) },
            ipAddress,
            userAgent
        });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
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
        await deleteCache(cacheKeys.catalogs(userId));
        await deleteCache(cacheKeys.catalog(userId, id));

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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const publishCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const { is_published } = req.body;

        // Önce catalog'u al - share_slug lazım
        const { data: catalog } = await supabase
            .from('catalogs')
            .select('share_slug')
            .eq('id', id)
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
        await deleteCache(cacheKeys.catalogs(userId));
        await deleteCache(cacheKeys.catalog(userId, id));
        if (catalog?.share_slug) {
            await deleteCache(cacheKeys.publicCatalog(catalog.share_slug));
        }

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

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// PUBLIC ROUTE HANDLER
export const getPublicCatalog = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const cacheKey = cacheKeys.publicCatalog(slug);

        const data = await getOrSetCache(cacheKey, cacheTTL.publicCatalog, async () => {
            const { data, error } = await supabase
                .from('catalogs')
                .select('*')
                .eq('share_slug', slug)
                .eq('is_published', true)
                .single();

            if (error || !data) throw new Error('Catalog not found or not published');
            return data;
        });

        // Limit kontrolü: Paylaşılan katalog hala aktif mi?
        const userId = data.user_id;
        const [allCatalogs, user] = await Promise.all([
            getOrSetCache(cacheKeys.catalogs(userId), cacheTTL.catalogs, async () => {
                const { data: list } = await supabase.from('catalogs').select('id').eq('user_id', userId).order('updated_at', { ascending: false });
                return list || [];
            }),
            getOrSetCache(cacheKeys.user(userId), cacheTTL.user, async () => {
                const { data: u } = await supabase.from('users').select('plan').eq('id', userId).single();
                return u;
            })
        ]);

        const plan = user?.plan || 'free';
        const maxCatalogs = plan === 'pro' ? 999999 : (plan === 'plus' ? 10 : 1);

        const catalogIndex = allCatalogs.findIndex((c: any) => c.id === data.id);
        if (catalogIndex >= maxCatalogs) {
            return res.status(403).json({ error: 'Bu katalog şu an erişime kapalıdır. (Limit aşımı)' });
        }

        // View count artır (async, bekleme)
        incrementViewCount(data.id);

        res.json(data);
    } catch (error: any) {
        const status = error.message === 'Catalog not found or not published' ? 404 : 500;
        res.status(status).json({ error: error.message });
    }
};

// View count helper (fire and forget)
const incrementViewCount = async (catalogId: string) => {
    try {
        await supabase.rpc('increment_view_count', { catalog_id: catalogId });
    } catch (error) {
        // Hata olursa sessizce devam et
        console.warn('View count increment failed:', error);
    }
};

// Dashboard istatistikleri
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        // Paralel sorgular
        const [catalogsResult, productsResult] = await Promise.all([
            supabase
                .from('catalogs')
                .select('id, name, view_count, is_published, created_at')
                .eq('user_id', userId)
                .order('view_count', { ascending: false }),
            supabase
                .from('products')
                .select('id', { count: 'exact' })
                .eq('user_id', userId),
        ]);

        const catalogs = catalogsResult.data || [];
        const productCount = productsResult.count || 0;

        const stats = {
            totalCatalogs: catalogs.length,
            publishedCatalogs: catalogs.filter(c => c.is_published).length,
            totalViews: catalogs.reduce((sum, c) => sum + (c.view_count || 0), 0),
            totalProducts: productCount,
            topCatalogs: catalogs.slice(0, 5).map(c => ({
                id: c.id,
                name: c.name,
                views: c.view_count || 0,
            })),
        };

        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

