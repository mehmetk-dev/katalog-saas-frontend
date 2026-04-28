import type { Language } from '../schemas'
import type { ExcelAiOperation, ExcelAiTextField } from '../types'
import { includesAnyToken, resolveScopeFromMessage } from '../helpers'

export interface DetectionContext {
    normalized: string
    scope: 'selected' | 'currentPage' | 'all'
}

export interface FewShotExample {
    tr?: string
    en?: string
    output: {
        scope: 'selected' | 'currentPage' | 'all'
        operations: ExcelAiOperation[]
    }
}

export interface OperationDef<T extends ExcelAiOperation = ExcelAiOperation> {
    id: T['type']
    guide: { tr: string; en: string }
    describe: (op: T, language: Language) => string
    detect?: (ctx: DetectionContext) => T | null
    examples?: FewShotExample[]
}

function parsePercentOrMultiplier(message: string): number | null {
    const xMatch = message.match(/x\s*(\d+(?:[.,]\d+)?)/)
    if (xMatch?.[1]) return Number.parseFloat(xMatch[1].replace(',', '.'))

    const percentMatch = message.match(/%?\s*(\d+(?:[.,]\d+)?)\s*(?:%|yuzde|percent)?/)
    if (!percentMatch?.[1]) return null
    return Number.parseFloat(percentMatch[1].replace(',', '.'))
}

const SET: OperationDef<Extract<ExcelAiOperation, { type: 'set' }>> = {
    id: 'set',
    guide: {
        tr: 'set: Bir alani sabit degere ata. Ornek: stoku 0 yap.',
        en: 'set: Assign a fixed value to a field. e.g. set stock to 0.',
    },
    describe: (op, lang) =>
        lang === 'tr'
            ? `${op.field} alanini ${String(op.value)} yap`
            : `Set ${op.field} to ${String(op.value)}`,
    examples: [
        {
            tr: 'tum urunlerde stoku 0 yap',
            en: 'set stock to 0 for all products',
            output: { scope: 'all', operations: [{ type: 'set', field: 'stock', value: 0 }] },
        },
    ],
}

const MULTIPLY: OperationDef<Extract<ExcelAiOperation, { type: 'multiply' }>> = {
    id: 'multiply',
    guide: {
        tr: 'multiply: Sayisal alani carpanla guncelle. %10 artir => 1.10, %20 azalt => 0.80.',
        en: 'multiply: Update a numeric field by a multiplier. +10% => 1.10, -20% => 0.80.',
    },
    describe: (op, lang) =>
        lang === 'tr'
            ? `${op.field} alanini x${op.value} ile carp`
            : `Multiply ${op.field} by x${op.value}`,
    detect: ({ normalized }) => {
        const hasPriceWord = normalized.includes('fiyat') || normalized.includes('price')
        if (!hasPriceWord) return null

        const wantsIncrease = includesAnyToken(normalized, [
            'artir',
            'arttir',
            'yukselt',
            'zam',
            'increase',
            'raise',
            'up',
        ])
        const wantsDecrease = includesAnyToken(normalized, [
            'azalt',
            'dusur',
            'indirim',
            'decrease',
            'reduce',
            'lower',
            'down',
        ])
        if (!wantsIncrease && !wantsDecrease) return null

        const numericValue = parsePercentOrMultiplier(normalized)
        if (numericValue !== null && Number.isFinite(numericValue) && numericValue > 0) {
            const isExplicitMultiplier = /\bx\s*\d/.test(normalized)
            const multiplier = isExplicitMultiplier
                ? numericValue
                : wantsDecrease
                  ? 1 - numericValue / 100
                  : 1 + numericValue / 100

            if (multiplier > 0) {
                return { type: 'multiply', field: 'price', value: Number(multiplier.toFixed(4)) }
            }
        }

        return { type: 'multiply', field: 'price', value: wantsDecrease ? 0.9 : 1.1 }
    },
    examples: [
        {
            tr: 'secili urunlerin fiyatini %10 artir',
            en: "increase selected products' price by 10%",
            output: {
                scope: 'selected',
                operations: [{ type: 'multiply', field: 'price', value: 1.1 }],
            },
        },
        {
            tr: 'tum fiyatlari %20 dusur',
            en: 'decrease all prices by 20%',
            output: {
                scope: 'all',
                operations: [{ type: 'multiply', field: 'price', value: 0.8 }],
            },
        },
    ],
}

