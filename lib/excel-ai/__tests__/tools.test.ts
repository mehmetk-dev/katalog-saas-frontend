/**
 * Tests for Groq tool building and tool-call response parsing.
 */

import { describe, expect, it } from 'vitest'

import { buildSystemPrompt } from '@/lib/excel-ai/prompts'
import { buildGroqTools } from '@/lib/excel-ai/tools/build-tools'
import { parseToolCallResponse, isGroqToolCallResponse } from '@/lib/excel-ai/tools/parse-tool-call'
import type { GroqResponse } from '@/lib/excel-ai/tools/parse-tool-call'

// Helper to build typed Groq tool-call responses in tests
function makeToolCall(name: string, args: Record<string, unknown>): GroqResponse {
    return {
        choices: [
            {
                message: {
                    content: null,
                    tool_calls: [
                        {
                            id: 'call_test',
                            type: 'function',
                            function: { name, arguments: JSON.stringify(args) },
                        },
                    ],
                },
            },
        ],
    }
}

// ─── buildGroqTools ──────────────────────────────────────────────────────────

describe('buildGroqTools', () => {
    it('returns 4 tools for each mode', () => {
        const tools = buildGroqTools('tr')
        expect(tools).toHaveLength(4)
        const names = tools.map((t) => t.function.name)
        expect(names).toContain('apply_bulk_edit')
        expect(names).toContain('chat_response')
        expect(names).toContain('ask_clarification')
        expect(names).toContain('generate_products')
    })

    it('each tool has type=function and a parameters JSON Schema', () => {
        const tools = buildGroqTools('en')
        for (const tool of tools) {
            expect(tool.type).toBe('function')
            expect(tool.function.name).toBeTruthy()
            expect(tool.function.description.length).toBeGreaterThan(10)
            expect(tool.function.parameters).toBeDefined()
            const params = tool.function.parameters as Record<string, unknown>
            expect(params).toHaveProperty('type')
        }
    })

    it('apply_bulk_edit tool includes operation types in description', () => {
        const tools = buildGroqTools('tr')
        const bulkEdit = tools.find((t) => t.function.name === 'apply_bulk_edit')
        expect(bulkEdit?.function.description).toContain('multiply')
        expect(bulkEdit?.function.description).toContain('generate_sku')
    })

    it('EN and TR tools have different descriptions', () => {
        const trTools = buildGroqTools('tr')
        const enTools = buildGroqTools('en')
        const trChat = trTools.find((t) => t.function.name === 'chat_response')
        const enChat = enTools.find((t) => t.function.name === 'chat_response')
        expect(trChat?.function.description).not.toBe(enChat?.function.description)
    })
})

describe('buildSystemPrompt tool mode', () => {
    it('uses tool-call instructions instead of JSON output examples', () => {
        const prompt = buildSystemPrompt('en', { useTools: true })

        expect(prompt).toContain('TOOL CALLING:')
        expect(prompt).toContain('Respond with exactly one tool call')
        expect(prompt).toContain('apply_bulk_edit')
        expect(prompt).not.toContain('OUTPUT FORMAT:')
        expect(prompt).not.toContain('EXAMPLES')
        expect(prompt).not.toContain('{"mode":"intent"')
    })

    it('keeps JSON output instructions in legacy mode', () => {
        const prompt = buildSystemPrompt('en')

        expect(prompt).toContain('OUTPUT FORMAT:')
        expect(prompt).toContain('EXAMPLES')
        expect(prompt).toContain('{"mode":"intent"')
    })
})

// ─── isGroqToolCallResponse ──────────────────────────────────────────────────

describe('isGroqToolCallResponse', () => {
    it('returns true for valid Groq response with choices', () => {
        expect(isGroqToolCallResponse({ choices: [{ message: { content: 'hi' } }] })).toBe(true)
    })

    it('returns false for null', () => {
        expect(isGroqToolCallResponse(null)).toBe(false)
    })

    it('returns false for object without choices', () => {
        expect(isGroqToolCallResponse({ data: 'oops' })).toBe(false)
    })

    it('returns false for empty choices array', () => {
        expect(isGroqToolCallResponse({ choices: [] })).toBe(false)
    })
})

