import { describe, expect, it } from 'vitest'

import { normalizeForMatch } from '@/lib/excel-ai/helpers'
import { detectHighConfidenceOperation } from '@/lib/excel-ai/operations/registry'

interface DetectionCase {
    message: string
    expectedType: string | null
    expectedScope?: 'selected' | 'currentPage' | 'all'
}

const TR_CASES: DetectionCase[] = [
    {
        message: 'secili urunlerin fiyatini %10 arttir',
        expectedType: 'multiply',
        expectedScope: 'selected',
    },
    { message: 'tum fiyatlari %20 azalt', expectedType: 'multiply', expectedScope: 'all' },

    { message: 'tum urunlere SKU uret', expectedType: 'generate_sku', expectedScope: 'all' },
    {
        message: 'secili urunler icin SKU olustur',
        expectedType: 'generate_sku',
        expectedScope: 'selected',
    },
    { message: 'rastgele benzersiz SKU ata', expectedType: 'generate_sku' },

    {
        message: 'tum urunleri mevcut kategorilere yerlestir',
        expectedType: 'generate_category',
        expectedScope: 'all',
    },
    { message: 'urunleri uygun kategoriye eslestir', expectedType: 'generate_category' },

    { message: 'urun adina gore aciklama yaz', expectedType: 'generate_description' },
    {
        message: 'tum aciklamalari uret',
        expectedType: 'generate_description',
        expectedScope: 'all',
    },

    { message: 'mevcut aciklamalari zenginlestir', expectedType: 'enrich_description' },
    { message: 'aciklamalari gelistir', expectedType: 'enrich_description' },
    { message: 'aciklamalari detaylandir', expectedType: 'enrich_description' },

    { message: 'urun isimlerini duzelt', expectedType: 'fix_name' },
    { message: 'isimleri buyuk harfe cevir', expectedType: 'fix_name' },

    { message: 'aciklamalari ingilizceye cevir', expectedType: 'translate' },
    { message: 'kategorileri turkceye cevir', expectedType: 'translate' },

    { message: 'fiyatlari yuvarla', expectedType: 'round_price' },
    { message: 'fiyatlari charm yuvarla', expectedType: 'round_price' },
    { message: 'fiyatlari asagi yuvarla', expectedType: 'round_price' },

    { message: 'bos aciklamalari doldur', expectedType: 'fill_empty' },
    { message: 'eksik kategorileri doldur', expectedType: 'fill_empty' },

    { message: 'merhaba', expectedType: null },
    { message: 'kim yapti bu uygulamayi', expectedType: null },
    { message: 'bir sey yap', expectedType: null },
]

const EN_CASES: DetectionCase[] = [
    { message: 'translate descriptions to english', expectedType: 'translate' },
    { message: 'fill empty descriptions', expectedType: 'fill_empty' },
    { message: 'enrich existing descriptions', expectedType: 'enrich_description' },
    { message: 'hi there', expectedType: null },
]

describe('registry.detectHighConfidenceOperation', () => {
    for (const c of [...TR_CASES, ...EN_CASES]) {
        it(`"${c.message}" => ${c.expectedType ?? 'null'}`, () => {
            const result = detectHighConfidenceOperation(normalizeForMatch(c.message))
            if (c.expectedType === null) {
                expect(result).toBeNull()
            } else {
                expect(result).not.toBeNull()
                expect(result?.operation.type).toBe(c.expectedType)
                if (c.expectedScope) expect(result?.scope).toBe(c.expectedScope)
            }
        })
    }
})

describe('registry.detectHighConfidenceOperation (precedence)', () => {
    it('handles Turkish arttir variant for multiply', () => {
        const result = detectHighConfidenceOperation(
            normalizeForMatch('secili urunlerin fiyatini %10 arttir')
        )
        expect(result?.operation.type).toBe('multiply')
        expect(result?.scope).toBe('selected')
        if (result?.operation.type === 'multiply') {
            expect(result.operation.value).toBe(1.1)
        }
    })

    it('enrichment keywords beat plain description generation', () => {
        const result = detectHighConfidenceOperation(normalizeForMatch('aciklamalari zenginlestir'))
        expect(result?.operation.type).toBe('enrich_description')
    })

    it('translate strategy uses english by default when target unspecified', () => {
        const result = detectHighConfidenceOperation(normalizeForMatch('aciklamayi cevir'))
        expect(result?.operation.type).toBe('translate')
        if (result?.operation.type === 'translate') {
            expect(result.operation.targetLanguage).toBe('en')
        }
    })

    it("scope: 'tum' resolves to all", () => {
        const result = detectHighConfidenceOperation(normalizeForMatch('tum urunlere sku uret'))
        expect(result?.scope).toBe('all')
    })

    it("scope: 'secili' resolves to selected", () => {
        const result = detectHighConfidenceOperation(
            normalizeForMatch('secili urunlerin aciklamalarini yaz')
        )
        expect(result?.scope).toBe('selected')
    })

    it('scope: default resolves to currentPage', () => {
        const result = detectHighConfidenceOperation(normalizeForMatch('aciklamalari zenginlestir'))
        expect(result?.scope).toBe('currentPage')
    })
})
