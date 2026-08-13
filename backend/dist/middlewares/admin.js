"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminRoleCacheKey = void 0;
exports.getAdminUser = getAdminUser;
exports.requireAdmin = requireAdmin;
const redis_1 = require("../services/redis");
const supabase_1 = require("../services/supabase");
const ADMIN_ROLE_CACHE_TTL_SECONDS = 120;
const getAdminRoleCacheKey = (userId) => `katalog:admin-role:${userId}`;
exports.getAdminRoleCacheKey = getAdminRoleCacheKey;
function getAdminUser(req) {
    const user = req.user;
    return user?.id ? user : null;
}
async function requireAdmin(req, res, next) {
    const user = getAdminUser(req);
    if (!user)
        return res.status(401).json({ error: 'Authentication required' });
    if (user.is_admin === true)
        return next();
    try {
        const isAdmin = await (0, redis_1.getOrSetCache)(getAdminRoleCacheKey(user.id), ADMIN_ROLE_CACHE_TTL_SECONDS, async () => {
            const { data, error } = await supabase_1.supabase
                .from('users')
                .select('is_admin')
                .eq('id', user.id)
                .single();
            if (error)
                throw error;
            return Boolean(data?.is_admin);
        });
        if (!isAdmin)
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        return next();
    }
    catch {
        return res.status(500).json({ error: 'Admin authorization check failed' });
    }
}
