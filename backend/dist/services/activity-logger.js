"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityDescriptions = void 0;
exports.logActivity = logActivity;
exports.getRequestInfo = getRequestInfo;
const supabase_1 = require("../services/supabase");
const redis_1 = require("../services/redis");
/**
 * Log a user activity to the database
 */
async function logActivity(params) {
    const { userId, activityType, description, metadata, ipAddress, userAgent } = params;
    try {
        // Get user profile info from cache (preferred) or DB
        const profile = await (0, redis_1.getOrSetCache)(redis_1.cacheKeys.user(userId), redis_1.cacheTTL.user, async () => {
            const { data, error } = await supabase_1.supabase
                .from('profiles')
                .select('email, full_name')
                .eq('id', userId)
                .single();
            if (error)
                return null;
            return data;
        });
        const { error } = await supabase_1.supabase
            .from('activity_logs')
            .insert({
            user_id: userId,
            user_email: profile?.email,
            user_name: profile?.full_name,
            activity_type: activityType,
            description,
            metadata: metadata || {},
            ip_address: ipAddress,
            user_agent: userAgent,
        });
        if (error) {
            console.error('[Activity Logger] Failed to log activity:', error.message);
        }
    }
    catch (error) {
        console.error('[Activity Logger] Error:', error);
    }
}
/**
 * Helper to extract IP and User Agent from Express Request
 */
function getRequestInfo(req) {
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
        req.headers['x-real-ip'] ||
        req.ip ||
        req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return { ipAddress, userAgent };
}
// Activity descriptions for common actions
exports.ActivityDescriptions = {
    login: (email) => `${email} sisteme giriş yaptı`,
    logout: (email) => `${email} sistemden çıkış yaptı`,
    signup: (email) => `${email} yeni hesap oluşturdu`,
    planUpgrade: (plan) => `${plan} planına yükseltti`,
    planDowngrade: (plan) => `${plan} planına düşürdü`,
    catalogCreated: (name) => `"${name}" kataloğu oluşturdu`,
    catalogUpdated: (name) => `"${name}" kataloğunu güncelledi`,
    catalogDeleted: (name) => `"${name}" kataloğunu sildi`,
    catalogPublished: (name) => `"${name}" kataloğunu yayınladı`,
    catalogUnpublished: (name) => `"${name}" kataloğunu yayından kaldırdı`,
    productCreated: (name) => `"${name}" ürününü ekledi`,
    productUpdated: (name) => `"${name}" ürününü güncelledi`,
    productDeleted: (name) => `"${name}" ürününü sildi`,
    productsImported: (count) => `${count} ürün içe aktardı`,
    productsExported: (count) => `${count} ürün dışa aktardı`,
    categoryCreated: (name) => `"${name}" kategorisi oluşturdu`,
    categoryDeleted: (name) => `"${name}" kategorisini sildi`,
    pdfDownloaded: (name) => `"${name}" kataloğunu PDF indirdi`,
    profileUpdated: () => `Profil bilgilerini güncelledi`,
    passwordChanged: () => `Şifresini değiştirdi`,
    accountDeleted: () => `Hesabını sildi`,
};
