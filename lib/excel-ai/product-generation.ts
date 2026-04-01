import { z } from "zod"

import type { Language, ParsedAiResponse } from "./schemas"

// ─── Product Generation Prompt ──────────────────────────────────────────────

export function buildProductGenerationPrompt(count: number, theme: string | null, language: Language): string {
    if (language === "tr") {
        return [
            `Tam olarak ${count} adet${theme ? ` "${theme}" temalı` : ""} ürün üret.`,
            "Her ürün için şu alanları JSON array olarak dön:",
            '{"products":[{"name":"...","description":"...","price":...,"stock":...,"category":"...","sku":"..."}]}',
            "",
            "Kurallar:",
            "- name: Gerçekçi, profesyonel ürün adı (Türkçe)",
            "- description: 1-2 cümlelik kısa açıklama (Türkçe)",
            "- price: Mantıklı bir fiyat (TRY, tam sayı veya ondalıklı)",
            "- stock: 1-500 arası rastgele stok",
            "- category: Uygun kategori adı (Türkçe)",
            `- sku: "${theme ? theme.substring(0, 3).toUpperCase() : "PRD"}-" ile başlayan 8 karakterlik kod`,
            "",
            "SADECE geçerli JSON döndür. Markdown, açıklama veya başka metin ekleme.",
        ].join("\n")
    }

    return [
        `Generate exactly ${count}${theme ? ` "${theme}" themed` : ""} products.`,
        "Return each product as a JSON array:",
        '{"products":[{"name":"...","description":"...","price":...,"stock":...,"category":"...","sku":"..."}]}',
        "",
        "Rules:",
        "- name: Realistic, professional product name",
        "- description: 1-2 sentence short description",
        "- price: Reasonable price (USD, integer or decimal)",
        "- stock: Random stock between 1-500",
        "- category: Appropriate category name",
        `- sku: 8-char code starting with "${theme ? theme.substring(0, 3).toUpperCase() : "PRD"}-"`,
        "",
        "Return ONLY valid JSON. No markdown, explanations, or extra text.",
    ].join("\n")
}

// ─── Generated Product Schema ───────────────────────────────────────────────

export const generatedProductSchema = z.object({
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
})

// ─── JSON Extraction ────────────────────────────────────────────────────────

export function extractJsonObject(raw: string): string {
    const trimmed = raw.trim()
    if (trimmed.startsWith("{")) return trimmed

    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    if (codeBlockMatch?.[1]) return codeBlockMatch[1]

    const firstBrace = trimmed.indexOf("{")
    const lastBrace = trimmed.lastIndexOf("}")
    if (firstBrace >= 0 && lastBrace > firstBrace) {
        return trimmed.slice(firstBrace, lastBrace + 1)
    }

    return trimmed
}

// ─── Generate Products via Groq ─────────────────────────────────────────────

export async function generateProductsViaGroq(
    count: number,
    theme: string | null,
    language: Language,
): Promise<ParsedAiResponse | null> {
    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) return null

    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b"

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${groqApiKey}`,
            },
            signal: controller.signal,
            body: JSON.stringify({
                model,
                temperature: 0.7,
                max_tokens: 4096,
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: "Sen bir ürün veri üretici AI'sın. Sadece geçerli JSON döndür. / You are a product data generator AI. Return only valid JSON.",
                    },
                    {
                        role: "user",
                        content: buildProductGenerationPrompt(count, theme, language),
                    },
                ],
            }),
        })

        if (!response.ok) {
            console.warn("[excel-ai/intent] Groq product generation failed:", response.status)
            return null
        }

        const json = (await response.json()) as {
            choices?: Array<{ message?: { content?: string } }>
        }

        const content = json.choices?.[0]?.message?.content
        if (!content) return null

        let parsed: unknown
        try {
            parsed = JSON.parse(extractJsonObject(content))
        } catch {
            return null
        }

        const result = generatedProductSchema.safeParse(parsed)
        if (!result.success) return null

        const products = result.data.products.slice(0, count)

        const themeLabel = theme || (language === "tr" ? "ürün" : "product")
        const assistantMessage =
            language === "tr"
                ? `${products.length} adet ${themeLabel} ürünü oluşturdum. Onaylayarak tabloya ekleyebilirsin.`
                : `Generated ${products.length} ${themeLabel} products. Confirm to add them to the table.`

        return {
            mode: "generate_products" as const,
            assistantMessage,
            products,
        }
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            console.warn("[excel-ai/intent] Product generation timed out (20s)")
        } else {
            console.warn("[excel-ai/intent] Product generation error:", error)
        }
        return null
    } finally {
        clearTimeout(timeout)
    }
}
