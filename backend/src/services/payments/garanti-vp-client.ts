import { z } from 'zod'

import { buildGarantiVpHash, encodeGarantiIso88599 } from './garanti-crypto'

const httpsUrl = z
    .string()
    .url()
    .refine((value) => new URL(value).protocol === 'https:')

const configSchema = z
    .object({
        GARANTI_OPERATIONS_ENABLED: z.literal('true'),
        GARANTI_POS_MODE: z.enum(['TEST', 'PROD']),
        GARANTI_POS_API_VERSION: z.literal('512'),
        GARANTI_POS_MERCHANT_ID: z.string().trim().min(1).max(32),
        GARANTI_POS_TERMINAL_ID: z
            .string()
            .trim()
            .regex(/^\d{8}$/),
        GARANTI_POS_VP_URL: httpsUrl,
        GARANTI_VP_USER_ID: z.string().trim().max(64).optional(),
        GARANTI_POS_TERMINAL_USER_ID: z.string().trim().max(64).optional(),
        GARANTI_INQUIRY_PROV_USER_ID: z.string().trim().min(1).max(64),
        GARANTI_INQUIRY_PROVISION_PASSWORD: z.string().min(1).max(256),
        GARANTI_REFUND_PROV_USER_ID: z.string().trim().min(1).max(64),
        GARANTI_REFUND_PROVISION_PASSWORD: z.string().min(1).max(256),
    })
    .superRefine((data, ctx) => {
        if (!data.GARANTI_VP_USER_ID?.trim() && !data.GARANTI_POS_TERMINAL_USER_ID?.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Garanti terminal user is required',
            })
        }
    })

export interface GarantiVpConfig {
    mode: 'TEST' | 'PROD'
    apiVersion: '512'
    merchantId: string
    terminalId: string
    endpoint: string
    userId: string
    inquiryProvisionUserId: string
    inquiryProvisionPassword: string
    refundProvisionUserId: string
    refundProvisionPassword: string
    timeoutMs: number
    maxResponseBytes: number
}

export type GarantiVpTransactionType = 'orderinq' | 'orderhistoryinq' | 'void' | 'refund'

export interface GarantiVpRequestInput {
    orderId: string
    amount: string
    currencyCode: '949'
    customerEmail: string
    customerIp: string
    originalRetrefNum?: string
}

export interface GarantiOrderInquiryResult {
    status: string
    code: string
    reasonCode: string
    authAmount: string
    authDate: string
    retrefNum: string
    authCode: string
    installmentCount: string
}

export interface GarantiOrderHistoryTransaction {
    type: string
    status: string
    authAmount: string
    returnCode: string
    currencyCode: string
    retrefNum: string
    authCode: string
    authDate: string
    voidDate: string
}

export interface GarantiVpResponse {
    transactionType: GarantiVpTransactionType
    mode: string
    terminalId: string
    merchantId: string
    orderId: string
    responseCode: string
    reasonCode: string
    message: string
    errorMessage: string
    systemErrorMessage: string
    bankReferenceNumber: string
    authorizationCode: string
    orderInquiry: GarantiOrderInquiryResult | null
    orderHistory: GarantiOrderHistoryTransaction[]
}

export type GarantiInquiryClassification =
    | { status: 'approved'; bankReferenceNumber: string; authorizationCode: string }
    | { status: 'declined'; bankCode: string }
    | { status: 'unknown'; reason: string }
    | { status: 'mismatch'; reason: string }

export class GarantiVpError extends Error {
    constructor(
        message: string,
        readonly kind:
            | 'config'
            | 'validation'
            | 'timeout'
            | 'network'
            | 'http'
            | 'response_too_large'
            | 'invalid_xml'
            | 'response_mismatch',
        readonly retryable: boolean
    ) {
        super(message)
        this.name = 'GarantiVpError'
    }
}

function getBoundedInteger(
    value: string | undefined,
    fallback: number,
    minimum: number,
    maximum: number
): number {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) return fallback
    return parsed
}

