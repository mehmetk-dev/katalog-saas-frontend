"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const payment_operation_queue_1 = require("../services/payment-operation-queue");
const payment_alerts_1 = require("../services/payment-alerts");
const garanti_vp_client_1 = require("../services/payments/garanti-vp-client");
const supabase_1 = require("../services/supabase");
// The first operation is due at T+2m. Subsequent values are intervals that
// produce absolute attempts at T+5m, T+15m and T+60m.
const RECONCILIATION_DELAYS_SECONDS = [120, 180, 600, 2700];
const VERIFICATION_DELAYS_SECONDS = [120, 300, 900, 1800, 3600, 7200];
function safeErrorCode(error) {
    if (error instanceof garanti_vp_client_1.GarantiVpError)
        return `GARANTI_${error.kind.toUpperCase()}`;
    return 'PAYMENT_WORKER_ERROR';
}
async function patchOperation(id, patch) {
    const { error } = await supabase_1.supabase.from('billing_payment_operations').update(patch).eq('id', id);
    if (error)
        throw new Error('PAYMENT_OPERATION_UPDATE_FAILED');
}
async function claimOperation(operationId) {
    const { data: current, error } = await supabase_1.supabase
        .from('billing_payment_operations')
        .select('id,order_id,attempt_id,operation_type,status,requested_amount_minor,retry_count,next_retry_at')
        .eq('id', operationId)
        .single();
    if (error || !current)
        return null;
    const operation = current;
    if (['succeeded', 'declined', 'manual_review', 'failed'].includes(operation.status))
        return null;
    if (operation.next_retry_at &&
        new Date(operation.next_retry_at).getTime() > Date.now() + 1000) {
        return null;
    }
    const { data, error: claimError } = await supabase_1.supabase
        .from('billing_payment_operations')
        .update({ status: 'processing', processing_started_at: new Date().toISOString() })
        .eq('id', operation.id)
        .eq('status', operation.status)
        .select('id,order_id,attempt_id,operation_type,status,requested_amount_minor,retry_count,next_retry_at')
        .maybeSingle();
    if (claimError || !data)
        return null;
    return { operation: data, previousStatus: operation.status };
}
async function loadBankInput(operation) {
    const [attemptResult, detailsResult] = await Promise.all([
        supabase_1.supabase
            .from('billing_payment_attempts')
            .select('id,provider_order_id,amount_minor,currency_code,bank_reference_number,customer_ip')
            .eq('id', operation.attempt_id)
            .single(),
        supabase_1.supabase
            .from('billing_order_details')
            .select('email')
            .eq('order_id', operation.order_id)
            .single(),
    ]);
    if (attemptResult.error || !attemptResult.data || detailsResult.error || !detailsResult.data) {
        throw new Error('PAYMENT_OPERATION_CONTEXT_MISSING');
    }
    const attempt = attemptResult.data;
    if (!attempt.customer_ip)
        throw new Error('PAYMENT_CUSTOMER_IP_MISSING');
    return {
        attempt: attempt,
        customerEmail: String(detailsResult.data.email),
    };
}
async function moveToManualReview(operation, code, message, severity = 'critical') {
    await patchOperation(operation.id, {
        status: 'manual_review',
        next_retry_at: null,
        completed_at: new Date().toISOString(),
        last_error_code: code,
    });
    await supabase_1.supabase
        .from('billing_payment_attempts')
        .update({ status: 'manual_review' })
        .eq('id', operation.attempt_id);
    await (0, payment_alerts_1.recordPaymentAlert)({
        severity,
        code,
        dedupeKey: `${code}:${operation.id}`,
        title: 'Ödeme işlemi manuel kontrol bekliyor',
        message,
        orderId: operation.order_id,
        attemptId: operation.attempt_id,
        operationId: operation.id,
        safeDetails: { operationType: operation.operation_type },
    }).catch(() => undefined);
}
async function scheduleReadOnlyRetry(operation, kind, errorCode) {
    const delays = kind === 'reconciliation' ? RECONCILIATION_DELAYS_SECONDS : VERIFICATION_DELAYS_SECONDS;
    const retryCount = operation.retry_count + 1;
    if (retryCount >= delays.length) {
        return moveToManualReview(operation, kind === 'reconciliation'
            ? 'PAYMENT_RECONCILIATION_EXHAUSTED'
            : 'PAYMENT_REVERSAL_VERIFICATION_EXHAUSTED', kind === 'reconciliation'
            ? 'Banka sipariş durumu otomatik denemeler sonunda kesinleştirilemedi.'
            : 'İptal/iade sonucu sipariş geçmişinden kesinleştirilemedi.');
    }
    await patchOperation(operation.id, {
        status: kind === 'verification' ? 'verification_pending' : 'retry_scheduled',
        retry_count: retryCount,
        next_retry_at: new Date(Date.now() + delays[retryCount] * 1000).toISOString(),
        processing_started_at: null,
        last_error_code: errorCode,
    });
    if (kind === 'reconciliation' && retryCount >= 2) {
        await (0, payment_alerts_1.recordPaymentAlert)({
            severity: 'warning',
            code: 'PAYMENT_PENDING_OVER_5_MINUTES',
            dedupeKey: `payment-pending:${operation.id}`,
            title: 'Ödeme 5 dakikadan uzun süredir bekliyor',
            message: 'Banka sipariş sorgusu kesin sonuç vermedi; otomatik mutabakat devam ediyor.',
            orderId: operation.order_id,
            attemptId: operation.attempt_id,
            operationId: operation.id,
            safeDetails: { retryCount, errorCode },
        }).catch(() => undefined);
    }
}
async function processReconciliation(operation) {
    const config = (0, garanti_vp_client_1.getGarantiVpConfig)();
    const client = (0, garanti_vp_client_1.createGarantiVpClient)(config);
    const { attempt, customerEmail } = await loadBankInput(operation);
    const response = await client.orderInquiry({
        orderId: attempt.provider_order_id,
        amount: String(attempt.amount_minor),
        currencyCode: attempt.currency_code,
        customerEmail,
        customerIp: attempt.customer_ip,
    });
    const classification = (0, garanti_vp_client_1.classifyGarantiOrderInquiry)(response, {
        orderId: attempt.provider_order_id,
        amount: String(attempt.amount_minor),
        terminalId: config.terminalId,
        merchantId: config.merchantId,
    });
    if (classification.status === 'mismatch') {
        return moveToManualReview(operation, 'PAYMENT_RECONCILIATION_MISMATCH', 'Banka yanıtı sipariş, terminal, işyeri veya tutar bilgisiyle eşleşmedi.');
    }
    if (classification.status === 'unknown') {
        return scheduleReadOnlyRetry(operation, 'reconciliation', 'PAYMENT_RECONCILIATION_UNKNOWN');
    }
    const { error } = await supabase_1.supabase.rpc('complete_garanti_reconciliation', {
        p_operation_id: operation.id,
        p_result_status: classification.status,
        p_bank_response_code: classification.status === 'approved' ? '00' : classification.bankCode,
        p_bank_reference_number: classification.status === 'approved' ? classification.bankReferenceNumber : '',
        p_authorization_code: classification.status === 'approved' ? classification.authorizationCode : '',
    });
    if (error)
        throw new Error('PAYMENT_RECONCILIATION_FINALIZE_FAILED');
    await (0, payment_alerts_1.resolvePaymentAlertsForOperation)({
        operationId: operation.id,
        attemptId: operation.attempt_id,
    }).catch(() => undefined);
}
async function verifyReversal(operation, attempt, customerEmail) {
    const config = (0, garanti_vp_client_1.getGarantiVpConfig)();
    const response = await (0, garanti_vp_client_1.createGarantiVpClient)(config).orderHistoryInquiry({
        orderId: attempt.provider_order_id,
        amount: String(operation.requested_amount_minor),
        currencyCode: attempt.currency_code,
        customerEmail,
        customerIp: attempt.customer_ip,
    });
    const confirmed = (0, garanti_vp_client_1.findConfirmedGarantiReversal)(response, {
        type: operation.operation_type,
        amount: String(operation.requested_amount_minor),
    });
    if (!confirmed) {
        return scheduleReadOnlyRetry(operation, 'verification', 'PAYMENT_REVERSAL_NOT_CONFIRMED');
    }
    const { error } = await supabase_1.supabase.rpc('complete_garanti_reversal', {
        p_operation_id: operation.id,
        p_bank_response_code: confirmed.returnCode || '00',
        p_bank_reference_number: confirmed.retrefNum,
        p_authorization_code: confirmed.authCode,
    });
    if (error)
        throw new Error('PAYMENT_REVERSAL_FINALIZE_FAILED');
    await (0, payment_alerts_1.resolvePaymentAlertsForOperation)({
        operationId: operation.id,
        attemptId: operation.attempt_id,
    }).catch(() => undefined);
}
async function processReversal(operation, previousStatus) {
    const { attempt, customerEmail } = await loadBankInput(operation);
    if (previousStatus === 'verification_pending') {
        return verifyReversal(operation, attempt, customerEmail);
    }
    const config = (0, garanti_vp_client_1.getGarantiVpConfig)();
    const client = (0, garanti_vp_client_1.createGarantiVpClient)(config);
    const input = {
        orderId: attempt.provider_order_id,
        amount: String(operation.requested_amount_minor),
        currencyCode: attempt.currency_code,
        customerEmail,
        customerIp: attempt.customer_ip,
        originalRetrefNum: attempt.bank_reference_number ?? undefined,
    };
    const response = operation.operation_type === 'void'
        ? await client.voidPayment(input)
        : await client.refundPayment(input);
    if (response.responseCode !== '00') {
        await patchOperation(operation.id, {
            status: 'declined',
            bank_response_code: response.responseCode || null,
            bank_reason_code: response.reasonCode || null,
            completed_at: new Date().toISOString(),
            next_retry_at: null,
            last_error_code: 'PAYMENT_REVERSAL_DECLINED',
        });
        await (0, payment_alerts_1.recordPaymentAlert)({
            severity: 'warning',
            code: 'PAYMENT_REVERSAL_DECLINED',
            dedupeKey: `reversal-declined:${operation.id}`,
            title: 'Banka iptal/iade isteğini reddetti',
            message: 'Sipariş durumu değiştirilmedi. Banka kodu yönetim ekranından incelenmeli.',
            orderId: operation.order_id,
            operationId: operation.id,
            safeDetails: { bankCode: response.responseCode, reasonCode: response.reasonCode },
        }).catch(() => undefined);
        return;
    }
    const { error } = await supabase_1.supabase.rpc('complete_garanti_reversal', {
        p_operation_id: operation.id,
        p_bank_response_code: response.responseCode,
        p_bank_reference_number: response.bankReferenceNumber,
        p_authorization_code: response.authorizationCode,
    });
    if (error)
        throw new Error('PAYMENT_REVERSAL_FINALIZE_FAILED');
    await (0, payment_alerts_1.resolvePaymentAlertsForOperation)({
        operationId: operation.id,
        attemptId: operation.attempt_id,
    }).catch(() => undefined);
}
async function processOperation(job) {
    const claimed = await claimOperation(job.data.operationId);
    if (!claimed)
        return;
    const { operation, previousStatus } = claimed;
    try {
        if (operation.operation_type === 'reconciliation') {
            await processReconciliation(operation);
        }
        else {
            await processReversal(operation, previousStatus);
        }
    }
    catch (error) {
        const code = safeErrorCode(error);
        if (operation.operation_type === 'reconciliation') {
            await scheduleReadOnlyRetry(operation, 'reconciliation', code);
        }
        else {
            // A timeout/network/finalization crash after sending a money mutation is
            // ambiguous. Never resend it; subsequent runs perform history inquiry only.
            await patchOperation(operation.id, {
                status: 'verification_pending',
                retry_count: operation.retry_count + 1,
                next_retry_at: new Date(Date.now() + 120000).toISOString(),
                processing_started_at: null,
                last_error_code: code,
            });
            await (0, payment_alerts_1.recordPaymentAlert)({
                severity: 'critical',
                code: 'PAYMENT_REVERSAL_AMBIGUOUS',
                dedupeKey: `reversal-ambiguous:${operation.id}`,
                title: 'İptal/iade sonucu belirsiz',
                message: 'Aynı finansal istek tekrar gönderilmeyecek; worker sipariş geçmişiyle doğrulayacak.',
                orderId: operation.order_id,
                operationId: operation.id,
                safeDetails: { errorCode: code, operationType: operation.operation_type },
            }).catch(() => undefined);
        }
    }
}
async function scanDueOperations() {
    const now = new Date().toISOString();
    const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: stale } = await supabase_1.supabase
        .from('billing_payment_operations')
        .select('id,order_id,attempt_id,operation_type')
        .eq('status', 'processing')
        .lt('processing_started_at', staleBefore)
        .limit(100);
    for (const row of stale ?? []) {
        await supabase_1.supabase
            .from('billing_payment_operations')
            .update({
            status: row.operation_type === 'reconciliation'
                ? 'retry_scheduled'
                : 'verification_pending',
            next_retry_at: now,
            processing_started_at: null,
            last_error_code: 'PAYMENT_OPERATION_STALE',
        })
            .eq('id', row.id)
            .eq('status', 'processing');
        await (0, payment_alerts_1.recordPaymentAlert)({
            severity: 'critical',
            code: 'PAYMENT_OPERATION_STALE',
            dedupeKey: `operation-stale:${row.id}`,
            title: 'Ödeme operasyonu yarım kaldı',
            message: 'Worker yarım kalan işlemi güvenli doğrulama akışına aldı.',
            orderId: row.order_id,
            attemptId: row.attempt_id,
            operationId: row.id,
            safeDetails: { operationType: row.operation_type },
        }).catch(() => undefined);
    }
    // Safety net: a callback or API crash cannot leave a pending payment without
    // a bank inquiry operation.
    const pendingBefore = new Date(Date.now() - 120000).toISOString();
    const { data: pendingAttempts } = await supabase_1.supabase
        .from('billing_payment_attempts')
        .select('id')
        .in('status', ['created', 'redirected', 'callback_received', 'unknown'])
        .lt('created_at', pendingBefore)
        .limit(100);
    for (const attempt of pendingAttempts ?? []) {
        const { data } = await supabase_1.supabase.rpc('ensure_garanti_reconciliation', {
            p_attempt_id: attempt.id,
            p_delay_seconds: 0,
        });
        if (data)
            await (0, payment_operation_queue_1.enqueuePaymentOperation)(String(data));
    }
    const { data: due } = await supabase_1.supabase
        .from('billing_payment_operations')
        .select('id')
        .in('status', ['queued', 'retry_scheduled', 'verification_pending'])
        .lte('next_retry_at', now)
        .order('next_retry_at', { ascending: true })
        .limit(100);
    for (const operation of due ?? [])
        await (0, payment_operation_queue_1.enqueuePaymentOperation)(operation.id);
}
async function startPaymentWorker() {
    if (process.env.GARANTI_OPERATIONS_ENABLED !== 'true') {
        console.log('[payment-worker] disabled by GARANTI_OPERATIONS_ENABLED');
        const idleTimer = setInterval(() => undefined, 60 * 60 * 1000);
        const stopIdle = () => {
            clearInterval(idleTimer);
            process.exit(0);
        };
        process.on('SIGTERM', stopIdle);
        process.on('SIGINT', stopIdle);
        return;
    }
    (0, garanti_vp_client_1.getGarantiVpConfig)();
    const worker = (0, payment_operation_queue_1.createPaymentOperationWorker)(processOperation);
    const intervalValue = Number(process.env.GARANTI_RECONCILIATION_SCAN_INTERVAL_MS || 30000);
    const scanInterval = Number.isInteger(intervalValue) && intervalValue >= 5000 && intervalValue <= 300000
        ? intervalValue
        : 30000;
    worker.on('completed', (job) => console.log(`[payment-worker] completed ${job.id}`));
    worker.on('failed', (job) => console.error(`[payment-worker] failed ${job?.id}`));
    async function scan() {
        try {
            await scanDueOperations();
            await (0, payment_alerts_1.refreshPaymentAlertMetrics)();
        }
        catch {
            console.error('[payment-worker] scanner failed');
        }
    }
    const timer = setInterval(() => void scan(), scanInterval);
    void scan();
    async function shutdown() {
        clearInterval(timer);
        await worker.close();
        process.exit(0);
    }
    process.on('SIGTERM', () => void shutdown());
    process.on('SIGINT', () => void shutdown());
}
void startPaymentWorker();
