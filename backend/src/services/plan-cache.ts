import { cacheKeys, deleteCache } from './redis'
import { supabase } from './supabase'

/**
 * Plan değişince (ödeme, mutabakat, iade) kullanıcının plan bilgisini tutan önbellekler silinmeli;
 * aksi halde ödeme yapan kullanıcı TTL (10 dk) boyunca eski plan limitlerine takılır.
 */
export async function invalidateUserPlanCaches(userId: string): Promise<void> {
    await Promise.all([
        deleteCache(cacheKeys.user(userId), true),
        deleteCache(cacheKeys.catalogs(userId)),
        deleteCache(cacheKeys.stats(userId)),
    ]).catch((error) => {
        console.warn('[billing] plan cache invalidation failed', {
            message: error instanceof Error ? error.message : String(error),
        })
    })
}

export async function invalidatePlanCachesForOrder(orderId: string): Promise<void> {
    const { data } = await supabase.from('billing_orders').select('user_id').eq('id', orderId).maybeSingle()
    if (data?.user_id) await invalidateUserPlanCaches(String(data.user_id))
}
