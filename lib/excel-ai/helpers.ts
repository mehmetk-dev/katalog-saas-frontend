import type { Language, CatalogProfile } from "./schemas"

// ─── Text Utilities ─────────────────────────────────────────────────────────

export const TOKEN_STOPWORDS = new Set([
    "ve", "ile", "icin", "için", "the", "and", "for",
    "set", "model", "pro", "plus", "new", "yeni", "urun", "ürün",
])

export function normalizeForMatch(input: string): string {
    return input
        .toLocaleLowerCase("tr")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ı/g, "i")
        .trim()
}

export function includesAnyToken(input: string, tokens: readonly string[]): boolean {
    return tokens.some((token) => input.includes(token))
}

export function clampText(value: string, maxLength = 220): string {
    if (value.length <= maxLength) return value
    return `${value.slice(0, maxLength - 1).trimEnd()}…`
}

export function extractTopKeywords(productNames: string[]): string[] {
    const counts = new Map<string, number>()

    productNames.forEach((name) => {
        const tokens = name.split(/[^\p{L}\p{N}]+/u)
        tokens.forEach((token) => {
            const normalized = normalizeForMatch(token)
            if (!normalized || normalized.length < 3 || TOKEN_STOPWORDS.has(normalized)) return
            counts.set(normalized, (counts.get(normalized) || 0) + 1)
        })
    })

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))
        .slice(0, 3)
        .map(([keyword]) => keyword)
}

// ─── Scope Resolution ───────────────────────────────────────────────────────

export const SELECTED_SCOPE_TOKENS = ["secili", "isaretli", "checked", "selected"] as const
export const ALL_SCOPE_TOKENS = ["tum", "hepsi", "hepsini", "all", "everything"] as const

export function resolveScopeFromMessage(message: string): "selected" | "currentPage" | "all" {
    if (includesAnyToken(message, SELECTED_SCOPE_TOKENS)) return "selected"
    if (includesAnyToken(message, ALL_SCOPE_TOKENS)) return "all"
    return "currentPage"
}

// ─── Guardrail Patterns ─────────────────────────────────────────────────────

export const UNSUPPORTED_CAPABILITY_PATTERNS = [
    "urun ekle", "urun sil", "urun ara", "arama yap",
    "create product", "delete product", "search product",
] as const

// ─── User Note Builder ──────────────────────────────────────────────────────

export function buildUserNoteLine(profile: CatalogProfile | null, language: Language): string {
    if (!profile || profile.totalProducts === 0) {
        return language === "tr"
            ? "Kullanıcı notu: Katalog verin arttıkça daha hedefli öneriler verebilirim."
            : "User note: As your catalog grows, I can provide more tailored guidance."
    }

    const topCategory = profile.topCategories[0]?.name
    const topKeyword = profile.topKeywords[0]

    if (language === "tr") {
        if (topCategory && topKeyword) {
            return `Kullanıcı notu: Kataloğunda ${topCategory} kategorisi ve ${topKeyword} odaklı ürünler öne çıkıyor.`
        }
        if (topCategory) {
            return `Kullanıcı notu: Kataloğunda en yoğun kategori ${topCategory}.`
        }
        return `Kullanıcı notu: Kataloğunda ${profile.totalProducts} ürün bulunuyor.`
    }

    if (topCategory && topKeyword) {
        return `User note: Your catalog is strongest in ${topCategory} with ${topKeyword}-focused products.`
    }
    if (topCategory) {
        return `User note: Your most active category is ${topCategory}.`
    }
    return `User note: Your catalog currently has ${profile.totalProducts} products.`
}
