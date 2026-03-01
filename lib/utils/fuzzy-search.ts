/**
 * Fuzzy Search Utility
 * Yazım hatalarını tolere eden akıllı arama
 */

interface FuzzySearchOptions {
    /** Minimum eşleşme skoru (0-1) - varsayılan 0.3 */
    threshold?: number
    /** Büyük/küçük harf duyarlılığı - varsayılan false */
    caseSensitive?: boolean
    /** Aranacak alanlar */
    keys?: string[]
}

interface FuzzySearchResult<T> {
    item: T
    score: number
    matches: string[]
}

/**
 * Levenshtein distance - iki string arasındaki düzenleme mesafesi
 * Optimized: O(min(m,n)) memory instead of O(m*n)
 */
function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length
    const n = str2.length

    // Boş string kontrolü
    if (m === 0) return n
    if (n === 0) return m

    // Ensure str2 is the shorter string for optimal memory usage
    if (m < n) return levenshteinDistance(str2, str1)

    // Two-row DP — only O(n) memory
    let prev = Array.from({ length: n + 1 }, (_, i) => i)
    let curr = new Array<number>(n + 1)

    for (let i = 1; i <= m; i++) {
        curr[0] = i
        for (let j = 1; j <= n; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
            curr[j] = Math.min(
                prev[j] + 1,      // silme
                curr[j - 1] + 1,   // ekleme
                prev[j - 1] + cost // değiştirme
            )
        }
        // Swap rows
        ;[prev, curr] = [curr, prev]
    }

    return prev[n]
}

/**
 * Türkçe karakterleri normalize et
 */
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/İ/g, 'i')
        .replace(/Ğ/g, 'g')
        .replace(/Ü/g, 'u')
        .replace(/Ş/g, 's')
        .replace(/Ö/g, 'o')
        .replace(/Ç/g, 'c')
}

/**
 * İki string arasındaki benzerlik skoru (0-1)
 */
export function similarity(str1: string, str2: string, caseSensitive = false): number {
    const s1 = caseSensitive ? str1 : normalizeText(str1)
    const s2 = caseSensitive ? str2 : normalizeText(str2)

    if (s1 === s2) return 1
    if (s1.length === 0 || s2.length === 0) return 0

    const distance = levenshteinDistance(s1, s2)
    const maxLength = Math.max(s1.length, s2.length)

    return 1 - distance / maxLength
}

/**
 * Bir string'in başka bir string'i içerip içermediğini kontrol et
 */
export function containsMatch(haystack: string, needle: string, caseSensitive = false): boolean {
    const h = caseSensitive ? haystack : normalizeText(haystack)
    const n = caseSensitive ? needle : normalizeText(needle)
    return h.includes(n)
}

/**
 * Kelime bazlı eşleşme skoru
 */
export function wordMatchScore(text: string, query: string, caseSensitive = false): number {
    const t = caseSensitive ? text : normalizeText(text)
    const q = caseSensitive ? query : normalizeText(query)

    const textWords = t.split(/\s+/).filter(w => w.length > 0)
    const queryWords = q.split(/\s+/).filter(w => w.length > 0)

    if (queryWords.length === 0) return 0

    let matchedWords = 0
    let totalScore = 0

    for (const queryWord of queryWords) {
        let bestMatch = 0
        for (const textWord of textWords) {
            // Tam eşleşme
            if (textWord === queryWord) {
                bestMatch = 1
                break
            }
            // Başlangıç eşleşmesi
            if (textWord.startsWith(queryWord) || queryWord.startsWith(textWord)) {
                bestMatch = Math.max(bestMatch, 0.8)
            }
            // Fuzzy eşleşme
            const sim = similarity(textWord, queryWord, caseSensitive)
            if (sim > 0.6) {
                bestMatch = Math.max(bestMatch, sim * 0.7)
            }
        }
        if (bestMatch > 0) matchedWords++
        totalScore += bestMatch
    }

    // Eşleşen kelime oranı + ortalama skor
    const matchRatio = matchedWords / queryWords.length
    const avgScore = totalScore / queryWords.length

    return (matchRatio * 0.5) + (avgScore * 0.5)
}

/**
 * Fuzzy search - bir dizi içinde arama yap
 */
export function fuzzySearch<T>(
    items: T[],
    query: string,
    options: FuzzySearchOptions = {}
): FuzzySearchResult<T>[] {
    const {
        threshold = 0.3,
        caseSensitive = false,
        keys = []
    } = options

    if (!query || query.trim().length === 0) {
        return items.map(item => ({ item, score: 1, matches: [] }))
    }

    const normalizedQuery = caseSensitive ? query.trim() : normalizeText(query.trim())
    const results: FuzzySearchResult<T>[] = []

    for (const item of items) {
        let bestScore = 0
        const matches: string[] = []

        // Aranacak alanları belirle
        const searchFields: string[] = []

        if (keys.length > 0) {
            for (const key of keys) {
                const value = getNestedValue(item, key)
                if (typeof value === 'string') {
                    searchFields.push(value)
                }
            }
        } else if (typeof item === 'string') {
            searchFields.push(item)
        } else if (typeof item === 'object' && item !== null) {
            // Tüm string alanları ara
            for (const value of Object.values(item)) {
                if (typeof value === 'string') {
                    searchFields.push(value)
                }
            }
        }

        // Her alanda ara
        for (const field of searchFields) {
            const normalizedField = caseSensitive ? field : normalizeText(field)

            // Tam içerme kontrolü (en yüksek öncelik)
            if (containsMatch(normalizedField, normalizedQuery, true)) {
                bestScore = Math.max(bestScore, 0.9)
                matches.push(field)
                continue
            }

            // Kelime bazlı eşleşme
            const wordScore = wordMatchScore(field, query, caseSensitive)
            if (wordScore > threshold) {
                bestScore = Math.max(bestScore, wordScore)
                matches.push(field)
            }

            // Fuzzy eşleşme
            const sim = similarity(normalizedField, normalizedQuery, true)
            if (sim > threshold) {
                bestScore = Math.max(bestScore, sim * 0.8)
                matches.push(field)
            }
        }

        if (bestScore >= threshold) {
            results.push({ item, score: bestScore, matches: [...new Set(matches)] })
        }
    }

    // Skora göre sırala (yüksekten düşüğe)
    return results.sort((a, b) => b.score - a.score)
}

/**
 * Nested object value getter
 */
function getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => {
        if (current && typeof current === 'object' && key in current) {
            return (current as Record<string, unknown>)[key]
        }
        return undefined
    }, obj as unknown)
}

/**
 * Highlight matched text
 */
export function highlightMatch(text: string, query: string): string {
    if (!query) return text

    const normalizedText = normalizeText(text)
    const normalizedQuery = normalizeText(query)

    const index = normalizedText.indexOf(normalizedQuery)
    if (index === -1) return text

    const before = text.slice(0, index)
    const match = text.slice(index, index + query.length)
    const after = text.slice(index + query.length)

    return `${before}<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">${match}</mark>${after}`
}

/**
 * React hook için basit arama fonksiyonu
 */
export function createSearchFilter<T>(
    keys: string[],
    threshold: number = 0.3
): (items: T[], query: string) => T[] {
    return (items: T[], query: string) => {
        if (!query || query.trim().length === 0) return items

        const results = fuzzySearch(items, query, { keys, threshold })
        return results.map(r => r.item)
    }
}
