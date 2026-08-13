import { recordPaymentAlert } from './payment-alerts'
import { enqueuePaymentOperation } from './payment-operation-queue'
import { supabase } from './supabase'

export async function ensurePaymentReconciliation(
    attemptId: string,
    delaySeconds = 120
): Promise<string> {
    const { data, error } = await supabase.rpc('ensure_garanti_reconciliation', {
        p_attempt_id: attemptId,
        p_delay_seconds: delaySeconds,
    })
    if (error || !data) throw new Error('PAYMENT_RECONCILIATION_CREATE_FAILED')
    const operationId = String(data)
    await enqueuePaymentOperation(operationId).catch(async () => {
        await recordPaymentAlert({
            severity: 'warning',
            code: 'PAYMENT_QUEUE_UNAVAILABLE',
            dedupeKey: `queue:${operationId}`,
            title: 'Ödeme mutabakatı kuyruğa alınamadı',
            message: 'Mutabakat kaydı oluşturuldu; worker tarayıcısı kuyruğu kontrol etmeli.',
            attemptId,
            operationId,
        }).catch(() => undefined)
    })
    return operationId
}
