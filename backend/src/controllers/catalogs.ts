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
    show_urls?: boolean;
    columns_per_row?: number;
    background_color?: string;
    background_gradient?: string;
    background_image?: string;
    background_image_fit?: string;
    logo_url?: string;
    logo_position?: string;
    logo_size?: string;
    title_position?: string;
    product_image_fit?: string;
    header_text_color?: string;
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
        const { name: rawName, description, layout }: { name: string; description?: string; layout?: string } = req.body;

        // Varsayılan isim ataması: Eğer isim belirtilmemişse 'Yeni Katalog' veya 'Katalog-[zamandamgası]' kullan
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
        const maxCatalogs = plan === 'pro' ? 999999 : (plan === 'plus' ? 10 : 1);

        if (currentCount >= maxCatalogs) {
            return res.status(403).json({
                error: 'Limit Reached',
                message: `Katalog oluşturma limitinize ulaştınız (${plan.toUpperCase()} planı için ${maxCatalogs} adet). Daha fazla oluşturmak için paketinizi yükseltin.`
            });
        }

        // Generate unique dynamic share slug: [username]-[catalogname]-[random]
        const cleanUserName = userName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const cleanCatalogName = name.toLowerCase()
            .replace(/[ıİ]/g, 'i')
            .replace(/[ğĞ]/g, 'g')
            .replace(/[üÜ]/g, 'u')
            .replace(/[şŞ]/g, 's')
            .replace(/[öÖ]/g, 'o')
            .replace(/[çÇ]/g, 'c')
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        // Eğer kullanıcı adı "fogcatalog" ise slug'a ekleme (URL tekrarını önlemek için)
        const slugPrefix = cleanUserName === 'fogcatalog' ? '' : `${cleanUserName}-`;

        const shareSlug = `${slugPrefix}${cleanCatalogName || 'katalog'}-${Date.now().toString(36)}`;

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
            show_urls,
            columns_per_row,
            background_color,
            background_gradient,
            background_image,
            background_image_fit,
            logo_url,
            logo_position,
            logo_size,
            title_position,
            product_image_fit,
            header_text_color
        }: CatalogUpdatePayload = req.body;

        // Eski slug'ı bul (cache temizlemek için)
        const { data: oldCatalog } = await supabase
            .from('catalogs')
            .select('share_slug')
            .eq('id', id)
            .single();

        // Sadece tanımlı değerleri güncelle (undefined ve null değerleri atla)
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        if (name !== undefined && name !== null) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (layout !== undefined && layout !== null) updateData.layout = layout;
        if (primary_color !== undefined && primary_color !== null) updateData.primary_color = primary_color;
        if (is_published !== undefined && is_published !== null) updateData.is_published = is_published;
        if (share_slug !== undefined && share_slug !== null) updateData.share_slug = share_slug;
        if (product_ids !== undefined && product_ids !== null) updateData.product_ids = product_ids;
        if (show_prices !== undefined && show_prices !== null) updateData.show_prices = show_prices;
        if (show_descriptions !== undefined && show_descriptions !== null) updateData.show_descriptions = show_descriptions;
        if (show_attributes !== undefined && show_attributes !== null) updateData.show_attributes = show_attributes;
        if (show_sku !== undefined && show_sku !== null) updateData.show_sku = show_sku;
        if (show_urls !== undefined && show_urls !== null) updateData.show_urls = show_urls;
        if (columns_per_row !== undefined && columns_per_row !== null) updateData.columns_per_row = columns_per_row;
        if (background_color !== undefined && background_color !== null) updateData.background_color = background_color;
        if (background_gradient !== undefined) updateData.background_gradient = background_gradient;
        if (background_image !== undefined) updateData.background_image = background_image;
        if (background_image_fit !== undefined && background_image_fit !== null) updateData.background_image_fit = background_image_fit;
        if (logo_url !== undefined) updateData.logo_url = logo_url;
        if (logo_position !== undefined) updateData.logo_position = logo_position;
        if (logo_size !== undefined && logo_size !== null) updateData.logo_size = logo_size;
        if (title_position !== undefined && title_position !== null) updateData.title_position = title_position;
        if (product_image_fit !== undefined && product_image_fit !== null) updateData.product_image_fit = product_image_fit;
        if (header_text_color !== undefined && header_text_color !== null) updateData.header_text_color = header_text_color;


        const { error, data } = await supabase
            .from('catalogs')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select();

        if (error) {
            console.error('Catalog update error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Error details:', error.details);
            // Unique constraint violation için özel hata mesajı
            if (error.code === '23505' && error.message.includes('share_slug')) {
                return res.status(409).json({
                    error: 'Bu slug zaten kullanılıyor. Lütfen farklı bir slug seçin.'
                });
            }
            return res.status(500).json({
                error: 'Katalog güncellenirken bir hata oluştu',
                details: error.message,
                code: error.code
            });
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
        console.error('Catalog update exception:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error('Error stack:', errorStack);
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

        // Perform basic limit check via cache if possible
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

        // --- OWNERSHIP & VIEW TRACKING ---
        const visitorInfo = getVisitorInfo(req);
        const ownerId = data.user_id;

        // Try to identify if the current visitor is the owner
        let isOwner = false;

        // 1. Check x-user-id header (passed by apiFetch in frontend)
        const headerUserId = req.headers['x-user-id'];
        if (headerUserId && headerUserId === ownerId) {
            isOwner = true;
        }

        // 2. If no header, try to verify JWT (fallback for security)
        if (!isOwner && req.headers.authorization) {
            try {
                const token = req.headers.authorization.replace('Bearer ', '');
                const { data: { user: authUser } } = await supabase.auth.getUser(token);
                if (authUser && authUser.id === ownerId) {
                    isOwner = true;
                }
            } catch (e) {
                // Ignore auth error in public route
            }
        }

        // DEBUG: Analytics tracking info

        // Increment view count asynchronously to not block the request
        smartIncrementViewCount(data.id, ownerId, visitorInfo, isOwner).catch(err => {
            console.error('[PublicCatalog] View tracking failed:', err);
        });

        res.json({ ...data, products });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const status = errorMessage === 'Catalog not found or not published' ? 404 : 500;
        res.status(status).json({ error: errorMessage });
    }
};

