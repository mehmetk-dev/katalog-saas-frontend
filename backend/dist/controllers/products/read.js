"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProductsInCatalogs = exports.checkProductInCatalogs = exports.getProduct = exports.getProducts = void 0;
const supabase_1 = require("../../services/supabase");
const redis_1 = require("../../services/redis");
const helpers_1 = require("./helpers");
const getProducts = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 50;
        const category = req.query.category;
        const search = req.query.search;
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 12;
        if (limit > 2000)
            limit = 2000;
        const params = { page, limit, category, search };
        const cacheKey = redis_1.cacheKeys.products(userId, params);
        const result = await (0, redis_1.getOrSetCache)(cacheKey, redis_1.cacheTTL.products, async () => {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            let query = supabase_1.supabase
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
            if (error)
                throw error;
            const products = (data || []).map((p) => ({
                ...p,
                order: p.display_order ?? p.order ?? 0
            }));
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.getProducts = getProducts;
const getProduct = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const { id } = req.params;
        const cacheKey = redis_1.cacheKeys.product(userId, id);
        const product = await (0, redis_1.getOrSetCache)(cacheKey, redis_1.cacheTTL.products, async () => {
            const { data, error } = await supabase_1.supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .eq('user_id', userId)
                .single();
            if (error)
                throw error;
            return data;
        });
        if (!product) {
            return res.status(404).json({ error: 'Ürün bulunamadı veya yetkiniz yok.' });
        }
        res.json(product);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.getProduct = getProduct;
const checkProductInCatalogs = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const { id } = req.params;
        const { data: catalogs, error } = await supabase_1.supabase
            .from('catalogs')
            .select('id, name')
            .eq('user_id', userId)
            .contains('product_ids', [id]);
        if (error)
            throw error;
        res.json({
            isInCatalogs: (catalogs?.length || 0) > 0,
            catalogs: catalogs || [],
            count: catalogs?.length || 0
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.checkProductInCatalogs = checkProductInCatalogs;
const checkProductsInCatalogs = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const { productIds } = req.body;
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.json({ productsInCatalogs: [], catalogs: [] });
        }
        const { data: catalogs, error } = await supabase_1.supabase
            .from('catalogs')
            .select('id, name, product_ids')
            .eq('user_id', userId);
        if (error)
            throw error;
        const productsInCatalogs = [];
        for (const productId of productIds) {
            const catalogsContaining = catalogs?.filter(c => c.product_ids?.includes(productId)).map(c => ({ id: c.id, name: c.name })) || [];
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
};
exports.checkProductsInCatalogs = checkProductsInCatalogs;
