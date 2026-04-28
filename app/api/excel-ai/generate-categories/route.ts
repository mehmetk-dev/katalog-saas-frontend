import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerSupabaseClient } from "@/lib/supabase/server"

const requestSchema = z.object({
  language: z.enum(["tr", "en"]).optional(),
  existingCategories: z.array(z.string().trim().min(1).max(200)).min(1).max(500),
  products: z.array(
    z.object({
      id: z.string().trim().min(1).max(128),
      name: z.string().trim().min(1).max(300),
      description: z.string().trim().max(5000).nullable().optional(),
      currentCategory: z.string().trim().max(200).nullable().optional(),
    }),
  ).min(1).max(120),
})

const modelResponseSchema = z.object({
  categories: z.array(
    z.object({
      productId: z.string().trim().min(1),
      category: z.string().trim().min(1).max(200),
    }),
  ).min(1),
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
      "Sen urunleri mevcut kategorilere yerlestiren bir asistansin.",
      "Sadece gecerli JSON don.",
      "Cikis semasi:",
      '{"categories":[{"productId":"...","category":"..."}]}',
      "Kurallar:",
      "- category degeri mutlaka existingCategories listesinden biri olmali.",
      "- Yeni kategori uretme.",
      "- Urun adina ve aciklamasina gore en uygun kategoriye eslestir.",
      "- productId degerlerini aynen koru.",
    ].join("\n")
  }

  return [
    "You map products into existing categories.",
    "Return valid JSON only.",
    "Output schema:",
    '{"categories":[{"productId":"...","category":"..."}]}',
    "Rules:",
    "- category must be one of existingCategories.",
    "- Do not create new categories.",
    "- Match by product name and description relevance.",
    "- Keep productId exactly as provided.",
  ].join("\n")
}

function buildUserPrompt(input: z.infer<typeof requestSchema>): string {
  return [
    `language: ${input.language || "tr"}`,
    `existingCategories: ${JSON.stringify(input.existingCategories)}`,
    `products: ${JSON.stringify(input.products.map((p) => ({
      productId: p.id,
      name: p.name,
      description: p.description || "",
      currentCategory: p.currentCategory || "",
    })))}`
  ].join("\n")
}

function fallbackCategory(name: string, existingCategories: string[]): string {
  const lowerName = name.toLowerCase()
  const exact = existingCategories.find((cat) => lowerName.includes(cat.toLowerCase()))
  if (exact) return exact
  return existingCategories[0]
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
        {
          error: "Invalid request payload",
          details: parsedRequest.error.flatten(),
        },
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
    const timeout = setTimeout(() => controller.abort(), 20_000)

    let groqResponse: Response
    try {
      groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: 4096,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: buildSystemPrompt(language) },
            { role: "user", content: buildUserPrompt(parsedRequest.data) },
          ],
        }),
      })
    } catch (fetchError) {
      clearTimeout(timeout)
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        return NextResponse.json({ error: "Groq request timed out" }, { status: 504 })
      }
      throw fetchError
    }
    clearTimeout(timeout)

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      return NextResponse.json(
        {
          error: "Groq request failed",
          status: groqResponse.status,
          details: errorText.slice(0, 1000),
        },
        { status: 502 },
      )
    }

    const groqJson = (await groqResponse.json()) as {
      choices?: Array<{
        message?: {
          content?: string
        }
      }>
    }

    const content = groqJson.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: "Groq returned empty content" }, { status: 502 })
    }

    const normalizedJson = extractJsonObject(content)
    const parsedModelResponse = modelResponseSchema.safeParse(JSON.parse(normalizedJson))

    if (!parsedModelResponse.success) {
      return NextResponse.json(
        {
          error: "Model output did not match expected schema",
          details: parsedModelResponse.error.flatten(),
          raw: content,
        },
        { status: 422 },
      )
    }

    const normalizedExistingCategories = parsedRequest.data.existingCategories.map((c) => c.trim()).filter(Boolean)
    const allowed = new Set(normalizedExistingCategories)
    const modelMap = new Map(parsedModelResponse.data.categories.map((item) => [item.productId, item.category]))

    const categories = parsedRequest.data.products.map((product) => {
      const proposed = modelMap.get(product.id)
      if (proposed && allowed.has(proposed)) {
        return { productId: product.id, category: proposed }
      }

      return {
        productId: product.id,
        category: fallbackCategory(product.name, normalizedExistingCategories),
      }
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("[excel-ai/generate-categories] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

