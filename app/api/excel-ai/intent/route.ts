import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

import { requestSchema, aiResponseSchema } from '@/lib/excel-ai/schemas'
import type { Language } from '@/lib/excel-ai/schemas'
import { checkUserRateLimit, AI_CHAT_WINDOW_MS, AI_CHAT_LIMITS } from '@/lib/services/rate-limit'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchCatalogProfile } from '@/lib/excel-ai/profile'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/excel-ai/prompts'
import { extractJsonObject, generateProductsViaGroq } from '@/lib/excel-ai/product-generation'
import { buildGroqTools, isGroqToolCallResponse, parseToolCallResponse } from '@/lib/excel-ai/tools'
import { normalizeForMatch, UNSUPPORTED_CAPABILITY_PATTERNS } from '@/lib/excel-ai/helpers'
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
} from '@/lib/excel-ai/detection'
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
} from '@/lib/excel-ai/responses'

export async function POST(request: NextRequest) {
    let resolvedLanguage: Language = 'tr'

    try {
        const supabase = await createServerSupabaseClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // aaa Fetch user plan for rate limiting aaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        const { data: userProfile } = await supabase
            .from('users')
            .select('plan')
            .eq('id', user.id)
            .single()
        const userPlan: string = (userProfile?.plan as string) || 'free'

        // aaa Per-user daily rate limit (plan-based) aaaaaaaaaaaaaaaaaaaaaaa
        const dailyLimit = AI_CHAT_LIMITS[userPlan] ?? AI_CHAT_LIMITS.free
        const rl = checkUserRateLimit(user.id, 'excel-ai', dailyLimit, AI_CHAT_WINDOW_MS)
        if (!rl.allowed) {
            const resetMinutes = Math.ceil((rl.resetAt - Date.now()) / 60_000)
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded',
                    message:
                        `Günlük AI kullanım limitinize ulaştınız (${dailyLimit} istek). ` +
                        `Yaklaşık ${resetMinutes} dakika sonra tekrar deneyebilirsiniz.`,
                    remaining: 0,
                    resetAt: rl.resetAt,
                },
                { status: 429 }
            )
        }

        const body = await request.json().catch(() => null)
        const parsedRequest = requestSchema.safeParse(body)

        const jsonWithQuota = (data: Record<string, unknown>, init?: ResponseInit) =>
            NextResponse.json(
                { ...data, _quota: { remaining: rl.remaining, limit: dailyLimit } },
                init
            )

        if (!parsedRequest.success) {
            return NextResponse.json(
                {
                    error: 'Invalid request payload',
                    details: parsedRequest.error.flatten(),
                },
                { status: 400 }
            )
        }

        const language = parsedRequest.data.language || 'tr'
        resolvedLanguage = language
        const message = parsedRequest.data.message

        // aaa Safety: Sensitive content check aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        const sensitiveCategory = detectSensitiveContent(message)
        if (sensitiveCategory) {
            return jsonWithQuota(buildSensitiveContentResponse(sensitiveCategory, language))
        }

        // aaa Preset commands aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        if (parsedRequest.data.presetId) {
            const needsProfile = parsedRequest.data.presetId === 'intro_capabilities'
            const profile = needsProfile
                ? await fetchCatalogProfile(supabase, user.id).catch((error) => {
                      console.error('[excel-ai/intent] profile fetch failed:', error)
                      return null
                  })
                : null

            return jsonWithQuota(
                buildPresetResponse(parsedRequest.data.presetId, language, profile)
            )
        }

        // aaa Name introduction detection aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        const introducedName = extractUserNameFromMessage(message)
        if (introducedName) {
            const profile = await fetchCatalogProfile(supabase, user.id).catch((error) => {
                console.error('[excel-ai/intent] profile fetch failed:', error)
                return null
            })
            return jsonWithQuota(buildNameAwareResponse(language, introducedName, profile))
        }

        // aaa Product generation detection (must run BEFORE guardrail aaaaaaaaa
        // so that 'X urun ekle' doesn't get blocked by the unsupported-capability
        // pattern 'urun ekle'.
        const earlyProductGenRequest = detectProductGenerationRequest(message)

        // aaa Unsupported capability guardrail aaaaaaaaaaaaaaaaaaaaaaaaaa
        const normalizedMsg = normalizeForMatch(message)
        if (
            !earlyProductGenRequest &&
            UNSUPPORTED_CAPABILITY_PATTERNS.some((p) => normalizedMsg.includes(p))
        ) {
            return jsonWithQuota(buildUnsupportedCapabilityGuardrail(language))
        }

        // aaa High confidence intent detection aaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        const highConfidenceIntent = earlyProductGenRequest
            ? null
            : tryHighConfidenceIntent(parsedRequest.data, language)
        if (highConfidenceIntent) {
            return jsonWithQuota(highConfidenceIntent)
        }

        // aaa Casual conversation detection aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        const casualCategory = detectCasualConversation(message)
        if (casualCategory) {
            return jsonWithQuota(buildCasualConversationResponse(casualCategory, language))
        }

        // aaa Identity, About, Greeting detection aaaaaaaaaaaaaaaaaaaaaaaaaa
        const wantsAboutPlatform = isAboutFogCatalogQuestion(message)
        const wantsIdentity = isIdentityOrCapabilitiesQuestion(message)
        const wantsGreeting = isGreetingMessage(message)
        if (wantsAboutPlatform || wantsIdentity || wantsGreeting) {
            const profile = await fetchCatalogProfile(supabase, user.id).catch((error) => {
                console.error('[excel-ai/intent] profile fetch failed:', error)
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

        // aaa Low Stock Alert Detection aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        const wantsLowStockAlert = detectLowStockRequest(message)
        if (wantsLowStockAlert) {
            const lowStockResponse = await buildLowStockAlertResponse(
                supabase,
                user.id,
                language,
                wantsLowStockAlert
            )
            return jsonWithQuota(lowStockResponse)
        }

        const useTools = process.env.EXCEL_AI_USE_TOOLS === 'true'

        // aaa Product Generation Detection aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        // Reuse the early detection from above so we don't run the regex twice.
        const productGenRequest = earlyProductGenRequest
        if (!useTools && productGenRequest) {
            const generated = await generateProductsViaGroq(
                productGenRequest.count,
                productGenRequest.theme,
                language
            )
            if (generated) {
                return jsonWithQuota(generated)
            }
        }

        // aaa Groq AI Fallthrough aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        const groqApiKey = process.env.GROQ_API_KEY
        if (!groqApiKey) {
            console.warn('[excel-ai/intent] GROQ_API_KEY is not configured.')
            return jsonWithQuota(buildAiServiceFallback(language))
        }

        const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

        const groqController = new AbortController()
        const groqTimeout = setTimeout(() => groqController.abort(), 15_000)

        // Build request body a tools mode or legacy JSON mode
        const systemPrompt = buildSystemPrompt(language, { useTools })
        const userPrompt = buildUserPrompt(parsedRequest.data, parsedRequest.data.history)
        const messages = [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: userPrompt },
        ]

        const groqBody: Record<string, unknown> = {
            model,
            temperature: 0.1,
            max_tokens: 1024,
            messages,
        }

        if (useTools) {
            groqBody.tools = buildGroqTools(language)
            groqBody.tool_choice = 'auto'
            groqBody.parallel_tool_calls = false
        } else {
            groqBody.response_format = { type: 'json_object' }
        }

        let groqResponse: Response
        try {
            groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${groqApiKey}`,
                },
                signal: groqController.signal,
                body: JSON.stringify(groqBody),
            })
        } catch (fetchError) {
            if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
                console.warn('[excel-ai/intent] Groq request timed out (15s)')
            } else {
                console.warn('[excel-ai/intent] Groq fetch error:', fetchError)
            }
            return jsonWithQuota(buildAiServiceFallback(language))
        } finally {
            clearTimeout(groqTimeout)
        }

        if (!groqResponse.ok) {
            const errorText = await groqResponse.text()
            console.warn('[excel-ai/intent] Groq request failed', {
                status: groqResponse.status,
                details: errorText.slice(0, 300),
            })
            return jsonWithQuota(buildAiServiceFallback(language))
        }

        const groqJson = await groqResponse.json()

        // aaa Try tool-call parsing first (when useTools=true) aaaaaaaaaa
        if (useTools && isGroqToolCallResponse(groqJson)) {
            const hasToolCalls = Boolean(groqJson.choices?.[0]?.message?.tool_calls?.length)

            if (hasToolCalls) {
                const toolResult = parseToolCallResponse(groqJson)
                if (toolResult) {
                    Sentry.addBreadcrumb({
                        category: 'excel-ai',
                        level: 'info',
                        message: 'tool_call_parsed',
                        data: {
                            language,
                            mode: toolResult.mode,
                            operations:
                                toolResult.mode === 'intent'
                                    ? toolResult.intent.operations.map(
                                          (o: { type: string }) => o.type
                                      )
                                    : undefined,
                            scope:
                                toolResult.mode === 'intent' ? toolResult.intent.scope : undefined,
                        },
                    })

                    // Post-filter safety checks (same as JSON mode below)
                    if (toolResult.mode === 'chat') {
                        const normalized = normalizeChatResponse(toolResult, language)
                        const msg =
                            'assistantMessage' in normalized ? normalized.assistantMessage : null
                        const responseCategory = msg ? detectSensitiveContent(msg) : null
                        if (responseCategory)
                            return jsonWithQuota(
                                buildSensitiveContentResponse(responseCategory, language)
                            )
                        return jsonWithQuota(normalized)
                    }

                    if (toolResult.mode === 'intent' && toolResult.assistantMessage) {
                        const responseCategory = detectSensitiveContent(toolResult.assistantMessage)
                        if (responseCategory)
                            return jsonWithQuota(
                                buildSensitiveContentResponse(responseCategory, language)
                            )
                    }

                    return jsonWithQuota(toolResult)
                }

                // Tool call was present but failed to parse a fall through to JSON mode
                Sentry.addBreadcrumb({
                    category: 'excel-ai',
                    level: 'warning',
                    message: 'tool_call_parse_failed_fallback_json',
                    data: { language },
                })
            } else {
                Sentry.addBreadcrumb({
                    category: 'excel-ai',
                    level: 'info',
                    message: 'tool_call_absent_fallback_json',
                    data: { language },
                })
            }
        }

        // aaa JSON-mode parsing (legacy or fallback) aaaaaaaaaaaaaaaaaaaaa
        const content = (groqJson as { choices?: Array<{ message?: { content?: string } }> })
            .choices?.[0]?.message?.content
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
            Sentry.addBreadcrumb({
                category: 'excel-ai',
                level: 'warning',
                message: 'groq response failed schema validation',
                data: { language },
            })
            return jsonWithQuota(buildClarificationFallback(language))
        }

        // Telemetry: track resolved AI mode/operations for clarification-rate analysis
        Sentry.addBreadcrumb({
            category: 'excel-ai',
            level: 'info',
            message: `mode=${parsedModelResponse.data.mode}`,
            data: {
                language,
                mode: parsedModelResponse.data.mode,
                operations:
                    parsedModelResponse.data.mode === 'intent'
                        ? parsedModelResponse.data.intent.operations.map((o) => o.type)
                        : undefined,
                scope:
                    parsedModelResponse.data.mode === 'intent'
                        ? parsedModelResponse.data.intent.scope
                        : undefined,
            },
        })

        // aaa Post-filter chat responses aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
        if (parsedModelResponse.data.mode === 'chat') {
            const normalized = normalizeChatResponse(parsedModelResponse.data, language)
            if ('assistantMessage' in normalized && normalized.assistantMessage) {
                const responseCategory = detectSensitiveContent(normalized.assistantMessage)
                if (responseCategory) {
                    return jsonWithQuota(buildSensitiveContentResponse(responseCategory, language))
                }
            }
            return jsonWithQuota(normalized)
        }

        // Post-filter intent responses
        if (
            parsedModelResponse.data.mode === 'intent' &&
            parsedModelResponse.data.assistantMessage
        ) {
            const responseCategory = detectSensitiveContent(
                parsedModelResponse.data.assistantMessage
            )
            if (responseCategory) {
                return jsonWithQuota(buildSensitiveContentResponse(responseCategory, language))
            }
        }

        return jsonWithQuota(parsedModelResponse.data)
    } catch (error) {
        console.error('[excel-ai/intent] Error:', error)
        return NextResponse.json(buildAiServiceFallback(resolvedLanguage))
    }
}
