import type { Request, Response } from 'express';

import { supabase } from '../../services/supabase';
import { cacheKeys, cacheTTL, getOrSetCache } from '../../services/redis';
import { getUserId } from './helpers';

export const getProducts = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        let page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || 50;
        const category = req.query.category as string;
        const search = req.query.search as string;

        if (page < 1) page = 1;
        if (limit < 1) limit = 12;
        if (limit > 1000) limit = 1000;

        const params = { page, limit, category, search };
        const cacheKey = cacheKeys.products(userId, params);

        const result = await getOrSetCache(cacheKey, cacheTTL.products, async () => {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            let query = supabase
                .from('products')
                .select('*', { count: 'exact' })
                .eq('user_id', userId);

            if (category && category !== 'all') {
                query = query.ilike('category', `%${category}%`);
            }

            if (search) {
                query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
            }

            const { data, error, count } = await query
                .order('display_order', { ascending: true, nullsFirst: false })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const products = (data || []).map((p: Record<string, unknown>) => {
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
                }
            };
        });

        res.json(result);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const checkProductsInCatalogs = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { productIds }: { productIds: string[] } = req.body;

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.json({ productsInCatalogs: [], catalogs: [] });
        }

        const { data: catalogs, error } = await supabase
            .from('catalogs')
            .select('id, name, product_ids')
            .eq('user_id', userId);

        if (error) throw error;

        const productsInCatalogs: { productId: string; catalogs: { id: string; name: string }[] }[] = [];

        for (const productId of productIds) {
            const catalogsContaining = catalogs?.filter(c =>
                c.product_ids?.includes(productId)
            ).map(c => ({ id: c.id, name: c.name })) || [];

            if (catalogsContaining.length > 0) {
                productsInCatalogs.push({
                    productId,
                    catalogs: catalogsContaining
                });
            }
        }

        res.json({
            productsInCatalogs,
            hasAnyInCatalogs: productsInCatalogs.length > 0
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};

export const getProductStats = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        // Use redis cache to speed up stats
        const cacheKey = cacheKeys.stats(userId, { type: 'products' });
        const result = await getOrSetCache(cacheKey, cacheTTL.products, async () => {
            // First get exact total count (doesn't fetch rows)
            const { count: totalCount, error: countError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (countError) throw countError;

            const total = totalCount || 0;

            const stats = {
                total,
                inStock: 0,
                lowStock: 0,
                outOfStock: 0,
                totalValue: 0
            };

            // Fetch all stock/price pairs in batches of 1000 (Supabase default limit)
            const BATCH_SIZE = 1000;
            const totalBatches = Math.ceil(total / BATCH_SIZE);

            for (let batch = 0; batch < totalBatches; batch++) {
                const from = batch * BATCH_SIZE;
                const to = from + BATCH_SIZE - 1;

                const { data, error } = await supabase
                    .from('products')
                    .select('stock, price')
                    .eq('user_id', userId)
                    .range(from, to);

                if (error) throw error;

                (data || []).forEach(p => {
                    const stock = p.stock || 0;
                    const price = Number(p.price) || 0;

                    if (stock >= 10) stats.inStock++;
                    else if (stock > 0 && stock < 10) stats.lowStock++;
                    else if (stock === 0) stats.outOfStock++;

                    stats.totalValue += (stock * price);
                });
            }

            return stats;
        });

        res.json(result);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
