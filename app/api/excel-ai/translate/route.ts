import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerSupabaseClient } from "@/lib/supabase/server"

const requestSchema = z.object({
    language: z.enum(["tr", "en"]).optional(),
    targetLanguage: z.enum(["tr", "en"]),
    field: z.enum(["name", "description", "category"]),
    products: z
        .array(
            z.object({
                id: z.string().trim().min(1).max(128),
                value: z.string().trim().min(1).max(5000),
            }),
        )
        .min(1)
        .max(80),
})

const modelResponseSchema = z.object({
    translations: z
        .array(
            z.object({
                productId: z.string().trim().min(1),
                value: z.string().trim().min(1).max(5000),
            }),
        )
        .min(1),
})

function extractJsonObject(raw: string): string {
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

const LANGUAGE_LABELS: Record<string, Record<string, string>> = {
    tr: { tr: "Turkce", en: "Ingilizce" },
    en: { tr: "Turkish", en: "English" },
}

function buildSystemPrompt(targetLanguage: "tr" | "en", field: string, interfaceLanguage: "tr" | "en"): string {
    const targetLabel = LANGUAGE_LABELS[interfaceLanguage]?.[targetLanguage] || targetLanguage

    if (interfaceLanguage === "tr") {
        return [
            `Sen urun verilerini ${targetLabel}'ye ceviren bir asistansin.`,
            "Sadece gecerli JSON don. Markdown veya aciklama donme.",
            "Cikis semasi:",
            '{"translations":[{"productId":"...","value":"..."}]}',
            "",
            "Kurallar:",
            `- Alan: ${field}. Urun ${field === "name" ? "adini" : field === "description" ? "aciklamasini" : "kategorisini"} cevir.`,
            "- Anlamini koru, dogal ve akici ceviri yap.",
            "- Zaten hedef dilde olan metinleri degistirmeden birak.",
            "- Id'leri aynen koru.",
        ].join("\n")
    }

    return [
        `You translate product data to ${targetLabel}.`,
        "Return valid JSON only. No prose and no markdown.",
        "Output schema:",
        '{"translations":[{"productId":"...","value":"..."}]}',
        "",
        "Rules:",
        `- Field: ${field}. Translate the product ${field}.`,
        "- Keep the meaning, produce natural and fluent translations.",
        "- Leave text unchanged if already in the target language.",
        "- Keep productId values exactly as provided.",
    ].join("\n")
}

function buildUserPrompt(input: z.infer<typeof requestSchema>): string {
    const items = input.products.map((product) => ({
        productId: product.id,
        value: product.value,
    }))

    return [
        `targetLanguage: ${input.targetLanguage}`,
        `field: ${input.field}`,
        `products: ${JSON.stringify(items)}`,
    ].join("\n")
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json().catch(() => null)
        const parsedRequest = requestSchema.safeParse(body)

        if (!parsedRequest.success) {
            return NextResponse.json(
                { error: "Invalid request payload", details: parsedRequest.error.flatten() },
                { status: 400 },
            )
        }

        const groqApiKey = process.env.GROQ_API_KEY
        if (!groqApiKey) {
            return NextResponse.json({ error: "GROQ_API_KEY is not configured" }, { status: 500 })
        }

        const interfaceLanguage = parsedRequest.data.language || "tr"
        const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b"

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 20_000)

        try {
            const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${groqApiKey}`,
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model,
                    temperature: 0.2,
                    max_tokens: 4096,
                    response_format: { type: "json_object" },
                    messages: [
                        {
                            role: "system",
                            content: buildSystemPrompt(parsedRequest.data.targetLanguage, parsedRequest.data.field, interfaceLanguage),
                        },
                        { role: "user", content: buildUserPrompt(parsedRequest.data) },
                    ],
                }),
            })

            if (!groqResponse.ok) {
                const errorText = await groqResponse.text()
                return NextResponse.json(
                    { error: "Groq request failed", status: groqResponse.status, details: errorText.slice(0, 1000) },
                    { status: 502 },
                )
            }

            const groqJson = (await groqResponse.json()) as {
                choices?: Array<{ message?: { content?: string } }>
            }

            const content = groqJson.choices?.[0]?.message?.content
            if (!content) {
                return NextResponse.json({ error: "Groq returned empty content" }, { status: 502 })
            }

            const normalizedJson = extractJsonObject(content)
            const parsedModelResponse = modelResponseSchema.safeParse(JSON.parse(normalizedJson))

            if (!parsedModelResponse.success) {
                return NextResponse.json(
                    { error: "Model output did not match expected schema", details: parsedModelResponse.error.flatten() },
                    { status: 422 },
                )
            }

            const inputProducts = parsedRequest.data.products
            const byId = new Map(parsedModelResponse.data.translations.map((item) => [item.productId, item.value]))

            const translations = inputProducts.map((product) => ({
                productId: product.id,
                value: (byId.get(product.id) || product.value).slice(0, 5000),
            }))

            return NextResponse.json({ translations })
        } finally {
            clearTimeout(timeout)
        }
    } catch (error) {
        console.error("[excel-ai/translate] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
