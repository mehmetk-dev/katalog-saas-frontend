import { NextRequest, NextResponse } from "next/server"

import { requestSchema, aiResponseSchema } from "@/lib/excel-ai/schemas"
import type { Language, ParsedAiResponse } from "@/lib/excel-ai/schemas"
import { checkUserRateLimit, AI_CHAT_WINDOW_MS, AI_CHAT_LIMITS } from "@/lib/services/rate-limit"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { fetchCatalogProfile } from "@/lib/excel-ai/profile"
import { buildSystemPrompt, buildUserPrompt } from "@/lib/excel-ai/prompts"
import { extractJsonObject, generateProductsViaGroq } from "@/lib/excel-ai/product-generation"
import { normalizeForMatch, UNSUPPORTED_CAPABILITY_PATTERNS } from "@/lib/excel-ai/helpers"
import {
  isAboutFogCatalogQuestion,
  isIdentityOrCapabilitiesQuestion,
  isGreetingMessage,
  detectCasualConversation,
  extractUserNameFromMessage,
  detectSensitiveContent,
  detectLowStockRequest,
  detectProductGenerationRequest,
  tryHighConfidenceIntent,
} from "@/lib/excel-ai/detection"
import {
  buildAboutFogCatalogResponse,
  buildIdentityResponse,
  buildGreetingResponse,
  buildCasualConversationResponse,
  buildNameAwareResponse,
  buildSensitiveContentResponse,
  buildLowStockAlertResponse,
  buildPresetResponse,
  buildClarificationFallback,
  buildAiServiceFallback,
  buildUnsupportedCapabilityGuardrail,
  normalizeChatResponse,
} from "@/lib/excel-ai/responses"

