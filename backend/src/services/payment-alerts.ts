import client from 'prom-client'

import { supabase } from './supabase'
import { sanitizePaymentAlertDetails } from './payment-alert-sanitizer'

export type PaymentAlertSeverity = 'warning' | 'critical'

export interface PaymentAlertInput {
    severity: PaymentAlertSeverity
    code: string
    dedupeKey: string
    title: string
    message: string
    orderId?: string
    attemptId?: string
    operationId?: string
    safeDetails?: Record<string, unknown>
}

const alertCounter =
    (client.register.getSingleMetric(
        'fogcatalog_payment_alerts_total'
    ) as client.Counter<string>) ||
    new client.Counter({
        name: 'fogcatalog_payment_alerts_total',
        help: 'Garanti payment alerts recorded',
        labelNames: ['severity', 'code'] as const,
    })

const openAlertGauge =
    (client.register.getSingleMetric('fogcatalog_payment_alerts_open') as client.Gauge<string>) ||
    new client.Gauge({
        name: 'fogcatalog_payment_alerts_open',
        help: 'Open or acknowledged Garanti payment alerts',
        labelNames: ['severity'] as const,
    })

export async function refreshPaymentAlertMetrics(): Promise<void> {
    const { data, error } = await supabase
        .from('billing_payment_alerts')
        .select('severity')
        .in('status', ['open', 'acknowledged'])
    if (error) return
    const warning = (data ?? []).filter((row) => row.severity === 'warning').length
    const critical = (data ?? []).filter((row) => row.severity === 'critical').length
    openAlertGauge.set({ severity: 'warning' }, warning)
    openAlertGauge.set({ severity: 'critical' }, critical)
}

export async function recordPaymentAlert(input: PaymentAlertInput): Promise<void> {
    const safeDetails = sanitizePaymentAlertDetails(input.safeDetails)
    const now = new Date().toISOString()
    const { data: existing } = await supabase
        .from('billing_payment_alerts')
        .select('id,occurrence_count,status')
        .eq('dedupe_key', input.dedupeKey)
        .maybeSingle()

    let alertId: string | undefined
    let shouldNotify = false
    if (existing) {
        const { data, error } = await supabase
            .from('billing_payment_alerts')
            .update({
                severity: input.severity,
                title: input.title.slice(0, 160),
                message: input.message.slice(0, 1000),
                safe_details: safeDetails,
                status: 'open',
                occurrence_count: Number(existing.occurrence_count || 0) + 1,
                last_seen_at: now,
                acknowledged_by: null,
                acknowledged_at: null,
                resolved_at: null,
            })
            .eq('id', existing.id)
            .select('id')
            .single()
        if (error) throw new Error('PAYMENT_ALERT_UPDATE_FAILED')
        alertId = data.id
        shouldNotify = existing.status === 'resolved'
    } else {
        const { data, error } = await supabase
            .from('billing_payment_alerts')
            .insert({
                severity: input.severity,
                code: input.code,
                dedupe_key: input.dedupeKey,
                title: input.title.slice(0, 160),
                message: input.message.slice(0, 1000),
                order_id: input.orderId,
                attempt_id: input.attemptId,
                operation_id: input.operationId,
                safe_details: safeDetails,
            })
            .select('id')
            .single()
        if (error) {
            // A concurrent worker may have won the unique-key race. The next
            // scan will update that durable alert, so never leak the DB error.
            if (error.code === '23505') return
            throw new Error('PAYMENT_ALERT_INSERT_FAILED')
        }
        alertId = data.id
        shouldNotify = true
    }

    alertCounter.inc({ severity: input.severity, code: input.code })
    await refreshPaymentAlertMetrics()

    if (shouldNotify && alertId) {
        const { data: admins } = await supabase.from('users').select('id').eq('is_admin', true)
        if (admins?.length) {
            await supabase.from('notifications').insert(
                admins.map((admin) => ({
                    user_id: admin.id,
                    type: 'payment_alert',
                    title: input.title.slice(0, 160),
                    message: input.message.slice(0, 1000),
                    action_url: '/admin',
                    metadata: { alertId, severity: input.severity, code: input.code },
                }))
            )
        }
    }
}

export async function resolvePaymentAlertsForOperation(input: {
    operationId: string
    attemptId: string
}): Promise<void> {
    const resolvedAt = new Date().toISOString()
    const results = await Promise.all([
        supabase
            .from('billing_payment_alerts')
            .update({ status: 'resolved', resolved_at: resolvedAt })
            .eq('operation_id', input.operationId)
            .in('status', ['open', 'acknowledged']),
        supabase
            .from('billing_payment_alerts')
            .update({ status: 'resolved', resolved_at: resolvedAt })
            .eq('attempt_id', input.attemptId)
            .in('status', ['open', 'acknowledged']),
    ])
    if (results.some((result) => result.error)) {
        throw new Error('PAYMENT_ALERT_RESOLVE_FAILED')
    }
    await refreshPaymentAlertMetrics()
}
