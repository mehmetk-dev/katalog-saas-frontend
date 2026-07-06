"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const safe_error_1 = require("../utils/safe-error");
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
        res.json(response);
    }
    catch (error) {
        console.error('Check provider error:', (0, safe_error_1.safeErrorMessage)(error));
        res.json({ exists: true, provider: null, isOAuth: false });
    }
});
exports.default = router;
