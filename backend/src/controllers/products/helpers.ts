import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
    };
}

export const getUserId = (req: Request): string => (req as AuthenticatedRequest).user.id;
