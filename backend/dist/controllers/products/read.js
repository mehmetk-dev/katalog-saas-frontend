"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductStats = exports.checkProductsInCatalogs = exports.checkProductInCatalogs = exports.getProduct = exports.getProducts = void 0;
const supabase_1 = require("../../services/supabase");
const redis_1 = require("../../services/redis");
const helpers_1 = require("./helpers");
const safe_error_1 = require("../../utils/safe-error");
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
        if (limit > 1000)
            limit = 1000;
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
            const { data, error, count } = await query
                .order('display_order', { ascending: true, nullsFirst: false })
                .order('created_at', { ascending: false })
                .order('id', { ascending: false })
                .range(from, to);
            if (error)
                throw error;
            const products = (data || []).map((p) => {
                let imgUrl = typeof p.image_url === 'string' ? p.image_url : null;
                if (imgUrl && imgUrl.startsWith('http://') && !imgUrl.includes('localhost')) {
                    imgUrl = imgUrl.replace('http://', 'https://');
                }
                let imgs = Array.isArray(p.images) ? p.images : [];
                imgs = imgs.map((img) => (typeof img === 'string' && img.startsWith('http://') && !img.includes('localhost'))
                    ? img.replace('http://', 'https://')
                    : img);
                return {
                    ...p,
                    image_url: imgUrl,
                    images: imgs,
                    order: p.display_order ?? p.order ?? 0
                };
            });
            // Tüm benzersiz kategorileri getir (filtre için)
            const { data: categoryData } = await supabase_1.supabase
                .from('products')
                .select('category')
                .eq('user_id', userId)
                .not('category', 'is', null)
                .not('category', 'eq', '');
            const allCategories = [...new Set((categoryData || [])
                    .map((p) => p.category)
                    .filter(Boolean))];
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
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
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
        if (typeof product.image_url === 'string' && product.image_url.startsWith('http://') && !product.image_url.includes('localhost')) {
            product.image_url = product.image_url.replace('http://', 'https://');
        }
        if (Array.isArray(product.images)) {
            product.images = product.images.map((img) => (typeof img === 'string' && img.startsWith('http://') && !img.includes('localhost'))
                ? img.replace('http://', 'https://')
                : img);
        }
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
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
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
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
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
};
exports.checkProductsInCatalogs = checkProductsInCatalogs;
const getProductStats = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        // Use redis cache to speed up stats
        const cacheKey = redis_1.cacheKeys.stats(userId, { type: 'products' });
        const result = await (0, redis_1.getOrSetCache)(cacheKey, redis_1.cacheTTL.products, async () => {
            // First get exact total count (doesn't fetch rows)
            const { count: totalCount, error: countError } = await supabase_1.supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
            if (countError)
                throw countError;
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
                const { data, error } = await supabase_1.supabase
                    .from('products')
                    .select('stock, price')
                    .eq('user_id', userId)
                    .range(from, to);
                if (error)
                    throw error;
                (data || []).forEach(p => {
                    const stock = p.stock || 0;
                    const price = Number(p.price) || 0;
                    if (stock >= 10)
                        stats.inStock++;
                    else if (stock > 0 && stock < 10)
                        stats.lowStock++;
                    else if (stock === 0)
                        stats.outOfStock++;
                    stats.totalValue += (stock * price);
                });
            }
            return stats;
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
};
exports.getProductStats = getProductStats;