function isAllowedGarantiHostname(hostname: string): boolean {
    const normalized = hostname.toLowerCase()
    return normalized.endsWith('.garantibbva.com.tr') || normalized.endsWith('.garanti.com.tr')
}

export function parseGarantiVpConfig(values: Record<string, string | undefined>): GarantiVpConfig {
    const parsed = configSchema.safeParse(values)
    if (!parsed.success) throw new GarantiVpError('GARANTI_VP_CONFIG_INVALID', 'config', false)

    const endpoint = new URL(parsed.data.GARANTI_POS_VP_URL)
    const hostname = endpoint.hostname.toLowerCase()
    const isTestEndpoint = hostname.includes('test')
    if (
        !isAllowedGarantiHostname(hostname) ||
        endpoint.pathname !== '/VPServlet' ||
        (parsed.data.GARANTI_POS_MODE === 'TEST' && !isTestEndpoint) ||
        (parsed.data.GARANTI_POS_MODE === 'PROD' && isTestEndpoint)
    ) {
        throw new GarantiVpError('GARANTI_VP_CONFIG_INVALID', 'config', false)
    }

    return {
        mode: parsed.data.GARANTI_POS_MODE,
        apiVersion: parsed.data.GARANTI_POS_API_VERSION,
        merchantId: parsed.data.GARANTI_POS_MERCHANT_ID,
        terminalId: parsed.data.GARANTI_POS_TERMINAL_ID,
        endpoint: endpoint.toString(),
        userId: (
            parsed.data.GARANTI_VP_USER_ID ||
            parsed.data.GARANTI_POS_TERMINAL_USER_ID ||
            ''
        ).trim(),
        inquiryProvisionUserId: parsed.data.GARANTI_INQUIRY_PROV_USER_ID,
        inquiryProvisionPassword: parsed.data.GARANTI_INQUIRY_PROVISION_PASSWORD,
        refundProvisionUserId: parsed.data.GARANTI_REFUND_PROV_USER_ID,
        refundProvisionPassword: parsed.data.GARANTI_REFUND_PROVISION_PASSWORD,
        timeoutMs: getBoundedInteger(values.GARANTI_VP_TIMEOUT_MS, 10_000, 1_000, 30_000),
        maxResponseBytes: getBoundedInteger(
            values.GARANTI_VP_MAX_RESPONSE_BYTES,
            128 * 1024,
            8 * 1024,
            512 * 1024
        ),
    }
}

export function getGarantiVpConfig(): GarantiVpConfig {
    return parseGarantiVpConfig(process.env)
}

function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function decodeXmlEntities(value: string): string {
    return value
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
}

function decodeIso88599(buffer: Buffer): string {
    const replacements = new Map<number, string>([
        [0xd0, 'Ğ'],
        [0xdd, 'İ'],
        [0xde, 'Ş'],
        [0xf0, 'ğ'],
        [0xfd, 'ı'],
        [0xfe, 'ş'],
    ])
    let output = ''
    for (const byte of buffer) output += replacements.get(byte) ?? String.fromCharCode(byte)
    return output
}

function tagPattern(tagName: string, global = false): RegExp {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(tagName)) {
        throw new GarantiVpError('GARANTI_VP_INVALID_TAG', 'invalid_xml', false)
    }
    return new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, global ? 'gi' : 'i')
}

function getTag(xml: string, tagName: string): string {
    const match = tagPattern(tagName).exec(xml)
    if (!match) return ''
    return decodeXmlEntities(match[1].replace(/<[^>]*>/g, '').trim()).slice(0, 1000)
}

function getBlock(xml: string, tagName: string): string {
    return tagPattern(tagName).exec(xml)?.[1] ?? ''
}

