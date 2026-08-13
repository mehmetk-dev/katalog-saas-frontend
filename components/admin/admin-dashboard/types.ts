export type { ActivityLog } from "@/lib/services/activity-logger"

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

export interface AdminPaymentOrder {
    id: string
    user_id: string
    plan_id: "plus" | "pro"
    billing_cycle: "monthly" | "yearly"
    status: string
    total_amount: number | string
    currency: string
    refunded_amount_minor: number
    paid_at: string | null
    reversed_at: string | null
    created_at: string
}

export interface AdminPaymentOperation {
    id: string
    order_id: string
    attempt_id: string
    operation_type: "reconciliation" | "void" | "refund"
    status: string
    requested_amount_minor: number
    reason: string | null
    bank_response_code: string | null
    retry_count: number
    next_retry_at: string | null
    last_error_code: string | null
    created_at: string
}

export interface AdminPaymentAlert {
    id: string
    order_id: string | null
    operation_id: string | null
    severity: "warning" | "critical"
    code: string
    title: string
    message: string
    status: "open" | "acknowledged" | "resolved"
    occurrence_count: number
    last_seen_at: string
}

