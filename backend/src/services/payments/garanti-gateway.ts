import { z } from 'zod'

import { buildGarantiThreeDHash } from './garanti-crypto'

const httpsUrl = z
    .string()
    .url()
    .refine((value) => new URL(value).protocol === 'https:')

const configSchema = z.object({
    GARANTI_POS_ENABLED: z.literal('true'),
    GARANTI_POS_MODE: z.enum(['TEST', 'PROD']),
    GARANTI_POS_API_VERSION: z.literal('512'),
    GARANTI_POS_MERCHANT_ID: z.string().trim().min(1).max(32),
    GARANTI_POS_TERMINAL_ID: z
        .string()
        .trim()
        .regex(/^\d{8}$/),
    GARANTI_POS_TERMINAL_USER_ID: z.string().trim().min(1).max(64),
    GARANTI_POS_PROV_USER_ID: z.string().trim().min(1).max(64),
    GARANTI_POS_PROVISION_PASSWORD: z.string().min(1).max(256),
    GARANTI_POS_STORE_KEY: z.string().min(1).max(256),
    GARANTI_POS_SECURITY_LEVEL: z.literal('3D_OOS_PAY'),
    GARANTI_POS_PAYMENT_URL: httpsUrl,
    GARANTI_POS_CALLBACK_URL: httpsUrl,
    GARANTI_POS_RESULT_URL: httpsUrl,
    GARANTI_POS_COMPANY_NAME: z.string().trim().min(1).max(100),
})

export interface GarantiPaymentConfig {
    mode: 'TEST' | 'PROD'
    apiVersion: '512'
    merchantId: string
    terminalId: string
    terminalUserId: string
    provisionUserId: string
    provisionPassword: string
    storeKey: string
    securityLevel: '3D_OOS_PAY'
    paymentUrl: string
    callbackUrl: string
    resultUrl: string
    companyName: string
}

export interface GarantiHostedPaymentInput {
    orderId: string
    amount: string
    customerEmail: string
    customerIp: string
    timestamp?: Date
}

export interface GarantiHostedPaymentForm {
    action: string
    method: 'POST'
    fields: Record<string, string>
}

export function parseGarantiPaymentConfig(
    values: Record<string, string | undefined>
): GarantiPaymentConfig {
    const parsed = configSchema.safeParse(values)
    if (!parsed.success) {
        throw new Error('GARANTI_POS_CONFIG_INVALID')
    }

    const paymentHostname = new URL(parsed.data.GARANTI_POS_PAYMENT_URL).hostname.toLowerCase()
    if (
        !paymentHostname.endsWith('.garantibbva.com.tr') &&
        !paymentHostname.endsWith('.garanti.com.tr')
    ) {
        throw new Error('GARANTI_POS_CONFIG_INVALID')
    }
    const isTestEndpoint = paymentHostname.includes('test')
    if (
        (parsed.data.GARANTI_POS_MODE === 'TEST' && !isTestEndpoint) ||
        (parsed.data.GARANTI_POS_MODE === 'PROD' && isTestEndpoint)
    ) {
        throw new Error('GARANTI_POS_CONFIG_INVALID')
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
    }
}

export function buildGarantiPaymentResultUrl(
    config: GarantiPaymentConfig,
    orderId: string
): string {
    const resultUrl = new URL(config.resultUrl)
    resultUrl.searchParams.set('order', orderId)
    return resultUrl.toString()
}

export function getGarantiPaymentConfig(): GarantiPaymentConfig {
    return parseGarantiPaymentConfig(process.env)
}

export function buildGarantiHostedPaymentForm(
    config: GarantiPaymentConfig,
    input: GarantiHostedPaymentInput
): GarantiHostedPaymentForm {
    if (!/^[A-Za-z0-9_-]{8,36}$/.test(input.orderId)) {
        throw new Error('GARANTI_INVALID_ORDER_ID')
    }
    if (!/^\d{1,12}$/.test(input.amount) || input.amount === '0') {
        throw new Error('GARANTI_INVALID_AMOUNT')
    }

    const transactionType = 'sales'
    const currencyCode = '949'
    const installmentCount = ''
    const secure3dhash = buildGarantiThreeDHash({
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
    })

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
    }
}
