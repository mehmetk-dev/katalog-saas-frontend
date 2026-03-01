import { Request, Response, NextFunction } from 'express';

import { supabase } from '../services/supabase';

/** Typed auth user shape attached to req by auth middleware */
export interface AuthUser {
    id: string;
    email: string;
    user_metadata: Record<string, string>;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header is missing' });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Attach user to request object with proper typing
        (req as unknown as { user: AuthUser }).user = {
            id: user.id,
            email: user.email ?? '',
            user_metadata: (user.user_metadata ?? {}) as Record<string, string>,
        };
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};
