import type { ExcelAiIntent, GeneratedProduct } from "@/lib/excel-ai/types"

export interface ApplyResult {
    changedCells: number
    targetProducts: number
}

export interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    /** Clickable follow-up suggestions rendered as buttons below the message. */
    suggestions?: string[]
    /** Optional follow-up question shown above suggestion buttons. */
    clarificationQuestion?: string
}

export type QuickPromptPresetId =
    | "intro_capabilities"
    | "increase_selected_price_10"
    | "map_all_to_existing_categories"
    | "set_all_stock_zero"

export interface QuickPrompt {
    id: QuickPromptPresetId
    text: string
}

export interface QuotaInfo {
    remaining: number
    limit: number
}

export type IntentApiResponse =
    | {
        mode: "intent"
        intent: ExcelAiIntent
        assistantMessage?: string
        _quota?: QuotaInfo
    }
    | {
        mode: "chat"
        assistantMessage: string
        capabilities?: string[]
        _quota?: QuotaInfo
    }
    | {
        mode: "clarification"
        assistantMessage: string
        clarificationQuestion: string
        suggestedCommands?: string[]
        _quota?: QuotaInfo
    }
    | {
        mode: "generate_products"
        assistantMessage: string
        products: GeneratedProduct[]
        _quota?: QuotaInfo
    }

export function isIntentApiResponse(payload: unknown): payload is IntentApiResponse {
    if (!payload || typeof payload !== "object") return false
    if (!("mode" in payload)) return false
    const mode = (payload as { mode?: unknown }).mode
    return mode === "intent" || mode === "chat" || mode === "clarification" || mode === "generate_products"
}

export function extractApiError(payload: unknown): string | null {
    if (!payload || typeof payload !== "object") return null
    if (!("error" in payload)) return null
    const errorValue = (payload as { error?: unknown }).error
    return typeof errorValue === "string" && errorValue.trim().length > 0 ? errorValue : null
}
