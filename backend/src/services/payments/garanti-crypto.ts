import { createHash, timingSafeEqual } from 'crypto'

type CallbackPayload = Record<string, unknown>

export interface GarantiThreeDHashInput {
    terminalId: string
    orderId: string
    amount: string
    currencyCode: string
    successUrl: string
    errorUrl: string
    transactionType: string
    installmentCount: string
    storeKey: string
    provisionPassword: string
}

export interface ExpectedGarantiCallback {
    orderId: string
    amount: string
    currencyCode: string
    terminalId: string
}

export type GarantiCallbackClassification =
    | { status: 'approved'; reason: 'approved' }
    | { status: 'declined'; reason: 'bank_declined' }
    | {
          status: 'invalid'
          reason:
              | 'invalid_hash'
              | 'order_mismatch'
              | 'amount_mismatch'
              | 'currency_mismatch'
              | 'terminal_mismatch'
      }

const ISO_8859_9_TURKISH_BYTES = new Map<number, number>([
    [0x011e, 0xd0], // Ğ
    [0x0130, 0xdd], // İ
    [0x015e, 0xde], // Ş
    [0x011f, 0xf0], // ğ
    [0x0131, 0xfd], // ı
    [0x015f, 0xfe], // ş
])

export function encodeGarantiIso88599(value: string): Buffer {
    const bytes: number[] = []

    for (const character of value) {
        const codePoint = character.codePointAt(0)
        if (codePoint === undefined) continue

        const turkishByte = ISO_8859_9_TURKISH_BYTES.get(codePoint)
        if (turkishByte !== undefined) {
            bytes.push(turkishByte)
            continue
        }

        if (codePoint <= 0xff && ![0xd0, 0xdd, 0xde, 0xf0, 0xfd, 0xfe].includes(codePoint)) {
            bytes.push(codePoint)
            continue
        }

        throw new Error('GARANTI_UNSUPPORTED_HASH_CHARACTER')
    }

    return Buffer.from(bytes)
}

export function digestGaranti(value: string, algorithm: 'sha1' | 'sha512'): string {
    return createHash(algorithm)
        .update(encodeGarantiIso88599(value))
        .digest('hex')
        .toUpperCase()
}

export interface GarantiVpHashInput {
    provisionPassword: string
    terminalId: string
    orderId: string
    amount: string
    currencyCode: string
    cardNumber?: string
}

export function buildGarantiVpHash(input: GarantiVpHashInput): string {
    const hashedPassword = digestGaranti(
        `${input.provisionPassword}0${input.terminalId}`,
        'sha1'
    )
    return digestGaranti(
        [
            input.orderId,
            input.terminalId,
            input.cardNumber ?? '',
            input.amount,
            input.currencyCode,
            hashedPassword,
        ].join(''),
        'sha512'
    )
}

function getPayloadValue(payload: CallbackPayload, fieldName: string): string {
    const normalizedFieldName = fieldName.toLocaleLowerCase('en-US')
    const entry = Object.entries(payload).find(
        ([key]) => key.toLocaleLowerCase('en-US') === normalizedFieldName
    )

    if (!entry || entry[1] === null || entry[1] === undefined) return ''
    if (Array.isArray(entry[1])) return String(entry[1][0] ?? '')
    return String(entry[1])
}

export function buildGarantiThreeDHash(input: GarantiThreeDHashInput): string {
    const hashedPassword = digestGaranti(
        `${input.provisionPassword}0${input.terminalId}`,
        'sha1'
    )
    const hashInput = [
        input.terminalId,
        input.orderId,
        input.amount,
        input.currencyCode,
        input.successUrl,
        input.errorUrl,
        input.transactionType,
        input.installmentCount,
        input.storeKey,
        hashedPassword,
    ].join('')

    return digestGaranti(hashInput, 'sha512')
}

export function computeGarantiCallbackHash(payload: CallbackPayload, storeKey: string): string {
    const hashParams = getPayloadValue(payload, 'hashparams')
    if (!hashParams || hashParams.length > 4096) {
        throw new Error('GARANTI_INVALID_HASH_PARAMS')
    }

    const fieldNames = hashParams.split(':').filter(Boolean)
    if (fieldNames.length === 0 || fieldNames.length > 128) {
        throw new Error('GARANTI_INVALID_HASH_PARAMS')
    }
    if (fieldNames.some((field) => !/^[a-z0-9_]+$/i.test(field))) {
        throw new Error('GARANTI_INVALID_HASH_PARAMS')
    }

    const digestInput = fieldNames.map((field) => getPayloadValue(payload, field)).join('')
    return digestGaranti(`${digestInput}${storeKey}`, 'sha512')
}

export function verifyGarantiCallbackHash(payload: CallbackPayload, storeKey: string): boolean {
    try {
        const receivedHash = getPayloadValue(payload, 'hash').trim().toUpperCase()
        const calculatedHash = computeGarantiCallbackHash(payload, storeKey)
        if (!/^[A-F0-9]{128}$/.test(receivedHash)) return false

        const receivedBuffer = Buffer.from(receivedHash, 'ascii')
        const calculatedBuffer = Buffer.from(calculatedHash, 'ascii')
        return (
            receivedBuffer.length === calculatedBuffer.length &&
            timingSafeEqual(receivedBuffer, calculatedBuffer)
        )
    } catch {
        return false
    }
}

export function classifyGarantiCallback(
    payload: CallbackPayload,
    expected: ExpectedGarantiCallback,
    hashValid: boolean
): GarantiCallbackClassification {
    if (!hashValid) return { status: 'invalid', reason: 'invalid_hash' }
    if (getPayloadValue(payload, 'oid') !== expected.orderId) {
        return { status: 'invalid', reason: 'order_mismatch' }
    }
    if (getPayloadValue(payload, 'txnamount') !== expected.amount) {
        return { status: 'invalid', reason: 'amount_mismatch' }
    }
    if (getPayloadValue(payload, 'txncurrencycode') !== expected.currencyCode) {
        return { status: 'invalid', reason: 'currency_mismatch' }
    }
    if (getPayloadValue(payload, 'clientid') !== expected.terminalId) {
        return { status: 'invalid', reason: 'terminal_mismatch' }
    }
    if (getPayloadValue(payload, 'procreturncode') !== '00') {
        return { status: 'declined', reason: 'bank_declined' }
    }

    return { status: 'approved', reason: 'approved' }
}
