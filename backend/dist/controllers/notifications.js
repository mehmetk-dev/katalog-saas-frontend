"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTemplates = exports.cancelSubscription = exports.createNotification = exports.deleteAllNotifications = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const supabase_1 = require("../services/supabase");
const safe_error_1 = require("../utils/safe-error");
const getUserId = (req) => req.user.id;
// Get user notifications
const getNotifications = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { limit = 20, unread_only = false } = req.query;
        // SECURITY: Cap limit to prevent excessive data extraction
        const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
        let query = supabase_1.supabase
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
            supabase_1.supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false)
        ]);
        if (notifResult.error)
            throw notifResult.error;
        res.json({ notifications: notifResult.data || [], unreadCount: countResult.count || 0 });
    }
    catch (error) {
        const message = (0, safe_error_1.safeErrorMessage)(error);
        res.status(500).json({ error: message });
    }
};
exports.getNotifications = getNotifications;
// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const { error } = await supabase_1.supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            throw error;
        res.json({ success: true });
    }
    catch (error) {
        const message = (0, safe_error_1.safeErrorMessage)(error);
        res.status(500).json({ error: message });
    }
};
exports.markAsRead = markAsRead;
// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { error } = await supabase_1.supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('is_read', false);
        if (error)
            throw error;
        res.json({ success: true });
    }
    catch (error) {
        const message = (0, safe_error_1.safeErrorMessage)(error);
        res.status(500).json({ error: message });
    }
};
exports.markAllAsRead = markAllAsRead;
// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const { error } = await supabase_1.supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            throw error;
        res.json({ success: true });
    }
    catch (error) {
        const message = (0, safe_error_1.safeErrorMessage)(error);
        res.status(500).json({ error: message });
    }
};
exports.deleteNotification = deleteNotification;
// Delete all notifications
const deleteAllNotifications = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { error } = await supabase_1.supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId);
        if (error)
            throw error;
        res.json({ success: true });
    }
    catch (error) {
        const message = (0, safe_error_1.safeErrorMessage)(error);
        res.status(500).json({ error: message });
    }
};
exports.deleteAllNotifications = deleteAllNotifications;
// Create notification (internal use - called from other controllers)
const createNotification = async (userId, type, title, message, actionUrl, metadata) => {
    try {
        const { error } = await supabase_1.supabase
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
    }
    catch (error) {
        console.error('Failed to create notification:', error);
    }
};
exports.createNotification = createNotification;
// Cancel subscription
const cancelSubscription = async (req, res) => {
    try {
        const userId = getUserId(req);
        // Get current user info
        const { data: user, error: fetchError } = await supabase_1.supabase
            .from('users')
            .select('plan, subscription_end')
            .eq('id', userId)
            .single();
        if (fetchError)
            throw fetchError;
        if (user.plan === 'free') {
            return res.status(400).json({ error: 'No active subscription to cancel' });
        }
        // Update subscription status to cancelled
        const { error: updateError } = await supabase_1.supabase
            .from('users')
            .update({
            subscription_status: 'cancelled',
            subscription_cancelled_at: new Date().toISOString()
        })
            .eq('id', userId);
        if (updateError)
            throw updateError;
        // Create notification
        await (0, exports.createNotification)(userId, 'subscription_cancelled', 'Üyelik İptal Edildi', user.subscription_end
            ? `Üyeliğiniz iptal edildi. ${new Date(user.subscription_end).toLocaleDateString('tr-TR')} tarihine kadar premium özelliklerinizi kullanmaya devam edebilirsiniz.`
            : 'Üyeliğiniz iptal edildi.', '/dashboard/settings');
        res.json({
            success: true,
            message: 'Subscription cancelled. You can continue using premium features until the end date.'
        });
    }
    catch (error) {
        const message = (0, safe_error_1.safeErrorMessage)(error);
        res.status(500).json({ error: message });
    }
};
exports.cancelSubscription = cancelSubscription;
// Notification templates helper
exports.NotificationTemplates = {
    welcome: (userName) => ({
        title: 'Hoş Geldiniz! 🎉',
        message: `Merhaba ${userName}, FogCatalog'a hoş geldiniz! İlk kataloğunuzu oluşturmak için şablonlar sayfasını ziyaret edin.`,
        actionUrl: '/dashboard/templates'
    }),
    subscriptionStarted: (planName, endDate) => ({
        title: `${planName} Paketi Aktif! ✨`,
        message: `${planName} paketiniz aktif edildi. ${endDate.toLocaleDateString('tr-TR')} tarihine kadar tüm premium özelliklerden yararlanabilirsiniz.`,
        actionUrl: '/dashboard'
    }),
    subscriptionExpiring: (daysLeft, endDate) => ({
        title: 'Üyeliğiniz Bitiyor ⏰',
        message: `Üyeliğiniz ${daysLeft} gün içinde (${endDate.toLocaleDateString('tr-TR')}) sona erecek. Yenilemek için ayarlar sayfasını ziyaret edin.`,
        actionUrl: '/dashboard/settings'
    }),
    subscriptionExpired: () => ({
        title: 'Üyeliğiniz Sona Erdi',
        message: 'Premium üyeliğiniz sona erdi. Premium özelliklere devam etmek için üyeliğinizi yenileyin.',
        actionUrl: '/dashboard/settings'
    }),
    catalogCreated: (catalogName, catalogId) => ({
        title: 'Katalog Oluşturuldu 📦',
        message: `"${catalogName}" kataloğunuz başarıyla oluşturuldu.`,
        actionUrl: `/dashboard/builder?id=${catalogId}`
    }),
    catalogDownloaded: (catalogName) => ({
        title: 'Katalog İndirildi 📥',
        message: `"${catalogName}" kataloğunuz PDF olarak indirildi.`,
        actionUrl: '/dashboard/catalogs'
    }),
    productLimitWarning: (current, max) => ({
        title: 'Ürün Limitine Yaklaşıyorsunuz ⚠️',
        message: `${current}/${max} ürün kullandınız. Daha fazla ürün eklemek için planınızı yükseltin.`,
        actionUrl: '/dashboard/products'
    }),
    catalogLimitWarning: (current, max) => ({
        title: 'Katalog Limitine Yaklaşıyorsunuz ⚠️',
        message: `${current}/${max} katalog kullandınız. Daha fazla katalog oluşturmak için planınızı yükseltin.`,
        actionUrl: '/dashboard/catalogs'
    })
};
