import type { Request, Response } from 'express'
import { z } from 'zod'

import { getAdminUser } from '../middlewares/admin'
import { refreshPaymentAlertMetrics, recordPaymentAlert } from '../services/payment-alerts'
import { enqueuePaymentOperation } from '../services/payment-operation-queue'
import { supabase } from '../services/supabase'

const uuid = z.string().uuid()
const listSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    status: z.string().trim().max(40).optional(),
})
const reversalSchema = z
    .object({
        amountMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
        reason: z.string().trim().min(3).max(500),
    })
    .strict()

function firstRow<T>(value: unknown): T | null {
    return Array.isArray(value) ? ((value[0] as T | undefined) ?? null) : ((value as T) ?? null)
}

export async function listPaymentOrders(req: Request, res: Response) {
    const parsed = listSchema.safeParse(req.query)
    if (!parsed.success) return res.status(422).json({ code: 'VALIDATION_ERROR' })
    let query = supabase
        .from('billing_orders')
        .select(
            'id,user_id,plan_id,billing_cycle,status,total_amount,currency,refunded_amount_minor,payment_provider,provider_payment_id,paid_at,reversed_at,created_at,updated_at'
        )
        .order('created_at', { ascending: false })
        .limit(parsed.data.limit)
    if (parsed.data.status) query = query.eq('status', parsed.data.status)
    const { data, error } = await query
    if (error) return res.status(500).json({ code: 'PAYMENT_ORDERS_LIST_FAILED' })
    return res.json({ orders: data ?? [] })
}

export async function listPaymentOperations(req: Request, res: Response) {
    const parsed = listSchema.safeParse(req.query)
    if (!parsed.success) return res.status(422).json({ code: 'VALIDATION_ERROR' })
    let query = supabase
        .from('billing_payment_operations')
        .select(
            'id,order_id,attempt_id,requested_by,operation_type,status,requested_amount_minor,currency_code,reason,bank_response_code,bank_reason_code,retry_count,next_retry_at,processing_started_at,completed_at,last_error_code,created_at,updated_at'
        )
        .order('created_at', { ascending: false })
        .limit(parsed.data.limit)
    if (parsed.data.status) query = query.eq('status', parsed.data.status)
    const { data, error } = await query
    if (error) return res.status(500).json({ code: 'PAYMENT_OPERATIONS_LIST_FAILED' })
    return res.json({ operations: data ?? [] })
}

export async function listPaymentAlerts(req: Request, res: Response) {
    const parsed = listSchema.safeParse(req.query)
    if (!parsed.success) return res.status(422).json({ code: 'VALIDATION_ERROR' })
    let query = supabase
        .from('billing_payment_alerts')
        .select(
            'id,order_id,attempt_id,operation_id,severity,code,title,message,safe_details,status,occurrence_count,first_seen_at,last_seen_at,acknowledged_by,acknowledged_at,resolved_at'
        )
        .order('last_seen_at', { ascending: false })
        .limit(parsed.data.limit)
    if (parsed.data.status) query = query.eq('status', parsed.data.status)
    const { data, error } = await query
    if (error) return res.status(500).json({ code: 'PAYMENT_ALERTS_LIST_FAILED' })
    return res.json({ alerts: data ?? [] })
}

export async function reconcilePaymentAttempt(req: Request, res: Response) {
    const parsed = uuid.safeParse(req.params.attemptId)
    if (!parsed.success) return res.status(422).json({ code: 'VALIDATION_ERROR' })
    const { data, error } = await supabase.rpc('ensure_garanti_reconciliation', {
        p_attempt_id: parsed.data,
        p_delay_seconds: 0,
    })
    if (error || !data) return res.status(409).json({ code: 'RECONCILIATION_CREATE_FAILED' })
    const operationId = String(data)
    await enqueuePaymentOperation(operationId).catch(async () => {
        await recordPaymentAlert({
            severity: 'warning',
            code: 'PAYMENT_QUEUE_UNAVAILABLE',
            dedupeKey: `queue:${operationId}`,
            title: 'Ödeme mutabakatı kuyruğa alınamadı',
            message: 'İşlem veritabanında bekliyor; worker kuyruğu kontrol edilmeli.',
            operationId,
        }).catch(() => undefined)
    })
    return res.status(202).json({ operation: { id: operationId, status: 'queued' } })
}

export async function createPaymentReversal(req: Request, res: Response) {
    const orderId = uuid.safeParse(req.params.orderId)
    const body = reversalSchema.safeParse(req.body)
    const rawIdempotency = req.header('Idempotency-Key')?.trim()
    const idempotency = z.string().min(8).max(128).safeParse(rawIdempotency)
    const admin = getAdminUser(req)
    if (!orderId.success || !body.success || !idempotency.success || !admin) {
        return res.status(422).json({
            code: 'VALIDATION_ERROR',
            error: 'Tutar, gerekçe ve Idempotency-Key zorunludur.',
        })
    }

    const { data, error } = await supabase.rpc('create_garanti_reversal_operation', {
        p_order_id: orderId.data,
        p_requested_by: admin.id,
        p_amount_minor: body.data.amountMinor,
        p_reason: body.data.reason,
        p_idempotency_key: idempotency.data,
    })
    if (error) {
        return res.status(409).json({
            code: 'PAYMENT_REVERSAL_REJECTED',
            error: 'İptal/iade isteği oluşturulamadı. Sipariş durumu ve kalan tutarı kontrol edin.',
        })
    }
    const operation = firstRow<{
        operation_id: string
        operation_type: 'void' | 'refund'
        operation_status: string
        reused: boolean
    }>(data)
    if (!operation) return res.status(500).json({ code: 'PAYMENT_REVERSAL_CREATE_FAILED' })
    await enqueuePaymentOperation(operation.operation_id).catch(async () => {
        await recordPaymentAlert({
            severity: 'critical',
            code: 'PAYMENT_REVERSAL_QUEUE_UNAVAILABLE',
            dedupeKey: `queue:${operation.operation_id}`,
            title: 'İptal/iade kuyruğa alınamadı',
            message: 'Finansal işlem veritabanında bekliyor; worker acilen kontrol edilmeli.',
            orderId: orderId.data,
            operationId: operation.operation_id,
        }).catch(() => undefined)
    })
    return res.status(operation.reused ? 200 : 202).json({
        operation: {
            id: operation.operation_id,
            type: operation.operation_type,
            status: operation.operation_status,
            reused: operation.reused,
        },
    })
}

export async function acknowledgePaymentAlert(req: Request, res: Response) {
    const alertId = uuid.safeParse(req.params.alertId)
    const admin = getAdminUser(req)
    if (!alertId.success || !admin) return res.status(422).json({ code: 'VALIDATION_ERROR' })
    const { error } = await supabase.rpc('acknowledge_billing_payment_alert', {
        p_alert_id: alertId.data,
        p_admin_user_id: admin.id,
    })
    if (error) return res.status(404).json({ code: 'PAYMENT_ALERT_NOT_FOUND' })
    await refreshPaymentAlertMetrics()
    return res.json({ success: true })
}
