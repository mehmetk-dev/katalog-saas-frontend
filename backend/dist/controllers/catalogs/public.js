"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicCatalog = void 0;
const crypto_1 = __importDefault(require("crypto"));
const supabase_1 = require("../../services/supabase");
const redis_1 = require("../../services/redis");
const helpers_1 = require("./helpers");
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
        // Plan limit kontrolü
        const [allCatalogs, plan] = await Promise.all([
            (0, redis_1.getOrSetCache)(redis_1.cacheKeys.catalogs(userId), redis_1.cacheTTL.catalogs, async () => {
                const { data: list } = await supabase_1.supabase.from('catalogs').select('id').eq('user_id', userId).order('updated_at', { ascending: false });
                return list || [];
            }),
            (0, helpers_1.getUserPlan)(userId)
        ]);
        const { maxCatalogs } = (0, helpers_1.getPlanLimits)(plan);
        const catalogIndex = allCatalogs.findIndex((c) => c.id === data.id);
        if (catalogIndex >= maxCatalogs) {
            return res.status(403).json({ error: 'Bu katalog şu an erişime kapalıdır. (Limit aşımı)' });
        }
        // Product IDs parsing
        let productIds = data.product_ids;
        if (typeof productIds === 'string') {
            productIds = productIds.replace('{', '').replace('}', '').split(',').map(s => s.trim()).filter(Boolean);
        }
        let products = [];
        if (Array.isArray(productIds) && productIds.length > 0) {
            console.log(`[Debug] Fetching ${productIds.length} products for catalog ${slug}`);
            const { data: productData, error: productError } = await supabase_1.supabase
                .from('products')
                .select('*')
                .in('id', productIds);
            if (productError) {
                console.error('[Debug] Product fetch error:', productError);
            }
            if (productData) {
                products = productIds
                    .map((pid) => productData.find((p) => p.id.toLowerCase() === pid.toLowerCase()))
                    .filter(Boolean);
            }
        }
        // Ownership & view tracking
        const visitorInfo = getVisitorInfo(req);
        const ownerId = data.user_id;
        let isOwner = false;
        // Check x-user-id header
        const headerUserId = req.headers['x-user-id'];
        if (headerUserId && headerUserId === ownerId) {
            isOwner = true;
        }
        // Fallback: JWT verification
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
        // Increment view count asynchronously
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
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
        ? forwarded.split(',')[0].trim()
        : (req.headers['x-real-ip'] || req.socket?.remoteAddress || '0.0.0.0');
    const userAgent = (req.headers['user-agent'] || 'unknown').substring(0, 500);
    let deviceType = 'desktop';
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
        deviceType = /ipad|tablet/i.test(userAgent) ? 'tablet' : 'mobile';
    }
    const visitorHash = crypto_1.default.createHash('md5').update(`${ip}-${userAgent}`).digest('hex');
    return { ip, userAgent, deviceType, visitorHash };
};
const smartIncrementViewCount = async (catalogId, ownerId, visitorInfo, isOwner) => {
    try {
        if (isOwner)
            return;
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
            await supabase_1.supabase.rpc('increment_view_count', { catalog_id: catalogId });
        }
        if (inserted || !error) {
            await (0, redis_1.deleteCache)(redis_1.cacheKeys.catalogs(ownerId));
        }
    }
    catch (err) {
        console.error('[Analytics] Critical error:', err);
    }
};
