"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickDefinedFields = exports.generateShareSlug = exports.turkishToSlug = exports.getUserPlan = exports.getPlanLimits = exports.getUserId = void 0;
const supabase_1 = require("../../services/supabase");
const redis_1 = require("../../services/redis");
const getUserId = (req) => req.user.id;
exports.getUserId = getUserId;
/**
 * Plan bazlı katalog limiti hesaplar.
 */
const getPlanLimits = (plan) => {
    const maxCatalogs = plan === 'pro' ? 999999 : (plan === 'plus' ? 10 : 1);
    return { maxCatalogs };
};
exports.getPlanLimits = getPlanLimits;
/**
 * Kullanıcının plan bilgisini cache üzerinden getirir.
 */
const getUserPlan = async (userId) => {
    const user = await (0, redis_1.getOrSetCache)(redis_1.cacheKeys.user(userId), redis_1.cacheTTL.user, async () => {
        const { data } = await supabase_1.supabase.from('users').select('plan').eq('id', userId).single();
        return data;
    });
    return user?.plan || 'free';
};
exports.getUserPlan = getUserPlan;
/**
 * Türkçe karakterleri ASCII'ye dönüştürür ve slug-safe string üretir.
 */
const turkishToSlug = (text) => text.toLowerCase()
    .replace(/[ıİ]/g, 'i')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[şŞ]/g, 's')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
exports.turkishToSlug = turkishToSlug;
/**
 * Dinamik share slug üretir: [username]-[catalogname]-[random]
 */
const generateShareSlug = (userName, catalogName) => {
    const cleanUserName = userName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const cleanCatalogName = (0, exports.turkishToSlug)(catalogName).substring(0, 50);
    // "fogcatalog" ise slug'a ekleme (URL tekrarını önlemek için)
    const slugPrefix = cleanUserName === 'fogcatalog' ? '' : `${cleanUserName.substring(0, 30)}-`;
    return `${slugPrefix}${cleanCatalogName || 'katalog'}-${Date.now().toString(36)}`;
};
exports.generateShareSlug = generateShareSlug;
/**
 * Undefined olmayan field'ları bir Record'a filtreler.
 * Null check'li ve null check'siz varyantları destekler.
 */
const pickDefinedFields = (source, fieldsWithNullCheck, fieldsWithoutNullCheck = []) => {
    const result = {};
    for (const key of fieldsWithNullCheck) {
        if (source[key] !== undefined && source[key] !== null) {
            result[key] = source[key];
        }
    }
    for (const key of fieldsWithoutNullCheck) {
        if (source[key] !== undefined) {
            result[key] = source[key];
        }
    }
    return result;
};
exports.pickDefinedFields = pickDefinedFields;
