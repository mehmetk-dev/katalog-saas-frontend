"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = exports.getPublicCatalog = exports.publishCatalog = exports.deleteCatalog = exports.updateCatalog = exports.createCatalog = exports.getTemplates = exports.getCatalog = exports.getCatalogs = void 0;
const crypto_1 = __importDefault(require("crypto"));
const supabase_1 = require("../services/supabase");
const redis_1 = require("../services/redis");
const activity_logger_1 = require("../services/activity-logger");
const notifications_1 = require("../controllers/notifications");
const getUserId = (req) => req.user.id;
const getCatalogs = async (req, res) => {
    try {
        const userId = getUserId(req);
        // DEBUG: Bypass cache to investigate stale data issues
        const { data, error } = await supabase_1.supabase
            .from('catalogs')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
        if (error)
            throw error;
        // Get user plan to mark disabled catalogs
        const user = await (0, redis_1.getOrSetCache)(redis_1.cacheKeys.user(userId), redis_1.cacheTTL.user, async () => {
            const { data } = await supabase_1.supabase.from('users').select('plan').eq('id', userId).single();
            return data;
        });
        const plan = user?.plan || 'free';
        const maxCatalogs = plan === 'pro' ? 999999 : (plan === 'plus' ? 10 : 1);
        // Mark catalogs beyond the limit as disabled
        const catalogsWithStatus = data.map((catalog, index) => ({
            ...catalog,
            is_disabled: index >= maxCatalogs
        }));
        res.json(catalogsWithStatus);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.getCatalogs = getCatalogs;
const getCatalog = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const cacheKey = redis_1.cacheKeys.catalog(userId, id);
        const data = await (0, redis_1.getOrSetCache)(cacheKey, redis_1.cacheTTL.catalogs, async () => {
            const { data, error } = await supabase_1.supabase
                .from('catalogs')
                .select('*')
                .eq('id', id)
                .eq('user_id', userId)
                .single();
            if (error)
                throw new Error('Catalog not found');
            return data;
        });
        // Limit kontrolü: Bu katalog erişilebilir mi?
        const allCatalogs = await (0, redis_1.getOrSetCache)(redis_1.cacheKeys.catalogs(userId), redis_1.cacheTTL.catalogs, async () => {
            const { data } = await supabase_1.supabase.from('catalogs').select('id').eq('user_id', userId).order('updated_at', { ascending: false });
            return data || [];
        });
        const user = await (0, redis_1.getOrSetCache)(redis_1.cacheKeys.user(userId), redis_1.cacheTTL.user, async () => {
            const { data } = await supabase_1.supabase.from('users').select('plan').eq('id', userId).single();
            return data;
        });
        const plan = user?.plan || 'free';
        const maxCatalogs = plan === 'pro' ? 999999 : (plan === 'plus' ? 10 : 1);
        const catalogIndex = allCatalogs.findIndex((c) => c.id === id);
        if (catalogIndex >= maxCatalogs) {
            return res.status(403).json({
                error: 'Limit Reached',
                message: 'Bu kataloğa erişmek için planınızı yükseltmeniz gerekmektedir.'
            });
        }
        res.json(data);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const status = errorMessage === 'Catalog not found' ? 404 : 500;
        res.status(status).json({ error: errorMessage });
    }
};
exports.getCatalog = getCatalog;
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
const getTemplates = async (req, res) => {
    try {
        const cacheKey = redis_1.cacheKeys.templates();
        const data = await (0, redis_1.getOrSetCache)(cacheKey, redis_1.cacheTTL.templates, async () => {
            return TEMPLATES;
        });
        res.json(data);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.getTemplates = getTemplates;
const createCatalog = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { name: rawName, description, layout } = req.body;
        // Varsayılan isim ataması: Eğer isim belirtilmemişse 'Yeni Katalog' veya 'Katalog-[zamandamgası]' kullan
        const name = rawName?.trim() || `Yeni Katalog ${new Date().toLocaleDateString('tr-TR')}`;
        // Limit kontrolü ve kullanıcı bilgileri
        const [userData, catalogsCountResult] = await Promise.all([
            (0, redis_1.getOrSetCache)(redis_1.cacheKeys.user(userId), redis_1.cacheTTL.user, async () => {
                const { data } = await supabase_1.supabase.from('users').select('plan, full_name, company').eq('id', userId).single();
                return data;
            }),
            supabase_1.supabase.from('catalogs').select('id', { count: 'exact', head: true }).eq('user_id', userId)
        ]);
        const typedUserData = userData;
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
            .replace(/^-+|-+$/g, "")
            .substring(0, 50); // Uzun isimleri kırp
        // Eğer kullanıcı adı "fogcatalog" ise slug'a ekleme (URL tekrarını önlemek için)
        const slugPrefix = cleanUserName === 'fogcatalog' ? '' : `${cleanUserName.substring(0, 30)}-`;
        const shareSlug = `${slugPrefix}${cleanCatalogName || 'katalog'}-${Date.now().toString(36)}`;
        const { data, error } = await supabase_1.supabase
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
        await Promise.all([
            (0, redis_1.deleteCache)(redis_1.cacheKeys.catalogs(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.stats(userId))
        ]);
        // Bildirim gönder
        try {
            const { NotificationTemplates } = await Promise.resolve().then(() => __importStar(require('./notifications')));
            const template = NotificationTemplates.catalogCreated(name, data.id);
            await (0, notifications_1.createNotification)(userId, 'catalog_created', template.title, template.message, template.actionUrl);
        }
        catch {
            // Bildirim hatası sessizce geçilir
        }
        // Log activity
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'catalog_created',
            description: activity_logger_1.ActivityDescriptions.catalogCreated(name),
            metadata: { catalogId: data.id, catalogName: name },
            ipAddress,
            userAgent
        });
        res.status(201).json(data);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.createCatalog = createCatalog;
const updateCatalog = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const { name, description, layout, primary_color, is_published, share_slug, product_ids, show_prices, show_descriptions, show_attributes, show_sku, show_urls, columns_per_row, background_color, background_gradient, background_image, background_image_fit, logo_url, logo_position, logo_size, title_position, product_image_fit, header_text_color, enable_cover_page, cover_image_url, cover_description, enable_category_dividers, cover_theme } = req.body;
        // Validate cover_description length (max 500 chars)
        if (cover_description !== undefined && cover_description !== null && cover_description.length > 500) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Kapak açıklaması maksimum 500 karakter olabilir.'
            });
        }
        // Validate cover_image_url format (basic URL check)
        if (cover_image_url !== undefined && cover_image_url !== null && cover_image_url.trim() !== '') {
            try {
                new URL(cover_image_url);
            }
            catch {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Geçersiz kapak görsel URL formatı.'
                });
            }
        }
        // Eski slug'ı bul (cache temizlemek için)
        const { data: oldCatalog } = await supabase_1.supabase
            .from('catalogs')
            .select('share_slug')
            .eq('id', id)
            .single();
        // Sadece tanımlı değerleri güncelle (undefined ve null değerleri atla)
        const updateData = {
            updated_at: new Date().toISOString()
        };
        if (name !== undefined && name !== null)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        if (layout !== undefined && layout !== null)
            updateData.layout = layout;
        if (primary_color !== undefined && primary_color !== null)
            updateData.primary_color = primary_color;
        if (is_published !== undefined && is_published !== null)
            updateData.is_published = is_published;
        if (share_slug !== undefined && share_slug !== null)
            updateData.share_slug = share_slug;
        if (product_ids !== undefined && product_ids !== null)
            updateData.product_ids = product_ids;
        if (show_prices !== undefined && show_prices !== null)
            updateData.show_prices = show_prices;
        if (show_descriptions !== undefined && show_descriptions !== null)
            updateData.show_descriptions = show_descriptions;
        if (show_attributes !== undefined && show_attributes !== null)
            updateData.show_attributes = show_attributes;
        if (show_sku !== undefined && show_sku !== null)
            updateData.show_sku = show_sku;
        if (show_urls !== undefined && show_urls !== null)
            updateData.show_urls = show_urls;
        if (columns_per_row !== undefined && columns_per_row !== null)
            updateData.columns_per_row = columns_per_row;
        if (background_color !== undefined && background_color !== null)
            updateData.background_color = background_color;
        if (background_gradient !== undefined)
            updateData.background_gradient = background_gradient;
        if (background_image !== undefined)
            updateData.background_image = background_image;
        if (background_image_fit !== undefined && background_image_fit !== null)
            updateData.background_image_fit = background_image_fit;
        if (logo_url !== undefined)
            updateData.logo_url = logo_url;
        if (logo_position !== undefined)
            updateData.logo_position = logo_position;
        if (logo_size !== undefined && logo_size !== null)
            updateData.logo_size = logo_size;
        if (title_position !== undefined && title_position !== null)
            updateData.title_position = title_position;
        if (product_image_fit !== undefined && product_image_fit !== null)
            updateData.product_image_fit = product_image_fit;
        if (header_text_color !== undefined && header_text_color !== null)
            updateData.header_text_color = header_text_color;
        // Storytelling Catalog Features
        if (enable_cover_page !== undefined && enable_cover_page !== null)
            updateData.enable_cover_page = enable_cover_page;
        if (cover_image_url !== undefined)
            updateData.cover_image_url = cover_image_url;
        if (cover_description !== undefined)
            updateData.cover_description = cover_description;
        if (enable_category_dividers !== undefined && enable_category_dividers !== null)
            updateData.enable_category_dividers = enable_category_dividers;
        if (cover_theme !== undefined)
            updateData.cover_theme = cover_theme;
        const { error, data } = await supabase_1.supabase
            .from('catalogs')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select();
        if (error) {
            console.error('Catalog update error:', error);
            // Unique constraint violation için özel hata mesajı
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
            (0, redis_1.deleteCache)(redis_1.cacheKeys.catalogs(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.catalog(userId, id)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.stats(userId)),
            ...(oldCatalog?.share_slug ? [(0, redis_1.deleteCache)(redis_1.cacheKeys.publicCatalog(oldCatalog.share_slug))] : []),
            ...(share_slug && share_slug !== oldCatalog?.share_slug ? [(0, redis_1.deleteCache)(redis_1.cacheKeys.publicCatalog(share_slug))] : [])
        ]);
        // Log activity
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'catalog_updated',
            description: activity_logger_1.ActivityDescriptions.catalogUpdated(name || 'Katalog'),
            metadata: { catalogId: id, updates: Object.keys(req.body) },
            ipAddress,
            userAgent
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Catalog update exception:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            error: 'Katalog güncellenirken bir hata oluştu',
            message: errorMessage
        });
    }
};
exports.updateCatalog = updateCatalog;
const deleteCatalog = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const { error } = await supabase_1.supabase
            .from('catalogs')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            throw error;
        // Cache'leri temizle
        await Promise.all([
            (0, redis_1.deleteCache)(redis_1.cacheKeys.catalogs(userId)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.catalog(userId, id)),
            (0, redis_1.deleteCache)(redis_1.cacheKeys.stats(userId))
        ]);
        // Log activity
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'catalog_deleted',
            description: 'Bir katalog sildi',
            metadata: { catalogId: id },
            ipAddress,
            userAgent
        });
        res.json({ success: true });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.deleteCatalog = deleteCatalog;
