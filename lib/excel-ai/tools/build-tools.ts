/**
 * Builds Groq tool definitions from Zod schemas.
 * Each AI response mode becomes a separate tool so the model
 * explicitly chooses intent / chat / clarification / generate_products.
 */

import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"

import type { Language } from "../schemas"
import { AI_SCOPES } from "../types"
import { intentSchema } from "../schemas"
import { OPERATION_DEFS } from "../operations/registry"

// ─── Tool parameter schemas (Zod) ──────────────────────────────────────────

const applyBulkEditParamsSchema = z.object({
    scope: z.enum(AI_SCOPES).describe("Which products to target: selected, currentPage, or all"),
    operations: intentSchema.shape.operations.describe("List of bulk edit operations to apply"),
    reason: z.string().max(400).optional().describe("Short explanation of why this intent was chosen"),
    assistantMessage: z.string().max(2000).optional().describe("Brief confirmation message to the user"),
})

const chatResponseParamsSchema = z.object({
    assistantMessage: z.string().min(1).max(2000).describe("The reply text to show the user"),
    capabilities: z.array(z.string().max(220)).max(12).optional().describe("Optional list of capability hints"),
})

const askClarificationParamsSchema = z.object({
    assistantMessage: z.string().min(1).max(2000).describe("Acknowledge the user's message"),
    clarificationQuestion: z.string().min(1).max(600).describe("Specific follow-up question to ask"),
    suggestedCommands: z.array(z.string().min(1).max(220)).max(5).optional().describe("Example commands the user could try"),
})

const generateProductsParamsSchema = z.object({
    assistantMessage: z.string().min(1).max(2000).describe("Brief confirmation message"),
    products: z.array(
        z.object({
            name: z.string().min(2).max(200),
            description: z.string().max(2000).optional().default(""),
            price: z.number().min(0).max(1_000_000_000),
            stock: z.number().int().min(0).max(10_000_000),
            category: z.string().max(200).optional().default(""),
            sku: z.string().max(100).optional().default(""),
        }),
    ).min(1).max(50),
})

// ─── Tool type ───────────────────────────────────────────────────────────────

export type ToolName = "apply_bulk_edit" | "chat_response" | "ask_clarification" | "generate_products"

export interface GroqTool {
    type: "function"
    function: {
        name: ToolName
        description: string
        parameters: Record<string, unknown>
    }
}

// ─── Build operation guide for tool description ─────────────────────────────

function buildOperationGuide(language: Language): string {
    return OPERATION_DEFS
        .map((o) => `- ${o.id}: ${o.guide[language]}`)
        .join("\n")
}

// ─── Public: build tools array ───────────────────────────────────────────────

export function buildGroqTools(language: Language): GroqTool[] {
    const opGuide = buildOperationGuide(language)

    return [
        {
            type: "function",
            function: {
                name: "apply_bulk_edit",
                description:
                    language === "tr"
                        ? `Ürün verilerinde toplu düzenleme uygula.\n\nKullanılabilir operations:\n${opGuide}`
                        : `Apply a bulk edit to product data.\n\nAvailable operations:\n${opGuide}`,
                parameters: zodToJsonSchema(applyBulkEditParamsSchema, { target: "openApi3" }) as Record<string, unknown>,
            },
        },
        {
            type: "function",
            function: {
                name: "chat_response",
                description:
                    language === "tr"
                        ? "Sohbet, selamlaşma, platform bilgisi veya yetenek sorularına yanıt ver. Veri değişikliği yok."
                        : "Respond to chat, greetings, platform info, or capability questions. No data changes.",
                parameters: zodToJsonSchema(chatResponseParamsSchema, { target: "openApi3" }) as Record<string, unknown>,
            },
        },
        {
            type: "function",
            function: {
                name: "ask_clarification",
                description:
                    language === "tr"
                        ? "Kullanıcının isteği belirsiz olduğunda netleştirici soru sor. Örnek komutlar öner."
                        : "Ask a clarifying question when the user's request is ambiguous. Suggest example commands.",
                parameters: zodToJsonSchema(askClarificationParamsSchema, { target: "openApi3" }) as Record<string, unknown>,
            },
        },
        {
            type: "function",
            function: {
                name: "generate_products",
                description:
                    language === "tr"
                        ? "Belirli bir temada yeni ürünler oluştur ve tabloya ekle."
                        : "Generate new products with a given theme and add them to the table.",
                parameters: zodToJsonSchema(generateProductsParamsSchema, { target: "openApi3" }) as Record<string, unknown>,
            },
        },
    ]
}
