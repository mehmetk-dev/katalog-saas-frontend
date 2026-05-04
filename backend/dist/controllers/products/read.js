"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductStats = exports.checkProductsInCatalogs = exports.checkProductInCatalogs = exports.getProductsByIds = exports.getProduct = exports.getProducts = void 0;
const supabase_1 = require("../../services/supabase");
const redis_1 = require("../../services/redis");
const helpers_1 = require("./helpers");
const safe_error_1 = require("../../utils/safe-error");
const schemas_1 = require("./schemas");
const getProducts = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const parsedQuery = schemas_1.productsQuerySchema.safeParse(req.query);
        if (!parsedQuery.success) {
            return res.status(400).json({
                error: parsedQuery.error.errors[0]?.message || 'Invalid query parameters',
            });
        }
        const { page, limit, sortBy, sortOrder, select } = parsedQuery.data;
        const category = parsedQuery.data.category === 'all' ? undefined : parsedQuery.data.category;
        const search = parsedQuery.data.search;
        const params = { page, limit, category, search, sortBy, sortOrder, select };
        const cacheKey = redis_1.cacheKeys.products(userId, params);
        const result = await (0, redis_1.getOrSetCache)(cacheKey, redis_1.cacheTTL.products, async () => {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            let query = supabase_1.supabase
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
            if (error)
                throw error;
            const products = select === 'id'
                ? (data || [])
                : (data || []).map((p) => {
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
            let allCategories = undefined;
            if (select !== 'id') {
                // Cache categories separately with longer TTL — they change infrequently
                const categoriesCacheKey = redis_1.cacheKeys.products(userId) + ':categories';
                allCategories = await (0, redis_1.getOrSetCache)(categoriesCacheKey, redis_1.cacheTTL.products * 4, async () => {
                    const { data: categoryData } = await supabase_1.supabase
                        .from('products')
                        .select('category')
                        .eq('user_id', userId)
                        .not('category', 'is', null)
                        .not('category', 'eq', '');
                    return [...new Set((categoryData || [])
                            .map((p) => p.category)
                            .filter(Boolean))];
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
const getProductsByIds = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const parse = schemas_1.productsByIdsSchema.safeParse(req.body);
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
        let data = [];
        for (let i = 0; i < requestedIds.length; i += SUPABASE_IN_CHUNK) {
            const chunk = requestedIds.slice(i, i + SUPABASE_IN_CHUNK);
            const { data: chunkData, error } = await supabase_1.supabase
                .from('products')
                .select('*')
                .eq('user_id', userId)
                .in('id', chunk);
            if (error)
                throw error;
            if (chunkData)
                data = data.concat(chunkData);
        }
        const normalizedProducts = (data || []).map((p) => {
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
        // Return in requested ID order for deterministic builder state
        const byId = new Map(normalizedProducts.map((p) => [p.id, p]));
        const ordered = requestedIds
            .map((id) => byId.get(id))
            .filter((p) => !!p);
        res.json(ordered);
    }
    catch (error) {
        console.error('[getProductsByIds] Error:', error);
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
};
exports.getProductsByIds = getProductsByIds;
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
        // Only fetch catalogs that contain at least one of the requested productIds
        const { data: catalogs, error } = await supabase_1.supabase
            .from('catalogs')
            .select('id, name, product_ids')
            .eq('user_id', userId)
            .overlaps('product_ids', productIds);
        if (error)
            throw error;
        // Build a map: productId → catalogs containing it
        const productIdSet = new Set(productIds);
        const productsInCatalogs = [];
        for (const catalog of catalogs || []) {
            const matchingIds = (catalog.product_ids || []).filter((id) => productIdSet.has(id));
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
            // Single RPC call instead of N+1 batch fetching
            const { data, error } = await supabase_1.supabase
                .rpc('get_product_stats', { p_user_id: userId });
            if (error)
                throw error;
            return {
                total: data?.total || 0,
                inStock: data?.inStock || 0,
                lowStock: data?.lowStock || 0,
                outOfStock: data?.outOfStock || 0,
                totalValue: Number(data?.totalValue) || 0,
            };
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
};
exports.getProductStats = getProductStats;