const APPEND_TEXT: OperationDef<Extract<ExcelAiOperation, { type: 'append_text' }>> = {
    id: 'append_text',
    guide: {
        tr: 'append_text: Metin alaninin sonuna ek koy.',
        en: 'append_text: Append text to the end of a text field.',
    },
    describe: (op, lang) =>
        lang === 'tr' ? `${op.field} sonuna metin ekle` : `Append text to ${op.field}`,
    examples: [
        {
            tr: "tum urun isimlerinin sonuna ' - YENI' ekle",
            en: "append ' - NEW' to all product names",
            output: {
                scope: 'all',
                operations: [{ type: 'append_text', field: 'name', text: ' - YENI' }],
            },
        },
    ],
}

const PREPEND_TEXT: OperationDef<Extract<ExcelAiOperation, { type: 'prepend_text' }>> = {
    id: 'prepend_text',
    guide: {
        tr: 'prepend_text: Metin alaninin basina ek koy.',
        en: 'prepend_text: Prepend text to a text field.',
    },
    describe: (op, lang) =>
        lang === 'tr' ? `${op.field} basina metin ekle` : `Prepend text to ${op.field}`,
    examples: [
        {
            tr: "secili urun isimlerinin basina '[YENI] ' ekle",
            en: "prepend '[NEW] ' to selected product names",
            output: {
                scope: 'selected',
                operations: [{ type: 'prepend_text', field: 'name', text: '[YENI] ' }],
            },
        },
    ],
}

const CLEAR: OperationDef<Extract<ExcelAiOperation, { type: 'clear' }>> = {
    id: 'clear',
    guide: {
        tr: 'clear: Alani bosalt.',
        en: 'clear: Empty/clear a field.',
    },
    describe: (op, lang) => (lang === 'tr' ? `${op.field} alanini temizle` : `Clear ${op.field}`),
    examples: [
        {
            tr: 'tum aciklamalari temizle',
            en: 'clear all descriptions',
            output: {
                scope: 'all',
                operations: [{ type: 'clear', field: 'description' }],
            },
        },
    ],
}

const GENERATE_DESCRIPTION: OperationDef<
    Extract<ExcelAiOperation, { type: 'generate_description' }>
> = {
    id: 'generate_description',
    guide: {
        tr: 'generate_description: Urun adina gore yeni aciklama uret. Mevcut aciklamalari yok sayar.',
        en: 'generate_description: Produce a new description from the product name. Ignores existing description.',
    },
    describe: (_op, lang) =>
        lang === 'tr' ? 'Urun adina gore aciklama uret' : 'Generate description from product name',
    detect: ({ normalized }) => {
        const hasField = normalized.includes('aciklama') || normalized.includes('description')
        const hasVerb = includesAnyToken(normalized, [
            'uret',
            'olustur',
            'yaz',
            'ekle',
            'tamamla',
            'generate',
            'write',
            'create',
        ])
        const isEnrich = includesAnyToken(normalized, [
            'zenginlestir',
            'gelistir',
            'iyilestir',
            'detaylandir',
            'enrich',
            'improve',
        ])
        if (!hasField || !hasVerb || isEnrich) return null
        return { type: 'generate_description', field: 'description' }
    },
    examples: [
        {
            tr: 'urun adina gore aciklama yaz',
            en: 'write descriptions from product names',
            output: {
                scope: 'currentPage',
                operations: [{ type: 'generate_description', field: 'description' }],
            },
        },
    ],
}

const GENERATE_CATEGORY: OperationDef<Extract<ExcelAiOperation, { type: 'generate_category' }>> = {
    id: 'generate_category',
    guide: {
        tr: 'generate_category: Urunleri kategorilere yerlestir. useExistingOnly=true ise sadece mevcut kategoriler.',
        en: 'generate_category: Map products into categories. useExistingOnly=true restricts to existing categories.',
    },
    describe: (op, lang) =>
        op.useExistingOnly
            ? lang === 'tr'
                ? 'Mevcut kategorilere akilli yerlestir'
                : 'Map into existing categories'
            : lang === 'tr'
              ? 'Kategori oner'
              : 'Suggest categories',
    detect: ({ normalized }) => {
        const wants =
            normalized.includes('kategori') &&
            includesAnyToken(normalized, [
                'yerlestir',
                'eslestir',
                'siniflandir',
                'dagit',
                'uygun kategori',
            ])
        if (!wants) return null
        return { type: 'generate_category', field: 'category', useExistingOnly: true }
    },
    examples: [
        {
            tr: 'tum urunleri mevcut kategorilere yerlestir',
            en: 'map all products into existing categories',
            output: {
                scope: 'all',
                operations: [
                    { type: 'generate_category', field: 'category', useExistingOnly: true },
                ],
            },
        },
    ],
}

