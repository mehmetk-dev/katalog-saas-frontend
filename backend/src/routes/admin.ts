import { Router, Request, Response } from 'express';

import { supabase } from '../services/supabase';
import { requireAuth } from '../middlewares/auth';
import { getAdminRoleCacheKey, requireAdmin } from '../middlewares/admin';
import { getOrSetCache, cacheKeys, cacheTTL, deleteCache } from '../services/redis';
import { safeErrorMessage } from '../utils/safe-error';
import {
    acknowledgePaymentAlert,
    createPaymentReversal,
    listPaymentAlerts,
    listPaymentOperations,
    listPaymentOrders,
    reconcilePaymentAttempt,
} from '../controllers/admin-billing';
import { billingMutationLimiter } from '../middlewares/rate-limiters';
import { invalidateUserPlanCaches } from '../services/plan-cache';

const router = Router();
const PLAN_VALUES = ['free', 'plus', 'pro'] as const;

function isValidUuid(value: string): boolean {
    // RFC4122 v1-v5 UUID format
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isValidPlan(value: unknown): value is (typeof PLAN_VALUES)[number] {
    return typeof value === 'string' && PLAN_VALUES.includes(value as (typeof PLAN_VALUES)[number]);
}

// Apply authentication and admin authorization to all routes
router.use(requireAuth);
router.use(requireAdmin);

router.get('/billing/orders', listPaymentOrders);
router.get('/billing/operations', listPaymentOperations);
router.get('/billing/alerts', listPaymentAlerts);
router.post('/billing/attempts/:attemptId/reconcile', billingMutationLimiter, reconcilePaymentAttempt);
router.post('/billing/orders/:orderId/reversal', billingMutationLimiter, createPaymentReversal);
router.post('/billing/alerts/:alertId/acknowledge', billingMutationLimiter, acknowledgePaymentAlert);

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

        const { data: current, error: fetchError } = await supabase
            .from('users')
            .select('subscription_end')
            .eq('id', id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!current) return res.status(404).json({ error: 'User not found' });

        // Elle verilen ücretli plan: geçmişte kalmış bitiş tarihi temizlenir (süresiz). Önceden yalnızca
        // plan güncelleniyordu ve eski subscription_end geçmişte olduğu için kullanıcının bir sonraki
        // girişinde plan hemen tekrar ücretsize düşüyordu. İleri tarihli ödeme dönemi korunur.
        const endTime = current.subscription_end ? new Date(current.subscription_end).getTime() : NaN;
        const hasFuturePaidPeriod = Number.isFinite(endTime) && endTime > Date.now();
        const update = plan === 'free'
            ? { plan, subscription_status: 'inactive', subscription_end: null, subscription_cancelled_at: null }
            : { plan, subscription_status: 'active', subscription_end: hasFuturePaidPeriod ? current.subscription_end : null };

        const { error } = await supabase
            .from('users')
            .update({ ...update, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        // Plan değişti: kullanıcı, katalog (kilitli kataloglar) ve istatistik önbellekleri
        await invalidateUserPlanCaches(id);
        await deleteCache(getAdminRoleCacheKey(id), true);

        res.json({ success: true });
    } catch (error: unknown) {
        res.status(500).json({ error: safeErrorMessage(error) });
    }
});

export default router;
