import { createServerSupabaseClient } from '@/lib/supabase/server'

export type ActivityType =
    | 'user_login'
    | 'user_logout'
    | 'user_signup'
    | 'plan_upgrade'
    | 'plan_downgrade'
    | 'catalog_created'
    | 'catalog_updated'
    | 'catalog_deleted'
    | 'catalog_published'
    | 'catalog_unpublished'
    | 'product_created'
    | 'product_updated'
    | 'product_deleted'
    | 'products_imported'
    | 'products_exported'
    | 'category_created'
    | 'category_deleted'
    | 'pdf_downloaded'
    | 'profile_updated'
    | 'password_changed'
    | 'account_deleted'

export interface ActivityLog {
    id: string
    user_id: string
    user_email?: string
    user_name?: string
    activity_type: ActivityType
    description: string
    metadata?: Record<string, unknown>
    ip_address?: string
    user_agent?: string
    created_at: string
}

/**
 * Log a user activity to the database
 */
export async function logActivity(
    userId: string,
    activityType: ActivityType,
    description: string,
    metadata?: Record<string, unknown>,
    request?: Request
): Promise<void> {
    try {
        const supabase = await createServerSupabaseClient()

        // Get user info
        const { data: profile } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', userId)
            .single()

        // Get IP and User Agent from request if available
        let ip_address: string | undefined
        let user_agent: string | undefined

        if (request) {
            ip_address = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                request.headers.get('x-real-ip') ||
                undefined
            user_agent = request.headers.get('user-agent') || undefined
        }

        const { error } = await supabase
            .from('activity_logs')
            .insert({
                user_id: userId,
                user_email: profile?.email,
                user_name: profile?.full_name,
                activity_type: activityType,
                description,
                metadata,
                ip_address,
                user_agent,
            })

        if (error) {
            console.error('Failed to log activity:', error)
        }
    } catch (error) {
        console.error('Activity logging error:', error)
    }
}

/**
 * Get activity logs with pagination (for admin panel)
 */
export async function getActivityLogs(
    page: number = 1,
    limit: number = 50,
    filters?: {
        userId?: string
        activityType?: ActivityType
        startDate?: string
        endDate?: string
        search?: string
    }
): Promise<{ logs: ActivityLog[]; total: number }> {
    const supabase = await createServerSupabaseClient()

    let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

    if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
    }
    if (filters?.activityType) {
        query = query.eq('activity_type', filters.activityType)
    }
    if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate)
    }
    if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate)
    }
    if (filters?.search) {
        const term = `%${filters.search}%`
        query = query.or(`user_email.ilike.${term},user_name.ilike.${term},description.ilike.${term}`)
    }

    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
        console.error('Failed to fetch activity logs:', error)
        return { logs: [], total: 0 }
    }

    return { logs: data || [], total: count || 0 }
}

/**
 * Get recent activities for a specific user
 */
export async function getUserActivities(
    userId: string,
    limit: number = 10
): Promise<ActivityLog[]> {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Failed to fetch user activities:', error)
        return []
    }

    return data || []
}

/**
 * Get activity statistics for admin dashboard
 */
export async function getActivityStats(): Promise<{
    todayLogins: number
    todaySignups: number
    todayPremiumUpgrades: number
    todayCatalogsCreated: number
    todayProductsCreated: number
}> {
    const supabase = await createServerSupabaseClient()
    const today = new Date().toISOString().split('T')[0]

    const queries = await Promise.all([
        supabase
            .from('activity_logs')
            .select('id', { count: 'exact', head: true })
            .eq('activity_type', 'user_login')
            .gte('created_at', today),
        supabase
            .from('activity_logs')
            .select('id', { count: 'exact', head: true })
            .eq('activity_type', 'user_signup')
            .gte('created_at', today),
        supabase
            .from('activity_logs')
            .select('id', { count: 'exact', head: true })
            .eq('activity_type', 'plan_upgrade')
            .gte('created_at', today),
        supabase
            .from('activity_logs')
            .select('id', { count: 'exact', head: true })
            .eq('activity_type', 'catalog_created')
            .gte('created_at', today),
        supabase
            .from('activity_logs')
            .select('id', { count: 'exact', head: true })
            .eq('activity_type', 'product_created')
            .gte('created_at', today),
    ])

    return {
        todayLogins: queries[0].count || 0,
        todaySignups: queries[1].count || 0,
        todayPremiumUpgrades: queries[2].count || 0,
        todayCatalogsCreated: queries[3].count || 0,
        todayProductsCreated: queries[4].count || 0,
    }
}

// Activity type labels for UI
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, { tr: string; en: string; icon: string; color: string }> = {
    user_login: { tr: 'Giriş Yaptı', en: 'Logged In', icon: 'LogIn', color: 'green' },
    user_logout: { tr: 'Çıkış Yaptı', en: 'Logged Out', icon: 'LogOut', color: 'gray' },
    user_signup: { tr: 'Kayıt Oldu', en: 'Signed Up', icon: 'UserPlus', color: 'blue' },
    plan_upgrade: { tr: 'Plan Yükseltti', en: 'Upgraded Plan', icon: 'Crown', color: 'yellow' },
    plan_downgrade: { tr: 'Plan Düşürdü', en: 'Downgraded Plan', icon: 'ArrowDown', color: 'orange' },
    catalog_created: { tr: 'Katalog Oluşturdu', en: 'Created Catalog', icon: 'BookOpen', color: 'purple' },
    catalog_updated: { tr: 'Katalog Güncelledi', en: 'Updated Catalog', icon: 'Edit', color: 'blue' },
    catalog_deleted: { tr: 'Katalog Sildi', en: 'Deleted Catalog', icon: 'Trash', color: 'red' },
    catalog_published: { tr: 'Katalog Yayınladı', en: 'Published Catalog', icon: 'Globe', color: 'green' },
    catalog_unpublished: { tr: 'Katalog Yayından Kaldırdı', en: 'Unpublished Catalog', icon: 'EyeOff', color: 'gray' },
    product_created: { tr: 'Ürün Ekledi', en: 'Added Product', icon: 'Package', color: 'green' },
    product_updated: { tr: 'Ürün Güncelledi', en: 'Updated Product', icon: 'Edit', color: 'blue' },
    product_deleted: { tr: 'Ürün Sildi', en: 'Deleted Product', icon: 'Trash', color: 'red' },
    products_imported: { tr: 'Ürün İçe Aktardı', en: 'Imported Products', icon: 'Upload', color: 'purple' },
    products_exported: { tr: 'Ürün Dışa Aktardı', en: 'Exported Products', icon: 'Download', color: 'blue' },
    category_created: { tr: 'Kategori Oluşturdu', en: 'Created Category', icon: 'Tag', color: 'green' },
    category_deleted: { tr: 'Kategori Sildi', en: 'Deleted Category', icon: 'Trash', color: 'red' },
    pdf_downloaded: { tr: 'PDF İndirdi', en: 'Downloaded PDF', icon: 'FileDown', color: 'blue' },
    profile_updated: { tr: 'Profil Güncelledi', en: 'Updated Profile', icon: 'User', color: 'blue' },
    password_changed: { tr: 'Şifre Değiştirdi', en: 'Changed Password', icon: 'Key', color: 'yellow' },
    account_deleted: { tr: 'Hesap Sildi', en: 'Deleted Account', icon: 'UserMinus', color: 'red' },
}
