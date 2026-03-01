import { Request, Response } from 'express';
import { z } from 'zod';

import { supabase } from '../services/supabase';
import { deleteCache, cacheKeys } from '../services/redis';
import { logActivity, getRequestInfo, ActivityDescriptions } from '../services/activity-logger';
import { safeErrorMessage } from '../utils/safe-error';

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

const incrementExportsSchema = z.object({
    catalogName: z.string().max(200).optional().nullable(),
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

export const deleteMe = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { ipAddress, userAgent } = getRequestInfo(req);

        // Log activity before deletion
        await logActivity({
            userId,
            activityType: 'account_deleted',
            description: ActivityDescriptions.accountDeleted(),
            ipAddress,
            userAgent
        });

        // Transactional delete: Deleting from Auth (via Admin) triggers 
        // ON DELETE CASCADE on public.users, which cascades to other tables.
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);

        if (authError) throw authError;

        res.json({ success: true });
    } catch (error: unknown) {
        const message = safeErrorMessage(error);
        res.status(500).json({ error: message });
    }
};

export const incrementExportsUsed = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const parsed = incrementExportsSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            return res.status(400).json({ error: issue?.message || 'Invalid request body' });
        }
        const catalogName = parsed.data.catalogName ?? undefined;

        // Small retry loop to handle race conditions safely (compare-and-swap)
        for (let attempt = 0; attempt < 3; attempt++) {
            // First get current
            const { data: profile, error: fetchError } = await supabase
                .from('users')
                .select('exports_used, plan')
                .eq('id', userId)
                .single();

            if (fetchError) throw fetchError;

            const plan = profile.plan || 'free';
            const used = profile.exports_used || 0;

            let limit = 1; // free
            if (plan === 'plus') limit = 50;
            if (plan === 'pro') limit = 999999999; // unlimited

            if (used >= limit) {
                return res.status(403).json({ error: 'Export limit reached' });
            }

            // CAS-style update: only update if the counter is still the same
            const { data: updatedRows, error: updateError } = await supabase
                .from('users')
                .update({ exports_used: used + 1 })
                .eq('id', userId)
                .eq('exports_used', used)
                .select('id')
                .limit(1);

            if (updateError) throw updateError;

            if (updatedRows && updatedRows.length > 0) {
                // Log activity
                const { ipAddress, userAgent } = getRequestInfo(req);
                await logActivity({
                    userId,
                    activityType: 'pdf_downloaded',
                    description: ActivityDescriptions.pdfDownloaded(catalogName || 'Katalog'),
                    metadata: { catalogName },
                    ipAddress,
                    userAgent
                });

                // Bildirim gönder
                try {
                    const { createNotification } = await import('./notifications');
                    await createNotification(
                        userId,
                        'catalog_downloaded',
                        'Katalog İndirildi 📥',
                        catalogName
                            ? `"${catalogName}" kataloğunuz PDF olarak indirildi.`
                            : 'Kataloğunuz PDF olarak indirildi.',
                        '/dashboard/catalogs'
                    );
                } catch (notifError) {
                    console.error('Notification error:', notifError);
                }

                return res.json({ success: true });
            }
        }
        return res.status(409).json({ error: 'Export counter update conflict, please retry' });

    } catch (error: unknown) {
        const message = safeErrorMessage(error);
        res.status(500).json({ error: message });
    }
};

export const upgradeToPro = async (req: Request, res: Response) => {
    try {
        // SECURITY: Plan upgrade is disabled until payment integration (Stripe/Iyzico) is implemented.
        // This endpoint must ONLY be callable from a verified payment webhook, not directly by users.
        // TODO: Implement payment webhook verification before enabling plan upgrades.
        return res.status(403).json({
            error: 'Payment Required',
            message: 'Plan yükseltme işlemi şu anda aktif değil. Ödeme entegrasyonu tamamlandığında kullanılabilir olacaktır.'
        });
    } catch (error: unknown) {
        const message = safeErrorMessage(error);
        res.status(500).json({ error: message });
    }
};
