import { Router, Request, Response, NextFunction } from 'express';

import { supabase } from '../services/supabase';
import { requireAuth } from '../middlewares/auth';
import { getOrSetCache, cacheKeys, cacheTTL } from '../services/redis';

const router = Router();

// Admin email from environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// Admin authorization middleware - must be used after requireAuth
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const userEmail = (req as unknown as { user: { email: string } }).user?.email;

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
router.use(requireAuth);
router.use(requireAdmin);

// GET /admin/users - Tüm kullanıcıları getir
router.get('/users', async (req: Request, res: Response) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(users);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
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
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});

// GET /admin/stats - Admin istatistikleri
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const cacheKey = cacheKeys.adminStats();
        const stats = await getOrSetCache(cacheKey, cacheTTL.adminStats, async () => {
            const [usersResult, productsResult, catalogsResult, exportsResult, deletedResult] = await Promise.all([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('catalogs').select('*', { count: 'exact', head: true }),
                supabase.from('users').select('exports_used'),
                supabase.from('deleted_users').select('*', { count: 'exact', head: true })
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
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
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
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});

export default router;
