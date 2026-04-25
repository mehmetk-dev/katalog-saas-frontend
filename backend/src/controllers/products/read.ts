import type { Request, Response } from 'express';

import { supabase } from '../../services/supabase';
import { cacheKeys, cacheTTL, getOrSetCache } from '../../services/redis';
import { getUserId } from './helpers';
import { safeErrorMessage } from '../../utils/safe-error';
import { productsByIdsSchema, productsQuerySchema } from './schemas';

export const getProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        const parsedQuery = productsQuerySchema.safeParse(req.query);
        if (!parsedQuery.success) {
            return res.status(400).json({
                error: parsedQuery.error.errors[0]?.message || 'Invalid query parameters',
            });
        }

        const { page, limit, sortBy, sortOrder, select } = parsedQuery.data;
        const category = parsedQuery.data.category === 'all' ? undefined : parsedQuery.data.category;
        const search = parsedQuery.data.search;

        const params = { page, limit, category, search, sortBy, sortOrder, select };
        const cacheKey = cacheKeys.products(userId, params);

        const result = await getOrSetCache(cacheKey, cacheTTL.products, async () => {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            let query = supabase
                .from('products')
                .select(select === 'id' ? 'id' : '*', { count: 'exact' })
                .eq('user_id', userId);

            if (category && category !== 'all') {
                // SECURITY: Escape PostgREST special characters to prevent filter injection
                const sanitizedCategory = category.replace(/[%_*(),."\\]/g, '');
                query = query.ilike('category', `%${sanitizedCategory}%`);
            }

            if (search) {
                // SECURITY: Sanitize search input to prevent PostgREST .or() filter injection
                // PostgREST parses .or() string as filter expressions — raw interpolation is dangerous
                const sanitizedSearch = search.replace(/[%_*(),."\\]/g, '');
                if (sanitizedSearch.length > 0) {
                    query = query.or(`name.ilike.%${sanitizedSearch}%,sku.ilike.%${sanitizedSearch}%`);
                }
            }

            let orderedQuery = query.order(sortBy, { ascending: sortOrder === 'asc', nullsFirst: false });

            if (sortBy !== 'display_order') {
                orderedQuery = orderedQuery.order('display_order', { ascending: true, nullsFirst: false });
            }
            if (sortBy !== 'created_at') {
                orderedQuery = orderedQuery.order('created_at', { ascending: false });
            }

            const { data, error, count } = await orderedQuery
                .range(from, to);

            if (error) throw error;

            const products = select === 'id'
                ? (data || [])
                : (data || []).map((p: Record<string, unknown>) => {
                    let imgUrl = typeof p.image_url === 'string' ? p.image_url : null;
                    if (imgUrl && imgUrl.startsWith('http://') && !imgUrl.includes('localhost')) {
                        imgUrl = imgUrl.replace('http://', 'https://');
                    }

                    let imgs = Array.isArray(p.images) ? p.images as string[] : [];
                    imgs = imgs.map((img) =>
                        (typeof img === 'string' && img.startsWith('http://') && !img.includes('localhost'))
                            ? img.replace('http://', 'https://')
                            : img
                    );

                    return {
                        ...p,
                        image_url: imgUrl,
                        images: imgs,
                        order: (p as Record<string, unknown>).display_order ?? (p as Record<string, unknown>).order ?? 0
                    };
                });

            let allCategories: string[] | undefined = undefined;
            if (select !== 'id') {
                // Cache categories separately with longer TTL — they change infrequently
                const categoriesCacheKey = cacheKeys.products(userId) + ':categories';
                allCategories = await getOrSetCache(categoriesCacheKey, cacheTTL.products * 4, async () => {
                    const { data: categoryData } = await supabase
                        .from('products')
                        .select('category')
                        .eq('user_id', userId)
                        .not('category', 'is', null)
                        .not('category', 'eq', '');

                    return [...new Set(
                        (categoryData || [])
                            .map((p: { category: string | null }) => p.category)
                            .filter(Boolean)
                    )] as string[];
                });
            }

            return {
                products,
                metadata: {
                    total: count || 0,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                },
                allCategories,
            };
        });

        res.json(result);
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};

export const getProduct = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        const cacheKey = cacheKeys.product(userId, id);
        const product = await getOrSetCache(cacheKey, cacheTTL.products, async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return data;
        });

        if (!product) {
            return res.status(404).json({ error: 'Ürün bulunamadı veya yetkiniz yok.' });
        }

        if (typeof product.image_url === 'string' && product.image_url.startsWith('http://') && !product.image_url.includes('localhost')) {
            product.image_url = product.image_url.replace('http://', 'https://');
        }

        if (Array.isArray(product.images)) {
            product.images = product.images.map((img: string) =>
                (typeof img === 'string' && img.startsWith('http://') && !img.includes('localhost'))
                    ? img.replace('http://', 'https://')
                    : img
            );
        }

        res.json(product);
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};

export const getProductsByIds = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const parse = productsByIdsSchema.safeParse(req.body);

        if (!parse.success) {
            return res.status(400).json({
                error: parse.error.errors[0]?.message || 'Invalid productIds payload',
            });
        }

        const requestedIds = Array.from(new Set(parse.data.productIds));
        if (requestedIds.length === 0) {
            return res.json([]);
        }

        // FIX: Chunk .in() queries to avoid HeadersOverflowError.
        // Supabase JS encodes .in() as URL query params — 500 UUIDs ≈ 18KB URL
        // which overflows undici's default 16KB header parser limit.
        const SUPABASE_IN_CHUNK = 50;
        let data: Record<string, unknown>[] = [];

        for (let i = 0; i < requestedIds.length; i += SUPABASE_IN_CHUNK) {
            const chunk = requestedIds.slice(i, i + SUPABASE_IN_CHUNK);
            const { data: chunkData, error } = await supabase
                .from('products')
                .select('*')
                .eq('user_id', userId)
                .in('id', chunk);

            if (error) throw error;
            if (chunkData) data = data.concat(chunkData);
        }

        const normalizedProducts = (data || []).map((p: Record<string, unknown>) => {
            let imgUrl = typeof p.image_url === 'string' ? p.image_url : null;
            if (imgUrl && imgUrl.startsWith('http://') && !imgUrl.includes('localhost')) {
                imgUrl = imgUrl.replace('http://', 'https://');
            }

            let imgs = Array.isArray(p.images) ? p.images as string[] : [];
            imgs = imgs.map((img) =>
                (typeof img === 'string' && img.startsWith('http://') && !img.includes('localhost'))
                    ? img.replace('http://', 'https://')
                    : img
            );

            return {
                ...p,
                image_url: imgUrl,
                images: imgs,
                order: (p as Record<string, unknown>).display_order ?? (p as Record<string, unknown>).order ?? 0
            };
        });

        // Return in requested ID order for deterministic builder state
        const byId = new Map(normalizedProducts.map((p: Record<string, unknown>) => [p.id, p]));
        const ordered = requestedIds
            .map((id) => byId.get(id))
            .filter((p): p is Record<string, unknown> => !!p);

        res.json(ordered);
    } catch (error: unknown) {
        console.error('[getProductsByIds] Error:', error);
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};

