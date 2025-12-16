import { supabase } from '../services/supabase'

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

interface LogActivityParams {
    userId: string
    activityType: ActivityType
    description: string
    metadata?: Record<string, any>
    ipAddress?: string
    userAgent?: string
}

/**
 * Log a user activity to the database
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
    const { userId, activityType, description, metadata, ipAddress, userAgent } = params

    try {
        // Get user profile info
        const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single()

        const { error } = await supabase
            .from('activity_logs')
            .insert({
                user_id: userId,
                user_email: profile?.email,
                user_name: profile?.full_name,
                activity_type: activityType,
                description,
                metadata: metadata || {},
                ip_address: ipAddress,
                user_agent: userAgent,
            })

        if (error) {
            console.error('[Activity Logger] Failed to log activity:', error.message)
        } else {
            console.log(`[Activity] ${profile?.email || userId}: ${activityType} - ${description}`)
        }
    } catch (error) {
        console.error('[Activity Logger] Error:', error)
    }
}

/**
 * Helper to extract IP and User Agent from Express Request
 */
export function getRequestInfo(req: any): { ipAddress?: string; userAgent?: string } {
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
        req.headers['x-real-ip'] ||
        req.ip ||
        req.connection?.remoteAddress

    const userAgent = req.headers['user-agent']

    return { ipAddress, userAgent }
}

// Activity descriptions for common actions
export const ActivityDescriptions = {
    login: (email: string) => `${email} sisteme giriş yaptı`,
    logout: (email: string) => `${email} sistemden çıkış yaptı`,
    signup: (email: string) => `${email} yeni hesap oluşturdu`,
    planUpgrade: (plan: string) => `${plan} planına yükseltti`,
    planDowngrade: (plan: string) => `${plan} planına düşürdü`,
    catalogCreated: (name: string) => `"${name}" kataloğu oluşturdu`,
    catalogUpdated: (name: string) => `"${name}" kataloğunu güncelledi`,
    catalogDeleted: (name: string) => `"${name}" kataloğunu sildi`,
    catalogPublished: (name: string) => `"${name}" kataloğunu yayınladı`,
    catalogUnpublished: (name: string) => `"${name}" kataloğunu yayından kaldırdı`,
    productCreated: (name: string) => `"${name}" ürününü ekledi`,
    productUpdated: (name: string) => `"${name}" ürününü güncelledi`,
    productDeleted: (name: string) => `"${name}" ürününü sildi`,
    productsImported: (count: number) => `${count} ürün içe aktardı`,
    productsExported: (count: number) => `${count} ürün dışa aktardı`,
    categoryCreated: (name: string) => `"${name}" kategorisi oluşturdu`,
    categoryDeleted: (name: string) => `"${name}" kategorisini sildi`,
    pdfDownloaded: (name: string) => `"${name}" kataloğunu PDF indirdi`,
    profileUpdated: () => `Profil bilgilerini güncelledi`,
    passwordChanged: () => `Şifresini değiştirdi`,
    accountDeleted: () => `Hesabını sildi`,
}
