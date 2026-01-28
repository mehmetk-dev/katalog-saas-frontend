import { Router, Request, Response } from 'express';

import { supabase } from '../services/supabase';
import { CheckProviderRequest, CheckProviderResponse } from '../types/auth';

const router = Router();

router.post('/check-provider', async (req: Request<{}, CheckProviderResponse | { error: string }, CheckProviderRequest>, res: Response<CheckProviderResponse | { error: string }>) => {
    try {
        const { email }: CheckProviderRequest = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required' });
        }

        const cleanEmail = email.trim().toLowerCase();

        // 1. Önce public.users tablosundan kontrol et
        const { data: publicUser } = await supabase
            .from('users')
            .select('id, email')
            .ilike('email', cleanEmail)
            .single();

        // 2. Auth listesinden detayları al
        const { data: authData } = await supabase.auth.admin.listUsers();

        // Auth listesinde ara (Case-insensitive)
        const authUser = authData?.users.find(u =>
            u.email?.toLowerCase() === cleanEmail ||
            u.email === email.trim()
        );

        // Kullanıcı var mı?
        const exists = !!publicUser || !!authUser;


        if (!exists) {
            return res.json({ exists: false, provider: null, isOAuth: false });
        }

        // Provider bilgisini belirle (authUser'dan al, yoksa email varsay)
        const provider = authUser?.app_metadata?.provider || 'email';
        const isOAuth = provider !== 'email';

        const response: CheckProviderResponse = {
            exists: true,
            provider,
            isOAuth,
        };

        res.json(response);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Check provider error:', message);
        res.json({ exists: false, provider: null, isOAuth: false });
    }
});

export default router;