export const checkProductInCatalogs = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        const { data: catalogs, error } = await supabase
            .from('catalogs')
            .select('id, name')
            .eq('user_id', userId)
            .contains('product_ids', [id]);

        if (error) throw error;

        res.json({
            isInCatalogs: (catalogs?.length || 0) > 0,
            catalogs: catalogs || [],
            count: catalogs?.length || 0
        });
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};

export const checkProductsInCatalogs = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { productIds }: { productIds: string[] } = req.body;

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.json({ productsInCatalogs: [], catalogs: [] });
        }

        // Only fetch catalogs that contain at least one of the requested productIds
        const { data: catalogs, error } = await supabase
            .from('catalogs')
            .select('id, name, product_ids')
            .eq('user_id', userId)
            .overlaps('product_ids', productIds);

        if (error) throw error;

        // Build a map: productId → catalogs containing it
        const productIdSet = new Set(productIds);
        const productsInCatalogs: { productId: string; catalogs: { id: string; name: string }[] }[] = [];

        for (const catalog of catalogs || []) {
            const matchingIds = (catalog.product_ids || []).filter((id: string) => productIdSet.has(id));
            for (const productId of matchingIds) {
                let entry = productsInCatalogs.find(p => p.productId === productId);
                if (!entry) {
                    entry = { productId, catalogs: [] };
                    productsInCatalogs.push(entry);
                }
                entry.catalogs.push({ id: catalog.id, name: catalog.name });
            }
        }

        res.json({
            productsInCatalogs,
            hasAnyInCatalogs: productsInCatalogs.length > 0
        });
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};

export const getProductStats = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        // Use redis cache to speed up stats
        const cacheKey = cacheKeys.stats(userId, { type: 'products' });
        const result = await getOrSetCache(cacheKey, cacheTTL.products, async () => {
            // Single RPC call instead of N+1 batch fetching
            const { data, error } = await supabase
                .rpc('get_product_stats', { p_user_id: userId });

            if (error) throw error;

            return {
                total: data?.total || 0,
                inStock: data?.inStock || 0,
                lowStock: data?.lowStock || 0,
                outOfStock: data?.outOfStock || 0,
                totalValue: Number(data?.totalValue) || 0,
            };
        });

        res.json(result);
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
};

