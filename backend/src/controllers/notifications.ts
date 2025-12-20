import { Request, Response } from 'express';

import { supabase } from '../services/supabase';

const getUserId = (req: Request) => (req as any).user.id;

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

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(Number(limit));

        if (unread_only === 'true') {
            query = query.eq('is_read', false);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Also get unread count
        const { count: unreadCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        res.json({ notifications: data || [], unreadCount: unreadCount || 0 });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Create notification (internal use - called from other controllers)
export const createNotification = async (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: Record<string, any>
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
export const cancelSubscription = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        // Get current user info
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('plan, subscription_end')
            .eq('id', userId)
            .single();

        if (fetchError) throw fetchError;

        if (user.plan === 'free') {
            return res.status(400).json({ error: 'No active subscription to cancel' });
        }

        // Update subscription status to cancelled
        const { error: updateError } = await supabase
            .from('users')
            .update({
                subscription_status: 'cancelled',
                subscription_cancelled_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        // Create notification
        await createNotification(
            userId,
            'subscription_cancelled',
            'Üyelik İptal Edildi',
            user.subscription_end
                ? `Üyeliğiniz iptal edildi. ${new Date(user.subscription_end).toLocaleDateString('tr-TR')} tarihine kadar premium özelliklerinizi kullanmaya devam edebilirsiniz.`
                : 'Üyeliğiniz iptal edildi.',
            '/dashboard/settings'
        );

        res.json({
            success: true,
            message: 'Subscription cancelled. You can continue using premium features until the end date.'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Notification templates helper
export const NotificationTemplates = {
    welcome: (userName: string) => ({
        title: 'Hoş Geldiniz! 🎉',
        message: `Merhaba ${userName}, CatalogPro'ya hoş geldiniz! İlk kataloğunuzu oluşturmak için şablonlar sayfasını ziyaret edin.`,
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
