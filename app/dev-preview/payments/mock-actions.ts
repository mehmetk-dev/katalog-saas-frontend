// GEÇİCİ: görsel QA için — commit'lenmeyecek
const now = '2026-10-08T09:00:00Z'
export async function getAdminPaymentOperationsData() {
    return {
        orders: [
            { id: 'ord_9f2a1c', user_id: 'u1', plan_id: 'plus' as const, billing_cycle: 'yearly' as const, status: 'paid', total_amount: '5000.00', currency: 'TRY', refunded_amount_minor: 0, paid_at: now, reversed_at: null, created_at: now },
            { id: 'ord_7b11e0', user_id: 'u3', plan_id: 'pro' as const, billing_cycle: 'monthly' as const, status: 'refunded', total_amount: '1000.00', currency: 'TRY', refunded_amount_minor: 100000, paid_at: '2026-10-01T09:00:00Z', reversed_at: '2026-10-03T09:00:00Z', created_at: '2026-10-01T09:00:00Z' },
            { id: 'ord_31c9d4', user_id: 'u2', plan_id: 'plus' as const, billing_cycle: 'monthly' as const, status: 'failed', total_amount: '500.00', currency: 'TRY', refunded_amount_minor: 0, paid_at: null, reversed_at: null, created_at: '2026-10-07T09:00:00Z' },
        ],
        operations: [
            { id: 'op_1', order_id: 'ord_7b11e0', attempt_id: 'att_1', operation_type: 'refund' as const, status: 'succeeded', requested_amount_minor: 100000, reason: 'Müşteri talebi', bank_response_code: '00', retry_count: 0, next_retry_at: null, last_error_code: null, created_at: '2026-10-03T09:00:00Z' },
            { id: 'op_2', order_id: 'ord_31c9d4', attempt_id: 'att_2', operation_type: 'reconciliation' as const, status: 'pending', requested_amount_minor: 0, reason: null, bank_response_code: null, retry_count: 2, next_retry_at: '2026-10-08T10:00:00Z', last_error_code: 'TIMEOUT', created_at: '2026-10-07T09:05:00Z' },
        ],
        alerts: [
            { id: 'al_1', order_id: 'ord_31c9d4', operation_id: 'op_2', severity: 'critical' as const, code: 'RECONCILE_STUCK', title: 'Mutabakat tamamlanamadı', message: 'Banka 3 denemede yanıt vermedi.', status: 'open' as const, occurrence_count: 3, last_seen_at: now },
            { id: 'al_2', order_id: null, operation_id: null, severity: 'warning' as const, code: 'CALLBACK_SLOW', title: 'Geri dönüş gecikti', message: 'Son 1 saatte 2 ödeme dönüşü 30 sn’den uzun sürdü.', status: 'acknowledged' as const, occurrence_count: 2, last_seen_at: now },
        ],
    }
}
export async function createAdminPaymentReversal(_input: unknown) { void _input }
export async function reconcileAdminPaymentAttempt(_id: string) { void _id }
export async function acknowledgeAdminPaymentAlert(_id: string) { void _id }