const GENERATE_SKU: OperationDef<Extract<ExcelAiOperation, { type: 'generate_sku' }>> = {
    id: 'generate_sku',
    guide: {
        tr: 'generate_sku: Benzersiz SKU uret. Opsiyonel: prefix, length.',
        en: 'generate_sku: Generate unique SKUs. Optional: prefix, length.',
    },
    describe: (op, lang) => {
        const parts = [lang === 'tr' ? 'SKU uret' : 'Generate SKU']
        if (op.prefix) parts.push(`prefix: ${op.prefix}`)
        if (op.length) parts.push(`${op.length} ${lang === 'tr' ? 'karakter' : 'chars'}`)
        return parts.join(' - ')
    },
    detect: ({ normalized }) => {
        const wants =
            normalized.includes('sku') &&
            includesAnyToken(normalized, [
                'uret',
                'olustur',
                'ata',
                'gir',
                'oner',
                'rastgele',
                'benzersiz',
                'doldur',
            ])
        if (!wants) return null
        return { type: 'generate_sku', field: 'sku' }
    },
    examples: [
        {
            tr: 'tum urunlere SKU uret',
            en: 'generate SKU for all products',
            output: { scope: 'all', operations: [{ type: 'generate_sku', field: 'sku' }] },
        },
    ],
}

const GENERATE_PRICE: OperationDef<Extract<ExcelAiOperation, { type: 'generate_price' }>> = {
    id: 'generate_price',
    guide: {
        tr: 'generate_price: Eksik fiyatlar icin ortalama hesapla. strategy=scope_average|category_average.',
        en: 'generate_price: Compute average for missing prices. strategy=scope_average|category_average.',
    },
    describe: (op, lang) =>
        op.strategy === 'category_average'
            ? lang === 'tr'
                ? 'Kategori bazli ortalama fiyat'
                : 'Category-average price'
            : lang === 'tr'
              ? 'Ortalama fiyat hesapla'
              : 'Average price',
    examples: [
        {
            tr: 'eksik fiyatlari kategori ortalamasiyla doldur',
            en: 'fill missing prices with category average',
            output: {
                scope: 'all',
                operations: [
                    { type: 'generate_price', field: 'price', strategy: 'category_average' },
                ],
            },
        },
    ],
}

const ENRICH_DESCRIPTION: OperationDef<Extract<ExcelAiOperation, { type: 'enrich_description' }>> =
    {
        id: 'enrich_description',
        guide: {
            tr: "enrich_description: Mevcut aciklamayi zenginlestirir. generate_description'dan farkli olarak eski metni baz alir.",
            en: 'enrich_description: Enhance EXISTING description text.',
        },
        describe: (_op, lang) =>
            lang === 'tr' ? 'Mevcut aciklamalari zenginlestir' : 'Enrich existing descriptions',
        detect: ({ normalized }) => {
            const hasField = normalized.includes('aciklama') || normalized.includes('description')
            const hasVerb = includesAnyToken(normalized, [
                'zenginlestir',
                'gelistir',
                'iyilestir',
                'detaylandir',
                'enrich',
                'improve',
            ])
            if (!hasField || !hasVerb) return null
            return { type: 'enrich_description', field: 'description' }
        },
        examples: [
            {
                tr: 'mevcut aciklamalari zenginlestir',
                en: 'enrich existing descriptions',
                output: {
                    scope: 'currentPage',
                    operations: [{ type: 'enrich_description', field: 'description' }],
                },
            },
        ],
    }

