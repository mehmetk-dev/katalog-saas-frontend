import type { Request } from 'express';
import { supabase } from '../../services/supabase';
import { cacheKeys, cacheTTL, getOrSetCache } from '../../services/redis';
import type { AuthenticatedRequest } from './types';

export const getUserId = (req: Request): string =>
    (req as unknown as AuthenticatedRequest).user.id;

/**
 * Plan bazlı katalog limiti hesaplar.
 */
export const getPlanLimits = (plan: string) => {
    const maxCatalogs = plan === 'pro' ? 999999 : (plan === 'plus' ? 10 : 1);
    return { maxCatalogs };
};

/**
 * Kullanıcının plan bilgisini cache üzerinden getirir.
 */
export const getUserPlan = async (userId: string): Promise<string> => {
    const user = await getOrSetCache(cacheKeys.user(userId), cacheTTL.user, async () => {
        const { data } = await supabase.from('users').select('plan').eq('id', userId).single();
        return data;
    });
    return (user as { plan: string })?.plan || 'free';
};

/**
 * Türkçe karakterleri ASCII'ye dönüştürür ve slug-safe string üretir.
 */
export const turkishToSlug = (text: string): string =>
    text.toLowerCase()
        .replace(/[ıİ]/g, 'i')
        .replace(/[ğĞ]/g, 'g')
        .replace(/[üÜ]/g, 'u')
        .replace(/[şŞ]/g, 's')
        .replace(/[öÖ]/g, 'o')
        .replace(/[çÇ]/g, 'c')
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

/**
 * Dinamik share slug üretir: [username]-[catalogname]-[random]
 */
export const generateShareSlug = (userName: string, catalogName: string): string => {
    const cleanUserName = userName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const cleanCatalogName = turkishToSlug(catalogName).substring(0, 50);

    // "fogcatalog" ise slug'a ekleme (URL tekrarını önlemek için)
    const slugPrefix = cleanUserName === 'fogcatalog' ? '' : `${cleanUserName.substring(0, 30)}-`;

    return `${slugPrefix}${cleanCatalogName || 'katalog'}-${Date.now().toString(36)}`;
};

/**
 * Undefined olmayan field'ları bir Record'a filtreler.
 * Null check'li ve null check'siz varyantları destekler.
 */
export const pickDefinedFields = (
    source: Record<string, unknown>,
    fieldsWithNullCheck: string[],
    fieldsWithoutNullCheck: string[] = []
): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

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
