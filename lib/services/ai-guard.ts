import { NextResponse } from "next/server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { checkUserRateLimit } from "@/lib/services/rate-limit"

/**
 * Toplu AI uçları (açıklama, kategori, çeviri, ad düzeltme, zenginleştirme) için ortak giriş +
 * günlük kota kontrolü. Önceden bu uçlarda yalnızca giriş kontrolü vardı: her kullanıcı istek
 * başına 80–120 ürünü sınırsız kez modele gönderebiliyordu (Groq maliyeti).
 *
 * Not: sayaç sunucu belleğinde tutulur (lib/services/rate-limit); tek frontend süreciyle çalışan
 * mevcut kurulumda yeterli, yatay ölçeklenirse Redis'e taşınmalı.
 */
export const AI_BULK_WINDOW_MS = 24 * 60 * 60 * 1000
export const AI_BULK_DAILY_LIMITS: Record<string, number> = {
  free: 15,
  plus: 100,
  pro: 300,
}

type GuardResult =
  | { ok: true; userId: string; plan: string; remaining: number }
  | { ok: false; response: NextResponse }

export async function guardAiRequest(language: "tr" | "en" = "tr"): Promise<GuardResult> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: profile } = await supabase.from("users").select("plan").eq("id", user.id).single()
  const plan = (profile?.plan as string) || "free"
  const limit = AI_BULK_DAILY_LIMITS[plan] ?? AI_BULK_DAILY_LIMITS.free
  const result = checkUserRateLimit(user.id, "excel-ai-bulk", limit, AI_BULK_WINDOW_MS)

  if (!result.allowed) {
    const minutes = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 60_000))
    const message =
      language === "en"
        ? `You've reached your daily AI limit (${limit} requests). Try again in about ${minutes} minutes.`
        : `Günlük yapay zeka kullanım limitinize ulaştınız (${limit} istek). Yaklaşık ${minutes} dakika sonra tekrar deneyin.`
    return {
      ok: false,
      response: NextResponse.json({ error: "Rate limit exceeded", message, resetAt: result.resetAt }, { status: 429 }),
    }
  }

  return { ok: true, userId: user.id, plan, remaining: result.remaining }
}
