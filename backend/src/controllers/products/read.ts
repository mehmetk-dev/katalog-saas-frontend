import type { Request, Response } from 'express';

import { supabase } from '../../services/supabase';
import { cacheKeys, cacheTTL, getOrSetCache } from '../../services/redis';
import { getUserId } from './helpers';
import { safeErrorMessage } from '../../utils/safe-error';
import { productsByIdsSchema, productsQuerySchema } from './schemas';
import { applyProductSort } from './ordering';
import { categoryMatchPattern } from './category-filter';

/** PostgREST tek yanıtta en fazla 1000 satır döndürür */
const CATEGORY_PAGE_SIZE = 1000;
const CATEGORY_PAGE_CONCURRENCY = 4;

/**
 * Kullanıcının tüm kategori adları (ürünün kategori alanı virgülle ayrılmış birden çok kategori
 * içerebilir). Eskiden tek sorguydu ve 1000+ ürünlü hesaplarda ilk 1000 ürünün kategorileri geliyordu.
 */
async function fetchAllCategoryNames(userId: string): Promise<string[]> {
    const page = (from: number) => supabase
        .from('products')
        .select('category', from === 0 ? { count: 'exact' } : undefined)
        .eq('user_id', userId)
        .not('category', 'is', null)
        .not('category', 'eq', '')
        .order('id')
        .range(from, from + CATEGORY_PAGE_SIZE - 1);

    const first = await page(0);
    if (first.error) throw first.error;
    const rows = [...(first.data || [])] as { category: string | null }[];
    const total = first.count ?? rows.length;

    const offsets: number[] = [];
    for (let from = CATEGORY_PAGE_SIZE; from < total; from += CATEGORY_PAGE_SIZE) offsets.push(from);
    for (let i = 0; i < offsets.length; i += CATEGORY_PAGE_CONCURRENCY) {
        const results = await Promise.all(offsets.slice(i, i + CATEGORY_PAGE_CONCURRENCY).map(page));
        for (const result of results) {
            if (result.error) throw result.error;
            rows.push(...((result.data || []) as { category: string | null }[]));
        }
    }

    return [...new Set(
        rows
            .flatMap((p) => (p.category || '').split(','))
            .map((c) => c.trim())
            .filter(Boolean)
    )].sort((x, y) => x.localeCompare(y, 'tr-TR'));
}

export const getProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        const parsedQuery = productsQuerySchema.safeParse(req.query);
        if (!parsedQuery.success) {
            return res.status(400).json({
                error: parsedQuery.error.errors[0]?.message || 'Invalid query parameters',
            });
        }

        const { page, limit, sortBy, sortOrder, select, stockFilter, minPrice, maxPrice } = parsedQuery.data;
        const category = parsedQuery.data.category === 'all' ? undefined : parsedQuery.data.category;
        const search = parsedQuery.data.search;

        const params = { page, limit, category, search, sortBy, sortOrder, select, stockFilter, minPrice, maxPrice };
        const cacheKey = cacheKeys.products(userId, params);

        const result = await getOrSetCache(cacheKey, cacheTTL.products, async () => {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            let query = supabase
                .from('products')
                .select(select === 'id' ? 'id' : '*', { count: 'exact' })
                .eq('user_id', userId);

            if (category && category !== 'all' && category.trim()) {
                // Tek sütun filtresi (or() değil) — değer PostgREST ifadesi olarak ayrıştırılmaz
                query = query.filter('category', 'imatch', categoryMatchPattern(category));
            }

            if (search) {
                // SECURITY: Sanitize search input to prevent PostgREST .or() filter injection
                // PostgREST parses .or() string as filter expressions — raw interpolation is dangerous
                const sanitizedSearch = search.replace(/[%_*(),."\\]/g, '');
                if (sanitizedSearch.length > 0) {
                    query = query.or(`name.ilike.%${sanitizedSearch}%,sku.ilike.%${sanitizedSearch}%`);
                }
            }

            if (stockFilter === 'in_stock') {
                query = query.gte('stock', 10);
            } else if (stockFilter === 'low_stock') {
                query = query.gt('stock', 0).lt('stock', 10);
            } else if (stockFilter === 'out_of_stock') {
                query = query.eq('stock', 0);
            }

            if (minPrice !== undefined) {
                query = query.gte('price', minPrice);
            }
            if (maxPrice !== undefined && maxPrice >= (minPrice ?? 0)) {
                query = query.lte('price', maxPrice);
            }

            // Kategoriler ayrı ve daha uzun önbelleklenir (seyrek değişir); ürün sorgusuyla paralel çekilir
            const categoriesPromise = select === 'id'
                ? Promise.resolve(undefined)
                : getOrSetCache(cacheKeys.products(userId) + ':categories', cacheTTL.products * 4, () => fetchAllCategoryNames(userId));

            const [{ data, error, count }, allCategories] = await Promise.all([
                applyProductSort(query, sortBy, sortOrder).range(from, to),
                categoriesPromise,
            ]);

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
        // Parçalar sırayla değil, sınırlı eşzamanlılıkla çekilir (500 ürün: 10 ardışık sorgu → 2 tur)
        const SUPABASE_IN_CONCURRENCY = 6;
        const chunks: string[][] = [];
        for (let i = 0; i < requestedIds.length; i += SUPABASE_IN_CHUNK) {
            chunks.push(requestedIds.slice(i, i + SUPABASE_IN_CHUNK));
        }

        let data: Record<string, unknown>[] = [];
        for (let i = 0; i < chunks.length; i += SUPABASE_IN_CONCURRENCY) {
            const results = await Promise.all(chunks.slice(i, i + SUPABASE_IN_CONCURRENCY).map(async (chunk) => {
                const { data: chunkData, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('user_id', userId)
                    .in('id', chunk);

                if (error) throw error;
                return (chunkData || []) as Record<string, unknown>[];
            }));
            data = data.concat(...results);
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

