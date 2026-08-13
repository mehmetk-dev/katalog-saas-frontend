"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateGarantiPayment = initiateGarantiPayment;
exports.handleGarantiPaymentCallback = handleGarantiPaymentCallback;
exports.getBillingPaymentStatus = getBillingPaymentStatus;
const crypto_1 = require("crypto");
const net_1 = require("net");
const zod_1 = require("zod");
const garanti_crypto_1 = require("../../services/payments/garanti-crypto");
const garanti_gateway_1 = require("../../services/payments/garanti-gateway");
const payment_alerts_1 = require("../../services/payment-alerts");
const payment_operations_1 = require("../../services/payment-operations");
const supabase_1 = require("../../services/supabase");
const pricing_1 = require("./pricing");
const initiateSchema = zod_1.z.object({ orderId: zod_1.z.string().uuid() }).strict();
const statusParamsSchema = zod_1.z.object({ orderId: zod_1.z.string().uuid() });
function getRequestUser(req) {
    return req.user;
}
function firstHeaderValue(value) {
    return Array.isArray(value) ? value[0] : value;
}
function getCustomerIp(req) {
    const cloudflareIp = firstHeaderValue(req.headers['cf-connecting-ip']);
    const forwardedIp = firstHeaderValue(req.headers['x-forwarded-for'])?.split(',')[0]?.trim();
    const candidates = [cloudflareIp, forwardedIp, req.ip, req.socket.remoteAddress];
    return candidates.find((candidate) => Boolean(candidate && (0, net_1.isIP)(candidate))) || '127.0.0.1';
}
function getCallbackValue(payload, name) {
    const entry = Object.entries(payload).find(([key]) => key.toLocaleLowerCase('en-US') === name.toLocaleLowerCase('en-US'));
    if (!entry || entry[1] === null || entry[1] === undefined)
        return '';
    if (Array.isArray(entry[1]))
        return String(entry[1][0] ?? '');
    return typeof entry[1] === 'string' || typeof entry[1] === 'number' ? String(entry[1]) : '';
}
function firstRow(data) {
    if (Array.isArray(data))
        return data[0] ?? null;
    return data ?? null;
}
async function initiateGarantiPayment(req, res) {
    const parsed = initiateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(422).json({
            code: 'VALIDATION_ERROR',
            error: 'Ödeme siparişi bilgisi geçersiz.',
        });
    }
    let config;
    try {
        config = (0, garanti_gateway_1.getGarantiPaymentConfig)();
    }
    catch {
        return res.status(503).json({
            code: 'PAYMENT_UNAVAILABLE',
            error: 'Banka ödeme bağlantısı yapılandırılmamış.',
        });
    }
    try {
        const user = getRequestUser(req);
        const [orderResult, detailsResult] = await Promise.all([
            supabase_1.supabase
                .from('billing_orders')
                .select('id,user_id,plan_id,billing_cycle,status,total_amount,currency,paid_at,updated_at')
                .eq('id', parsed.data.orderId)
                .eq('user_id', user.id)
                .single(),
            supabase_1.supabase
                .from('billing_order_details')
                .select('email')
                .eq('order_id', parsed.data.orderId)
                .single(),
        ]);
        if (orderResult.error || !orderResult.data || detailsResult.error || !detailsResult.data) {
            return res.status(404).json({
                code: 'BILLING_ORDER_NOT_FOUND',
                error: 'Ödeme siparişi bulunamadı.',
            });
        }
        const order = orderResult.data;
        const details = detailsResult.data;
        if (!['plus', 'pro'].includes(order.plan_id) ||
            !['monthly', 'yearly'].includes(order.billing_cycle)) {
            return res.status(409).json({
                code: 'BILLING_ORDER_INVALID',
                error: 'Ödeme siparişi kullanılamıyor.',
            });
        }
        const amounts = (0, pricing_1.getTrustedBillingAmounts)(order.plan_id, order.billing_cycle);
        const generatedProviderOrderId = (0, crypto_1.randomUUID)().replace(/-/g, '').toUpperCase();
        const { data, error } = await supabase_1.supabase.rpc('start_garanti_payment', {
            p_user_id: user.id,
            p_order_id: order.id,
            p_provider_order_id: generatedProviderOrderId,
            p_subtotal_amount: amounts.subtotal,
            p_vat_rate: amounts.vatRate,
            p_vat_amount: amounts.vat,
            p_total_amount: amounts.total,
            p_amount_minor: amounts.amountMinor,
        });
        if (error) {
            console.error('[billing] Garanti payment could not be started', { code: error.code });
            return res.status(409).json({
                code: 'PAYMENT_START_FAILED',
                error: 'Ödeme başlatılamadı. Lütfen tekrar deneyin.',
            });
        }
        const attempt = firstRow(data);
        if (!attempt) {
            return res.status(500).json({
                code: 'PAYMENT_START_FAILED',
                error: 'Ödeme başlatılamadı. Lütfen tekrar deneyin.',
            });
        }
        const customerIp = getCustomerIp(req);
        const { error: attemptContextError } = await supabase_1.supabase
            .from('billing_payment_attempts')
            .update({ customer_ip: customerIp, status: 'redirected' })
            .eq('id', attempt.attempt_id)
            .in('status', ['created', 'redirected']);
        if (attemptContextError) {
            await (0, payment_alerts_1.recordPaymentAlert)({
                severity: 'critical',
                code: 'PAYMENT_CONTEXT_SAVE_FAILED',
                dedupeKey: `payment-context:${attempt.attempt_id}`,
                title: 'Ödeme mutabakat bilgisi kaydedilemedi',
                message: 'Müşteri bankaya yönlendirilmedi; ödeme migration durumu kontrol edilmeli.',
                orderId: attempt.order_id,
                attemptId: attempt.attempt_id,
            }).catch(() => undefined);
            return res.status(503).json({
                code: 'PAYMENT_RECONCILIATION_UNAVAILABLE',
                error: 'Ödeme güvenli biçimde başlatılamadı. Lütfen daha sonra tekrar deneyin.',
            });
        }
        try {
            await (0, payment_operations_1.ensurePaymentReconciliation)(attempt.attempt_id, 120);
        }
        catch {
            await (0, payment_alerts_1.recordPaymentAlert)({
                severity: 'critical',
                code: 'PAYMENT_RECONCILIATION_CREATE_FAILED',
                dedupeKey: `reconcile-create:${attempt.attempt_id}`,
                title: 'Ödeme mutabakat kaydı oluşturulamadı',
                message: 'Müşteri bankaya yönlendirilmedi; migration ve worker yapılandırması kontrol edilmeli.',
                orderId: attempt.order_id,
                attemptId: attempt.attempt_id,
            }).catch(() => undefined);
            return res.status(503).json({
                code: 'PAYMENT_RECONCILIATION_UNAVAILABLE',
                error: 'Ödeme güvenli biçimde başlatılamadı. Lütfen daha sonra tekrar deneyin.',
            });
        }
        const form = (0, garanti_gateway_1.buildGarantiHostedPaymentForm)(config, {
            orderId: attempt.provider_order_id,
            amount: String(attempt.amount_minor),
            customerEmail: details.email,
            customerIp,
        });
        return res.status(200).json({
            payment: {
                orderId: attempt.order_id,
                status: 'payment_pending',
                form,
            },
        });
    }
    catch {
        return res.status(500).json({
            code: 'PAYMENT_START_FAILED',
            error: 'Ödeme başlatılamadı. Lütfen tekrar deneyin.',
        });
    }
}
async function handleGarantiPaymentCallback(req, res) {
    let config;
    try {
        config = (0, garanti_gateway_1.getGarantiPaymentConfig)();
    }
    catch {
        return res.status(503).send('Payment service unavailable');
    }
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).send('Invalid payment callback');
    }
    const payload = req.body;
    const providerOrderId = getCallbackValue(payload, 'oid');
    if (!/^[A-Za-z0-9_-]{8,36}$/.test(providerOrderId)) {
        return res.status(400).send('Invalid payment callback');
    }
    try {
        const { data, error } = await supabase_1.supabase
            .from('billing_payment_attempts')
            .select('id,order_id,user_id,provider_order_id,amount_minor,currency_code,status')
            .eq('provider', 'garanti_bbva')
            .eq('provider_order_id', providerOrderId)
            .single();
        if (error || !data) {
            return res.status(404).send('Payment attempt not found');
        }
        const attempt = data;
        const hashValid = (0, garanti_crypto_1.verifyGarantiCallbackHash)(payload, config.storeKey);
        const result = (0, garanti_crypto_1.classifyGarantiCallback)(payload, {
            orderId: attempt.provider_order_id,
            amount: String(attempt.amount_minor),
            currencyCode: attempt.currency_code,
            terminalId: config.terminalId,
        }, hashValid);
        const redirectUrl = (0, garanti_gateway_1.buildGarantiPaymentResultUrl)(config, attempt.order_id);
        if (result.status === 'invalid') {
            console.warn('[billing] Invalid Garanti callback rejected', { reason: result.reason });
            await (0, payment_operations_1.ensurePaymentReconciliation)(attempt.id, 0).catch(() => undefined);
            await (0, payment_alerts_1.recordPaymentAlert)({
                severity: 'critical',
                code: 'PAYMENT_CALLBACK_INVALID',
                dedupeKey: `callback-invalid:${attempt.id}`,
                title: 'Garanti ödeme callback doğrulanamadı',
                message: 'Callback ile ödeme kesinleştirilmedi; banka sipariş sorgusu devreye alındı.',
                orderId: attempt.order_id,
                attemptId: attempt.id,
                safeDetails: { reason: result.reason },
            }).catch(() => undefined);
            return res.redirect(303, redirectUrl);
        }
        const bankReference = getCallbackValue(payload, 'retrefnum') ||
            getCallbackValue(payload, 'hostrefnum') ||
            attempt.provider_order_id;
        const { error: finalizeError } = await supabase_1.supabase.rpc('finalize_garanti_payment', {
            p_attempt_id: attempt.id,
            p_result_status: result.status,
            p_bank_response_code: getCallbackValue(payload, 'procreturncode'),
            p_bank_reference_number: bankReference,
            p_authorization_code: getCallbackValue(payload, 'authcode'),
        });
        if (finalizeError) {
            console.error('[billing] Garanti callback could not be finalized', {
                code: finalizeError.code,
            });
            await (0, payment_operations_1.ensurePaymentReconciliation)(attempt.id, 0).catch(() => undefined);
            await (0, payment_alerts_1.recordPaymentAlert)({
                severity: 'critical',
                code: 'PAYMENT_CALLBACK_FINALIZE_FAILED',
                dedupeKey: `callback-finalize:${attempt.id}`,
                title: 'Garanti callback veritabanına işlenemedi',
                message: 'Banka sonucu yeniden sorgulanacak; sipariş henüz kesinleştirilmedi.',
                orderId: attempt.order_id,
                attemptId: attempt.id,
                safeDetails: { databaseCode: finalizeError.code },
            }).catch(() => undefined);
        }
        return res.redirect(303, redirectUrl);
    }
    catch {
        return res.status(500).send('Payment callback could not be processed');
    }
}
async function getBillingPaymentStatus(req, res) {
    const parsed = statusParamsSchema.safeParse(req.params);
    if (!parsed.success) {
        return res.status(422).json({
            code: 'VALIDATION_ERROR',
            error: 'Ödeme siparişi bilgisi geçersiz.',
        });
    }
    try {
        const user = getRequestUser(req);
        const { data, error } = await supabase_1.supabase
            .from('billing_orders')
            .select('id,user_id,plan_id,billing_cycle,status,total_amount,currency,paid_at,updated_at')
            .eq('id', parsed.data.orderId)
            .eq('user_id', user.id)
            .single();
        if (error || !data) {
            return res.status(404).json({
                code: 'BILLING_ORDER_NOT_FOUND',
                error: 'Ödeme siparişi bulunamadı.',
            });
        }
        const order = data;
        return res.status(200).json({
            payment: {
                orderId: order.id,
                status: order.status,
                planId: order.plan_id,
                billingCycle: order.billing_cycle,
                total: order.total_amount === null ? null : Number(order.total_amount),
                currency: order.currency,
                paidAt: order.paid_at,
                updatedAt: order.updated_at,
            },
        });
    }
    catch {
        return res.status(500).json({
            code: 'PAYMENT_STATUS_FAILED',
            error: 'Ödeme durumu alınamadı.',
        });
    }
}
