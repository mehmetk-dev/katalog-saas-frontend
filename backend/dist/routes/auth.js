"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../services/supabase");
const router = (0, express_1.Router)();
// Check if email is registered with OAuth provider (no auth required)
router.post('/check-provider', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required' });
        }
        // Query auth.users table with service role to check provider
        const { data, error } = await supabase_1.supabase.auth.admin.listUsers();
        if (error) {
            console.error('Error checking provider:', error);
            const response = {
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
            const response = {
                exists: false,
                provider: null,
                isOAuth: false
            };
            return res.json(response);
        }
        // Check if user signed up with OAuth
        const provider = user.app_metadata?.provider || 'email';
        const isOAuth = provider !== 'email';
        const response = {
            exists: true,
            provider,
            isOAuth,
        };
        res.json(response);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Check provider error:', message);
        const response = {
            exists: false,
            provider: null,
            isOAuth: false
        };
        res.json(response);
    }
});
exports.default = router;
