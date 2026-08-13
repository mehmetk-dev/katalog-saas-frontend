"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensurePaymentReconciliation = ensurePaymentReconciliation;
const payment_alerts_1 = require("./payment-alerts");
const payment_operation_queue_1 = require("./payment-operation-queue");
const supabase_1 = require("./supabase");
async function ensurePaymentReconciliation(attemptId, delaySeconds = 120) {
    const { data, error } = await supabase_1.supabase.rpc('ensure_garanti_reconciliation', {
        p_attempt_id: attemptId,
        p_delay_seconds: delaySeconds,
    });
    if (error || !data)
        throw new Error('PAYMENT_RECONCILIATION_CREATE_FAILED');
    const operationId = String(data);
    await (0, payment_operation_queue_1.enqueuePaymentOperation)(operationId).catch(async () => {
        await (0, payment_alerts_1.recordPaymentAlert)({
            severity: 'warning',
            code: 'PAYMENT_QUEUE_UNAVAILABLE',
            dedupeKey: `queue:${operationId}`,
            title: 'Ödeme mutabakatı kuyruğa alınamadı',
            message: 'Mutabakat kaydı oluşturuldu; worker tarayıcısı kuyruğu kontrol etmeli.',
            attemptId,
            operationId,
        }).catch(() => undefined);
    });
    return operationId;
}
