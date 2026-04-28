import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createServerSupabaseClient } from "@/lib/supabase/server"

const requestSchema = z.object({
  language: z.enum(["tr", "en"]).optional(),
  style: z.string().trim().min(1).max(200).optional(),
  maxLength: z.number().int().min(40).max(1200).optional(),
  products: z.array(
    z.object({
      id: z.string().trim().min(1).max(128),
      name: z.string().trim().min(1).max(300),
      category: z.string().trim().max(200).nullable().optional(),
      currentDescription: z.string().trim().max(5000).nullable().optional(),
    }),
  ).min(1).max(80),
})

const modelResponseSchema = z.object({
  descriptions: z.array(
    z.object({
      productId: z.string().trim().min(1),
      description: z.string().trim().min(1).max(5000),
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
      "Sen e-ticaret urun aciklamasi olusturan bir asistansin.",
      "Sadece gecerli JSON don. Aciklama veya markdown donme.",
      "Cikis semasi:",
      '{"descriptions":[{"productId":"...","description":"..."}]}',
      "Her urun icin urun adina uygun, dogal ve kisa bir aciklama yaz.",
      "Id'leri aynen koru. Uydurma productId uretme.",
      "Fiyata, stoga, garantiye dair bilinmeyen iddialar ekleme.",
      "Marka/model teknik bilgisi verilmediyse varsayim yapma.",
    ].join("\n")
  }

  return [
    "You generate ecommerce product descriptions.",
    "Return valid JSON only. No prose and no markdown.",
    "Output schema:",
    '{"descriptions":[{"productId":"...","description":"..."}]}',
    "Write concise, natural descriptions relevant to product names.",
    "Keep productId values exactly as provided. Do not invent ids.",
    "Do not add unknown claims about price, stock, warranty, or specs.",
  ].join("\n")
}

function buildUserPrompt(input: z.infer<typeof requestSchema>): string {
  const normalizedProducts = input.products.map((product) => ({
    productId: product.id,
    name: product.name,
    category: product.category || "",
    currentDescription: product.currentDescription || "",
  }))

  return [
    `language: ${input.language || "tr"}`,
    `style: ${input.style || ""}`,
    `maxLength: ${input.maxLength || 220}`,
    `products: ${JSON.stringify(normalizedProducts)}`,
  ].join("\n")
}

function fallbackDescription(name: string, category: string | null | undefined, language: "tr" | "en"): string {
  if (language === "tr") {
    if (category && category.trim().length > 0) {
      return `${name}, ${category} kategorisinde kullanisli bir urun secenegidir.`
    }
    return `${name}, gunluk kullanim icin pratik bir urun secenegidir.`
  }

  if (category && category.trim().length > 0) {
    return `${name} is a practical option in the ${category} category.`
  }
  return `${name} is a practical option for everyday use.`
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
          temperature: 0.3,
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

    const inputProducts = parsedRequest.data.products
    const byId = new Map(parsedModelResponse.data.descriptions.map((item) => [item.productId, item.description]))

    const descriptions = inputProducts.map((product) => ({
      productId: product.id,
      description: (byId.get(product.id) || fallbackDescription(product.name, product.category, language)).slice(0, 5000),
    }))

    return NextResponse.json({ descriptions })
  } catch (error) {
    console.error("[excel-ai/generate-descriptions] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

