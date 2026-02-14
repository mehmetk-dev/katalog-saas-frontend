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
            console.log(`[Debug] Fetching ${productIds.length} products for catalog ${slug}`);
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select('*')
                .in('id', productIds);

            if (productError) {
                console.error('[Debug] Product fetch error:', productError);
            }

            if (productData) {
                products = productIds
                    .map((pid: string) => productData.find((p: { id: string }) => p.id.toLowerCase() === pid.toLowerCase()))
                    .filter(Boolean);
            }
        }

        // DEBUG: Inject dummy product if empty to test frontend
        if (products.length === 0) {
            products.push({
                id: 'debug-product-1',
                name: 'Start Debug Product',
                price: 999,
                description: 'If you see this, Frontend is OK. DB is returning 0 products.',
                image_url: 'https://placehold.co/600x400/indigo/white?text=Debug',
                category: 'Debug'
            });
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
