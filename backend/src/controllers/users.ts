import { Request, Response } from 'express';
import { z } from 'zod';

import { supabase } from '../services/supabase';
import { deleteCache, cacheKeys } from '../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../services/activity-logger';
import { safeErrorMessage } from '../utils/safe-error';
import { countMonthlyExports, getMonthlyExportLimit } from '../services/pdf-export-quota';

// Helper to get user ID from request (attached by auth middleware)
const getUserId = (req: Request) => (req as unknown as { user: { id: string } }).user.id;
const getUserEmail = (req: Request) => (req as unknown as { user: { email: string } }).user.email;
const getUserMeta = (req: Request) => (req as unknown as { user: { user_metadata: Record<string, string> } }).user.user_metadata;

const updateMeSchema = z.object({
    full_name: z.string().trim().min(2).max(100).optional().nullable(),
    company: z.string().trim().max(120).optional().nullable(),
    avatar_url: z.union([z.string().url(), z.literal('')]).optional().nullable(),
    logo_url: z.union([z.string().url(), z.literal('')]).optional().nullable(),
});


export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const userEmail = getUserEmail(req);
        const userMeta = getUserMeta(req);

        // PERF: Fetch profile and counts in parallel (was 3 sequential queries)
        let [profileResult, productsCountResult, catalogsCountResult] = await Promise.all([
            supabase.from('users').select('*').eq('id', userId).single(),
            supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('catalogs').select('*', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        let profile = profileResult.data;

        // Check for subscription expiry
        if (profile && profile.plan !== 'free' && profile.subscription_end) {
            const expiry = new Date(profile.subscription_end);
            if (expiry < new Date()) {
                // Subscription expired, downgrade to free
                const { data: updatedProfile, error: upgradeError } = await supabase
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
                    // Plan değişti, cache'i temizle
                    await deleteCache(cacheKeys.user(userId));

                    // Bildirim gönder
                    try {
                        const { createNotification } = await import('./notifications');
                        await createNotification(
                            userId,
                            'subscription_expired',
                            'Üyelik Süreniz Doldu ⏰',
                            'Premium üyeliğinizin süresi dolduğu için hesabınız Free plana geçirildi. Bazı özellikler kısıtlanmış olabilir.',
                            '/dashboard/settings'
                        );
                    } catch (notifError) {
                        console.error('Notification error:', notifError);
                    }
                }
            }
        }

        // Get counts (already fetched in parallel above)
        const productsCount = productsCountResult.count;
        const catalogsCount = catalogsCountResult.count;
        const exportLimit = getMonthlyExportLimit(profile?.plan);
        const monthlyExports = await countMonthlyExports(userId);

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
            maxExports: Number.isFinite(exportLimit) ? exportLimit : 999999,
            // PDF hakkı aylık: bu ay tamamlanan PDF sayısı
            exportsUsed: monthlyExports,
        };

        res.json(result);
    } catch (error: unknown) {
        const message = safeErrorMessage(error);
        res.status(500).json({ error: message });
    }
};

// Hoşgeldin bildirimi gönder (kayıt sonrası çağrılır)
export const sendWelcomeNotification = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const userMeta = getUserMeta(req);
        const userName = userMeta?.full_name || 'Değerli Kullanıcı';

        // Check if welcome notification already sent
        const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', userId)
            .eq('type', 'welcome')
            .single();

        if (existingNotif) {
            return res.json({ success: true, message: 'Already sent' });
        }

        // Send welcome notification
        const { createNotification } = await import('./notifications');
        await createNotification(
            userId,
            'welcome',
            'Hoş Geldiniz! 🎉',
            `Merhaba ${userName}, FogCatalog'a hoş geldiniz! İlk kataloğunuzu oluşturmak için şablonlar sayfasını ziyaret edin.`,
            '/dashboard/templates'
        );

        res.json({ success: true });
    } catch (error: unknown) {
        const message = safeErrorMessage(error);
        res.status(500).json({ error: message });
    }
};

export const updateMe = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const parsed = updateMeSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            return res.status(400).json({ error: issue?.message || 'Invalid request body' });
        }

        const { full_name, company, avatar_url, logo_url } = parsed.data;

        const { error } = await supabase
            .from('users')
            .update({
                full_name,
                company,
                avatar_url: avatar_url === '' ? null : avatar_url,
                logo_url: logo_url === '' ? null : logo_url,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) throw error;

        // Profil değişti, user cache'i temizle
        await deleteCache(cacheKeys.user(userId));

        // Log activity
        const { ipAddress, userAgent } = getRequestInfo(req);
        await logActivity({
            userId,
            activityType: 'profile_updated',
            description: ActivityDescriptions.profileUpdated(),
            ipAddress,
            userAgent
        });

        res.json({ success: true });
    } catch (error: unknown) {
        const message = safeErrorMessage(error);
        res.status(500).json({ error: message });
    }
};

