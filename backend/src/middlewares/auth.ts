import { Request, Response, NextFunction } from 'express';

import { supabase } from '../services/supabase';

/** Typed auth user shape attached to req by auth middleware */
export interface AuthUser {
    id: string;
    email: string;
    user_metadata: Record<string, string>;
    is_admin?: boolean;
}

/**
 * Access token'ı doğrular. getUser() her istekte Supabase Auth'a (us-east-1) gidiyordu
 * (~150–300 ms); getClaims() asimetrik imzayı projenin JWKS'iyle (10 dk önbellek) yerelde doğrular.
 * Not: iptal edilen oturum token süresi (en fazla 1 saat) dolana kadar geçerli sayılır.
 */
export async function verifyAccessToken(token: string) {
    const { data, error } = await supabase.auth.getClaims(token);
    const claims = data?.claims;
    return { claims: claims?.sub ? claims : null, error };
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header is missing' });
        }

        const token = authHeader.replace('Bearer ', '');
        const { claims: user, error } = await verifyAccessToken(token);

        // Supabase Auth'a ulaşılamadıysa token geçersiz değildir; 401 frontend'de oturumu
        // kapattırır, bu yüzden geçici hata olarak bildirilir.
        if (error && (error.name === 'AuthRetryableFetchError' || (error.status ?? 0) >= 500)) {
            return res.status(503).json({ error: 'Authentication service unavailable' });
        }

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>;
        const isAdminClaim =
            appMetadata.is_admin === true ||
            appMetadata.role === 'admin' ||
            appMetadata.role === 'super_admin';

        // Attach user to request object with proper typing
        (req as unknown as { user: AuthUser }).user = {
            id: user.sub,
            email: user.email ?? '',
            user_metadata: (user.user_metadata ?? {}) as Record<string, string>,
            is_admin: isAdminClaim,
        };
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};
