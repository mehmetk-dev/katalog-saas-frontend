import { Router, Request, Response, NextFunction } from 'express';

import { supabase } from '../services/supabase';
import { requireAuth, type AuthUser } from '../middlewares/auth';
import { getOrSetCache, cacheKeys, cacheTTL, deleteCache } from '../services/redis';
import { safeErrorMessage } from '../utils/safe-error';

const router = Router();
const ADMIN_ROLE_CACHE_TTL_SECONDS = 120;
const PLAN_VALUES = ['free', 'plus', 'pro'] as const;
const getAdminRoleCacheKey = (userId: string) => `katalog:admin-role:${userId}`;

function getAuthUser(req: Request): AuthUser | null {
    const maybeUser = (req as unknown as { user?: AuthUser }).user;
    if (!maybeUser?.id) return null;
    return maybeUser;
}

function isValidUuid(value: string): boolean {
    // RFC4122 v1-v5 UUID format
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isValidPlan(value: unknown): value is (typeof PLAN_VALUES)[number] {
    return typeof value === 'string' && PLAN_VALUES.includes(value as (typeof PLAN_VALUES)[number]);
}

// Admin authorization middleware - must be used after requireAuth
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const user = getAuthUser(req);

    if (!user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Fast path: allow trusted auth claim to skip extra DB roundtrip.
    if (user.is_admin === true) {
        return next();
    }

    try {
        const isAdmin = await getOrSetCache<boolean>(
            getAdminRoleCacheKey(user.id),
            ADMIN_ROLE_CACHE_TTL_SECONDS,
            async () => {
                const { data: profile, error } = await supabase
                    .from('users')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    throw error;
                }

                return Boolean(profile?.is_admin);
            }
        );

        if (!isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        next();
    } catch {
        return res.status(500).json({ error: 'Admin authorization check failed' });
    }
};

// Apply authentication and admin authorization to all routes
router.use(requireAuth);
router.use(requireAdmin);

// GET /admin/users - Tum kullanicilari getir
router.get('/users', async (_req: Request, res: Response) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, full_name, company, plan, subscription_status, subscription_end, is_admin, exports_used, created_at, updated_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(users);
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
});

// GET /admin/deleted-users - Silinen kullanicilari getir
router.get('/deleted-users', async (_req: Request, res: Response) => {
    try {
        const { data: users, error } = await supabase
            .from('deleted_users')
            .select('id, email, full_name, company, plan, deleted_at, created_at')
            .order('deleted_at', { ascending: false });

        if (error) throw error;
        res.json(users || []);
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
});

// GET /admin/stats - Admin istatistikleri
router.get('/stats', async (_req: Request, res: Response) => {
    try {
        const cacheKey = cacheKeys.adminStats();
        const stats = await getOrSetCache(cacheKey, cacheTTL.adminStats, async () => {
            const [usersResult, productsResult, catalogsResult, exportsResult, deletedResult] = await Promise.all([
                supabase.from('users').select('id', { count: 'exact', head: true }),
                supabase.from('products').select('id', { count: 'exact', head: true }),
                supabase.from('catalogs').select('id', { count: 'exact', head: true }),
                supabase.from('users').select('exports_used').gt('exports_used', 0),
                supabase.from('deleted_users').select('id', { count: 'exact', head: true })
            ]);

            const totalExports = exportsResult.data?.reduce((acc: number, curr: { exports_used: number | null }) => acc + (curr.exports_used || 0), 0) || 0;

            return {
                usersCount: usersResult.count || 0,
                productsCount: productsResult.count || 0,
                catalogsCount: catalogsResult.count || 0,
                totalExports,
                deletedUsersCount: deletedResult.count || 0
            };
        });

        res.json(stats);
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
});

// PUT /admin/users/:id/plan - Kullanici planini guncelle
router.put('/users/:id/plan', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { plan } = req.body as { plan?: unknown };

        if (!isValidUuid(id)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }

        if (!isValidPlan(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        const { error } = await supabase
            .from('users')
            .update({ plan })
            .eq('id', id);

        if (error) throw error;

        // Plan degisti, ilgili cacheleri temizle
        await deleteCache(cacheKeys.user(id));
        await deleteCache(getAdminRoleCacheKey(id), true);

        res.json({ success: true });
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
});

export default router;
