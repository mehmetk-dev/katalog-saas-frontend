import type { Language, ParsedRequest, ParsedAiResponse } from './schemas'
import { normalizeForMatch, includesAnyToken } from './helpers'
import { detectHighConfidenceOperation, describeOperation } from './operations/registry'

// aaa FogCatalog Knowledge Base Detection aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

export const ABOUT_FOGCATALOG_PATTERNS = [
    'fogcatalog ne',
    'fogcatalog nedir',
    'bu uygulama ne',
    'bu platform ne',
    'bu site ne',
    'bu proje ne',
    'ne ise yar',
    'ne ise yarar',
    'kim yapti',
    'kim gelistir',
    'kim olustur',
    'kimin projesi',
    'hangi ozellik',
    'neler yapabil',
    'ne ozellikleri',
    'ne islevleri',
    'fiyat ne',
    'fiyatlandirma',
    'ucretli mi',
    'ucretsiz mi',
    'plan',
    'nasil calis',
    'nasil kullan',
    'nasil kayit',
    'sablon',
    'template',
    'tema',
    'pdf',
    'qr kod',
    'qr code',
    'analitik',
    'istatistik',
    'excel',
    'csv',
    'import',
    'what is fogcatalog',
    'what does this app',
    'what does this platform',
    'who made',
    'who built',
    'who created',
    'who developed',
    'what features',
    'what can this',
    'how does it work',
    'pricing',
    'is it free',
    'free plan',
    'how to use',
    'how to sign up',
    'templates',
    'themes',
    'analytics',
    'statistics',
] as const

export function isAboutFogCatalogQuestion(message: string): boolean {
    const normalized = normalizeForMatch(message)
    return ABOUT_FOGCATALOG_PATTERNS.some((p) => normalized.includes(p))
}

// aaa Identity & Capabilities Detection aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

export function isIdentityOrCapabilitiesQuestion(message: string): boolean {
    const normalized = normalizeForMatch(message)
    return [
        'kimsin',
        'sen kimsin',
        'ne yapabili',
        'neler yapabili',
        'yardim et',
        'yardim',
        'help',
        'who are you',
        'what can you do',
        'what do you do',
        'capabilities',
        'ozellik',
        'ne is yapar',
        'ne islevlerin',
        'komutlar',
        'commands',
    ].some((token) => normalized.includes(token))
}

// aaa Greeting Detection aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

export function isGreetingMessage(message: string): boolean {
    const normalized = normalizeForMatch(message)
    if (!normalized) return false

    const greetings = [
        'selam',
        'merhaba',
        'slm',
        'hey',
        'sa',
        'iyi gunler',
        'gunaydin',
        'iyi aksamlar',
        'hi',
        'hello',
        'hey there',
    ]

    const stripped = normalized.replace(/[!?.,;:]+$/u, '').trim()
    return greetings.some(
        (item) =>
            stripped === item ||
            stripped.startsWith(`${item} `) ||
            stripped.startsWith(`${item}!`) ||
            stripped.startsWith(`${item},`)
    )
}

// aaa Casual Conversation Detection aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

export type CasualCategory =
    | 'thanks'
    | 'acknowledgment'
    | 'goodbye'
    | 'positive_feedback'
    | 'how_are_you'
    | 'laughter'

const CASUAL_PATTERNS: Record<CasualCategory, readonly string[]> = {
    thanks: [
        'tesekkur',
        'sagol',
        'eyvallah',
        'saol',
        'tesekkurler',
        'eyv',
        'thanks',
        'thank you',
        'thx',
        'ty',
        'thnx',
    ],
    acknowledgment: [
        'tamam',
        'anladim',
        'ok',
        'oldu',
        'peki',
        'tamamdir',
        'got it',
        'understood',
        'alright',
        'okey',
        'okay',
    ],
    goodbye: [
        'gorusuruz',
        'iyi geceler',
        'bye',
        'goodbye',
        'see you',
        'hayirli geceler',
        'hos calin',
        'hoscakal',
        'kendine iyi bak',
        'good night',
        'take care',
        'later',
    ],
    positive_feedback: [
        'harika',
        'guzel',
        'super',
        'muhtesem',
        'bayildim',
        'mukemmel',
        'aferin',
        'bravo',
        'helal',
        'cool',
        'great',
        'awesome',
        'amazing',
        'perfect',
        'nice',
        'wonderful',
    ],
    how_are_you: [
        'nasilsin',
        'ne haber',
        'naber',
        'nabiyon',
        'keyifler',
        'how are you',
        'hows it going',
        'whats up',
        'sup',
    ],
    laughter: ['haha', 'hahaha', 'lol', 'sjsj', 'sksksk', 'random', 'ajsksj', 'asdfg', 'kdkd'],
}

export function detectCasualConversation(message: string): CasualCategory | null {
    const normalized = normalizeForMatch(message)
    if (!normalized || normalized.length > 60) return null

    for (const [category, patterns] of Object.entries(CASUAL_PATTERNS) as Array<
        [CasualCategory, readonly string[]]
    >) {
        if (
            patterns.some(
                (p) =>
                    normalized === p ||
                    normalized.startsWith(`${p} `) ||
                    normalized.endsWith(` ${p}`)
            )
        ) {
            return category
        }
    }

    return null
}

// aaa User Name Extraction aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

