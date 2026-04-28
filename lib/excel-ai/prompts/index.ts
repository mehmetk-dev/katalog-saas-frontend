/**
 * System & user prompt builder.
 * Composed from small modules — no more single 113-line concat blob.
 */

import type { Language, ParsedRequest } from '../schemas'
import { buildOperationGuide, buildFewShotExamples, listOperationIds } from '../operations/registry'

import { PERSONA } from './sections/persona'
import { SAFETY } from './sections/safety'
import { ABOUT_FOGCATALOG } from './sections/about'
import { OUTPUT_FORMAT } from './sections/output-format'
import { CONVERSATION_RULES } from './sections/conversation-rules'

function buildGenerateProductsExample(language: Language): string {
    const userText =
        language === 'tr'
            ? 'kahve temali 3 urun olustur'
            : 'create 3 coffee-themed products'
    const json = JSON.stringify({
        mode: 'generate_products',
        assistantMessage:
            language === 'tr'
                ? 'Onay icin 3 urun onerisi hazirladim.'
                : 'Prepared 3 product suggestions for approval.',
        products: [
            {
                name: 'Espresso Blend 250g',
                description:
                    language === 'tr'
                        ? 'Yogun aromali espresso harmani, 250g cekirdek.'
                        : 'Rich espresso blend, 250g whole bean.',
                price: 189.9,
                stock: 50,
                category: language === 'tr' ? 'Kahve' : 'Coffee',
                sku: 'COF-ESP-250',
            },
        ],
    })
    return [`User: ${userText}`, `Assistant: ${json}`].join('\n')
}

// ─── System Prompt ──────────────────────────────────────────────────────────

export interface BuildSystemPromptOptions {
    useTools?: boolean
}

function buildToolCallingInstructions(language: Language): string {
    return [
        language === 'tr'
            ? 'Cevabini normal content olarak JSON yazmadan, tam olarak bir tool call ile ver.'
            : 'Respond with exactly one tool call. Do not write JSON in normal content.',
        language === 'tr'
            ? "Veri degisikligi icin apply_bulk_edit tool'unu kullan."
            : 'Use apply_bulk_edit for product data changes.',
        language === 'tr'
            ? "Sohbet, selamlama, platform veya yetenek sorulari icin chat_response tool'unu kullan."
            : 'Use chat_response for chat, greetings, platform, or capability questions.',
        language === 'tr'
            ? "Istek belirsizse ask_clarification tool'unu kullan."
            : 'Use ask_clarification when the request is ambiguous.',
        language === 'tr'
            ? "Yeni urun olusturma istekleri icin generate_products tool'unu kullan."
            : 'Use generate_products for new product generation requests.',
    ].join('\n')
}

export function buildSystemPrompt(
    language: Language,
    options: BuildSystemPromptOptions = {}
): string {
    const operationGuide = buildOperationGuide(language)
    const fewShots = buildFewShotExamples(language)
    const opIds = listOperationIds()
    const useTools = options.useTools === true

    const lines = [
        PERSONA[language],
        '',
        'ABOUT FOGCATALOG (share when user asks):',
        ABOUT_FOGCATALOG[language],
        '',
        'SAFETY RULES (MANDATORY):',
        SAFETY[language],
        '',
        'CONVERSATION RULES:',
        CONVERSATION_RULES[language],
        '',
        useTools ? 'TOOL CALLING:' : 'OUTPUT FORMAT:',
        useTools ? buildToolCallingInstructions(language) : OUTPUT_FORMAT[language],
        '',
        language === 'tr' ? 'DESTEKLENEN OPERATIONS:' : 'SUPPORTED OPERATIONS:',
        operationGuide,
        '',
        language === 'tr'
            ? `Geçerli operation tipleri: ${opIds}.`
            : `Valid operation types: ${opIds}.`,
        language === 'tr'
            ? "Yüzde artış/azalış => multiply'a çevir. Örn: %10 artır => 1.10, %10 azalt => 0.90."
            : 'Convert percentage changes to multiply. e.g. +10% => 1.10, -10% => 0.90.',
        language === 'tr'
            ? "Scope: 'seçili/işaretli' => selected, 'tüm/hepsi' => all, aksi durumda currentPage."
            : "Scope: 'selected/checked' => selected, 'all/everything' => all, otherwise currentPage.",
        '',
        language === 'tr'
            ? 'ÖRNEKLER (formatı birebir takip et):'
            : 'EXAMPLES (follow the format exactly):',
        fewShots,
        buildGenerateProductsExample(language),
    ]

    if (useTools) {
        lines.splice(-4, 4)
    }

    return lines.join('\n')
}

// ─── User Prompt ────────────────────────────────────────────────────────────

export interface ConversationTurn {
    role: 'user' | 'assistant'
    content: string
}

export function buildUserPrompt(input: ParsedRequest, history?: ConversationTurn[]): string {
    const lines: string[] = []

    if (history?.length) {
        lines.push('=== Recent conversation (oldest first) ===')
        for (const turn of history) {
            lines.push(`${turn.role}: ${turn.content}`)
        }
        lines.push('=== End conversation ===')
        lines.push('')
    }

    lines.push(`message: ${input.message}`)
    lines.push(`selectedCount: ${input.selectedCount}`)
    lines.push(`visibleCount: ${input.visibleCount}`)
    lines.push(`totalCount: ${input.totalCount}`)
    lines.push(`search: ${input.search || ''}`)
    lines.push('allowedFields: name, sku, price, stock, category, description, product_url')

    return lines.join('\n')
}
