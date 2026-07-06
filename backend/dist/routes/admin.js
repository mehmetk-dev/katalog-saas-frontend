"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../services/supabase");
const auth_1 = require("../middlewares/auth");
const redis_1 = require("../services/redis");
const safe_error_1 = require("../utils/safe-error");
const router = (0, express_1.Router)();
const ADMIN_ROLE_CACHE_TTL_SECONDS = 120;
const PLAN_VALUES = ['free', 'plus', 'pro'];
const getAdminRoleCacheKey = (userId) => `katalog:admin-role:${userId}`;
function getAuthUser(req) {
    const maybeUser = req.user;
    if (!maybeUser?.id)
        return null;
    return maybeUser;
}
function isValidUuid(value) {
    // RFC4122 v1-v5 UUID format
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function isValidPlan(value) {
    return typeof value === 'string' && PLAN_VALUES.includes(value);
}
// Admin authorization middleware - must be used after requireAuth
const requireAdmin = async (req, res, next) => {
    const user = getAuthUser(req);
    if (!user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    // Fast path: allow trusted auth claim to skip extra DB roundtrip.
    if (user.is_admin === true) {
        return next();
    }
    try {
        const isAdmin = await (0, redis_1.getOrSetCache)(getAdminRoleCacheKey(user.id), ADMIN_ROLE_CACHE_TTL_SECONDS, async () => {
            const { data: profile, error } = await supabase_1.supabase
                .from('users')
                .select('is_admin')
                .eq('id', user.id)
                .single();
            if (error) {
                throw error;
            }
            return Boolean(profile?.is_admin);
        });
        if (!isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        next();
    }
    catch {
        return res.status(500).json({ error: 'Admin authorization check failed' });
    }
};
// Apply authentication and admin authorization to all routes
router.use(auth_1.requireAuth);
router.use(requireAdmin);
// GET /admin/users - Tum kullanicilari getir
router.get('/users', async (_req, res) => {
    try {
        const { data: users, error } = await supabase_1.supabase
            .from('users')
            .select('id, email, full_name, company, plan, subscription_status, subscription_end, is_admin, exports_used, created_at, updated_at')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
});
// GET /admin/deleted-users - Silinen kullanicilari getir
router.get('/deleted-users', async (_req, res) => {
    try {
        const { data: users, error } = await supabase_1.supabase
            .from('deleted_users')
            .select('id, email, full_name, company, plan, deleted_at, created_at')
            .order('deleted_at', { ascending: false });
        if (error)
            throw error;
        res.json(users || []);
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
});
// GET /admin/stats - Admin istatistikleri
router.get('/stats', async (_req, res) => {
    try {
        const cacheKey = redis_1.cacheKeys.adminStats();
        const stats = await (0, redis_1.getOrSetCache)(cacheKey, redis_1.cacheTTL.adminStats, async () => {
            const [usersResult, productsResult, catalogsResult, exportsResult, deletedResult] = await Promise.all([
                supabase_1.supabase.from('users').select('id', { count: 'exact', head: true }),
                supabase_1.supabase.from('products').select('id', { count: 'exact', head: true }),
                supabase_1.supabase.from('catalogs').select('id', { count: 'exact', head: true }),
                supabase_1.supabase.from('users').select('exports_used').gt('exports_used', 0),
                supabase_1.supabase.from('deleted_users').select('id', { count: 'exact', head: true })
            ]);
            const totalExports = exportsResult.data?.reduce((acc, curr) => acc + (curr.exports_used || 0), 0) || 0;
            return {
                usersCount: usersResult.count || 0,
                productsCount: productsResult.count || 0,
                catalogsCount: catalogsResult.count || 0,
                totalExports,
                deletedUsersCount: deletedResult.count || 0
            };
        });
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
});
// PUT /admin/users/:id/plan - Kullanici planini guncelle
router.put('/users/:id/plan', async (req, res) => {
    try {
        const { id } = req.params;
        const { plan } = req.body;
        if (!isValidUuid(id)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        if (!isValidPlan(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }
        const { error } = await supabase_1.supabase
            .from('users')
            .update({ plan })
            .eq('id', id);
        if (error)
            throw error;
        // Plan degisti, ilgili cacheleri temizle
        await (0, redis_1.deleteCache)(redis_1.cacheKeys.user(id));
        await (0, redis_1.deleteCache)(getAdminRoleCacheKey(id), true);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
});
exports.default = router;
