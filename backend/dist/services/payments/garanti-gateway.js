"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGarantiPaymentConfig = parseGarantiPaymentConfig;
exports.buildGarantiPaymentResultUrl = buildGarantiPaymentResultUrl;
exports.getGarantiPaymentConfig = getGarantiPaymentConfig;
exports.buildGarantiHostedPaymentForm = buildGarantiHostedPaymentForm;
const zod_1 = require("zod");
const garanti_crypto_1 = require("./garanti-crypto");
const httpsUrl = zod_1.z
    .string()
    .url()
    .refine((value) => new URL(value).protocol === 'https:');
const configSchema = zod_1.z.object({
    GARANTI_POS_ENABLED: zod_1.z.literal('true'),
    GARANTI_POS_MODE: zod_1.z.enum(['TEST', 'PROD']),
    GARANTI_POS_API_VERSION: zod_1.z.literal('512'),
    GARANTI_POS_MERCHANT_ID: zod_1.z.string().trim().min(1).max(32),
    GARANTI_POS_TERMINAL_ID: zod_1.z
        .string()
        .trim()
        .regex(/^\d{8}$/),
    GARANTI_POS_TERMINAL_USER_ID: zod_1.z.string().trim().min(1).max(64),
    GARANTI_POS_PROV_USER_ID: zod_1.z.string().trim().min(1).max(64),
    GARANTI_POS_PROVISION_PASSWORD: zod_1.z.string().min(1).max(256),
    GARANTI_POS_STORE_KEY: zod_1.z.string().min(1).max(256),
    GARANTI_POS_SECURITY_LEVEL: zod_1.z.literal('3D_OOS_PAY'),
    GARANTI_POS_PAYMENT_URL: httpsUrl,
    GARANTI_POS_CALLBACK_URL: httpsUrl,
    GARANTI_POS_RESULT_URL: httpsUrl,
    GARANTI_POS_COMPANY_NAME: zod_1.z.string().trim().min(1).max(100),
});
function parseGarantiPaymentConfig(values) {
    const parsed = configSchema.safeParse(values);
    if (!parsed.success) {
        throw new Error('GARANTI_POS_CONFIG_INVALID');
    }
    const paymentHostname = new URL(parsed.data.GARANTI_POS_PAYMENT_URL).hostname.toLowerCase();
    if (!paymentHostname.endsWith('.garantibbva.com.tr') &&
        !paymentHostname.endsWith('.garanti.com.tr')) {
        throw new Error('GARANTI_POS_CONFIG_INVALID');
    }
    const isTestEndpoint = paymentHostname.includes('test');
    if ((parsed.data.GARANTI_POS_MODE === 'TEST' && !isTestEndpoint) ||
        (parsed.data.GARANTI_POS_MODE === 'PROD' && isTestEndpoint)) {
        throw new Error('GARANTI_POS_CONFIG_INVALID');
    }
    return {
        mode: parsed.data.GARANTI_POS_MODE,
        apiVersion: parsed.data.GARANTI_POS_API_VERSION,
        merchantId: parsed.data.GARANTI_POS_MERCHANT_ID,
        terminalId: parsed.data.GARANTI_POS_TERMINAL_ID,
        terminalUserId: parsed.data.GARANTI_POS_TERMINAL_USER_ID,
        provisionUserId: parsed.data.GARANTI_POS_PROV_USER_ID,
        provisionPassword: parsed.data.GARANTI_POS_PROVISION_PASSWORD,
        storeKey: parsed.data.GARANTI_POS_STORE_KEY,
        securityLevel: parsed.data.GARANTI_POS_SECURITY_LEVEL,
        paymentUrl: parsed.data.GARANTI_POS_PAYMENT_URL,
        callbackUrl: parsed.data.GARANTI_POS_CALLBACK_URL,
        resultUrl: parsed.data.GARANTI_POS_RESULT_URL,
        companyName: parsed.data.GARANTI_POS_COMPANY_NAME,
    };
}
function buildGarantiPaymentResultUrl(config, orderId) {
    const resultUrl = new URL(config.resultUrl);
    resultUrl.searchParams.set('order', orderId);
    return resultUrl.toString();
}
function getGarantiPaymentConfig() {
    return parseGarantiPaymentConfig(process.env);
}
function buildGarantiHostedPaymentForm(config, input) {
    if (!/^[A-Za-z0-9_-]{8,36}$/.test(input.orderId)) {
        throw new Error('GARANTI_INVALID_ORDER_ID');
    }
    if (!/^\d{1,12}$/.test(input.amount) || input.amount === '0') {
        throw new Error('GARANTI_INVALID_AMOUNT');
    }
    const transactionType = 'sales';
    const currencyCode = '949';
    const installmentCount = '';
    const secure3dhash = (0, garanti_crypto_1.buildGarantiThreeDHash)({
        terminalId: config.terminalId,
        orderId: input.orderId,
        amount: input.amount,
        currencyCode,
        successUrl: config.callbackUrl,
        errorUrl: config.callbackUrl,
        transactionType,
        installmentCount,
        storeKey: config.storeKey,
        provisionPassword: config.provisionPassword,
    });
    return {
        action: config.paymentUrl,
        method: 'POST',
        fields: {
            mode: config.mode,
            apiversion: config.apiVersion,
            secure3dsecuritylevel: config.securityLevel,
            terminalprovuserid: config.provisionUserId,
            terminaluserid: config.terminalUserId,
            terminalmerchantid: config.merchantId,
            terminalid: config.terminalId,
            orderid: input.orderId,
            successurl: config.callbackUrl,
            errorurl: config.callbackUrl,
            customeremailaddress: input.customerEmail,
            customeripaddress: input.customerIp,
            companyname: config.companyName,
            lang: 'tr',
            txntimestamp: (input.timestamp ?? new Date()).toISOString().replace(/\.\d{3}Z$/, 'Z'),
            refreshtime: '1',
            secure3dhash,
            txnamount: input.amount,
            txntype: transactionType,
            txncurrencycode: currencyCode,
            txninstallmentcount: installmentCount,
        },
    };
}