const getVisitorInfo = (req: Request) => {
    // Forwarded IP takes precedence
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
        req.headers['x-real-ip']?.toString() ||
        req.socket?.remoteAddress ||
        '0.0.0.0';

    // User Agent
    const userAgent = (req.headers['user-agent'] || 'unknown').substring(0, 500);

    let deviceType = 'desktop';
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
        deviceType = /ipad|tablet/i.test(userAgent) ? 'tablet' : 'mobile';
    }

    // Creating a truly unique identifier per day for this visitor
    const visitorHash = crypto.createHash('md5').update(`${ip}-${userAgent}`).digest('hex');

    // DEBUG LOG

    return { ip, userAgent, deviceType, visitorHash };
};

const smartIncrementViewCount = async (
    catalogId: string,
    ownerId: string,
    visitorInfo: { ip: string; userAgent: string; deviceType: string; visitorHash: string },
    isOwner: boolean
) => {
    try {
        if (isOwner) {
            return;
        }

        const { data: inserted, error } = await supabase.rpc('smart_increment_view_count', {
            p_catalog_id: catalogId,
            p_visitor_hash: visitorInfo.visitorHash,
            p_ip_address: visitorInfo.ip,
            p_user_agent: visitorInfo.userAgent,
            p_device_type: visitorInfo.deviceType,
            p_is_owner: isOwner
        });

        if (error) {
            console.error('[Analytics] RPC Error:', error.message);
            // Fallback: Just increment the counter if complex tracking fails
            await supabase.rpc('increment_view_count', { catalog_id: catalogId });
        }

        // If a new view was recorded, clear the catalogs list cache for this user
        if (inserted || !error) {
            await deleteCache(cacheKeys.catalogs(ownerId));
        }
    } catch (err) {
        console.error('[Analytics] Critical error:', err);
    }
};

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const timeRange = (req.query.timeRange as string) || '30d';
        const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;

        // 1. Fetch Summary Stats from user_dashboard_stats view
        const { data: summaryData, error: summaryError } = await supabase
            .from('user_dashboard_stats')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (summaryError) {
            console.error('[Stats] Error fetching summary view:', summaryError);
            // Fallback will happen below if needed, but summary is preferred
        }

        const stats = {
            totalCatalogs: summaryData?.total_catalogs || 0,
            publishedCatalogs: summaryData?.published_catalogs || 0,
            totalViews: summaryData?.total_views || 0,
            totalProducts: summaryData?.total_products || 0,
            topCatalogs: summaryData?.top_catalogs || [],
        };

        const detailedStats = {
            uniqueVisitors: 0,
            deviceStats: [] as { device_type: string; view_count: number; percentage: number }[],
            dailyViews: [] as { view_date: string; view_count: number }[],
        };

        const { data: catalogs } = await supabase.from('catalogs').select('id').eq('user_id', userId);
        const catalogIds = catalogs?.map(c => c.id) || [];

        // 2. Fetch Detailed Analytics (Zaman aralığına duyarlı)
        if (catalogIds.length > 0) {
            try {
                const dateThreshold = new Date();
                dateThreshold.setDate(dateThreshold.getDate() - days);
                const dateThresholdStr = dateThreshold.toISOString().split('T')[0];

                // a. Unique Visitors
                const { data: vCount, error: vError } = await supabase
                    .rpc('get_unique_visitors_multi', {
                        p_catalog_ids: catalogIds,
                        p_days: days
                    });

                if (!vError) {
                    detailedStats.uniqueVisitors = Number(vCount);
                }

                // b. Device Stats (Using query directly for multi-catalog)
                const { data: deviceData } = await supabase
                    .from('catalog_views')
                    .select('device_type')
                    .in('catalog_id', catalogIds)
                    .eq('is_owner', false)
                    .gte('view_date', dateThresholdStr);

                if (deviceData && deviceData.length > 0) {
                    const counts: Record<string, number> = {};
                    deviceData.forEach(d => {
                        const t = d.device_type || 'unkn';
                        counts[t] = (counts[t] || 0) + 1;
                    });
                    const total = deviceData.length;
                    detailedStats.deviceStats = Object.entries(counts).map(([type, count]) => ({
                        device_type: type,
                        view_count: count,
                        percentage: Math.round((count / total) * 100)
                    })).sort((a, b) => b.view_count - a.view_count);
                }

                // c. Daily Views
                const { data: dailyData } = await supabase
                    .from('catalog_views')
                    .select('view_date')
                    .in('catalog_id', catalogIds)
                    .eq('is_owner', false)
                    .gte('view_date', dateThresholdStr);

                if (dailyData) {
                    const dCounts: Record<string, number> = {};
                    dailyData.forEach(d => {
                        dCounts[d.view_date] = (dCounts[d.view_date] || 0) + 1;
                    });
                    detailedStats.dailyViews = Object.entries(dCounts)
                        .map(([date, count]) => ({ view_date: date, view_count: count }))
                        .sort((a, b) => a.view_date.localeCompare(b.view_date));
                }
            } catch (err) {
                console.error('[Stats] Detailed error:', err);
            }
        }

        res.json({ ...stats, ...detailedStats });
    } catch (error: unknown) {
        console.error('[Stats] Critical Error:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı' });
    }
};
