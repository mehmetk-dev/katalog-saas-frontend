import crypto from 'crypto';

import { Request, Response } from 'express';

import { supabase } from '../services/supabase';
import { deleteCache, cacheKeys, cacheTTL, getOrSetCache } from '../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../services/activity-logger';
import { createNotification } from '../controllers/notifications';

// Interface definitions for better type safety
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
    };
}

interface Catalog {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    layout: string;
    is_published: boolean;
    share_slug: string | null;
    view_count: number;
    updated_at: string;
    created_at: string;
    product_ids: string[];
}

interface CatalogUpdatePayload {
    name?: string;
    description?: string;
    layout?: string;
    primary_color?: string;
    is_published?: boolean;
    share_slug?: string;
    product_ids?: string[];
    show_prices?: boolean;
    show_descriptions?: boolean;
    show_attributes?: boolean;
    show_sku?: boolean;
    columns_per_row?: number;
    background_color?: string;
    background_gradient?: string;
    background_image?: string;
    background_image_fit?: string;
    logo_url?: string;
    logo_position?: string;
    logo_size?: string;
    title_position?: string;
}

const getUserId = (req: Request): string => (req as unknown as AuthenticatedRequest).user.id;

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

        const plan = (user as { plan: string })?.plan || 'free';
        const maxCatalogs = plan === 'pro' ? 999999 : (plan === 'plus' ? 10 : 1);

        // Mark catalogs beyond the limit as disabled
        // Mark catalogs beyond the limit as disabled
        const catalogsWithStatus = (data as Catalog[]).map((catalog: Catalog, index: number) => ({
            ...catalog,
            is_disabled: index >= maxCatalogs
        }));

        res.json(catalogsWithStatus);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
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
        const allCatalogs = await getOrSetCache(cacheKeys.catalogs(userId), cacheTTL.catalogs, async () => {
            const { data } = await supabase.from('catalogs').select('id').eq('user_id', userId).order('updated_at', { ascending: false });
            return data || [];
        });

        const user = await getOrSetCache(cacheKeys.user(userId), cacheTTL.user, async () => {
            const { data } = await supabase.from('users').select('plan').eq('id', userId).single();
            return data;
        });

        const plan = (user as { plan: string })?.plan || 'free';
        const maxCatalogs = plan === 'pro' ? 999999 : (plan === 'plus' ? 10 : 1);

        const catalogIndex = (allCatalogs as { id: string }[]).findIndex((c: { id: string }) => c.id === id);
        if (catalogIndex >= maxCatalogs) {
            return res.status(403).json({
                error: 'Limit Reached',
                message: 'Bu kataloğa erişmek için planınızı yükseltmeniz gerekmektedir.'
            });
        }

        res.json(data);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const status = errorMessage === 'Catalog not found' ? 404 : 500;
        res.status(status).json({ error: errorMessage });
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
        const cacheKey = cacheKeys.templates();
        const data = await getOrSetCache(cacheKey, cacheTTL.templates, async () => {
            return TEMPLATES;
        });
        res.json(data);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const createCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { name, description, layout }: { name: string; description?: string; layout?: string } = req.body;

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
        const maxCatalogs = plan === 'pro' ? 999999 : (plan === 'plus' ? 10 : 1);

        if (currentCount >= maxCatalogs) {
            return res.status(403).json({
                error: 'Limit Reached',
                message: `Katalog oluşturma limitinize ulaştınız (${plan.toUpperCase()} planı için ${maxCatalogs} adet). Daha fazla oluşturmak için paketinizi yükseltin.`
            });
        }

        // Generate unique dynamic share slug: [username]-[catalogname]-[random]
        const cleanUserName = userName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const cleanCatalogName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const shareSlug = `${cleanUserName}-${cleanCatalogName}-${Date.now().toString(36)}`;

        const { data, error } = await supabase
            .from('catalogs')
            .insert({
                user_id: userId,
                name,
                description: description || null,
                layout: layout || 'modern-grid',
                share_slug: shareSlug,
                product_ids: [],
                is_published: false
            })
            .select()
            .single();

        if (error) {
            // Unique constraint violation için özel hata mesajı
            if (error.code === '23505' && error.message.includes('share_slug')) {
                return res.status(409).json({ 
                    error: 'Bu slug zaten kullanılıyor. Lütfen tekrar deneyin.' 
                });
            }
            throw error;
        }

        // Cache'i temizle
        await deleteCache(cacheKeys.catalogs(userId));

        // Bildirim gönder
        try {
            const { NotificationTemplates } = await import('./notifications');
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
            name,
            description,
            layout,
            primary_color,
            is_published,
            share_slug,
            product_ids,
            show_prices,
            show_descriptions,
            show_attributes,
            show_sku,
            columns_per_row,
            background_color,
            background_gradient,
            background_image,
            background_image_fit,
            logo_url,
            logo_position,
            logo_size,
            title_position
        }: CatalogUpdatePayload = req.body;

        // Eski slug'ı bul (cache temizlemek için)
        const { data: oldCatalog } = await supabase
            .from('catalogs')
            .select('share_slug')
            .eq('id', id)
            .single();

        const { error } = await supabase
            .from('catalogs')
            .update({
                name,
                description,
                layout,
                primary_color,
                is_published,
                share_slug,
                product_ids,
                show_prices,
                show_descriptions,
                show_attributes,
                show_sku,
                columns_per_row,
                background_color,
                background_gradient,
                background_image,
                background_image_fit,
                logo_url,
                logo_position,
                logo_size,
                title_position,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            // Unique constraint violation için özel hata mesajı
            if (error.code === '23505' && error.message.includes('share_slug')) {
                return res.status(409).json({ 
                    error: 'Bu slug zaten kullanılıyor. Lütfen farklı bir slug seçin.' 
                });
            }
            throw error;
        }

        // Cache'leri temizle
        await deleteCache(cacheKeys.catalogs(userId));
        await deleteCache(cacheKeys.catalog(userId, id));
        if (oldCatalog?.share_slug) {
            await deleteCache(cacheKeys.publicCatalog(oldCatalog.share_slug));
        }
        if (share_slug && share_slug !== oldCatalog?.share_slug) {
            await deleteCache(cacheKeys.publicCatalog(share_slug));
        }

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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
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
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const publishCatalog = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const { is_published }: { is_published: boolean } = req.body;

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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

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

        const plan = (user as { plan: string })?.plan || 'free';
        const maxCatalogs = plan === 'pro' ? 999999 : (plan === 'plus' ? 10 : 1);

        const catalogIndex = (allCatalogs as { id: string }[]).findIndex((c: { id: string }) => c.id === data.id);
        if (catalogIndex >= maxCatalogs) {
            return res.status(403).json({ error: 'Bu katalog şu an erişime kapalıdır. (Limit aşımı)' });
        }

        let products: Record<string, unknown>[] = [];
        if (data.product_ids && data.product_ids.length > 0) {
            const { data: productData } = await supabase
                .from('products')
                .select('*')
                .in('id', data.product_ids);

            if (productData) {
                products = data.product_ids
                    .map((pid: string) => productData.find((p: { id: string }) => p.id === pid))
                    .filter(Boolean);
            }
        }

        const visitorInfo = getVisitorInfo(req);
        const isOwner = req.headers['x-user-id'] === data.user_id;
        await smartIncrementViewCount(data.id, visitorInfo, isOwner);

        res.json({ ...data, products });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const status = errorMessage === 'Catalog not found or not published' ? 404 : 500;
        res.status(status).json({ error: errorMessage });
    }
};

