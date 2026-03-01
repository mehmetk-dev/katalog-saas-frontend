"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicCatalogMeta = exports.getPublicCatalog = void 0;
const crypto_1 = __importDefault(require("crypto"));
const supabase_1 = require("../../services/supabase");
const redis_1 = require("../../services/redis");
const helpers_1 = require("./helpers");
const safe_error_1 = require("../../utils/safe-error");
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
            // Batch fetch: Supabase .in() sends IDs as URL query params.
            // Node.js has a 16KB header limit — 100 UUIDs (~3.7KB) is safe per request.
            const CHUNK_SIZE = 100;
            // Higher concurrency for large catalogs — 6 parallel keeps 10K under 15s
            const CONCURRENCY = 6;
            const chunks = [];
            for (let i = 0; i < productIds.length; i += CHUNK_SIZE) {
                chunks.push(productIds.slice(i, i + CHUNK_SIZE));
            }
            // Only select fields the frontend actually needs (not select('*'))
            const PRODUCT_FIELDS = 'id,name,description,price,image_url,images,sku,category,custom_attributes,product_url,currency';
            // Concurrency-limited parallel fetch
            const allResults = [];
            for (let i = 0; i < chunks.length; i += CONCURRENCY) {
                const batch = chunks.slice(i, i + CONCURRENCY);
                const batchResults = await Promise.all(batch.map(async (chunk) => {
                    const { data, error } = await supabase_1.supabase
                        .from('products')
                        .select(PRODUCT_FIELDS)
                        .in('id', chunk)
                        .limit(CHUNK_SIZE); // ← CRITICAL: without this PostgREST default max-rows can silently cap results
                    if (error) {
                        console.error(`[PublicCatalog] Batch fetch error (${chunk.length} items):`, error);
                        return [];
                    }
                    return data || [];
                }));
                allResults.push(...batchResults);
            }
            const allProductData = allResults.flat();
            if (allProductData.length > 0) {
                // Preserve original order from product_ids
                const productMap = new Map(allProductData.map((p) => [p.id.toLowerCase(), p]));
                products = productIds
                    .map((pid) => productMap.get(pid.toLowerCase()))
                    .filter((p) => p !== undefined);
            }
        }
        // Ownership & view tracking
        const visitorInfo = getVisitorInfo(req);
        const ownerId = data.user_id;
        let isOwner = false;
        // SECURITY: Only trust JWT-based authentication for owner detection.
        // x-user-id header was removed because it's trivially spoofable.
        if (req.headers.authorization) {
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
        // Cache headers — stale-while-revalidate for fast repeat visits
        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        res.json({ ...data, products });
    }
    catch (error) {
        const errorMessage = (0, safe_error_1.safeErrorMessage)(error);
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
    // SECURITY: Use SHA-256 instead of MD5 for visitor hashing
    const visitorHash = crypto_1.default.createHash('sha256').update(`${ip}-${userAgent}`).digest('hex');
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
/**
 * Lightweight metadata endpoint — returns only catalog name/description/SEO fields.
 * No product fetching, no view tracking. Used by generateMetadata for fast page loads.
 */
const getPublicCatalogMeta = async (req, res) => {
    try {
        const { slug } = req.params;
        const metaCacheKey = `${redis_1.cacheKeys.publicCatalog(slug)}:meta`;
        const meta = await (0, redis_1.getOrSetCache)(metaCacheKey, redis_1.cacheTTL.publicCatalog, async () => {
            const { data, error } = await supabase_1.supabase
                .from('catalogs')
                .select('id, name, description, is_published, show_in_search')
                .eq('share_slug', slug)
                .eq('is_published', true)
                .single();
            if (error || !data)
                throw new Error('Catalog not found');
            return data;
        });
        res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
        res.json(meta);
    }
    catch (error) {
        const msg = (0, safe_error_1.safeErrorMessage)(error);
        const status = msg === 'Catalog not found' ? 404 : 500;
        res.status(status).json({ error: msg });
    }
};
exports.getPublicCatalogMeta = getPublicCatalogMeta;
