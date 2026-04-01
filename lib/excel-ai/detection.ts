import type { Language, ParsedRequest, ParsedAiResponse } from "./schemas"
import { normalizeForMatch, includesAnyToken, resolveScopeFromMessage } from "./helpers"

// ─── FogCatalog Knowledge Base Detection ────────────────────────────────────

export const ABOUT_FOGCATALOG_PATTERNS = [
    "fogcatalog ne", "fogcatalog nedir", "bu uygulama ne", "bu platform ne",
    "bu site ne", "bu proje ne", "ne ise yar", "ne ise yarar",
    "kim yapti", "kim gelistir", "kim olustur", "kimin projesi",
    "hangi ozellik", "neler yapabil", "ne ozellikleri", "ne islevleri",
    "fiyat ne", "fiyatlandirma", "ucretli mi", "ucretsiz mi", "plan",
    "nasil calis", "nasil kullan", "nasil kayit",
    "sablon", "template", "tema",
    "pdf", "qr kod", "qr code",
    "analitik", "istatistik",
    "excel", "csv", "import",
    "what is fogcatalog", "what does this app", "what does this platform",
    "who made", "who built", "who created", "who developed",
    "what features", "what can this", "how does it work",
    "pricing", "is it free", "free plan",
    "how to use", "how to sign up",
    "templates", "themes",
    "analytics", "statistics",
] as const

export function isAboutFogCatalogQuestion(message: string): boolean {
    const normalized = normalizeForMatch(message)
    return ABOUT_FOGCATALOG_PATTERNS.some((p) => normalized.includes(p))
}

// ─── Identity & Capabilities Detection ──────────────────────────────────────

export function isIdentityOrCapabilitiesQuestion(message: string): boolean {
    const normalized = normalizeForMatch(message)
    return [
        "kimsin", "sen kimsin", "ne yapabili", "neler yapabili",
        "yardim et", "yardim", "help", "who are you",
        "what can you do", "what do you do", "capabilities",
        "ozellik", "ne is yapar", "ne islevlerin", "komutlar", "commands",
    ].some((token) => normalized.includes(token))
}

// ─── Greeting Detection ─────────────────────────────────────────────────────

export function isGreetingMessage(message: string): boolean {
    const normalized = normalizeForMatch(message)
    if (!normalized) return false

    const greetings = [
        "selam", "merhaba", "slm", "hey", "sa",
        "iyi gunler", "gunaydin", "iyi aksamlar",
        "hi", "hello", "hey there",
    ]

    return greetings.some((item) => normalized === item || normalized.startsWith(`${item} `))
}

// ─── Casual Conversation Detection ──────────────────────────────────────────

export type CasualCategory = "thanks" | "acknowledgment" | "goodbye" | "positive_feedback" | "how_are_you" | "laughter"

const CASUAL_PATTERNS: Record<CasualCategory, readonly string[]> = {
    thanks: [
        "tesekkur", "sagol", "eyvallah", "saol", "tesekkurler", "eyv",
        "thanks", "thank you", "thx", "ty", "thnx",
    ],
    acknowledgment: [
        "tamam", "anladim", "ok", "oldu", "peki", "tamamdir",
        "got it", "understood", "alright", "okey", "okay",
    ],
    goodbye: [
        "gorusuruz", "iyi geceler", "bye", "goodbye", "see you",
        "hayirli geceler", "hos calin", "hoscakal", "kendine iyi bak",
        "good night", "take care", "later",
    ],
    positive_feedback: [
        "harika", "guzel", "super", "muhtesem", "bayildim", "mukemmel",
        "aferin", "bravo", "helal", "cool", "great", "awesome",
        "amazing", "perfect", "nice", "wonderful",
    ],
    how_are_you: [
        "nasilsin", "ne haber", "naber", "nabiyon", "keyifler",
        "how are you", "hows it going", "whats up", "sup",
    ],
    laughter: [
        "haha", "hahaha", "lol", "sjsj", "sksksk", "random",
        "ajsksj", "asdfg", "kdkd",
    ],
}