export async function POST(request: NextRequest) {
  let resolvedLanguage: Language = "tr"

  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ─── Fetch user plan for rate limiting ─────────────────────────────
    const { data: userProfile } = await supabase
      .from("users")
      .select("plan")
      .eq("id", user.id)
      .single()
    const userPlan: string = (userProfile?.plan as string) || "free"

    // ─── Per-user daily rate limit (plan-based) ───────────────────────
    const dailyLimit = AI_CHAT_LIMITS[userPlan] ?? AI_CHAT_LIMITS.free
    const rl = checkUserRateLimit(user.id, "excel-ai", dailyLimit, AI_CHAT_WINDOW_MS)
    if (!rl.allowed) {
      const resetMinutes = Math.ceil((rl.resetAt - Date.now()) / 60_000)
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message:
            `Günlük AI kullanım limitinize ulaştınız (${dailyLimit} istek). ` +
            `Yaklaşık ${resetMinutes} dakika sonra tekrar deneyebilirsiniz.`,
          remaining: 0,
          resetAt: rl.resetAt,
        },
        { status: 429 },
      )
    }

    const body = await request.json().catch(() => null)
    const parsedRequest = requestSchema.safeParse(body)

    const jsonWithQuota = (data: Record<string, unknown>, init?: ResponseInit) =>
      NextResponse.json({ ...data, _quota: { remaining: rl.remaining, limit: dailyLimit } }, init)

    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedRequest.error.flatten(),
        },
        { status: 400 },
      )
    }

    const language = parsedRequest.data.language || "tr"
    resolvedLanguage = language
    const message = parsedRequest.data.message

    // ─── Safety: Sensitive content check ──────────────────────────────
    const sensitiveCategory = detectSensitiveContent(message)
    if (sensitiveCategory) {
      return jsonWithQuota(buildSensitiveContentResponse(sensitiveCategory, language))
    }

    // ─── Preset commands ──────────────────────────────────────────────
    if (parsedRequest.data.presetId) {
      const needsProfile = parsedRequest.data.presetId === "intro_capabilities"
      const profile = needsProfile
        ? await fetchCatalogProfile(supabase, user.id).catch((error) => {
          console.error("[excel-ai/intent] profile fetch failed:", error)
          return null
        })
        : null

      return jsonWithQuota(buildPresetResponse(parsedRequest.data.presetId, language, profile))
    }

    // ─── Name introduction detection ──────────────────────────────────
    const introducedName = extractUserNameFromMessage(message)
    if (introducedName) {
      const profile = await fetchCatalogProfile(supabase, user.id).catch((error) => {
        console.error("[excel-ai/intent] profile fetch failed:", error)
        return null
      })
      return jsonWithQuota(buildNameAwareResponse(language, introducedName, profile))
    }

    // ─── Unsupported capability guardrail ──────────────────────────
    const normalizedMsg = normalizeForMatch(message)
    if (UNSUPPORTED_CAPABILITY_PATTERNS.some((p) => normalizedMsg.includes(p))) {
      return jsonWithQuota(buildUnsupportedCapabilityGuardrail(language))
    }

    // ─── High confidence intent detection ─────────────────────────────
    const highConfidenceIntent = tryHighConfidenceIntent(parsedRequest.data, language)
    if (highConfidenceIntent) {
      return jsonWithQuota(highConfidenceIntent)
    }

    // ─── Casual conversation detection ────────────────────────────────
    const casualCategory = detectCasualConversation(message)
    if (casualCategory) {
      return jsonWithQuota(buildCasualConversationResponse(casualCategory, language))
    }

    // ─── Identity, About, Greeting detection ──────────────────────────
    const wantsAboutPlatform = isAboutFogCatalogQuestion(message)
    const wantsIdentity = isIdentityOrCapabilitiesQuestion(message)
    const wantsGreeting = isGreetingMessage(message)
    if (wantsAboutPlatform || wantsIdentity || wantsGreeting) {
      const profile = await fetchCatalogProfile(supabase, user.id).catch((error) => {
        console.error("[excel-ai/intent] profile fetch failed:", error)
        return null
      })

      if (wantsAboutPlatform) {
        return jsonWithQuota(buildAboutFogCatalogResponse(language, profile))
      }
      if (wantsIdentity) {
        return jsonWithQuota(buildIdentityResponse(language, profile))
      }
      return jsonWithQuota(buildGreetingResponse(language, profile))
    }

    // ─── Low Stock Alert Detection ────────────────────────────────────
    const wantsLowStockAlert = detectLowStockRequest(message)
    if (wantsLowStockAlert) {
      const lowStockResponse = await buildLowStockAlertResponse(supabase, user.id, language, wantsLowStockAlert)
      return jsonWithQuota(lowStockResponse)
    }

    // ─── Product Generation Detection ─────────────────────────────────
    const productGenRequest = detectProductGenerationRequest(message)
    if (productGenRequest) {
      const generated = await generateProductsViaGroq(productGenRequest.count, productGenRequest.theme, language)
      if (generated) {
        return jsonWithQuota(generated)
      }
    }

    // ─── Groq AI Fallthrough ──────────────────────────────────────────
    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      console.warn("[excel-ai/intent] GROQ_API_KEY is not configured.")
      return jsonWithQuota(buildAiServiceFallback(language))
    }

    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b"

    const groqController = new AbortController()
    const groqTimeout = setTimeout(() => groqController.abort(), 15_000)

    let groqResponse: Response
    try {
      groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        signal: groqController.signal,
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: 1024,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: buildSystemPrompt(language) },
            { role: "user", content: buildUserPrompt(parsedRequest.data) },
          ],
        }),
      })
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        console.warn("[excel-ai/intent] Groq request timed out (15s)")
      } else {
        console.warn("[excel-ai/intent] Groq fetch error:", fetchError)
      }
      return jsonWithQuota(buildAiServiceFallback(language))
    } finally {
      clearTimeout(groqTimeout)
    }

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.warn("[excel-ai/intent] Groq request failed", {
        status: groqResponse.status,
        details: errorText.slice(0, 300),
      })
      return jsonWithQuota(buildAiServiceFallback(language))
    }

    const groqJson = (await groqResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const content = groqJson.choices?.[0]?.message?.content
    if (!content) {
      return jsonWithQuota(buildClarificationFallback(language))
    }

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(extractJsonObject(content))
    } catch {
      return jsonWithQuota(buildClarificationFallback(language))
    }

    const parsedModelResponse = aiResponseSchema.safeParse(parsedJson)
    if (!parsedModelResponse.success) {
      return jsonWithQuota(buildClarificationFallback(language))
    }

    // ─── Post-filter chat responses ─────────────────────────────────
    if (parsedModelResponse.data.mode === "chat") {
      const normalized = normalizeChatResponse(parsedModelResponse.data, language)
      if ("assistantMessage" in normalized && normalized.assistantMessage) {
        const responseCategory = detectSensitiveContent(normalized.assistantMessage)
        if (responseCategory) {
          return jsonWithQuota(buildSensitiveContentResponse(responseCategory, language))
        }
      }
      return jsonWithQuota(normalized)
    }

    // Post-filter intent responses
    if (parsedModelResponse.data.mode === "intent" && parsedModelResponse.data.assistantMessage) {
      const responseCategory = detectSensitiveContent(parsedModelResponse.data.assistantMessage)
      if (responseCategory) {
        return jsonWithQuota(buildSensitiveContentResponse(responseCategory, language))
      }
    }

    return jsonWithQuota(parsedModelResponse.data)
  } catch (error) {
    console.error("[excel-ai/intent] Error:", error)
    return NextResponse.json(buildAiServiceFallback(resolvedLanguage))
  }
}