const FIX_NAME: OperationDef<Extract<ExcelAiOperation, { type: 'fix_name' }>> = {
    id: 'fix_name',
    guide: {
        tr: 'fix_name: Urun adlarini duzelt - buyuk harf, yazim duzeni.',
        en: 'fix_name: Fix product names - capitalization, typos.',
    },
    describe: (_op, lang) => (lang === 'tr' ? 'Urun adlarini duzelt' : 'Fix product names'),
    detect: ({ normalized }) => {
        const hasNameWord =
            normalized.includes('isim') || normalized.includes('ad') || normalized.includes('name')
        const hasFixWord = includesAnyToken(normalized, [
            'duzelt',
            'duzenle',
            'fix',
            'temizle',
            'buyuk harf',
            'capitalize',
        ])
        if (!hasNameWord || !hasFixWord) return null
        return { type: 'fix_name', field: 'name' }
    },
    examples: [
        {
            tr: 'urun isimlerini duzelt',
            en: 'fix product names',
            output: { scope: 'currentPage', operations: [{ type: 'fix_name', field: 'name' }] },
        },
    ],
}

const TRANSLATE: OperationDef<Extract<ExcelAiOperation, { type: 'translate' }>> = {
    id: 'translate',
    guide: {
        tr: 'translate: Metin alanini cevir. field=name|sku|category|description|product_url targetLanguage=tr|en.',
        en: 'translate: Translate text field. field=name|sku|category|description|product_url targetLanguage=tr|en.',
    },
    describe: (op, lang) => {
        const target =
            op.targetLanguage === 'tr'
                ? lang === 'tr'
                    ? 'Turkce'
                    : 'Turkish'
                : lang === 'tr'
                  ? 'Ingilizce'
                  : 'English'
        return lang === 'tr'
            ? `${op.field} alanini ${target}'ye cevir`
            : `Translate ${op.field} to ${target}`
    },
    detect: ({ normalized }) => {
        const wants = includesAnyToken(normalized, [
            'cevir',
            'translate',
            'ingilizcey',
            'turkcey',
            'ingilizce yap',
            'turkce yap',
        ])
        if (!wants) return null
        const targetLanguage: 'tr' | 'en' = includesAnyToken(normalized, ['turkce', 'turkcey'])
            ? 'tr'
            : 'en'
        const field: ExcelAiTextField =
            normalized.includes('aciklama') || normalized.includes('description')
                ? 'description'
                : normalized.includes('kategori') || normalized.includes('category')
                  ? 'category'
                  : 'name'
        return { type: 'translate', field, targetLanguage }
    },
    examples: [
        {
            tr: 'aciklamalari ingilizceye cevir',
            en: 'translate descriptions to English',
            output: {
                scope: 'currentPage',
                operations: [{ type: 'translate', field: 'description', targetLanguage: 'en' }],
            },
        },
    ],
}

const ROUND_PRICE: OperationDef<Extract<ExcelAiOperation, { type: 'round_price' }>> = {
    id: 'round_price',
    guide: {
        tr: 'round_price: Fiyatlari yuvarla. strategy=floor|nearest|charm.',
        en: 'round_price: Round prices. strategy=floor|nearest|charm.',
    },
    describe: (op, lang) => {
        const strat =
            op.strategy === 'charm'
                ? lang === 'tr'
                    ? 'psikolojik'
                    : 'charm'
                : op.strategy === 'floor'
                  ? lang === 'tr'
                      ? 'asagi'
                      : 'floor'
                  : lang === 'tr'
                    ? 'en yakin'
                    : 'nearest'
        return lang === 'tr' ? `Fiyatlari yuvarla (${strat})` : `Round prices (${strat})`
    },
    detect: ({ normalized }) => {
        const hasPriceWord = normalized.includes('fiyat') || normalized.includes('price')
        const hasRoundWord = includesAnyToken(normalized, ['yuvarla', 'round', 'tam sayi', 'x9'])
        if (!hasPriceWord || !hasRoundWord) return null
        const strategy: 'floor' | 'nearest' | 'charm' =
            normalized.includes('charm') ||
            normalized.includes('psikoloji') ||
            normalized.includes('x9')
                ? 'charm'
                : normalized.includes('asagi') || normalized.includes('floor')
                  ? 'floor'
                  : 'nearest'
        return { type: 'round_price', field: 'price', strategy }
    },
    examples: [
        {
            tr: 'fiyatlari charm yontemiyle yuvarla',
            en: 'round prices with charm strategy',
            output: {
                scope: 'currentPage',
                operations: [{ type: 'round_price', field: 'price', strategy: 'charm' }],
            },
        },
    ],
}

