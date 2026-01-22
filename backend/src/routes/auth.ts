import { Router, Request, Response } from 'express';

import { supabase } from '../services/supabase';
import { CheckProviderRequest, CheckProviderResponse } from '../types/auth';

const router = Router();

// Check if email is registered with OAuth provider (no auth required)
router.post('/check-provider', async (req: Request<{}, CheckProviderResponse | { error: string }, CheckProviderRequest>, res: Response<CheckProviderResponse | { error: string }>) => {
    try {
        const { email }: CheckProviderRequest = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Query auth.users table with service role to check provider
        const { data, error } = await supabase.auth.admin.listUsers();

        if (error) {
            console.error('Error checking provider:', error);
            const response: CheckProviderResponse = { 
                exists: false, 
                provider: null, 
                isOAuth: false 
            };
            return res.json(response);
        }

        // Find user by email
        const user = data.users.find(u => u.email === email);

        if (!user) {
            // User doesn't exist - that's fine, let them try to reset
            const response: CheckProviderResponse = { 
                exists: false, 
                provider: null, 
                isOAuth: false 
            };
            return res.json(response);
        }

        // Check if user signed up with OAuth
        const provider = user.app_metadata?.provider || 'email';
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
        const response: CheckProviderResponse = {
            exists: false,
            provider: null,
            isOAuth: false
        };
        res.json(response);
    }
});

export default router;