/** Muhasebe kaydı oldukları için kullanıcıya ON DELETE RESTRICT ile bağlı tablolar */
const RETAINED_BILLING_TABLES = ['billing_payment_attempts', 'billing_documents'] as const;
/** Ödeme geçmişi olan hesapta silinen kullanıcı içeriği (FK'leri users'a cascade) */
const USER_CONTENT_TABLES = ['catalogs', 'products', 'category_metadata', 'notifications'] as const;

async function hasRetainedBillingRecords(userId: string): Promise<boolean> {
    const counts = await Promise.all(
        RETAINED_BILLING_TABLES.map((table) =>
            supabase.from(table).select('id', { count: 'exact', head: true }).eq('user_id', userId)
        )
    );
    const failed = counts.find((result) => result.error);
    if (failed?.error) throw failed.error;
    return counts.some((result) => (result.count ?? 0) > 0);
}

/** Admin panelindeki "silinen kullanıcılar" listesi için iz (best-effort) */
async function recordDeletedUser(userId: string, reason: string) {
    const { data: profile } = await supabase
        .from('users')
        .select('email, full_name, company, avatar_url, plan, exports_used, created_at')
        .eq('id', userId)
        .maybeSingle();
    if (!profile) return;
    const { error } = await supabase.from('deleted_users').upsert({
        id: userId,
        email: profile.email,
        full_name: profile.full_name,
        company: profile.company,
        avatar_url: profile.avatar_url,
        plan: profile.plan,
        exports_used: profile.exports_used,
        original_created_at: profile.created_at,
        deleted_by: 'user',
        deletion_reason: reason,
    }, { onConflict: 'id' });
    if (error) console.warn('[users] deleted_users kaydı yazılamadı', error.message);
}

/**
 * Hesap silme. Ödeme denemesi/belgesi olan kullanıcı silinemiyordu: bu tablolar users'a
 * ON DELETE RESTRICT ile bağlı (muhasebe kayıtları yasal olarak saklanmalı), auth kullanıcısını
 * silmek zincirleme silmede hata veriyor ve kullanıcı yalnızca "hesap silinemedi" görüyordu.
 * Böyle hesaplarda içerik ve kişisel bilgiler silinir, e-posta serbest bırakılır, giriş kalıcı
 * olarak kapatılır; ödeme kayıtları kalır.
 */
export const deleteMe = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { ipAddress, userAgent } = getRequestInfo(req);

        await logActivity({
            userId,
            activityType: 'account_deleted',
            description: ActivityDescriptions.accountDeleted(),
            ipAddress,
            userAgent
        });

        if (!(await hasRetainedBillingRecords(userId))) {
            await recordDeletedUser(userId, 'user_request');
            // auth kullanıcısını silmek public.users ve bağlı tablolara zincirleme yayılır
            const { error: authError } = await supabase.auth.admin.deleteUser(userId);
            if (authError) throw authError;
            return res.json({ success: true, mode: 'deleted' });
        }

        await recordDeletedUser(userId, 'user_request_billing_retained');

        for (const table of USER_CONTENT_TABLES) {
            const { error } = await supabase.from(table).delete().eq('user_id', userId);
            if (error) throw error;
        }

        const placeholderEmail = `deleted-${userId}@deleted.fogcatalog.invalid`;
        const { error: profileError } = await supabase
            .from('users')
            .update({
                email: placeholderEmail,
                full_name: null,
                company: null,
                avatar_url: null,
                logo_url: null,
                instagram_url: null,
                youtube_url: null,
                website_url: null,
                plan: 'free',
                subscription_status: 'inactive',
                subscription_end: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        if (profileError) throw profileError;

        // E-posta yer tutucuya alınır (aynı adresle yeniden kayıt olunabilsin), giriş kapatılır
        const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
            email: placeholderEmail,
            email_confirm: true,
            user_metadata: {},
            ban_duration: '876000h',
        });
        if (authError) throw authError;

        await deleteCache(cacheKeys.user(userId)).catch(() => undefined);
        res.json({ success: true, mode: 'anonymized' });
    } catch (error: unknown) {
        const message = safeErrorMessage(error);
        res.status(500).json({ error: message });
    }
};