const FILL_EMPTY: OperationDef<Extract<ExcelAiOperation, { type: 'fill_empty' }>> = {
    id: 'fill_empty',
    guide: {
        tr: 'fill_empty: Sadece bos alanlari doldur. field=description|category|sku|price.',
        en: 'fill_empty: Fill only empty cells. field=description|category|sku|price.',
    },
    describe: (op, lang) =>
        lang === 'tr' ? `Bos ${op.field} alanlarini doldur` : `Fill empty ${op.field} fields`,
    detect: ({ normalized }) => {
        const hasEmptyWord = includesAnyToken(normalized, [
            'bos',
            'eksik',
            'empty',
            'missing',
            'olmayan',
        ])
        const hasFillWord = includesAnyToken(normalized, [
            'doldur',
            'yaz',
            'uret',
            'olustur',
            'fill',
            'generate',
        ])
        if (!hasEmptyWord || !hasFillWord) return null
        const field: 'description' | 'category' | 'sku' | 'price' =
            normalized.includes('aciklama') || normalized.includes('description')
                ? 'description'
                : normalized.includes('kategori') || normalized.includes('category')
                  ? 'category'
                  : normalized.includes('sku')
                    ? 'sku'
                    : normalized.includes('fiyat') || normalized.includes('price')
                      ? 'price'
                      : 'description'
        return { type: 'fill_empty', field }
    },
    examples: [
        {
            tr: 'bos aciklamalari doldur',
            en: 'fill empty descriptions',
            output: {
                scope: 'currentPage',
                operations: [{ type: 'fill_empty', field: 'description' }],
            },
        },
    ],
}

export const OPERATION_DEFS: ReadonlyArray<OperationDef> = [
    SET,
    MULTIPLY,
    APPEND_TEXT,
    PREPEND_TEXT,
    CLEAR,
    GENERATE_DESCRIPTION,
    GENERATE_CATEGORY,
    GENERATE_SKU,
    GENERATE_PRICE,
    ENRICH_DESCRIPTION,
    FIX_NAME,
    TRANSLATE,
    ROUND_PRICE,
    FILL_EMPTY,
] as OperationDef[]

const OPERATION_BY_ID = new Map(OPERATION_DEFS.map((op) => [op.id, op]))

export function getOperationDef(type: ExcelAiOperation['type']): OperationDef | undefined {
    return OPERATION_BY_ID.get(type)
}

export function describeOperation(op: ExcelAiOperation, language: Language): string {
    const def = getOperationDef(op.type)
    if (!def) return language === 'tr' ? `${op.type} islemi` : `${op.type} operation`
    return (def.describe as (value: ExcelAiOperation, lang: Language) => string)(op, language)
}

export function listOperationIds(): string {
    return OPERATION_DEFS.map((o) => o.id).join(', ')
}

export function buildOperationGuide(language: Language): string {
    return OPERATION_DEFS.map((o) => `- ${o.guide[language]}`).join('\n')
}

export function buildFewShotExamples(language: Language): string {
    const lines: string[] = []
    for (const op of OPERATION_DEFS) {
        if (!op.examples?.length) continue
        for (const ex of op.examples) {
            const userText = language === 'tr' ? (ex.tr ?? ex.en) : (ex.en ?? ex.tr)
            if (!userText) continue
            const json = JSON.stringify({
                mode: 'intent',
                intent: { ...ex.output, reason: 'few-shot example' },
                assistantMessage: language === 'tr' ? 'Onizleme hazir.' : 'Preview ready.',
            })
            lines.push(`User: ${userText}`)
            lines.push(`Assistant: ${json}`)
        }
    }
    return lines.join('\n')
}

export function detectHighConfidenceOperation(
    normalizedMessage: string
): { operation: ExcelAiOperation; scope: 'selected' | 'currentPage' | 'all' } | null {
    const scope = resolveScopeFromMessage(normalizedMessage)
    const ctx: DetectionContext = { normalized: normalizedMessage, scope }
    for (const op of OPERATION_DEFS) {
        const match = op.detect?.(ctx)
        if (match) return { operation: match, scope }
    }
    return null
}
