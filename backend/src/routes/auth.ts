import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { CheckProviderRequest, CheckProviderResponse } from '../types/auth';
import { safeErrorMessage } from '../utils/safe-error';

const router = Router();

const checkProviderSchema = z.object({
    email: z.string().trim().email(),
});

router.post('/check-provider', async (req: Request<{}, CheckProviderResponse | { error: string }, CheckProviderRequest>, res: Response<CheckProviderResponse | { error: string }>) => {
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
        const response: CheckProviderResponse = {
            exists: true,
            provider: null,
            isOAuth: false,
        };

        res.json(response);

    } catch (error: unknown) {
        console.error('Check provider error:', safeErrorMessage(error));
        res.json({ exists: true, provider: null, isOAuth: false });
    }
});

export default router;
