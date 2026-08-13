import type { NextFunction, Request, Response } from 'express'

import { getOrSetCache } from '../services/redis'
import { supabase } from '../services/supabase'
import type { AuthUser } from './auth'

const ADMIN_ROLE_CACHE_TTL_SECONDS = 120
const getAdminRoleCacheKey = (userId: string) => `katalog:admin-role:${userId}`

export function getAdminUser(req: Request): AuthUser | null {
    const user = (req as unknown as { user?: AuthUser }).user
    return user?.id ? user : null
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const user = getAdminUser(req)
    if (!user) return res.status(401).json({ error: 'Authentication required' })
    if (user.is_admin === true) return next()

    try {
        const isAdmin = await getOrSetCache<boolean>(
            getAdminRoleCacheKey(user.id),
            ADMIN_ROLE_CACHE_TTL_SECONDS,
            async () => {
                const { data, error } = await supabase
                    .from('users')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single()
                if (error) throw error
                return Boolean(data?.is_admin)
            }
        )
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden: Admin access required' })
        return next()
    } catch {
        return res.status(500).json({ error: 'Admin authorization check failed' })
    }
}

export { getAdminRoleCacheKey }
