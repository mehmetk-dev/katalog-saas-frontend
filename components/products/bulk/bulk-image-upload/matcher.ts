import { type Product } from "@/lib/actions/products"

const MIN_SCORE = 0.7

export function normalizeText(text: string): string {
    if (!text) return ""
    return text
        .toLocaleLowerCase("tr")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
        .replace(/\s+/g, " ")
        .trim()
}

export function tokenize(text: string): string[] {
    const normalized = normalizeText(text)
    if (!normalized) return []

    return normalized
        .split(/[-_\s.()[\]{}]+/)
        .filter((word) => word.length >= 2 && !/^\d+$/.test(word))
}

function wordSimilarity(word1: string, word2: string): number {
    if (word1 === word2) return 1
    if (word1.length < 4 || word2.length < 4) return 0

    const minLen = Math.min(word1.length, word2.length)
    if (minLen >= 4 && (word1.startsWith(word2) || word2.startsWith(word1))) {
        return minLen / Math.max(word1.length, word2.length)
    }

    return 0
}

function calculateMatchScore(productTokens: string[], fileTokens: string[]): number {
    if (!productTokens.length || !fileTokens.length) return 0

    let totalScore = 0
    let matchedCount = 0
    const usedProductTokens = new Set<number>()

    for (const fileWord of fileTokens) {
        let bestSimilarity = 0
        let bestMatchIdx = -1

        for (let pi = 0; pi < productTokens.length; pi++) {
            if (usedProductTokens.has(pi)) continue
            const similarity = wordSimilarity(fileWord, productTokens[pi])

            if (similarity > bestSimilarity) {
                bestSimilarity = similarity
                bestMatchIdx = pi
            }
        }

        if (bestSimilarity >= 0.8) {
            matchedCount++
            totalScore += bestSimilarity
            usedProductTokens.add(bestMatchIdx)
        }
    }

    if (!matchedCount) return 0

    const fileMatchRatio = matchedCount / fileTokens.length
    const avgSimilarity = totalScore / matchedCount

    if (fileTokens.length <= 2 && matchedCount >= 1 && avgSimilarity >= 0.95) {
        return wordSimilarity(fileTokens[0], productTokens[0]) >= 0.9 ? 0.9 : 0.8
    }

    if (fileMatchRatio < 0.5) return 0
    return fileMatchRatio * avgSimilarity
}

function isExactSkuMatch(normalizedFileName: string, sku: string): boolean {
    const normalizedSku = normalizeText(sku)
    if (!normalizedSku || normalizedSku.length < 2) return false
    // ReDoS koruması: çok uzun SKU'larda regex backtracking'i engelle
    if (normalizedSku.length > 100) return normalizedFileName.includes(normalizedSku)

    if (normalizedFileName === normalizedSku) return true
    if (
        normalizedFileName.startsWith(`${normalizedSku}-`) ||
        normalizedFileName.startsWith(`${normalizedSku}_`) ||
        normalizedFileName.startsWith(`${normalizedSku} `)
    ) {
        return true
    }

    const skuPattern = new RegExp(`(^|[-_ ])${normalizedSku.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[-_ ])`)
    return skuPattern.test(normalizedFileName)
}

export function findBestProductMatch(fileName: string, products: Product[]): string | null {
    const normalizedFileName = normalizeText(fileName)
    const fileTokens = tokenize(fileName)
    if (!normalizedFileName) return null

    let bestMatch: { productId: string; score: number } | null = null

    for (const product of products) {
        if (product.sku && isExactSkuMatch(normalizedFileName, product.sku)) {
            return product.id
        }

        if (normalizedFileName === normalizeText(product.name)) {
            return product.id
        }

        const score = calculateMatchScore(tokenize(product.name), fileTokens)
        if (score >= MIN_SCORE && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { productId: product.id, score }
        }
    }

    return bestMatch?.productId ?? null
}
