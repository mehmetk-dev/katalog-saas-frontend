import { Request, Response } from 'express';
import { supabase } from '../services/supabase';

// Helper to get user ID from request (attached by auth middleware)
const getUserId = (req: Request) => (req as any).user.id;
const getUserEmail = (req: Request) => (req as any).user.email;
const getUserMeta = (req: Request) => (req as any).user.user_metadata;

export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const userEmail = getUserEmail(req);
        const userMeta = getUserMeta(req);

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        // Get counts
        const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        const { count: catalogsCount } = await supabase
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
            maxProducts: profile?.plan === 'pro' ? 999999 : 50,
            maxExports: profile?.plan === 'pro' ? 999999 : 1,
            exportsUsed: profile?.exports_used || 0,
        };

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateMe = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { full_name, company } = req.body;

        const { error } = await supabase
            .from('users')
            .update({
                full_name,
                company,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteMe = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

        // Transactional delete: Deleting from Auth (via Admin) triggers 
        // ON DELETE CASCADE on public.users, which cascades to other tables.
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);

        if (authError) throw authError;

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const incrementExportsUsed = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);

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

        const { error: updateError } = await supabase.from('users')
            .update({ exports_used: used + 1 })
            .eq('id', userId);

        if (updateError) throw updateError;

        res.json({ success: true });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const upgradeToPro = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { error } = await supabase.from('users')
            .update({ plan: 'pro' })
            .eq('id', userId);

        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
