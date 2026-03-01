"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../services/supabase");
const auth_1 = require("../middlewares/auth");
const redis_1 = require("../services/redis");
const safe_error_1 = require("../utils/safe-error");
const router = (0, express_1.Router)();
// Admin authorization middleware - must be used after requireAuth
// Uses DB-based is_admin field instead of ADMIN_EMAIL env variable for better security
const requireAdmin = async (req, res, next) => {
    const user = req.user;
    if (!user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const { data: profile, error } = await supabase_1.supabase
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .single();
        if (error || !profile?.is_admin) {
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
// GET /admin/users - Tüm kullanıcıları getir
router.get('/users', async (req, res) => {
    try {
        // SECURITY: Select only necessary fields instead of select('*') to avoid exposing sensitive data
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
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
});
// GET /admin/stats - Admin istatistikleri
router.get('/stats', async (req, res) => {
    try {
        const cacheKey = redis_1.cacheKeys.adminStats();
        const stats = await (0, redis_1.getOrSetCache)(cacheKey, redis_1.cacheTTL.adminStats, async () => {
            const [usersResult, productsResult, catalogsResult, exportsResult, deletedResult] = await Promise.all([
                supabase_1.supabase.from('users').select('id', { count: 'exact', head: true }),
                supabase_1.supabase.from('products').select('id', { count: 'exact', head: true }),
                supabase_1.supabase.from('catalogs').select('id', { count: 'exact', head: true }),
                supabase_1.supabase.from('users').select('exports_used'),
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
        // Plan değişti, user cache'i temizle
        const { deleteCache, cacheKeys } = await Promise.resolve().then(() => __importStar(require('../services/redis')));
        await deleteCache(cacheKeys.user(id));
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: (0, safe_error_1.safeErrorMessage)(error) });
    }
});
exports.default = router;
