import { Router, Request, Response, NextFunction } from 'express';

import { supabase } from '../services/supabase';
import { requireAuth } from '../middlewares/auth';
import { getOrSetCache, cacheKeys, cacheTTL } from '../services/redis';
import { safeErrorMessage } from '../utils/safe-error';

const router = Router();

// Admin authorization middleware - must be used after requireAuth
// Uses DB-based is_admin field instead of ADMIN_EMAIL env variable for better security
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as unknown as { user: { id: string; email: string } }).user;

    if (!user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const { data: profile, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (error || !profile?.is_admin) {
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

// GET /admin/users - Tüm kullanıcıları getir
router.get('/users', async (req: Request, res: Response) => {
    try {
        // SECURITY: Select only necessary fields instead of select('*') to avoid exposing sensitive data
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

// GET /admin/deleted-users - Silinen kullanıcıları getir
router.get('/deleted-users', async (req: Request, res: Response) => {
    try {
        const { data: users, error } = await supabase
            .from('deleted_users')
            .select('*')
            .order('deleted_at', { ascending: false });

        if (error) throw error;
        res.json(users || []);
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
});

// GET /admin/stats - Admin istatistikleri
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const cacheKey = cacheKeys.adminStats();
        const stats = await getOrSetCache(cacheKey, cacheTTL.adminStats, async () => {
            const [usersResult, productsResult, catalogsResult, exportsResult, deletedResult] = await Promise.all([
                supabase.from('users').select('id', { count: 'exact', head: true }),
                supabase.from('products').select('id', { count: 'exact', head: true }),
                supabase.from('catalogs').select('id', { count: 'exact', head: true }),
                supabase.from('users').select('exports_used'),
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

// PUT /admin/users/:id/plan - Kullanıcı planını güncelle
router.put('/users/:id/plan', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { plan } = req.body;

        if (!['free', 'plus', 'pro'].includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        const { error } = await supabase
            .from('users')
            .update({ plan })
            .eq('id', id);

        if (error) throw error;

        // Plan değişti, user cache'i temizle
        const { deleteCache, cacheKeys } = await import('../services/redis');
        await deleteCache(cacheKeys.user(id));

        res.json({ success: true });
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
});

export default router;