export function detectCasualConversation(message: string): CasualCategory | null {
    const normalized = normalizeForMatch(message)
    if (!normalized || normalized.length > 60) return null

    for (const [category, patterns] of Object.entries(CASUAL_PATTERNS) as Array<[CasualCategory, readonly string[]]>) {
        if (patterns.some((p) => normalized === p || normalized.startsWith(`${p} `) || normalized.endsWith(` ${p}`))) {
            return category
        }
    }

    return null
}

// ─── User Name Extraction ───────────────────────────────────────────────────

export function extractUserNameFromMessage(message: string): string | null {
    const trimmed = message.trim()
    if (!trimmed) return null

    const patterns = [
        /(?:benim adim|adim)\s+([a-zA-ZçğıöşüÇĞİÖŞÜ]{2,40})/i,
        /(?:my name is|i am)\s+([a-zA-ZçğıöşüÇĞİÖŞÜ]{2,40})/i,
    ]

    for (const pattern of patterns) {
        const match = trimmed.match(pattern)
        const candidate = match?.[1]?.trim()
        if (!candidate) continue
        return `${candidate.charAt(0).toLocaleUpperCase("tr")}${candidate.slice(1)}`
    }

    return null
}

// ─── Sensitive Content Detection ────────────────────────────────────────────

const VIOLENCE_PATTERNS = [
    "seni oldur", "seni oldureceg", "herkesi oldur", "oldurec",
    "bomba yap", "silah yap", "patlayici",
    "kill you", "kill everyone", "make a bomb", "build a weapon",
    "how to poison", "how to murder",
] as const

const PROMPT_INJECTION_PATTERNS = [
    "ignore previous", "ignore all", "ignore your", "ignore above",
    "disregard previous", "disregard your", "disregard all",
    "forget your instructions", "forget previous",
    "new instructions", "override instructions", "override your",
    "you are now", "act as", "pretend you are", "roleplay as",
    "system prompt", "reveal your prompt", "show me your prompt",
    "jailbreak", "dan mode", "developer mode",
    "onceki talimatlari", "talimatlari unut", "talimatlari gec",
    "yeni talimatlar", "rolu degistir",
    "sistem promptu", "promptunu goster",
] as const

export type SensitiveCategory = "violence" | "prompt_injection" | null

export function detectSensitiveContent(message: string): SensitiveCategory {
    const normalized = normalizeForMatch(message)

    if (VIOLENCE_PATTERNS.some((p) => normalized.includes(p))) return "violence"
    if (PROMPT_INJECTION_PATTERNS.some((p) => normalized.includes(p))) return "prompt_injection"

    return null
}

// ─── Low Stock Alert Detection ──────────────────────────────────────────────

const LOW_STOCK_PATTERNS = [
    "dusuk stok", "az stok", "stok az", "stok uyari", "stok bitmek",
    "stokta az", "azalan stok", "stok durumu", "stok kontrol",
    "low stock", "stock alert", "out of stock", "stock warning",
    "running low", "low inventory",
] as const

export function detectLowStockRequest(message: string): number | null {
    const normalized = normalizeForMatch(message)
    if (!LOW_STOCK_PATTERNS.some((p) => normalized.includes(p))) return null

    const thresholdMatch = normalized.match(/(\d+)\s*(?:ve |veya |altinda|alti|under|below|less)/)
    const threshold = thresholdMatch ? parseInt(thresholdMatch[1], 10) : 10
    return Math.max(1, Math.min(threshold, 10000))
}

// ─── Product Generation Detection ───────────────────────────────────────────

