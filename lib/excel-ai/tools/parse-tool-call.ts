/**
 * Parses Groq tool_call responses into ParsedAiResponse.
 * Falls back to null if the tool_call structure is invalid —
 * the caller should then try JSON-mode parsing as fallback.
 */

import type { ParsedAiResponse } from "../schemas"
import { aiResponseSchema } from "../schemas"
import type { ToolName } from "./build-tools"

export interface GroqToolCall {
    id?: string
    type?: "function"
    function?: {
        name?: string
        arguments?: string
    }
}

export interface GroqChoice {
    message?: {
        content?: string | null
        tool_calls?: GroqToolCall[]
    }
}

export interface GroqResponse {
    choices?: GroqChoice[]
}

// ─── Tool name → mode mapping ───────────────────────────────────────────────

const TOOL_TO_MODE: Record<ToolName, ParsedAiResponse["mode"]> = {
    apply_bulk_edit: "intent",
    chat_response: "chat",
    ask_clarification: "clarification",
    generate_products: "generate_products",
}

// ─── Parse ───────────────────────────────────────────────────────────────────

export function parseToolCallResponse(groqJson: GroqResponse): ParsedAiResponse | null {
    const toolCalls = groqJson.choices?.[0]?.message?.tool_calls
    if (!toolCalls || toolCalls.length === 0) return null

    const call = toolCalls[0]
    const fn = call.function
    if (!fn?.name || !fn.arguments) return null

    const toolName = fn.name as ToolName
    const mode = TOOL_TO_MODE[toolName]
    if (!mode) return null

    let args: unknown
    try {
        args = JSON.parse(fn.arguments)
    } catch {
        return null
    }

    // Reconstruct the aiResponse shape from tool args, then validate with Zod.
    let reconstructed: unknown

    switch (mode) {
        case "intent":
            reconstructed = {
                mode: "intent",
                intent: {
                    scope: (args as Record<string, unknown>).scope,
                    operations: (args as Record<string, unknown>).operations,
                    reason: (args as Record<string, unknown>).reason,
                },
                assistantMessage: (args as Record<string, unknown>).assistantMessage,
            }
            break
        case "chat":
            reconstructed = {
                mode: "chat",
                assistantMessage: (args as Record<string, unknown>).assistantMessage,
                capabilities: (args as Record<string, unknown>).capabilities,
            }
            break
        case "clarification":
            reconstructed = {
                mode: "clarification",
                assistantMessage: (args as Record<string, unknown>).assistantMessage,
                clarificationQuestion: (args as Record<string, unknown>).clarificationQuestion,
                suggestedCommands: (args as Record<string, unknown>).suggestedCommands,
            }
            break
        case "generate_products":
            reconstructed = {
                mode: "generate_products",
                assistantMessage: (args as Record<string, unknown>).assistantMessage,
                products: (args as Record<string, unknown>).products,
            }
            break
        default:
            return null
    }

    const parsed = aiResponseSchema.safeParse(reconstructed)
    if (!parsed.success) return null

    return parsed.data
}

/** Type guard for the raw Groq response shape. */
export function isGroqToolCallResponse(value: unknown): value is GroqResponse {
    if (!value || typeof value !== "object") return false
    const choices = (value as { choices?: unknown[] }).choices
    return Array.isArray(choices) && choices.length > 0
}