function getBlocks(xml: string, tagName: string): string[] {
    const blocks: string[] = []
    const pattern = tagPattern(tagName, true)
    let match: RegExpExecArray | null
    while ((match = pattern.exec(xml)) !== null) {
        blocks.push(match[1])
        if (blocks.length > 256) {
            throw new GarantiVpError('GARANTI_VP_XML_LIMIT', 'invalid_xml', false)
        }
    }
    return blocks
}

function assertRequestInput(input: GarantiVpRequestInput): void {
    if (!/^[A-Za-z0-9_-]{8,36}$/.test(input.orderId)) {
        throw new GarantiVpError('GARANTI_VP_INVALID_ORDER', 'validation', false)
    }
    if (!/^\d{1,17}$/.test(input.amount) || input.amount === '0') {
        throw new GarantiVpError('GARANTI_VP_INVALID_AMOUNT', 'validation', false)
    }
    if (input.currencyCode !== '949') {
        throw new GarantiVpError('GARANTI_VP_INVALID_CURRENCY', 'validation', false)
    }
    if (input.customerEmail.length < 3 || input.customerEmail.length > 64) {
        throw new GarantiVpError('GARANTI_VP_INVALID_EMAIL', 'validation', false)
    }
    if (!/^[0-9A-Fa-f:.]{3,45}$/.test(input.customerIp)) {
        throw new GarantiVpError('GARANTI_VP_INVALID_CUSTOMER_IP', 'validation', false)
    }
    if (input.originalRetrefNum && !/^[A-Za-z0-9_-]{1,128}$/.test(input.originalRetrefNum)) {
        throw new GarantiVpError('GARANTI_VP_INVALID_REFERENCE', 'validation', false)
    }
}

export function buildGarantiVpRequestXml(
    config: GarantiVpConfig,
    transactionType: GarantiVpTransactionType,
    input: GarantiVpRequestInput
): string {
    assertRequestInput(input)
    const isInquiry = transactionType === 'orderinq' || transactionType === 'orderhistoryinq'
    const provisionUserId = isInquiry ? config.inquiryProvisionUserId : config.refundProvisionUserId
    const provisionPassword = isInquiry
        ? config.inquiryProvisionPassword
        : config.refundProvisionPassword
    const hashData = buildGarantiVpHash({
        provisionPassword,
        terminalId: config.terminalId,
        orderId: input.orderId,
        amount: input.amount,
        currencyCode: input.currencyCode,
    })
    const listPage = isInquiry ? '<ListPageNum>0</ListPageNum>' : ''
    const originalReference =
        transactionType === 'void'
            ? `<OriginalRetrefNum>${escapeXml(input.originalRetrefNum ?? '')}</OriginalRetrefNum>`
            : ''
    const cardholderPresentCode = isInquiry ? '' : '13'

    return (
        `<?xml version="1.0" encoding="iso-8859-9"?>` +
        `<GVPSRequest>` +
        `<Mode>${config.mode}</Mode>` +
        `<Version>${config.apiVersion}</Version>` +
        `<Terminal>` +
        `<ProvUserID>${escapeXml(provisionUserId)}</ProvUserID>` +
        `<HashData>${hashData}</HashData>` +
        `<UserID>${escapeXml(config.userId)}</UserID>` +
        `<ID>${config.terminalId}</ID>` +
        `<MerchantID>${escapeXml(config.merchantId)}</MerchantID>` +
        `</Terminal>` +
        `<Customer>` +
        `<IPAddress>${escapeXml(input.customerIp)}</IPAddress>` +
        `<EmailAddress>${escapeXml(input.customerEmail)}</EmailAddress>` +
        `</Customer>` +
        `<Order><OrderID>${input.orderId}</OrderID><GroupID /></Order>` +
        `<Transaction>` +
        `<Type>${transactionType}</Type>` +
        listPage +
        `<Amount>${input.amount}</Amount>` +
        `<CurrencyCode>${input.currencyCode}</CurrencyCode>` +
        originalReference +
        `<CardholderPresentCode>${cardholderPresentCode}</CardholderPresentCode>` +
        `<MotoInd>N</MotoInd>` +
        `</Transaction>` +
        `</GVPSRequest>`
    )
}

