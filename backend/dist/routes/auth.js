"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const supabase_1 = require("../services/supabase");
const router = (0, express_1.Router)();
const checkProviderSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email(),
});
router.post('/check-provider', async (req, res) => {
    try {
        const parsed = checkProviderSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        const cleanEmail = parsed.data.email.toLowerCase();
        /**
         * SECURITY NOTE:
         * We intentionally return a neutral response to prevent user enumeration.
         * Do not expose whether the account exists or which provider is used.
         */
        const response = {
            exists: true,
            provider: null,
            isOAuth: false,
        };
        // Keep a light internal query path for observability/compatibility (result not exposed)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _ = await supabase_1.supabase
            .from('users')
            .select('id')
            .ilike('email', cleanEmail)
            .maybeSingle();
        res.json(response);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Check provider error:', message);
        res.json({ exists: true, provider: null, isOAuth: false });
    }
});
exports.default = router;