export function extractUserNameFromMessage(message: string): string | null {
    const trimmed = message.trim()
    if (!trimmed) return null

    const patterns = [
        /(?:benim adim|adim)\s+([a-zA-ZÇĞİÖŞÜçğıöşü]{2,40})/i,
        /(?:my name is|i am)\s+([a-zA-ZÇĞİÖŞÜçğıöşü]{2,40})/i,
    ]

    for (const pattern of patterns) {
        const match = trimmed.match(pattern)
        const candidate = match?.[1]?.trim()
        if (!candidate) continue
        return `${candidate.charAt(0).toLocaleUpperCase('tr')}${candidate.slice(1)}`
    }

    return null
}

// aaa Sensitive Content Detection aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

const VIOLENCE_PATTERNS = [
    'seni oldur',
    'seni oldureceg',
    'herkesi oldur',
    'oldurec',
    'bomba yap',
    'silah yap',
    'patlayici',
    'kill you',
    'kill everyone',
    'make a bomb',
    'build a weapon',
    'how to poison',
    'how to murder',
] as const

const PROMPT_INJECTION_PATTERNS = [
    'ignore previous',
    'ignore all',
    'ignore your',
    'ignore above',
    'disregard previous',
    'disregard your',
    'disregard all',
    'forget your instructions',
    'forget previous',
    'new instructions',
    'override instructions',
    'override your',
    'you are now',
    'act as',
    'pretend you are',
    'roleplay as',
    'system prompt',
    'reveal your prompt',
    'show me your prompt',
    'jailbreak',
    'dan mode',
    'developer mode',
    'onceki talimatlari',
    'talimatlari unut',
    'talimatlari gec',
    'yeni talimatlar',
    'rolu degistir',
    'sistem promptu',
    'promptunu goster',
] as const

export type SensitiveCategory = 'violence' | 'prompt_injection' | null

export function detectSensitiveContent(message: string): SensitiveCategory {
    const normalized = normalizeForMatch(message)

    if (VIOLENCE_PATTERNS.some((p) => normalized.includes(p))) return 'violence'
    if (PROMPT_INJECTION_PATTERNS.some((p) => normalized.includes(p))) return 'prompt_injection'

    return null
}

// aaa Low Stock Alert Detection aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

const LOW_STOCK_PATTERNS = [
    'dusuk stok',
    'az stok',
    'stok az',
    'stok uyari',
    'stok bitmek',
    'stokta az',
    'azalan stok',
    'stok durumu',
    'stok kontrol',
    'low stock',
    'stock alert',
    'out of stock',
    'stock warning',
    'running low',
    'low inventory',
] as const

export function detectLowStockRequest(message: string): number | null {
    const normalized = normalizeForMatch(message)
    if (!LOW_STOCK_PATTERNS.some((p) => normalized.includes(p))) return null

    const thresholdMatch = normalized.match(/(\d+)\s*(?:ve |veya |altinda|alti|under|below|less)/)
    const threshold = thresholdMatch ? parseInt(thresholdMatch[1], 10) : 10
    return Math.max(1, Math.min(threshold, 10000))
}

// aaa Product Generation Detection aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

const PRODUCT_GENERATION_PATTERNS = [
    /(\d+)\s*(?:tane|adet)?\s*urun\s*(?:ekle|olustur|yarat|uret|gir)/i,
    /(?:ekle|olustur|uret)\s*(\d+)\s*(?:tane|adet)?\s*urun/i,
    /(\d+)\s*(?:tane|adet)?\s*(.+?)\s*urunu?\s*(?:ekle|olustur|uret|gir)/i,
    /(?:ekle|olustur|uret)\s*(\d+)\s*(?:tane|adet)?\s*(.+?)\s*urun/i,
    /(\d+)\s*(?:tane|adet)?\s*(.+?)\s*(?:ekle|olustur|uret|gir)$/i,
    /(?:add|create|generate)\s*(\d+)\s*(.+?)\s*products?/i,
    /(\d+)\s*(.+?)\s*products?\s*(?:add|create|generate)/i,
] as const

export interface ProductGenerationRequest {
    count: number
    theme: string | null
}

export function detectProductGenerationRequest(message: string): ProductGenerationRequest | null {
    const normalized = normalizeForMatch(message)

    for (const pattern of PRODUCT_GENERATION_PATTERNS) {
        const match = normalized.match(pattern)
        if (!match) continue

        const groups = match.slice(1)
        const countStr = groups.find((g) => g && /^\d+$/.test(g.trim()))
        const count = countStr ? parseInt(countStr, 10) : 0

        if (count < 1 || count > 50) continue

        const theme = groups.find((g) => g && !/^\d+$/.test(g.trim()))?.trim() || null

        return { count, theme }
    }

    return null
}

// aaa High Confidence Intent Detection aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// Implementation moved to operations/registry.ts (one detector per operation).
// This is now a thin adapter that wraps the detected op into a ParsedAiResponse.

export function tryHighConfidenceIntent(
    input: ParsedRequest,
    language: Language
): ParsedAiResponse | null {
    const normalized = normalizeForMatch(input.message)
    const match = detectHighConfidenceOperation(normalized)
    if (!match) return null

    const { operation, scope } = match
    const opLabel = describeOperation(operation, language)

    return {
        mode: 'intent',
        assistantMessage:
            language === 'tr'
                ? `Anladım. ${opLabel} için önizleme hazırladım.`
                : `Understood. I prepared a preview for: ${opLabel}.`,
        intent: {
            scope,
            operations: [operation],
            reason:
                language === 'tr'
                    ? `Yüksek güven: ${operation.type} isteği algılandı.`
                    : `High confidence: ${operation.type} request detected.`,
        },
    }
}

// `includesAnyToken` re-export kept for backward compat (used by responses.ts post-filter).
void includesAnyToken