const PRODUCT_GENERATION_PATTERNS = [
    /(\d+)\s*(?:tane|adet)?\s*(?:urun|ürün)\s*(?:ekle|olustur|yarat|uret|üret|gir)/i,
    /(?:ekle|olustur|uret|üret)\s*(\d+)\s*(?:tane|adet)?\s*(?:urun|ürün)/i,
    /(\d+)\s*(?:tane|adet)?\s*(.+?)\s*(?:urun(?:u|ü)?|ürün(?:ü)?)\s*(?:ekle|olustur|uret|üret|gir)/i,
    /(?:ekle|olustur|uret|üret)\s*(\d+)\s*(?:tane|adet)?\s*(.+?)\s*(?:urun|ürün)/i,
    /(\d+)\s*(?:tane|adet)?\s*(.+?)\s*(?:ekle|olustur|uret|üret|gir)$/i,
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

// ─── High Confidence Intent Detection ───────────────────────────────────────

export function tryHighConfidenceIntent(input: ParsedRequest, language: Language): ParsedAiResponse | null {
    const normalized = normalizeForMatch(input.message)
    const scope = resolveScopeFromMessage(normalized)

    const wantsSku = normalized.includes("sku") && includesAnyToken(normalized, [
        "uret", "olustur", "ata", "gir", "oner", "rastgele", "benzersiz",
    ])

    if (wantsSku) {
        return {
            mode: "intent",
            assistantMessage:
                language === "tr"
                    ? "Anladım. İstenen kapsamdaki ürünler için SKU üretimi önizlemesini hazırladım."
                    : "Understood. I prepared a SKU generation preview for the requested scope.",
            intent: {
                scope,
                operations: [{ type: "generate_sku", field: "sku" }],
                reason: language === "tr" ? "Yüksek güven: SKU üretme isteği algılandı." : "High confidence: SKU generation request detected.",
            },
        }
    }

    const wantsCategory =
        normalized.includes("kategori") &&
        includesAnyToken(normalized, ["yerlestir", "eslestir", "siniflandir", "dagit", "uygun kategori"])

    if (wantsCategory) {
        return {
            mode: "intent",
            assistantMessage:
                language === "tr"
                    ? "Anladım. Ürünleri mevcut kategorilere yerleştirmek için önizleme hazırladım."
                    : "Understood. I prepared a preview to map products to existing categories.",
            intent: {
                scope,
                operations: [{ type: "generate_category", field: "category", useExistingOnly: true }],
                reason: language === "tr" ? "Yüksek güven: kategori yerleştirme isteği algılandı." : "High confidence: category mapping request detected.",
            },
        }
    }

    const wantsDescription =
        normalized.includes("aciklama") && includesAnyToken(normalized, ["uret", "olustur", "yaz", "ekle", "tamamla"])

    if (wantsDescription) {
        return {
            mode: "intent",
            assistantMessage:
                language === "tr"
                    ? "Anladım. Ürün adına göre açıklama üretimi için önizleme hazırladım."
                    : "Understood. I prepared a preview for description generation from product names.",
            intent: {
                scope,
                operations: [{ type: "generate_description", field: "description" }],
                reason: language === "tr" ? "Yüksek güven: açıklama üretme isteği algılandı." : "High confidence: description generation request detected.",
            },
        }
    }

    const wantsEnrichDescription =
        normalized.includes("aciklama") && includesAnyToken(normalized, ["zenginlestir", "gelistir", "iyilestir", "detaylandir", "enrich", "improve"])

    if (wantsEnrichDescription) {
        return {
            mode: "intent",
            assistantMessage:
                language === "tr"
                    ? "Anladım. Mevcut açıklamaları zenginleştirmek için önizleme hazırladım."
                    : "Understood. I prepared a preview to enrich existing descriptions.",
            intent: {
                scope,
                operations: [{ type: "enrich_description", field: "description" }],
                reason: language === "tr" ? "Yüksek güven: açıklama zenginleştirme isteği algılandı." : "High confidence: description enrichment request detected.",
            },
        }
    }

    const wantsFixName =
        (normalized.includes("isim") || normalized.includes("ad") || normalized.includes("name")) &&
        includesAnyToken(normalized, ["duzelt", "duzenle", "fix", "temizle", "buyuk harf", "capitalize"])

    if (wantsFixName) {
        return {
            mode: "intent",
            assistantMessage:
                language === "tr"
                    ? "Anladım. Ürün adlarını düzeltmek için önizleme hazırladım."
                    : "Understood. I prepared a preview to fix product names.",
            intent: {
                scope,
                operations: [{ type: "fix_name", field: "name" }],
                reason: language === "tr" ? "Yüksek güven: isim düzeltme isteği algılandı." : "High confidence: name fix request detected.",
            },
        }
    }

    const wantsTranslate = includesAnyToken(normalized, ["cevir", "translate", "ingilizcey", "turkcey", "ingilizce yap", "turkce yap"])

    if (wantsTranslate) {
        const targetLang: "tr" | "en" = includesAnyToken(normalized, ["turkce", "turkcey"]) ? "tr" : "en"
        const field = normalized.includes("aciklama") || normalized.includes("description")
            ? "description"
            : normalized.includes("kategori") || normalized.includes("category")
                ? "category"
                : "name"

        return {
            mode: "intent",
            assistantMessage:
                language === "tr"
                    ? `Anladım. ${field} alanını ${targetLang === "tr" ? "Türkçe" : "İngilizce"}'ye çevirmek için önizleme hazırladım.`
                    : `Understood. I prepared a preview to translate ${field} to ${targetLang === "tr" ? "Turkish" : "English"}.`,
            intent: {
                scope,
                operations: [{ type: "translate", field: field as "name" | "description" | "category", targetLanguage: targetLang }],
                reason: language === "tr" ? "Yüksek güven: çeviri isteği algılandı." : "High confidence: translation request detected.",
            },
        }
    }

    const wantsRoundPrice =
        (normalized.includes("fiyat") || normalized.includes("price")) &&
        includesAnyToken(normalized, ["yuvarla", "round", "duzelt", "tam sayi", "x9"])

    if (wantsRoundPrice) {
        const strategy = normalized.includes("charm") || normalized.includes("psikoloji") || normalized.includes("x9")
            ? "charm"
            : normalized.includes("asagi") || normalized.includes("floor")
                ? "floor"
                : "nearest"

        return {
            mode: "intent",
            assistantMessage:
                language === "tr"
                    ? "Anladım. Fiyatları yuvarlamak için önizleme hazırladım."
                    : "Understood. I prepared a preview to round prices.",
            intent: {
                scope,
                operations: [{ type: "round_price", field: "price", strategy }],
                reason: language === "tr" ? "Yüksek güven: fiyat yuvarlama isteği algılandı." : "High confidence: price rounding request detected.",
            },
        }
    }

    const wantsFillEmpty =
        includesAnyToken(normalized, ["bos", "eksik", "empty", "missing", "olmayan"]) &&
        includesAnyToken(normalized, ["doldur", "yaz", "uret", "olustur", "fill", "generate"])

    if (wantsFillEmpty) {
        const field = normalized.includes("aciklama") || normalized.includes("description")
            ? "description"
            : normalized.includes("kategori") || normalized.includes("category")
                ? "category"
                : normalized.includes("sku")
                    ? "sku"
                    : normalized.includes("fiyat") || normalized.includes("price")
                        ? "price"
                        : "description"

        return {
            mode: "intent",
            assistantMessage:
                language === "tr"
                    ? `Anladım. Boş ${field} alanlarını doldurmak için önizleme hazırladım.`
                    : `Understood. I prepared a preview to fill empty ${field} fields.`,
            intent: {
                scope,
                operations: [{ type: "fill_empty", field: field as "description" | "category" | "sku" | "price" }],
                reason: language === "tr" ? "Yüksek güven: boş alan doldurma isteği algılandı." : "High confidence: fill empty request detected.",
            },
        }
    }

    return null
}
