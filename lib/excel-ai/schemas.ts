import { z } from "zod"

import { AI_FIELDS, AI_NUMERIC_FIELDS, AI_TEXT_FIELDS, AI_SCOPES } from "@/lib/excel-ai/types"

// ─── Constants ──────────────────────────────────────────────────────────────

export const PRESET_IDS = [
    "intro_capabilities",
    "increase_selected_price_10",
    "map_all_to_existing_categories",
    "set_all_stock_zero",
] as const

export const PROFILE_SAMPLE_LIMIT = 250

// ─── Zod Schemas ────────────────────────────────────────────────────────────

export const requestSchema = z.object({
    message: z.string().trim().min(2).max(1200),
    selectedCount: z.number().int().min(0).max(200000),
    visibleCount: z.number().int().min(0).max(200000),
    totalCount: z.number().int().min(0).max(500000),
    search: z.string().trim().max(200).optional(),
    language: z.enum(["tr", "en"]).optional(),
    presetId: z.enum(PRESET_IDS).optional(),
})

export const fieldSchema = z.enum(AI_FIELDS)
export const numericFieldSchema = z.enum(AI_NUMERIC_FIELDS)
export const textFieldSchema = z.enum(AI_TEXT_FIELDS)

export const operationSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("set"),
        field: fieldSchema,
        value: z.union([z.string(), z.number(), z.null()]),
    }),
    z.object({
        type: z.literal("multiply"),
        field: numericFieldSchema,
        value: z.number().positive().max(1000),
    }),
    z.object({
        type: z.literal("append_text"),
        field: textFieldSchema,
        text: z.string().trim().min(1).max(1000),
        separator: z.string().max(10).optional(),
    }),
    z.object({
        type: z.literal("prepend_text"),
        field: textFieldSchema,
        text: z.string().trim().min(1).max(1000),
        separator: z.string().max(10).optional(),
    }),
    z.object({
        type: z.literal("clear"),
        field: fieldSchema,
    }),
    z.object({
        type: z.literal("generate_description"),
        field: z.literal("description"),
        style: z.string().trim().min(1).max(200).optional(),
        maxLength: z.number().int().min(40).max(1200).optional(),
    }),
    z.object({
        type: z.literal("generate_category"),
        field: z.literal("category"),
        useExistingOnly: z.boolean().optional(),
    }),
    z.object({
        type: z.literal("generate_sku"),
        field: z.literal("sku"),
        prefix: z.string().trim().min(1).max(40).optional(),
        length: z.number().int().min(4).max(24).optional(),
    }),
    z.object({
        type: z.literal("generate_price"),
        field: z.literal("price"),
        strategy: z.enum(["scope_average", "category_average"]).optional(),
    }),
    z.object({
        type: z.literal("enrich_description"),
        field: z.literal("description"),
        style: z.string().trim().min(1).max(200).optional(),
        maxLength: z.number().int().min(40).max(1200).optional(),
    }),
    z.object({
        type: z.literal("fix_name"),
        field: z.literal("name"),
    }),
    z.object({
        type: z.literal("translate"),
        field: textFieldSchema,
        targetLanguage: z.enum(["tr", "en"]),
    }),
    z.object({
        type: z.literal("round_price"),
        field: z.literal("price"),
        strategy: z.enum(["floor", "nearest", "charm"]).optional(),
    }),
    z.object({
        type: z.literal("fill_empty"),
        field: z.enum(["description", "category", "sku", "price"]),
        style: z.string().trim().min(1).max(200).optional(),
        maxLength: z.number().int().min(40).max(1200).optional(),
    }),
])

export const intentSchema = z.object({
    scope: z.enum(AI_SCOPES),
    operations: z.array(operationSchema).min(1).max(12),
    reason: z.string().trim().max(400).optional(),
})

export const aiResponseSchema = z.discriminatedUnion("mode", [
    z.object({
        mode: z.literal("intent"),
        intent: intentSchema,
        assistantMessage: z.string().trim().min(1).max(2000).optional(),
    }),
    z.object({
        mode: z.literal("chat"),
        assistantMessage: z.string().trim().min(1).max(2000),
        capabilities: z.array(z.string().trim().min(1).max(220)).max(12).optional(),
    }),
    z.object({
        mode: z.literal("clarification"),
        assistantMessage: z.string().trim().min(1).max(2000),
        clarificationQuestion: z.string().trim().min(1).max(600),
        suggestedCommands: z.array(z.string().trim().min(1).max(220)).max(5).optional(),
    }),
    z.object({
        mode: z.literal("generate_products"),
        assistantMessage: z.string().trim().min(1).max(2000),
        products: z.array(
            z.object({
                name: z.string().trim().min(2).max(200),
                description: z.string().trim().max(2000).optional().default(""),
                price: z.number().min(0).max(1_000_000_000),
                stock: z.number().int().min(0).max(10_000_000),
                category: z.string().trim().max(200).optional().default(""),
                sku: z.string().trim().max(100).optional().default(""),
            }),
        ).min(1).max(50),
    }),
])

// ─── Type Aliases ───────────────────────────────────────────────────────────

export type Language = "tr" | "en"
export type PresetId = (typeof PRESET_IDS)[number]
export type ParsedRequest = z.infer<typeof requestSchema>
export type ParsedAiResponse = z.infer<typeof aiResponseSchema>

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface CatalogCategoryStat {
    name: string
    count: number
}

export interface CatalogProfile {
    totalProducts: number
    topCategories: CatalogCategoryStat[]
    topKeywords: string[]
}
