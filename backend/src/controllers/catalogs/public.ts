import crypto from 'crypto';
import { Request, Response } from 'express';
import { supabase } from '../../services/supabase';
import { deleteCache, cacheKeys, cacheTTL, getOrSetCache } from '../../services/redis';
import { getUserPlan, getPlanLimits } from './helpers';

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

        // Plan limit kontrolü
        const [allCatalogs, plan] = await Promise.all([
            getOrSetCache(cacheKeys.catalogs(userId), cacheTTL.catalogs, async () => {
                const { data: list } = await supabase.from('catalogs').select('id').eq('user_id', userId).order('updated_at', { ascending: false });
                return list || [];
            }),
            getUserPlan(userId)
        ]);

        const { maxCatalogs } = getPlanLimits(plan);
        const catalogIndex = (allCatalogs as { id: string }[]).findIndex((c: { id: string }) => c.id === data.id);
        if (catalogIndex >= maxCatalogs) {
            return res.status(403).json({ error: 'Bu katalog şu an erişime kapalıdır. (Limit aşımı)' });
        }

        // Product IDs parsing
        let productIds = data.product_ids;

        if (typeof productIds === 'string') {
            productIds = (productIds as string).replace('{', '').replace('}', '').split(',').map(s => s.trim()).filter(Boolean);

        }


        let products: Record<string, unknown>[] = [];
        if (Array.isArray(productIds) && productIds.length > 0) {

            // Batch fetch: Supabase .in() sends IDs as URL query params.
            // Node.js has a 16KB header limit — 100 UUIDs (~3.7KB) is safe per request.
            const CHUNK_SIZE = 100;
            const CONCURRENCY = 3; // Max parallel requests to Supabase
            const chunks: string[][] = [];
            for (let i = 0; i < productIds.length; i += CHUNK_SIZE) {
                chunks.push(productIds.slice(i, i + CHUNK_SIZE));
            }

            // Only select fields the frontend actually needs (not select('*'))
            const PRODUCT_FIELDS = 'id,name,description,price,image_url,images,sku,category,custom_attributes,product_url,currency';

            // Concurrency-limited parallel fetch
            const allResults: Record<string, unknown>[][] = [];
            for (let i = 0; i < chunks.length; i += CONCURRENCY) {
                const batch = chunks.slice(i, i + CONCURRENCY);
                const batchResults = await Promise.all(
                    batch.map(async (chunk) => {
                        const { data, error } = await supabase
                            .from('products')
                            .select(PRODUCT_FIELDS)
                            .in('id', chunk);
                        if (error) {
                            console.error(`[PublicCatalog] Batch fetch error (${chunk.length} items):`, error);
                            return [];
                        }
                        return data || [];
                    })
                );
                allResults.push(...batchResults);
            }

            const allProductData = allResults.flat();

            if (allProductData.length > 0) {
                // Preserve original order from product_ids
                const productMap = new Map<string, Record<string, unknown>>(
                    allProductData.map((p) => [(p.id as string).toLowerCase(), p])
                );
                products = productIds
                    .map((pid: string) => productMap.get(pid.toLowerCase()))
                    .filter((p): p is Record<string, unknown> => p !== undefined);
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
                const { data: { user: authUser } } = await supabase.auth.getUser(token);
                if (authUser && authUser.id === ownerId) {
                    isOwner = true;
                }
            } catch (e) {
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
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const status = errorMessage === 'Catalog not found or not published' ? 404 : 500;
        res.status(status).json({ error: errorMessage });
    }
};

const getVisitorInfo = (req: Request) => {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded
        ? forwarded.split(',')[0].trim()
        : (req.headers['x-real-ip'] as string || req.socket?.remoteAddress || '0.0.0.0');

    const userAgent = (req.headers['user-agent'] || 'unknown').substring(0, 500);

    let deviceType = 'desktop';
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
        deviceType = /ipad|tablet/i.test(userAgent) ? 'tablet' : 'mobile';
    }

    const visitorHash = crypto.createHash('md5').update(`${ip}-${userAgent}`).digest('hex');

    return { ip, userAgent, deviceType, visitorHash };
};

const smartIncrementViewCount = async (
    catalogId: string,
    ownerId: string,
    visitorInfo: { ip: string; userAgent: string; deviceType: string; visitorHash: string },
    isOwner: boolean
) => {
    try {
        if (isOwner) return;

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
            await supabase.rpc('increment_view_count', { catalog_id: catalogId });
        }

        if (inserted || !error) {
            await deleteCache(cacheKeys.catalogs(ownerId));
        }
    } catch (err) {
        console.error('[Analytics] Critical error:', err);
    }
};

/**
 * Lightweight metadata endpoint — returns only catalog name/description/SEO fields.
 * No product fetching, no view tracking. Used by generateMetadata for fast page loads.
 */
export const getPublicCatalogMeta = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const metaCacheKey = `${cacheKeys.publicCatalog(slug)}:meta`;

        const meta = await getOrSetCache(metaCacheKey, cacheTTL.publicCatalog, async () => {
            const { data, error } = await supabase
                .from('catalogs')
                .select('id, name, description, is_published, show_in_search')
                .eq('share_slug', slug)
                .eq('is_published', true)
                .single();

            if (error || !data) throw new Error('Catalog not found');
            return data;
        });

        res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
        res.json(meta);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const status = errorMessage === 'Catalog not found' ? 404 : 500;
        res.status(status).json({ error: errorMessage });
    }
};
