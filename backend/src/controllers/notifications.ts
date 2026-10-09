import { Request, Response } from 'express';

import { supabase } from '../services/supabase';
import { safeErrorMessage } from '../utils/safe-error';
import { invalidateUserPlanCaches } from '../services/plan-cache';

const getUserId = (req: Request) => (req as unknown as { user: { id: string } }).user.id;

// Notification types
export type NotificationType =
    | 'subscription_started'
    | 'subscription_renewing'
    | 'subscription_expiring'
    | 'subscription_expired'
    | 'subscription_cancelled'
    | 'catalog_created'
    | 'catalog_downloaded'
    | 'product_limit_warning'
    | 'catalog_limit_warning'
    | 'welcome';

// Get user notifications
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { limit = 20, unread_only = false } = req.query;

        // SECURITY: Cap limit to prevent excessive data extraction
        const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(safeLimit);

        if (unread_only === 'true') {
            query = query.eq('is_read', false);
        }

        // PERF: Fetch notifications and unread count in parallel (was sequential)
        const [notifResult, countResult] = await Promise.all([
            query,
            supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false)
        ]);

        if (notifResult.error) throw notifResult.error;

        res.json({ notifications: notifResult.data || [], unreadCount: countResult.count || 0 });
    } catch (error: unknown) {
        const message = safeErrorMessage(error);
        res.status(500).json({ error: message });
    }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: unknown) {
        const message = safeErrorMessage(error);
        res.status(500).json({ error: message });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: unknown) {
        const message = safeErrorMessage(error);
        res.status(500).json({ error: message });
    }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: unknown) {
        const message = safeErrorMessage(error);
        res.status(500).json({ error: message });
    }
};

// Delete all notifications
export const deleteAllNotifications = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: unknown) {
        const message = safeErrorMessage(error);
        res.status(500).json({ error: message });
    }
};

// Create notification (internal use - called from other controllers)
export const createNotification = async (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: Record<string, unknown>
) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message,
                action_url: actionUrl,
                metadata: metadata || {}
            });

        if (error) {
            console.error('Failed to create notification:', error);
        }
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};

// Cancel subscription
/**
 * Aboneliği iptal eder. Ödemeler zaten otomatik yenilenmez; iptal, planın ödenen dönem sonuna
 * kadar sürüp sonra Ücretsiz plana geçeceğini kayda alır (iade yok — dijital hizmet). Yeni bir
 * ödeme durumu tekrar "active" yapar ve iptal tarihini temizler (garanti_payment_operations).
 */
export const cancelSubscription = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('plan, subscription_end, subscription_status')
            .eq('id', userId)
            .single();

        if (fetchError) throw fetchError;

        if (!user || user.plan === 'free') {
            return res.status(400).json({ error: 'İptal edilecek aktif bir abonelik yok.', code: 'no_active_subscription' });
        }

        if (user.subscription_status === 'cancelled') {
            return res.json({ success: true, alreadyCancelled: true, subscriptionEnd: user.subscription_end ?? null });
        }

        const { error: updateError } = await supabase
            .from('users')
            .update({
                subscription_status: 'cancelled',
                subscription_cancelled_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) throw updateError;
        await invalidateUserPlanCaches(userId);

        await createNotification(
            userId,
            'subscription_cancelled',
            'Üyelik İptal Edildi',
            user.subscription_end
                ? `Üyeliğiniz iptal edildi. ${new Date(user.subscription_end).toLocaleDateString('tr-TR')} tarihine kadar mevcut planınızı kullanmaya devam edebilirsiniz; ardından hesabınız Ücretsiz plana geçer.`
                : 'Üyeliğiniz iptal edildi.',
            '/dashboard/settings'
        );

        res.json({ success: true, subscriptionEnd: user.subscription_end ?? null });
    } catch (error: unknown) {
        const message = safeErrorMessage(error);
        res.status(500).json({ error: message });
    }
};

// Notification templates helper
export const NotificationTemplates = {
    welcome: (userName: string) => ({
        title: 'Hoş Geldiniz! 🎉',
        message: `Merhaba ${userName}, FogCatalog'a hoş geldiniz! İlk kataloğunuzu oluşturmak için şablonlar sayfasını ziyaret edin.`,
        actionUrl: '/dashboard/templates'
    }),

    subscriptionStarted: (planName: string, endDate: Date) => ({
        title: `${planName} Paketi Aktif! ✨`,
        message: `${planName} paketiniz aktif edildi. ${endDate.toLocaleDateString('tr-TR')} tarihine kadar tüm premium özelliklerden yararlanabilirsiniz.`,
        actionUrl: '/dashboard'
    }),

    subscriptionExpiring: (daysLeft: number, endDate: Date) => ({
        title: 'Üyeliğiniz Bitiyor ⏰',
        message: `Üyeliğiniz ${daysLeft} gün içinde (${endDate.toLocaleDateString('tr-TR')}) sona erecek. Yenilemek için ayarlar sayfasını ziyaret edin.`,
        actionUrl: '/dashboard/settings'
    }),

    subscriptionExpired: () => ({
        title: 'Üyeliğiniz Sona Erdi',
        message: 'Premium üyeliğiniz sona erdi. Premium özelliklere devam etmek için üyeliğinizi yenileyin.',
        actionUrl: '/dashboard/settings'
    }),

    catalogCreated: (catalogName: string, catalogId: string) => ({
        title: 'Katalog Oluşturuldu 📦',
        message: `"${catalogName}" kataloğunuz başarıyla oluşturuldu.`,
        actionUrl: `/dashboard/builder?id=${catalogId}`
    }),

    catalogDownloaded: (catalogName: string) => ({
        title: 'Katalog İndirildi 📥',
        message: `"${catalogName}" kataloğunuz PDF olarak indirildi.`,
        actionUrl: '/dashboard/catalogs'
    }),

    productLimitWarning: (current: number, max: number) => ({
        title: 'Ürün Limitine Yaklaşıyorsunuz ⚠️',
        message: `${current}/${max} ürün kullandınız. Daha fazla ürün eklemek için planınızı yükseltin.`,
        actionUrl: '/dashboard/products'
    }),

    catalogLimitWarning: (current: number, max: number) => ({
        title: 'Katalog Limitine Yaklaşıyorsunuz ⚠️',
        message: `${current}/${max} katalog kullandınız. Daha fazla katalog oluşturmak için planınızı yükseltin.`,
        actionUrl: '/dashboard/catalogs'
    })
};
