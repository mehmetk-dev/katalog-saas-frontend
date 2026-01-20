"use strict";
const __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    let desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
const __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
const __importStar = (this && this.__importStar) || (function () {
    let ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            const ar = [];
            for (const k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        const result = {};
        if (mod != null) for (let k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.upgradeToPro = exports.incrementExportsUsed = exports.deleteMe = exports.updateMe = exports.sendWelcomeNotification = exports.getMe = void 0;
const supabase_1 = require("../services/supabase");
const activity_logger_1 = require("../services/activity-logger");
// Helper to get user ID from request (attached by auth middleware)
const getUserId = (req) => req.user.id;
const getUserEmail = (req) => req.user.email;
const getUserMeta = (req) => req.user.user_metadata;
const getMe = async (req, res) => {
    try {
        const userId = getUserId(req);
        const userEmail = getUserEmail(req);
        const userMeta = getUserMeta(req);
        // Get user profile
        let { data: profile, error: profileError } = await supabase_1.supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        // Check for subscription expiry
        if (profile && profile.plan !== 'free' && profile.subscription_end) {
            const expiry = new Date(profile.subscription_end);
            if (expiry < new Date()) {
                // Subscription expired, downgrade to free
                const { data: updatedProfile, error: upgradeError } = await supabase_1.supabase
                    .from('users')
                    .update({
                    plan: 'free',
                    subscription_status: 'expired',
                    updated_at: new Date().toISOString()
                })
                    .eq('id', userId)
                    .select()
                    .single();
                if (!upgradeError && updatedProfile) {
                    profile = updatedProfile;
                    // Bildirim gönder
                    try {
                        const { createNotification } = await Promise.resolve().then(() => __importStar(require('./notifications')));
                        await createNotification(userId, 'subscription_expired', 'Üyelik Süreniz Doldu ⏰', 'Premium üyeliğinizin süresi dolduğu için hesabınız Free plana geçirildi. Bazı özellikler kısıtlanmış olabilir.', '/dashboard/settings');
                    }
                    catch (notifError) {
                        console.error('Notification error:', notifError);
                    }
                }
            }
        }
        // Get counts
        const { count: productsCount } = await supabase_1.supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        const { count: catalogsCount } = await supabase_1.supabase
            .from('catalogs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        const result = {
            id: userId,
            email: userEmail,
            name: profile?.full_name || userMeta?.full_name || 'Kullanıcı',
            company: profile?.company || '',
            avatar_url: profile?.avatar_url || userMeta?.avatar_url,
            plan: profile?.plan || 'free',
            productsCount: productsCount || 0,
            catalogsCount: catalogsCount || 0,
            maxProducts: profile?.plan === 'pro' ? 999999 : profile?.plan === 'plus' ? 1000 : 50,
            maxCatalogs: profile?.plan === 'pro' ? 999999 : profile?.plan === 'plus' ? 10 : 1,
            maxExports: profile?.plan === 'pro' ? 999999 : profile?.plan === 'plus' ? 50 : 1,
            exportsUsed: profile?.exports_used || 0,
        };
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getMe = getMe;
// Hoşgeldin bildirimi gönder (kayıt sonrası çağrılır)
const sendWelcomeNotification = async (req, res) => {
    try {
        const userId = getUserId(req);
        const userMeta = getUserMeta(req);
        const userName = userMeta?.full_name || 'Değerli Kullanıcı';
        // Check if welcome notification already sent
        const { data: existingNotif } = await supabase_1.supabase
            .from('notifications')
            .select('id')
            .eq('user_id', userId)
            .eq('type', 'welcome')
            .single();
        if (existingNotif) {
            return res.json({ success: true, message: 'Already sent' });
        }
        // Send welcome notification
        const { createNotification } = await Promise.resolve().then(() => __importStar(require('./notifications')));
        await createNotification(userId, 'welcome', 'Hoş Geldiniz! 🎉', `Merhaba ${userName}, CatalogPro'ya hoş geldiniz! İlk kataloğunuzu oluşturmak için şablonlar sayfasını ziyaret edin.`, '/dashboard/templates');
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.sendWelcomeNotification = sendWelcomeNotification;
const updateMe = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { full_name, company } = req.body;
        const { error } = await supabase_1.supabase
            .from('users')
            .update({
            full_name,
            company,
            updated_at: new Date().toISOString()
        })
            .eq('id', userId);
        if (error)
            throw error;
        // Log activity
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'profile_updated',
            description: activity_logger_1.ActivityDescriptions.profileUpdated(),
            ipAddress,
            userAgent
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateMe = updateMe;
const deleteMe = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        // Log activity before deletion
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'account_deleted',
            description: activity_logger_1.ActivityDescriptions.accountDeleted(),
            ipAddress,
            userAgent
        });
        // Transactional delete: Deleting from Auth (via Admin) triggers 
        // ON DELETE CASCADE on public.users, which cascades to other tables.
        const { error: authError } = await supabase_1.supabase.auth.admin.deleteUser(userId);
        if (authError)
            throw authError;
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteMe = deleteMe;
const incrementExportsUsed = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { catalogName } = req.body; // Frontend'den katalog adı gelecek
        // First get current
        const { data: profile, error: fetchError } = await supabase_1.supabase
            .from('users')
            .select('exports_used, plan')
            .eq('id', userId)
            .single();
        if (fetchError)
            throw fetchError;
        const plan = profile.plan || 'free';
        const used = profile.exports_used || 0;
        let limit = 1; // free
        if (plan === 'plus')
            limit = 50;
        if (plan === 'pro')
            limit = 999999999; // unlimited
        if (used >= limit) {
            return res.status(403).json({ error: 'Export limit reached' });
        }
        const { error: updateError } = await supabase_1.supabase.from('users')
            .update({ exports_used: used + 1 })
            .eq('id', userId);
        if (updateError)
            throw updateError;
        // Log activity
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'pdf_downloaded',
            description: activity_logger_1.ActivityDescriptions.pdfDownloaded(catalogName || 'Katalog'),
            metadata: { catalogName },
            ipAddress,
            userAgent
        });
        // Bildirim gönder
        try {
            const { createNotification } = await Promise.resolve().then(() => __importStar(require('./notifications')));
            await createNotification(userId, 'catalog_downloaded', 'Katalog İndirildi 📥', catalogName
                ? `"${catalogName}" kataloğunuz PDF olarak indirildi.`
                : 'Kataloğunuz PDF olarak indirildi.', '/dashboard/catalogs');
        }
        catch (notifError) {
            console.error('Notification error:', notifError);
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.incrementExportsUsed = incrementExportsUsed;
const upgradeToPro = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { plan } = req.body;
        // Validate plan
        const validPlans = ['free', 'plus', 'pro'];
        const targetPlan = validPlans.includes(plan) ? plan : 'pro';
        // Set subscription end date (1 year from now for yearly plans)
        const subscriptionEnd = new Date();
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
        const { error } = await supabase_1.supabase.from('users')
            .update({
            plan: targetPlan,
            subscription_status: 'active',
            subscription_end: subscriptionEnd.toISOString()
        })
            .eq('id', userId);
        if (error)
            throw error;
        // Log activity
        const { ipAddress, userAgent } = (0, activity_logger_1.getRequestInfo)(req);
        await (0, activity_logger_1.logActivity)({
            userId,
            activityType: 'plan_upgrade',
            description: activity_logger_1.ActivityDescriptions.planUpgrade(targetPlan.toUpperCase()),
            metadata: { newPlan: targetPlan },
            ipAddress,
            userAgent
        });
        // Bildirim gönder
        if (targetPlan !== 'free') {
            try {
                const { createNotification } = await Promise.resolve().then(() => __importStar(require('./notifications')));
                const planName = targetPlan === 'pro' ? 'Pro' : 'Plus';
                await createNotification(userId, 'subscription_started', `${planName} Paketi Aktif! ✨`, `Tebrikler! ${planName} paketiniz aktif edildi. ${subscriptionEnd.toLocaleDateString('tr-TR')} tarihine kadar tüm premium özelliklerden yararlanabilirsiniz.`, '/dashboard');
            }
            catch (notifError) {
                console.error('Notification error:', notifError);
            }
        }
        res.json({ success: true, plan: targetPlan });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.upgradeToPro = upgradeToPro;