// ─── parseToolCallResponse ────────────────────────────────────────────────────

describe('parseToolCallResponse', () => {
    it('parses apply_bulk_edit tool call into intent mode', () => {
        const result = parseToolCallResponse(
            makeToolCall('apply_bulk_edit', {
                scope: 'all',
                operations: [{ type: 'multiply', field: 'price', value: 1.1 }],
                reason: 'test',
                assistantMessage: 'Preview ready.',
            })
        )

        expect(result).not.toBeNull()
        expect(result?.mode).toBe('intent')
        if (result?.mode === 'intent') {
            expect(result.intent.scope).toBe('all')
            expect(result.intent.operations).toHaveLength(1)
            expect(result.intent.operations[0].type).toBe('multiply')
        }
    })

    it('parses chat_response tool call', () => {
        const result = parseToolCallResponse(
            makeToolCall('chat_response', {
                assistantMessage: 'Merhaba! Size nasıl yardımcı olabilirim?',
            })
        )

        expect(result?.mode).toBe('chat')
        if (result?.mode === 'chat') {
            expect(result.assistantMessage).toContain('Merhaba')
        }
    })

    it('parses ask_clarification tool call', () => {
        const result = parseToolCallResponse(
            makeToolCall('ask_clarification', {
                assistantMessage: 'İsteğinizi anladım ama netleştirelim.',
                clarificationQuestion: 'Hangi ürünler için?',
                suggestedCommands: ['Seçili ürünlerin fiyatını %10 artır'],
            })
        )

        expect(result?.mode).toBe('clarification')
        if (result?.mode === 'clarification') {
            expect(result.clarificationQuestion).toContain('Hangi')
            expect(result.suggestedCommands).toHaveLength(1)
        }
    })

    it('parses generate_products tool call', () => {
        const result = parseToolCallResponse(
            makeToolCall('generate_products', {
                assistantMessage: '5 ürün oluşturdum.',
                products: [
                    { name: 'Ürün A', price: 100, stock: 10 },
                    { name: 'Ürün B', price: 200, stock: 5 },
                ],
            })
        )

        expect(result?.mode).toBe('generate_products')
        if (result?.mode === 'generate_products') {
            expect(result.products).toHaveLength(2)
        }
    })

    it('returns null when no tool_calls present', () => {
        const groqJson: GroqResponse = {
            choices: [{ message: { content: 'plain text' } }],
        }
        expect(parseToolCallResponse(groqJson)).toBeNull()
    })

    it('returns null for invalid JSON arguments', () => {
        const groqJson: GroqResponse = {
            choices: [
                {
                    message: {
                        content: null,
                        tool_calls: [
                            {
                                id: 'call_bad',
                                type: 'function',
                                function: {
                                    name: 'chat_response',
                                    arguments: 'not-valid-json{{{',
                                },
                            },
                        ],
                    },
                },
            ],
        }
        expect(parseToolCallResponse(groqJson)).toBeNull()
    })

    it('returns null for unknown tool name', () => {
        const groqJson: GroqResponse = {
            choices: [
                {
                    message: {
                        content: null,
                        tool_calls: [
                            {
                                id: 'call_unk',
                                type: 'function',
                                function: {
                                    name: 'unknown_tool',
                                    arguments: '{}',
                                },
                            },
                        ],
                    },
                },
            ],
        }
        expect(parseToolCallResponse(groqJson)).toBeNull()
    })

    it('returns null when Zod validation fails (bad scope)', () => {
        const result = parseToolCallResponse(
            makeToolCall('apply_bulk_edit', {
                scope: 'invalid_scope',
                operations: [{ type: 'multiply', field: 'price', value: 1.1 }],
            })
        )
        expect(result).toBeNull()
    })
})
