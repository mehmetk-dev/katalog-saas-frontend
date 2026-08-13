"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GarantiVpError = void 0;
exports.parseGarantiVpConfig = parseGarantiVpConfig;
exports.getGarantiVpConfig = getGarantiVpConfig;
exports.buildGarantiVpRequestXml = buildGarantiVpRequestXml;
exports.parseGarantiVpResponse = parseGarantiVpResponse;
exports.classifyGarantiOrderInquiry = classifyGarantiOrderInquiry;
exports.findConfirmedGarantiReversal = findConfirmedGarantiReversal;
exports.createGarantiVpClient = createGarantiVpClient;
const zod_1 = require("zod");
const garanti_crypto_1 = require("./garanti-crypto");
const httpsUrl = zod_1.z
    .string()
    .url()
    .refine((value) => new URL(value).protocol === 'https:');
const configSchema = zod_1.z
    .object({
    GARANTI_OPERATIONS_ENABLED: zod_1.z.literal('true'),
    GARANTI_POS_MODE: zod_1.z.enum(['TEST', 'PROD']),
    GARANTI_POS_API_VERSION: zod_1.z.literal('512'),
    GARANTI_POS_MERCHANT_ID: zod_1.z.string().trim().min(1).max(32),
    GARANTI_POS_TERMINAL_ID: zod_1.z
        .string()
        .trim()
        .regex(/^\d{8}$/),
    GARANTI_POS_VP_URL: httpsUrl,
    GARANTI_VP_USER_ID: zod_1.z.string().trim().max(64).optional(),
    GARANTI_POS_TERMINAL_USER_ID: zod_1.z.string().trim().max(64).optional(),
    GARANTI_INQUIRY_PROV_USER_ID: zod_1.z.string().trim().min(1).max(64),
    GARANTI_INQUIRY_PROVISION_PASSWORD: zod_1.z.string().min(1).max(256),
    GARANTI_REFUND_PROV_USER_ID: zod_1.z.string().trim().min(1).max(64),
    GARANTI_REFUND_PROVISION_PASSWORD: zod_1.z.string().min(1).max(256),
})
    .superRefine((data, ctx) => {
    if (!data.GARANTI_VP_USER_ID?.trim() && !data.GARANTI_POS_TERMINAL_USER_ID?.trim()) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Garanti terminal user is required',
        });
    }
});
class GarantiVpError extends Error {
    constructor(message, kind, retryable) {
        super(message);
        this.kind = kind;
        this.retryable = retryable;
        this.name = 'GarantiVpError';
    }
}
exports.GarantiVpError = GarantiVpError;
function getBoundedInteger(value, fallback, minimum, maximum) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum)
        return fallback;
    return parsed;
}
function isAllowedGarantiHostname(hostname) {
    const normalized = hostname.toLowerCase();
    return normalized.endsWith('.garantibbva.com.tr') || normalized.endsWith('.garanti.com.tr');
}
function parseGarantiVpConfig(values) {
    const parsed = configSchema.safeParse(values);
    if (!parsed.success)
        throw new GarantiVpError('GARANTI_VP_CONFIG_INVALID', 'config', false);
    const endpoint = new URL(parsed.data.GARANTI_POS_VP_URL);
    const hostname = endpoint.hostname.toLowerCase();
    const isTestEndpoint = hostname.includes('test');
    if (!isAllowedGarantiHostname(hostname) ||
        endpoint.pathname !== '/VPServlet' ||
        (parsed.data.GARANTI_POS_MODE === 'TEST' && !isTestEndpoint) ||
        (parsed.data.GARANTI_POS_MODE === 'PROD' && isTestEndpoint)) {
        throw new GarantiVpError('GARANTI_VP_CONFIG_INVALID', 'config', false);
    }
    return {
        mode: parsed.data.GARANTI_POS_MODE,
        apiVersion: parsed.data.GARANTI_POS_API_VERSION,
        merchantId: parsed.data.GARANTI_POS_MERCHANT_ID,
        terminalId: parsed.data.GARANTI_POS_TERMINAL_ID,
        endpoint: endpoint.toString(),
        userId: (parsed.data.GARANTI_VP_USER_ID ||
            parsed.data.GARANTI_POS_TERMINAL_USER_ID ||
            '').trim(),
        inquiryProvisionUserId: parsed.data.GARANTI_INQUIRY_PROV_USER_ID,
        inquiryProvisionPassword: parsed.data.GARANTI_INQUIRY_PROVISION_PASSWORD,
        refundProvisionUserId: parsed.data.GARANTI_REFUND_PROV_USER_ID,
        refundProvisionPassword: parsed.data.GARANTI_REFUND_PROVISION_PASSWORD,
        timeoutMs: getBoundedInteger(values.GARANTI_VP_TIMEOUT_MS, 10000, 1000, 30000),
        maxResponseBytes: getBoundedInteger(values.GARANTI_VP_MAX_RESPONSE_BYTES, 128 * 1024, 8 * 1024, 512 * 1024),
    };
}
function getGarantiVpConfig() {
    return parseGarantiVpConfig(process.env);
}
function escapeXml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
function decodeXmlEntities(value) {
    return value
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
}
function decodeIso88599(buffer) {
    const replacements = new Map([
        [0xd0, 'Ğ'],
        [0xdd, 'İ'],
        [0xde, 'Ş'],
        [0xf0, 'ğ'],
        [0xfd, 'ı'],
        [0xfe, 'ş'],
    ]);
    let output = '';
    for (const byte of buffer)
        output += replacements.get(byte) ?? String.fromCharCode(byte);
    return output;
}
function tagPattern(tagName, global = false) {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(tagName)) {
        throw new GarantiVpError('GARANTI_VP_INVALID_TAG', 'invalid_xml', false);
    }
    return new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, global ? 'gi' : 'i');
}
function getTag(xml, tagName) {
    const match = tagPattern(tagName).exec(xml);
    if (!match)
        return '';
    return decodeXmlEntities(match[1].replace(/<[^>]*>/g, '').trim()).slice(0, 1000);
}
function getBlock(xml, tagName) {
    return tagPattern(tagName).exec(xml)?.[1] ?? '';
}
function getBlocks(xml, tagName) {
    const blocks = [];
    const pattern = tagPattern(tagName, true);
    let match;
    while ((match = pattern.exec(xml)) !== null) {
        blocks.push(match[1]);
        if (blocks.length > 256) {
            throw new GarantiVpError('GARANTI_VP_XML_LIMIT', 'invalid_xml', false);
        }
    }
    return blocks;
}
function assertRequestInput(input) {
    if (!/^[A-Za-z0-9_-]{8,36}$/.test(input.orderId)) {
        throw new GarantiVpError('GARANTI_VP_INVALID_ORDER', 'validation', false);
    }
    if (!/^\d{1,17}$/.test(input.amount) || input.amount === '0') {
        throw new GarantiVpError('GARANTI_VP_INVALID_AMOUNT', 'validation', false);
    }
    if (input.currencyCode !== '949') {
        throw new GarantiVpError('GARANTI_VP_INVALID_CURRENCY', 'validation', false);
    }
    if (input.customerEmail.length < 3 || input.customerEmail.length > 64) {
        throw new GarantiVpError('GARANTI_VP_INVALID_EMAIL', 'validation', false);
    }
    if (!/^[0-9A-Fa-f:.]{3,45}$/.test(input.customerIp)) {
        throw new GarantiVpError('GARANTI_VP_INVALID_CUSTOMER_IP', 'validation', false);
    }
    if (input.originalRetrefNum && !/^[A-Za-z0-9_-]{1,128}$/.test(input.originalRetrefNum)) {
        throw new GarantiVpError('GARANTI_VP_INVALID_REFERENCE', 'validation', false);
    }
}
function buildGarantiVpRequestXml(config, transactionType, input) {
    assertRequestInput(input);
    const isInquiry = transactionType === 'orderinq' || transactionType === 'orderhistoryinq';
    const provisionUserId = isInquiry ? config.inquiryProvisionUserId : config.refundProvisionUserId;
    const provisionPassword = isInquiry
        ? config.inquiryProvisionPassword
        : config.refundProvisionPassword;
    const hashData = (0, garanti_crypto_1.buildGarantiVpHash)({
        provisionPassword,
        terminalId: config.terminalId,
        orderId: input.orderId,
        amount: input.amount,
        currencyCode: input.currencyCode,
    });
    const listPage = isInquiry ? '<ListPageNum>0</ListPageNum>' : '';
    const originalReference = transactionType === 'void'
        ? `<OriginalRetrefNum>${escapeXml(input.originalRetrefNum ?? '')}</OriginalRetrefNum>`
        : '';
    const cardholderPresentCode = isInquiry ? '' : '13';
    return (`<?xml version="1.0" encoding="iso-8859-9"?>` +
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
        `</GVPSRequest>`);
}
function parseGarantiVpResponse(transactionType, xml) {
    if (xml.length < 20 ||
        !xml.includes('<GVPSResponse') ||
        /<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(xml)) {
        throw new GarantiVpError('GARANTI_VP_INVALID_XML', 'invalid_xml', false);
    }
    const terminal = getBlock(xml, 'Terminal');
    const order = getBlock(xml, 'Order');
    const transaction = getBlock(xml, 'Transaction');
    const response = getBlock(transaction, 'Response');
    const inquiryBlock = getBlock(order, 'OrderInqResult');
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
        : null;
    const historyBlock = getBlock(order, 'OrderHistInqResult');
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
    }));
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
    };
}
function classifyGarantiOrderInquiry(response, expected) {
    if (response.orderId !== expected.orderId)
        return { status: 'mismatch', reason: 'order' };
    if (response.terminalId !== expected.terminalId) {
        return { status: 'mismatch', reason: 'terminal' };
    }
    if (response.merchantId !== expected.merchantId) {
        return { status: 'mismatch', reason: 'merchant' };
    }
    if (response.responseCode !== '00') {
        return {
            status: 'unknown',
            reason: response.reasonCode || response.responseCode || 'query_failed',
        };
    }
    const inquiry = response.orderInquiry;
    if (!inquiry)
        return { status: 'unknown', reason: 'missing_order_result' };
    if (inquiry.authAmount && inquiry.authAmount !== expected.amount) {
        return { status: 'mismatch', reason: 'amount' };
    }
    if (inquiry.code === '00' && inquiry.authAmount === expected.amount && inquiry.retrefNum) {
        return {
            status: 'approved',
            bankReferenceNumber: inquiry.retrefNum,
            authorizationCode: inquiry.authCode,
        };
    }
    if (inquiry.code &&
        inquiry.code !== '00' &&
        (!inquiry.authAmount || inquiry.authAmount === '0')) {
        return { status: 'declined', bankCode: inquiry.code };
    }
    return { status: 'unknown', reason: inquiry.status || inquiry.reasonCode || 'ambiguous' };
}
function findConfirmedGarantiReversal(response, expected) {
    return (response.orderHistory.find((entry) => {
        const typeMatches = entry.type.toLowerCase() === expected.type;
        const approved = entry.returnCode === '00' ||
            ['approved', 'success', 'succeeded', 'completed'].includes(entry.status.toLowerCase());
        return typeMatches && approved && entry.authAmount === expected.amount;
    }) ?? null);
}
function createGarantiVpClient(config, fetchImpl = fetch) {
    async function send(transactionType, input) {
        const requestXml = buildGarantiVpRequestXml(config, transactionType, input);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), config.timeoutMs);
        try {
            const response = await fetchImpl(config.endpoint, {
                method: 'POST',
                headers: { 'content-type': 'application/xml; charset=ISO-8859-9' },
                body: new Uint8Array((0, garanti_crypto_1.encodeGarantiIso88599)(requestXml)),
                signal: controller.signal,
                redirect: 'error',
            });
            if (!response.ok) {
                throw new GarantiVpError('GARANTI_VP_HTTP_ERROR', 'http', response.status === 429 || response.status >= 500);
            }
            const declaredLength = Number(response.headers.get('content-length') || 0);
            if (declaredLength > config.maxResponseBytes) {
                throw new GarantiVpError('GARANTI_VP_RESPONSE_TOO_LARGE', 'response_too_large', false);
            }
            const bytes = Buffer.from(await response.arrayBuffer());
            if (bytes.byteLength > config.maxResponseBytes) {
                throw new GarantiVpError('GARANTI_VP_RESPONSE_TOO_LARGE', 'response_too_large', false);
            }
            const parsed = parseGarantiVpResponse(transactionType, decodeIso88599(bytes));
            if (parsed.mode !== config.mode ||
                parsed.terminalId !== config.terminalId ||
                parsed.merchantId !== config.merchantId ||
                parsed.orderId !== input.orderId) {
                throw new GarantiVpError('GARANTI_VP_RESPONSE_MISMATCH', 'response_mismatch', false);
            }
            return parsed;
        }
        catch (error) {
            if (error instanceof GarantiVpError)
                throw error;
            if (error instanceof Error && error.name === 'AbortError') {
                throw new GarantiVpError('GARANTI_VP_TIMEOUT', 'timeout', true);
            }
            throw new GarantiVpError('GARANTI_VP_NETWORK_ERROR', 'network', true);
        }
        finally {
            clearTimeout(timer);
        }
    }
    return {
        orderInquiry: (input) => send('orderinq', input),
        orderHistoryInquiry: (input) => send('orderhistoryinq', input),
        voidPayment: (input) => send('void', input),
        refundPayment: (input) => send('refund', input),
    };
}
