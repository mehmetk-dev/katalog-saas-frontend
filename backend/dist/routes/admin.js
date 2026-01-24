"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../services/supabase");
const auth_1 = require("../middlewares/auth");
const redis_1 = require("../services/redis");
const router = (0, express_1.Router)();
// Admin email from environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
// Admin authorization middleware - must be used after requireAuth
const requireAdmin = async (req, res, next) => {
    const userEmail = req.user?.email;
    if (!ADMIN_EMAIL) {
        console.error('ADMIN_EMAIL environment variable is not set');
        return res.status(500).json({ error: 'Server configuration error' });
    }
    if (userEmail !== ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};
// Apply authentication and admin authorization to all routes
router.use(auth_1.requireAuth);
router.use(requireAdmin);
// GET /admin/users - Tüm kullanıcıları getir
router.get('/users', async (req, res) => {
    try {
        const { data: users, error } = await supabase_1.supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.json(users);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});
// GET /admin/deleted-users - Silinen kullanıcıları getir
router.get('/deleted-users', async (req, res) => {
    try {
        const { data: users, error } = await supabase_1.supabase
            .from('deleted_users')
            .select('*')
            .order('deleted_at', { ascending: false });
        if (error)
            throw error;
        res.json(users || []);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});
// GET /admin/stats - Admin istatistikleri
router.get('/stats', async (req, res) => {
    try {
        const cacheKey = redis_1.cacheKeys.adminStats();
        const stats = await (0, redis_1.getOrSetCache)(cacheKey, redis_1.cacheTTL.adminStats, async () => {
            const [usersResult, productsResult, catalogsResult, exportsResult, deletedResult] = await Promise.all([
                supabase_1.supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase_1.supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase_1.supabase.from('catalogs').select('*', { count: 'exact', head: true }),
                supabase_1.supabase.from('users').select('exports_used'),
                supabase_1.supabase.from('deleted_users').select('*', { count: 'exact', head: true })
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
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});
// PUT /admin/users/:id/plan - Kullanıcı planını güncelle
router.put('/users/:id/plan', async (req, res) => {
    try {
        const { id } = req.params;
        const { plan } = req.body;
        if (!['free', 'plus', 'pro'].includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }
        const { error } = await supabase_1.supabase
            .from('users')
            .update({ plan })
            .eq('id', id);
        if (error)
            throw error;
        res.json({ success: true });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});
exports.default = router;
