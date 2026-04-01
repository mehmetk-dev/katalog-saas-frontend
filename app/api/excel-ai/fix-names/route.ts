import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerSupabaseClient } from "@/lib/supabase/server"

const requestSchema = z.object({
    language: z.enum(["tr", "en"]).optional(),
    products: z
        .array(
            z.object({
                id: z.string().trim().min(1).max(128),
                name: z.string().trim().min(1).max(300),
            }),
        )
        .min(1)
        .max(80),
})

const modelResponseSchema = z.object({
    names: z
        .array(
            z.object({
                productId: z.string().trim().min(1),
                name: z.string().trim().min(1).max(300),
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

function buildSystemPrompt(language: "tr" | "en"): string {
    if (language === "tr") {
        return [
            "Sen urun adlarini duzeltip profesyonellestiren bir asistansin.",
            "Sadece gecerli JSON don. Markdown veya aciklama donme.",
            "Cikis semasi:",
            '{"names":[{"productId":"...","name":"..."}]}',
            "",
            "Kurallar:",
            "- Her kelimenin bas harfini buyuk yap (Title Case).",
            "- Turkce karakterleri dogru kullan: ç, ğ, ı, ö, ş, ü, İ.",
            "- Gereksiz bosluklari kaldir.",
            "- Bariz yazim hatalarini duzelt.",
            "- Urun adinin anlamini degistirme, sadece bicimini iyilestir.",
            "- Id'leri aynen koru.",
        ].join("\n")
    }

    return [
        "You fix and professionalize product names.",
        "Return valid JSON only. No prose and no markdown.",
        "Output schema:",
        '{"names":[{"productId":"...","name":"..."}]}',
        "",
        "Rules:",
        "- Apply proper Title Case capitalization.",
        "- Fix obvious typos and spelling errors.",
        "- Remove extra whitespace.",
        "- Do not change the meaning, only improve formatting.",
        "- Keep productId values exactly as provided.",
    ].join("\n")
}

function buildUserPrompt(input: z.infer<typeof requestSchema>): string {
    const normalizedProducts = input.products.map((product) => ({
        productId: product.id,
        name: product.name,
    }))

    return [
        `language: ${input.language || "tr"}`,
        `products: ${JSON.stringify(normalizedProducts)}`,
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

        const language = parsedRequest.data.language || "tr"
        const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b"

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15_000)

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
                    temperature: 0.1,
                    max_tokens: 4096,
                    response_format: { type: "json_object" },
                    messages: [
                        { role: "system", content: buildSystemPrompt(language) },
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
            const byId = new Map(parsedModelResponse.data.names.map((item) => [item.productId, item.name]))

            const names = inputProducts.map((product) => ({
                productId: product.id,
                name: (byId.get(product.id) || product.name).slice(0, 300),
            }))

            return NextResponse.json({ names })
        } finally {
            clearTimeout(timeout)
        }
    } catch (error) {
        console.error("[excel-ai/fix-names] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