const publishCatalog = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const { is_published } = req.body;
        const { data: catalog } = await supabase_1.supabase
            .from('catalogs')
            .select('share_slug')
            .eq('id', id)
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.publishCatalog = publishCatalog;
const getPublicCatalog = async (req, res) => {
    try {
        const { slug } = req.params;
        const cacheKey = redis_1.cacheKeys.publicCatalog(slug);
        const data = await (0, redis_1.getOrSetCache)(cacheKey, redis_1.cacheTTL.publicCatalog, async () => {
            const { data, error } = await supabase_1.supabase
                .from('catalogs')
                .select('*')
                .eq('share_slug', slug)
                .eq('is_published', true)
                .single();
            if (error || !data)
                throw new Error('Catalog not found or not published');
            return data;
        });
        const userId = data.user_id;
        // Perform basic limit check via cache if possible
        const [allCatalogs, user] = await Promise.all([
            (0, redis_1.getOrSetCache)(redis_1.cacheKeys.catalogs(userId), redis_1.cacheTTL.catalogs, async () => {
                const { data: list } = await supabase_1.supabase.from('catalogs').select('id').eq('user_id', userId).order('updated_at', { ascending: false });
                return list || [];
            }),
            (0, redis_1.getOrSetCache)(redis_1.cacheKeys.user(userId), redis_1.cacheTTL.user, async () => {
                const { data: u } = await supabase_1.supabase.from('users').select('plan').eq('id', userId).single();
                return u;
            })
        ]);
        const plan = user?.plan || 'free';
        const maxCatalogs = plan === 'pro' ? 999999 : (plan === 'plus' ? 10 : 1);
        const catalogIndex = allCatalogs.findIndex((c) => c.id === data.id);
        if (catalogIndex >= maxCatalogs) {
            return res.status(403).json({ error: 'Bu katalog şu an erişime kapalıdır. (Limit aşımı)' });
        }
        let products = [];
        if (data.product_ids && data.product_ids.length > 0) {
            const { data: productData } = await supabase_1.supabase
                .from('products')
                .select('*')
                .in('id', data.product_ids);
            if (productData) {
                products = data.product_ids
                    .map((pid) => productData.find((p) => p.id === pid))
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
                const { data: { user: authUser } } = await supabase_1.supabase.auth.getUser(token);
                if (authUser && authUser.id === ownerId) {
                    isOwner = true;
                }
            }
            catch (e) {
                // Ignore auth error in public route
            }
        }
        // Increment view count asynchronously to not block the request
        smartIncrementViewCount(data.id, ownerId, visitorInfo, isOwner).catch(err => {
            console.error('[PublicCatalog] View tracking failed:', err);
        });
        res.json({ ...data, products });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const status = errorMessage === 'Catalog not found or not published' ? 404 : 500;
        res.status(status).json({ error: errorMessage });
    }
};
exports.getPublicCatalog = getPublicCatalog;
const getVisitorInfo = (req) => {
    // Forwarded IP takes precedence - handle multiple IPs in chain
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
        ? forwarded.split(',')[0].trim()
        : (req.headers['x-real-ip'] || req.socket?.remoteAddress || '0.0.0.0');
    // User Agent - clean and cap
    const userAgent = (req.headers['user-agent'] || 'unknown').substring(0, 500);
    let deviceType = 'desktop';
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
        deviceType = /ipad|tablet/i.test(userAgent) ? 'tablet' : 'mobile';
    }
    // Creating a truly unique identifier per day for this visitor
    const visitorHash = crypto_1.default.createHash('md5').update(`${ip}-${userAgent}`).digest('hex');
    return { ip, userAgent, deviceType, visitorHash };
};
const smartIncrementViewCount = async (catalogId, ownerId, visitorInfo, isOwner) => {
    try {
        if (isOwner) {
            return;
        }
        const { data: inserted, error } = await supabase_1.supabase.rpc('smart_increment_view_count', {
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
            await supabase_1.supabase.rpc('increment_view_count', { catalog_id: catalogId });
        }
        // If a new view was recorded, clear the catalogs list cache for this user
        if (inserted || !error) {
            await (0, redis_1.deleteCache)(redis_1.cacheKeys.catalogs(ownerId));
        }
    }
    catch (err) {
        console.error('[Analytics] Critical error:', err);
    }
};
const getDashboardStats = async (req, res) => {
    try {
        const userId = getUserId(req);
        const timeRange = req.query.timeRange || '30d';
        const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
        // Fetch Summary Stats
        let summaryStats = {
            totalCatalogs: 0,
            publishedCatalogs: 0,
            totalViews: 0,
            totalProducts: 0,
            topCatalogs: [],
        };
        const [catalogsResult, productsResult] = await Promise.all([
            supabase_1.supabase.from('catalogs').select('id, is_published, view_count, name, product_ids, updated_at, created_at').eq('user_id', userId),
            supabase_1.supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', userId)
        ]);
        if (catalogsResult.data) {
            const catalogs = catalogsResult.data;
            summaryStats.totalCatalogs = catalogs.length;
            summaryStats.publishedCatalogs = catalogs.filter(c => c.is_published).length;
            summaryStats.totalViews = catalogs.reduce((sum, c) => sum + (c.view_count || 0), 0);
            summaryStats.topCatalogs = [...catalogs]
                .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
                .slice(0, 5)
                .map(c => ({ id: c.id, name: c.name, views: c.view_count || 0 }));
        }
        summaryStats.totalProducts = productsResult.count || 0;
        const detailedStats = {
            uniqueVisitors: 0,
            deviceStats: [],
            dailyViews: [],
        };
        const catalogIds = catalogsResult.data?.map(c => c.id) || [];
        // Fetch Detailed Analytics
        if (catalogIds.length > 0) {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);
            const dateThresholdStr = dateThreshold.toISOString().split('T')[0];
            // Unique Visitors
            const { data: vCount, error: vError } = await supabase_1.supabase
                .rpc('get_unique_visitors_multi', {
                p_catalog_ids: catalogIds,
                p_days: days
            });
            if (!vError && vCount !== null && Number(vCount) > 0) {
                detailedStats.uniqueVisitors = Number(vCount);
            }
            else {
                const { count: directUniqueCount } = await supabase_1.supabase
                    .from('catalog_views')
                    .select('visitor_hash', { count: 'exact', head: true })
                    .in('catalog_id', catalogIds)
                    .eq('is_owner', false)
                    .gte('view_date', dateThresholdStr);
                if (directUniqueCount)
                    detailedStats.uniqueVisitors = directUniqueCount;
            }
            // Device Stats
            const { data: deviceData } = await supabase_1.supabase
                .from('catalog_views')
                .select('device_type')
                .in('catalog_id', catalogIds)
                .eq('is_owner', false)
                .gte('view_date', dateThresholdStr);
            if (deviceData && deviceData.length > 0) {
                const counts = {};
                deviceData.forEach(d => {
                    const t = d.device_type || 'unkn';
                    counts[t] = (counts[t] || 0) + 1;
                });
                const total = deviceData.length;
                detailedStats.deviceStats = Object.entries(counts).map(([type, count]) => ({
                    device_type: type,
                    view_count: count,
                    percentage: Math.round((count / total) * 100)
                }));
            }
            // Daily Views
            const { data: dailyData } = await supabase_1.supabase
                .from('catalog_views')
                .select('view_date')
                .in('catalog_id', catalogIds)
                .eq('is_owner', false)
                .gte('view_date', dateThresholdStr);
            if (dailyData) {
                const counts = {};
                dailyData.forEach(d => {
                    counts[d.view_date] = (counts[d.view_date] || 0) + 1;
                });
                detailedStats.dailyViews = Object.entries(counts)
                    .map(([date, count]) => ({ view_date: date, view_count: count }))
                    .sort((a, b) => a.view_date.localeCompare(b.view_date));
            }
        }
        const finalStats = { ...summaryStats, ...detailedStats };
        res.json(finalStats);
    }
    catch (error) {
        console.error('[Stats] Critical Error:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı' });
    }
};
exports.getDashboardStats = getDashboardStats;