const getVisitorInfo = (req: Request) => {
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
        req.headers['x-real-ip']?.toString() ||
        req.socket?.remoteAddress ||
        'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    let deviceType = 'desktop';
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
        deviceType = /ipad|tablet/i.test(userAgent) ? 'tablet' : 'mobile';
    }

    const visitorHash = crypto.createHash('md5').update(`${ip}-${userAgent}`).digest('hex');

    return { ip, userAgent, deviceType, visitorHash };
};

const smartIncrementViewCount = async (
    catalogId: string,
    visitorInfo: { ip: string; userAgent: string; deviceType: string; visitorHash: string },
    isOwner: boolean
) => {
    try {
        if (isOwner) return;

        const { error } = await supabase.rpc('smart_increment_view_count', {
            p_catalog_id: catalogId,
            p_visitor_hash: visitorInfo.visitorHash,
            p_ip_address: visitorInfo.ip,
            p_user_agent: visitorInfo.userAgent.substring(0, 500),
            p_device_type: visitorInfo.deviceType,
            p_is_owner: isOwner
        });

        if (error && error.message.includes('function')) {
            await supabase.rpc('increment_view_count', { catalog_id: catalogId });
        }
    } catch {
        try {
            await supabase.rpc('increment_view_count', { catalog_id: catalogId });
        } catch {
            // Silently fail
        }
    }
};

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        
        // TimeRange parametresini al (7d, 30d, 90d) - varsayılan 30d
        const timeRange = (req.query.timeRange as string) || '30d';
        const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;

        const [catalogsResult, productsResult] = await Promise.all([
            supabase
                .from('catalogs')
                .select('id, name, is_published, created_at')
                .eq('user_id', userId),
            supabase
                .from('products')
                .select('id', { count: 'exact' })
                .eq('user_id', userId),
        ]);

        if (catalogsResult.error) {
            console.error('Error fetching catalogs:', catalogsResult.error);
            throw new Error('Failed to fetch catalogs');
        }

        if (productsResult.error) {
            console.error('Error fetching products:', productsResult.error);
            throw new Error('Failed to fetch products');
        }

        const catalogs = catalogsResult.data || [];
        const productCount = productsResult.count || 0;

        // catalog_views tablosundan gerçek view sayılarını al
        const catalogIds = catalogs.map(c => c.id);
        let verifiedTotalViews = 0;
        const viewCountMap = new Map<string, number>();

        if (catalogIds.length > 0) {
            try {
                // Her katalog için catalog_views tablosundan gerçek sayıyı al
                const { data: viewCounts, error: viewCountError } = await supabase
                    .from('catalog_views')
                    .select('catalog_id')
                    .in('catalog_id', catalogIds)
                    .eq('is_owner', false);

                if (!viewCountError && viewCounts) {
                    // Her katalog için view sayısını hesapla
                    viewCounts.forEach(v => {
                        const count = viewCountMap.get(v.catalog_id) || 0;
                        viewCountMap.set(v.catalog_id, count + 1);
                    });
                    verifiedTotalViews = viewCounts.length;
                } else {
                    console.warn('Could not fetch view counts from catalog_views table:', viewCountError);
                }
            } catch (error) {
                console.error('Error fetching view counts:', error);
            }
        }

        // Top catalogs için gerçek view sayılarını kullan
        const topCatalogs = catalogs
            .map(c => ({
                id: c.id,
                name: c.name,
                views: viewCountMap.get(c.id) || 0,
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

        const stats = {
            totalCatalogs: catalogs.length,
            publishedCatalogs: catalogs.filter(c => c.is_published).length,
            totalViews: verifiedTotalViews, // Doğrulanmış view sayısı
            totalProducts: productCount,
            topCatalogs,
        };

        const detailedStats = {
            uniqueVisitors: 0,
            deviceStats: [] as { device_type: string; view_count: number; percentage: number }[],
            dailyViews: [] as { view_date: string; view_count: number }[],
        };

        // Detaylı analitik verilerini çek
        if (catalogIds.length > 0) {
            try {
                const dateThreshold = new Date();
                dateThreshold.setDate(dateThreshold.getDate() - days);
                const dateThresholdStr = dateThreshold.toISOString().split('T')[0];

                // Unique visitors (belirtilen zaman aralığında)
                const { data: uniqueData, error: uniqueError } = await supabase
                    .from('catalog_views')
                    .select('visitor_hash')
                    .in('catalog_id', catalogIds)
                    .eq('is_owner', false)
                    .gte('view_date', dateThresholdStr);

                if (!uniqueError && uniqueData) {
                    const uniqueHashes = new Set(uniqueData.map(d => d.visitor_hash));
                    detailedStats.uniqueVisitors = uniqueHashes.size;
                } else if (uniqueError) {
                    console.error('Error fetching unique visitors:', uniqueError);
                }

                // Device stats (belirtilen zaman aralığında)
                const { data: deviceData, error: deviceError } = await supabase
                    .from('catalog_views')
                    .select('device_type')
                    .in('catalog_id', catalogIds)
                    .eq('is_owner', false)
                    .gte('view_date', dateThresholdStr);

                if (!deviceError && deviceData && deviceData.length > 0) {
                    const deviceCounts: Record<string, number> = {};
                    deviceData.forEach(d => {
                        const type = d.device_type || 'unknown';
                        deviceCounts[type] = (deviceCounts[type] || 0) + 1;
                    });

                    const total = deviceData.length;
                    detailedStats.deviceStats = Object.entries(deviceCounts).map(([type, count]) => ({
                        device_type: type,
                        view_count: count,
                        percentage: Math.round((count / total) * 100)
                    })).sort((a, b) => b.view_count - a.view_count);
                } else if (deviceError) {
                    console.error('Error fetching device stats:', deviceError);
                }

                // Daily views (belirtilen zaman aralığında)
                const { data: dailyData, error: dailyError } = await supabase
                    .from('catalog_views')
                    .select('view_date')
                    .in('catalog_id', catalogIds)
                    .eq('is_owner', false)
                    .gte('view_date', dateThresholdStr);

                if (!dailyError && dailyData && dailyData.length > 0) {
                    const dailyCounts: Record<string, number> = {};
                    dailyData.forEach(d => {
                        const date = d.view_date;
                        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
                    });

                    detailedStats.dailyViews = Object.entries(dailyCounts)
                        .map(([date, count]) => ({ view_date: date, view_count: count }))
                        .sort((a, b) => a.view_date.localeCompare(b.view_date));
                } else if (dailyError) {
                    console.error('Error fetching daily views:', dailyError);
                }
            } catch (error) {
                // Detaylı analitik hatalarını logla ama işlemi durdurma
                console.error('Error fetching detailed analytics:', error);
            }
        }

        res.json({ ...stats, ...detailedStats });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ error: errorMessage });
    }
};
