"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPaymentOrders = listPaymentOrders;
exports.listPaymentOperations = listPaymentOperations;
exports.listPaymentAlerts = listPaymentAlerts;
exports.reconcilePaymentAttempt = reconcilePaymentAttempt;
exports.createPaymentReversal = createPaymentReversal;
exports.acknowledgePaymentAlert = acknowledgePaymentAlert;
const zod_1 = require("zod");
const admin_1 = require("../middlewares/admin");
const payment_alerts_1 = require("../services/payment-alerts");
const payment_operation_queue_1 = require("../services/payment-operation-queue");
const supabase_1 = require("../services/supabase");
const uuid = zod_1.z.string().uuid();
const listSchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
    status: zod_1.z.string().trim().max(40).optional(),
});
const reversalSchema = zod_1.z
    .object({
    amountMinor: zod_1.z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    reason: zod_1.z.string().trim().min(3).max(500),
})
    .strict();
function firstRow(value) {
    return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}
async function listPaymentOrders(req, res) {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success)
        return res.status(422).json({ code: 'VALIDATION_ERROR' });
    let query = supabase_1.supabase
        .from('billing_orders')
        .select('id,user_id,plan_id,billing_cycle,status,total_amount,currency,refunded_amount_minor,payment_provider,provider_payment_id,paid_at,reversed_at,created_at,updated_at')
        .order('created_at', { ascending: false })
        .limit(parsed.data.limit);
    if (parsed.data.status)
        query = query.eq('status', parsed.data.status);
    const { data, error } = await query;
    if (error)
        return res.status(500).json({ code: 'PAYMENT_ORDERS_LIST_FAILED' });
    return res.json({ orders: data ?? [] });
}
async function listPaymentOperations(req, res) {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success)
        return res.status(422).json({ code: 'VALIDATION_ERROR' });
    let query = supabase_1.supabase
        .from('billing_payment_operations')
        .select('id,order_id,attempt_id,requested_by,operation_type,status,requested_amount_minor,currency_code,reason,bank_response_code,bank_reason_code,retry_count,next_retry_at,processing_started_at,completed_at,last_error_code,created_at,updated_at')
        .order('created_at', { ascending: false })
        .limit(parsed.data.limit);
    if (parsed.data.status)
        query = query.eq('status', parsed.data.status);
    const { data, error } = await query;
    if (error)
        return res.status(500).json({ code: 'PAYMENT_OPERATIONS_LIST_FAILED' });
    return res.json({ operations: data ?? [] });
}
async function listPaymentAlerts(req, res) {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success)
        return res.status(422).json({ code: 'VALIDATION_ERROR' });
    let query = supabase_1.supabase
        .from('billing_payment_alerts')
        .select('id,order_id,attempt_id,operation_id,severity,code,title,message,safe_details,status,occurrence_count,first_seen_at,last_seen_at,acknowledged_by,acknowledged_at,resolved_at')
        .order('last_seen_at', { ascending: false })
        .limit(parsed.data.limit);
    if (parsed.data.status)
        query = query.eq('status', parsed.data.status);
    const { data, error } = await query;
    if (error)
        return res.status(500).json({ code: 'PAYMENT_ALERTS_LIST_FAILED' });
    return res.json({ alerts: data ?? [] });
}
async function reconcilePaymentAttempt(req, res) {
    const parsed = uuid.safeParse(req.params.attemptId);
    if (!parsed.success)
        return res.status(422).json({ code: 'VALIDATION_ERROR' });
    const { data, error } = await supabase_1.supabase.rpc('ensure_garanti_reconciliation', {
        p_attempt_id: parsed.data,
        p_delay_seconds: 0,
    });
    if (error || !data)
        return res.status(409).json({ code: 'RECONCILIATION_CREATE_FAILED' });
    const operationId = String(data);
    await (0, payment_operation_queue_1.enqueuePaymentOperation)(operationId).catch(async () => {
        await (0, payment_alerts_1.recordPaymentAlert)({
            severity: 'warning',
            code: 'PAYMENT_QUEUE_UNAVAILABLE',
            dedupeKey: `queue:${operationId}`,
            title: 'Ödeme mutabakatı kuyruğa alınamadı',
            message: 'İşlem veritabanında bekliyor; worker kuyruğu kontrol edilmeli.',
            operationId,
        }).catch(() => undefined);
    });
    return res.status(202).json({ operation: { id: operationId, status: 'queued' } });
}
async function createPaymentReversal(req, res) {
    const orderId = uuid.safeParse(req.params.orderId);
    const body = reversalSchema.safeParse(req.body);
    const rawIdempotency = req.header('Idempotency-Key')?.trim();
    const idempotency = zod_1.z.string().min(8).max(128).safeParse(rawIdempotency);
    const admin = (0, admin_1.getAdminUser)(req);
    if (!orderId.success || !body.success || !idempotency.success || !admin) {
        return res.status(422).json({
            code: 'VALIDATION_ERROR',
            error: 'Tutar, gerekçe ve Idempotency-Key zorunludur.',
        });
    }
    const { data, error } = await supabase_1.supabase.rpc('create_garanti_reversal_operation', {
        p_order_id: orderId.data,
        p_requested_by: admin.id,
        p_amount_minor: body.data.amountMinor,
        p_reason: body.data.reason,
        p_idempotency_key: idempotency.data,
    });
    if (error) {
        return res.status(409).json({
            code: 'PAYMENT_REVERSAL_REJECTED',
            error: 'İptal/iade isteği oluşturulamadı. Sipariş durumu ve kalan tutarı kontrol edin.',
        });
    }
    const operation = firstRow(data);
    if (!operation)
        return res.status(500).json({ code: 'PAYMENT_REVERSAL_CREATE_FAILED' });
    await (0, payment_operation_queue_1.enqueuePaymentOperation)(operation.operation_id).catch(async () => {
        await (0, payment_alerts_1.recordPaymentAlert)({
            severity: 'critical',
            code: 'PAYMENT_REVERSAL_QUEUE_UNAVAILABLE',
            dedupeKey: `queue:${operation.operation_id}`,
            title: 'İptal/iade kuyruğa alınamadı',
            message: 'Finansal işlem veritabanında bekliyor; worker acilen kontrol edilmeli.',
            orderId: orderId.data,
            operationId: operation.operation_id,
        }).catch(() => undefined);
    });
    return res.status(operation.reused ? 200 : 202).json({
        operation: {
            id: operation.operation_id,
            type: operation.operation_type,
            status: operation.operation_status,
            reused: operation.reused,
        },
    });
}
async function acknowledgePaymentAlert(req, res) {
    const alertId = uuid.safeParse(req.params.alertId);
    const admin = (0, admin_1.getAdminUser)(req);
    if (!alertId.success || !admin)
        return res.status(422).json({ code: 'VALIDATION_ERROR' });
    const { error } = await supabase_1.supabase.rpc('acknowledge_billing_payment_alert', {
        p_alert_id: alertId.data,
        p_admin_user_id: admin.id,
    });
    if (error)
        return res.status(404).json({ code: 'PAYMENT_ALERT_NOT_FOUND' });
    await (0, payment_alerts_1.refreshPaymentAlertMetrics)();
    return res.json({ success: true });
}