export function parseGarantiVpResponse(
    transactionType: GarantiVpTransactionType,
    xml: string
): GarantiVpResponse {
    if (
        xml.length < 20 ||
        !xml.includes('<GVPSResponse') ||
        /<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(xml)
    ) {
        throw new GarantiVpError('GARANTI_VP_INVALID_XML', 'invalid_xml', false)
    }

    const terminal = getBlock(xml, 'Terminal')
    const order = getBlock(xml, 'Order')
    const transaction = getBlock(xml, 'Transaction')
    const response = getBlock(transaction, 'Response')
    const inquiryBlock = getBlock(order, 'OrderInqResult')
    const orderInquiry = inquiryBlock
        ? {
              status: getTag(inquiryBlock, 'Status'),
              code: getTag(inquiryBlock, 'Code'),
              reasonCode: getTag(inquiryBlock, 'ReasonCode'),
              authAmount: getTag(inquiryBlock, 'AuthAmount'),
              authDate: getTag(inquiryBlock, 'AuthDate'),
              retrefNum: getTag(inquiryBlock, 'RetrefNum'),
              authCode: getTag(inquiryBlock, 'AuthCode'),
              installmentCount: getTag(inquiryBlock, 'InstallmentCnt'),
          }
        : null
    const historyBlock = getBlock(order, 'OrderHistInqResult')
    const orderHistory = getBlocks(historyBlock, 'OrderTxn').map((entry) => ({
        type: getTag(entry, 'Type'),
        status: getTag(entry, 'Status'),
        authAmount: getTag(entry, 'AuthAmount'),
        returnCode: getTag(entry, 'ReturnCode'),
        currencyCode: getTag(entry, 'CurrencyCode'),
        retrefNum: getTag(entry, 'RetrefNum'),
        authCode: getTag(entry, 'AuthCode'),
        authDate: getTag(entry, 'AuthDate'),
        voidDate: getTag(entry, 'VoidDate'),
    }))

    return {
        transactionType,
        mode: getTag(xml, 'Mode'),
        terminalId: getTag(terminal, 'ID'),
        merchantId: getTag(terminal, 'MerchantID'),
        orderId: getTag(order, 'OrderID'),
        responseCode: getTag(response, 'Code'),
        reasonCode: getTag(response, 'ReasonCode'),
        message: getTag(response, 'Message'),
        errorMessage: getTag(response, 'ErrorMsg'),
        systemErrorMessage: getTag(response, 'SysErrMsg'),
        bankReferenceNumber: getTag(transaction, 'RetrefNum'),
        authorizationCode: getTag(transaction, 'AuthCode'),
        orderInquiry,
        orderHistory,
    }
}

export function classifyGarantiOrderInquiry(
    response: GarantiVpResponse,
    expected: { orderId: string; amount: string; terminalId: string; merchantId: string }
): GarantiInquiryClassification {
    if (response.orderId !== expected.orderId) return { status: 'mismatch', reason: 'order' }
    if (response.terminalId !== expected.terminalId) {
        return { status: 'mismatch', reason: 'terminal' }
    }
    if (response.merchantId !== expected.merchantId) {
        return { status: 'mismatch', reason: 'merchant' }
    }
    if (response.responseCode !== '00') {
        return {
            status: 'unknown',
            reason: response.reasonCode || response.responseCode || 'query_failed',
        }
    }

    const inquiry = response.orderInquiry
    if (!inquiry) return { status: 'unknown', reason: 'missing_order_result' }
    if (inquiry.authAmount && inquiry.authAmount !== expected.amount) {
        return { status: 'mismatch', reason: 'amount' }
    }
    if (inquiry.code === '00' && inquiry.authAmount === expected.amount && inquiry.retrefNum) {
        return {
            status: 'approved',
            bankReferenceNumber: inquiry.retrefNum,
            authorizationCode: inquiry.authCode,
        }
    }
    if (
        inquiry.code &&
        inquiry.code !== '00' &&
        (!inquiry.authAmount || inquiry.authAmount === '0')
    ) {
        return { status: 'declined', bankCode: inquiry.code }
    }
    return { status: 'unknown', reason: inquiry.status || inquiry.reasonCode || 'ambiguous' }
}

