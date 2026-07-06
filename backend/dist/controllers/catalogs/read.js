"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplates = exports.getCatalog = exports.getCatalogs = void 0;
const supabase_1 = require("../../services/supabase");
const redis_1 = require("../../services/redis");
const helpers_1 = require("./helpers");
const safe_error_1 = require("../../utils/safe-error");
const types_1 = require("./types");
const getCatalogs = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const { data, error } = await supabase_1.supabase
            .from('catalogs')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
        if (error)
            throw error;
        const plan = await (0, helpers_1.getUserPlan)(userId);
        const { maxCatalogs } = (0, helpers_1.getPlanLimits)(plan);
        const catalogsWithStatus = data.map((catalog, index) => ({
            ...catalog,
            is_disabled: index >= maxCatalogs
        }));
        res.json(catalogsWithStatus);
    }
    catch (error) {
        const errorMessage = (0, safe_error_1.safeErrorMessage)(error);
        res.status(500).json({ error: errorMessage });
    }
};
exports.getCatalogs = getCatalogs;
const getCatalog = async (req, res) => {
    try {
        const userId = (0, helpers_1.getUserId)(req);
        const { id } = req.params;
        const cacheKey = redis_1.cacheKeys.catalog(userId, id);
        // PERF: Fetch catalog data, all catalogs list, and user plan in parallel (was 3 sequential calls)
        const [data, allCatalogs, plan] = await Promise.all([
            (0, redis_1.getOrSetCache)(cacheKey, redis_1.cacheTTL.catalogs, async () => {
                const { data, error } = await supabase_1.supabase
                    .from('catalogs')
                    .select('*')
                    .eq('id', id)
                    .eq('user_id', userId)
                    .single();
                if (error)
                    throw new Error('Catalog not found');
                return data;
            }),
            (0, redis_1.getOrSetCache)(redis_1.cacheKeys.catalogs(userId), redis_1.cacheTTL.catalogs, async () => {
                const { data } = await supabase_1.supabase.from('catalogs').select('id').eq('user_id', userId).order('updated_at', { ascending: false });
                return data || [];
            }),
            (0, helpers_1.getUserPlan)(userId)
        ]);
        const { maxCatalogs } = (0, helpers_1.getPlanLimits)(plan);
        const catalogIndex = allCatalogs.findIndex((c) => c.id === id);
        if (catalogIndex >= maxCatalogs) {
            return res.status(403).json({
                error: 'Limit Reached',
                message: 'Bu kataloğa erişmek için planınızı yükseltmeniz gerekmektedir.'
            });
        }
        res.json(data);
    }
    catch (error) {
        const errorMessage = (0, safe_error_1.safeErrorMessage)(error);
        const status = errorMessage === 'Catalog not found' ? 404 : 500;
        res.status(status).json({ error: errorMessage });
    }
};
exports.getCatalog = getCatalog;
const getTemplates = async (req, res) => {
    try {
        const cacheKey = redis_1.cacheKeys.templates();
        const data = await (0, redis_1.getOrSetCache)(cacheKey, redis_1.cacheTTL.templates, async () => {
            return types_1.TEMPLATES;
        });
        res.json(data);
    }
    catch (error) {
        const errorMessage = (0, safe_error_1.safeErrorMessage)(error);
        res.status(500).json({ error: errorMessage });
    }
};
exports.getTemplates = getTemplates;
