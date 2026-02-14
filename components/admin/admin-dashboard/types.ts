export type TranslationFn = (key: string) => string

export interface AdminStats {
    usersCount: number
    productsCount: number
    catalogsCount: number
    totalExports: number
    deletedUsersCount: number
}

export interface AdminUser {
    id: string
    name?: string
    full_name?: string
    email: string
    created_at: string
    subscription_end?: string
    subscription_status?: string
    plan?: "free" | "plus" | "pro"
}

export interface DeletedUser extends AdminUser {
    deleted_at: string
    deleted_by: string
    original_created_at: string
}

export interface ActivityLog {
    id: string
    created_at: string
    user_email?: string
    user_name?: string
    activity_type: string
    description: string
    ip_address?: string
}