export function findConfirmedGarantiReversal(
    response: GarantiVpResponse,
    expected: { type: 'void' | 'refund'; amount: string }
): GarantiOrderHistoryTransaction | null {
    return (
        response.orderHistory.find((entry) => {
            const typeMatches = entry.type.toLowerCase() === expected.type
            const approved =
                entry.returnCode === '00' ||
                ['approved', 'success', 'succeeded', 'completed'].includes(
                    entry.status.toLowerCase()
                )
            return typeMatches && approved && entry.authAmount === expected.amount
        }) ?? null
    )
}

export interface GarantiVpClient {
    orderInquiry(input: GarantiVpRequestInput): Promise<GarantiVpResponse>
    orderHistoryInquiry(input: GarantiVpRequestInput): Promise<GarantiVpResponse>
    voidPayment(input: GarantiVpRequestInput): Promise<GarantiVpResponse>
    refundPayment(input: GarantiVpRequestInput): Promise<GarantiVpResponse>
}

export function createGarantiVpClient(
    config: GarantiVpConfig,
    fetchImpl: typeof fetch = fetch
): GarantiVpClient {
    async function send(
        transactionType: GarantiVpTransactionType,
        input: GarantiVpRequestInput
    ): Promise<GarantiVpResponse> {
        const requestXml = buildGarantiVpRequestXml(config, transactionType, input)
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), config.timeoutMs)

        try {
            const response = await fetchImpl(config.endpoint, {
                method: 'POST',
                headers: { 'content-type': 'application/xml; charset=ISO-8859-9' },
                body: new Uint8Array(encodeGarantiIso88599(requestXml)),
                signal: controller.signal,
                redirect: 'error',
            })
            if (!response.ok) {
                throw new GarantiVpError(
                    'GARANTI_VP_HTTP_ERROR',
                    'http',
                    response.status === 429 || response.status >= 500
                )
            }
            const declaredLength = Number(response.headers.get('content-length') || 0)
            if (declaredLength > config.maxResponseBytes) {
                throw new GarantiVpError(
                    'GARANTI_VP_RESPONSE_TOO_LARGE',
                    'response_too_large',
                    false
                )
            }
            const bytes = Buffer.from(await response.arrayBuffer())
            if (bytes.byteLength > config.maxResponseBytes) {
                throw new GarantiVpError(
                    'GARANTI_VP_RESPONSE_TOO_LARGE',
                    'response_too_large',
                    false
                )
            }
            const parsed = parseGarantiVpResponse(transactionType, decodeIso88599(bytes))
            if (
                parsed.mode !== config.mode ||
                parsed.terminalId !== config.terminalId ||
                parsed.merchantId !== config.merchantId ||
                parsed.orderId !== input.orderId
            ) {
                throw new GarantiVpError('GARANTI_VP_RESPONSE_MISMATCH', 'response_mismatch', false)
            }
            return parsed
        } catch (error) {
            if (error instanceof GarantiVpError) throw error
            if (error instanceof Error && error.name === 'AbortError') {
                throw new GarantiVpError('GARANTI_VP_TIMEOUT', 'timeout', true)
            }
            throw new GarantiVpError('GARANTI_VP_NETWORK_ERROR', 'network', true)
        } finally {
            clearTimeout(timer)
        }
    }

    return {
        orderInquiry: (input) => send('orderinq', input),
        orderHistoryInquiry: (input) => send('orderhistoryinq', input),
        voidPayment: (input) => send('void', input),
        refundPayment: (input) => send('refund', input),
    }
}
