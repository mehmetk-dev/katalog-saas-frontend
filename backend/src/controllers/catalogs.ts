import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { getCache, setCache, deleteCache, cacheKeys, cacheTTL } from '../services/redis';

const getUserId = (req: Request) => (req as any).user.id;

export const getCatalogs = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        console.log(`📋 getCatalogs called for user: ${userId}`);

        const cacheKey = cacheKeys.catalogs(userId);

        // Cache'den kontrol et
        const cached = await getCache<any[]>(cacheKey);
        if (cached) {
            console.log(`📋 Returning ${cached.length} catalogs from CACHE for user: ${userId}`);
            return res.json(cached);
        }

        const { data, error } = await supabase
            .from('catalogs')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        console.log(`📋 Returning ${data?.length || 0} catalogs from DATABASE for user: ${userId}`);

        // Debug: Log first catalog's user_id to verify
        if (data && data.length > 0) {
            console.log(`📋 First catalog belongs to user_id: ${data[0].user_id}`);
        }

        // Cache'e yaz
        await setCache(cacheKey, data, cacheTTL.catalogs);

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const cacheKey = cacheKeys.catalog(userId, id);

        // Cache'den kontrol et
        const cached = await getCache<any>(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const { data, error } = await supabase
            .from('catalogs')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) return res.status(404).json({ error: 'Catalog not found' });

        // Cache'e yaz
        await setCache(cacheKey, data, cacheTTL.catalogs);

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
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
        // Templates statik, direkt döndür
        res.json(TEMPLATES);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { name, description, template_id, layout } = req.body;

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
            const { createNotification } = await import('./notifications');
            await createNotification(
                userId,
                'catalog_created',
                'Katalog Oluşturuldu 📦',
                `"${name}" kataloğunuz başarıyla oluşturuldu.`,
                `/dashboard/builder?id=${data.id}`
            );
        } catch (notifError) {
            console.error('Notification error:', notifError);
            // Bildirim hatası ana işlemi etkilemesin
        }

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

        // Cache'den kontrol et
        const cached = await getCache<any>(cacheKey);
        if (cached) {
            // View count artır (async, bekleme)
            incrementViewCount(cached.id);
            return res.json(cached);
        }

        const { data, error } = await supabase
            .from('catalogs')
            .select('*')
            .eq('share_slug', slug)
            .eq('is_published', true)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Catalog not found or not published' });
        }

        // View count artır
        incrementViewCount(data.id);

        // Cache'e yaz
        await setCache(cacheKey, data, cacheTTL.publicCatalog);

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
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

