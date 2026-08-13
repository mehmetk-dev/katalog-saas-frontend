"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshPaymentAlertMetrics = refreshPaymentAlertMetrics;
exports.recordPaymentAlert = recordPaymentAlert;
exports.resolvePaymentAlertsForOperation = resolvePaymentAlertsForOperation;
const prom_client_1 = __importDefault(require("prom-client"));
const supabase_1 = require("./supabase");
const payment_alert_sanitizer_1 = require("./payment-alert-sanitizer");
const alertCounter = prom_client_1.default.register.getSingleMetric('fogcatalog_payment_alerts_total') ||
    new prom_client_1.default.Counter({
        name: 'fogcatalog_payment_alerts_total',
        help: 'Garanti payment alerts recorded',
        labelNames: ['severity', 'code'],
    });
const openAlertGauge = prom_client_1.default.register.getSingleMetric('fogcatalog_payment_alerts_open') ||
    new prom_client_1.default.Gauge({
        name: 'fogcatalog_payment_alerts_open',
        help: 'Open or acknowledged Garanti payment alerts',
        labelNames: ['severity'],
    });
async function refreshPaymentAlertMetrics() {
    const { data, error } = await supabase_1.supabase
        .from('billing_payment_alerts')
        .select('severity')
        .in('status', ['open', 'acknowledged']);
    if (error)
        return;
    const warning = (data ?? []).filter((row) => row.severity === 'warning').length;
    const critical = (data ?? []).filter((row) => row.severity === 'critical').length;
    openAlertGauge.set({ severity: 'warning' }, warning);
    openAlertGauge.set({ severity: 'critical' }, critical);
}
async function recordPaymentAlert(input) {
    const safeDetails = (0, payment_alert_sanitizer_1.sanitizePaymentAlertDetails)(input.safeDetails);
    const now = new Date().toISOString();
    const { data: existing } = await supabase_1.supabase
        .from('billing_payment_alerts')
        .select('id,occurrence_count,status')
        .eq('dedupe_key', input.dedupeKey)
        .maybeSingle();
    let alertId;
    let shouldNotify = false;
    if (existing) {
        const { data, error } = await supabase_1.supabase
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
            .single();
        if (error)
            throw new Error('PAYMENT_ALERT_UPDATE_FAILED');
        alertId = data.id;
        shouldNotify = existing.status === 'resolved';
    }
    else {
        const { data, error } = await supabase_1.supabase
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
            .single();
        if (error) {
            // A concurrent worker may have won the unique-key race. The next
            // scan will update that durable alert, so never leak the DB error.
            if (error.code === '23505')
                return;
            throw new Error('PAYMENT_ALERT_INSERT_FAILED');
        }
        alertId = data.id;
        shouldNotify = true;
    }
    alertCounter.inc({ severity: input.severity, code: input.code });
    await refreshPaymentAlertMetrics();
    if (shouldNotify && alertId) {
        const { data: admins } = await supabase_1.supabase.from('users').select('id').eq('is_admin', true);
        if (admins?.length) {
            await supabase_1.supabase.from('notifications').insert(admins.map((admin) => ({
                user_id: admin.id,
                type: 'payment_alert',
                title: input.title.slice(0, 160),
                message: input.message.slice(0, 1000),
                action_url: '/admin',
                metadata: { alertId, severity: input.severity, code: input.code },
            })));
        }
    }
}
async function resolvePaymentAlertsForOperation(input) {
    const resolvedAt = new Date().toISOString();
    const results = await Promise.all([
        supabase_1.supabase
            .from('billing_payment_alerts')
            .update({ status: 'resolved', resolved_at: resolvedAt })
            .eq('operation_id', input.operationId)
            .in('status', ['open', 'acknowledged']),
        supabase_1.supabase
            .from('billing_payment_alerts')
            .update({ status: 'resolved', resolved_at: resolvedAt })
            .eq('attempt_id', input.attemptId)
            .in('status', ['open', 'acknowledged']),
    ]);
    if (results.some((result) => result.error)) {
        throw new Error('PAYMENT_ALERT_RESOLVE_FAILED');
    }
    await refreshPaymentAlertMetrics();
}
