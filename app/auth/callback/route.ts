import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import {
  checkRateLimit,
  AUTH_CALLBACK_LIMIT,
  AUTH_CALLBACK_WINDOW_MS,
} from "@/lib/rate-limit"

/** İzin verilen redirect host'ları (x-forwarded-host). Production'da güvenlik için. */
function getAllowedRedirectHosts(): string[] {
  const hosts: string[] = ["localhost", "127.0.0.1"]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      const u = new URL(appUrl)
      if (u.hostname) hosts.push(u.hostname)
    } catch {
      // ignore
    }
  }
  const extra = process.env.ALLOWED_REDIRECT_HOSTS
  if (extra) {
    extra.split(",").forEach((h) => {
      const t = h.trim().toLowerCase()
      if (t && !hosts.includes(t)) hosts.push(t)
    })
  }
  return hosts
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")
  const rawNext = searchParams.get("next") || "/dashboard"
  // Güvenlik: Sadece relative path kabul et (open redirect önleme)
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\")
    ? rawNext
    : "/dashboard"
  const type = searchParams.get("type")

  // Rate limit: auth callback (OAuth code exchange) dakikada limit kadar
  if (code) {
    const rl = checkRateLimit(
      request,
      "auth-callback",
      AUTH_CALLBACK_LIMIT,
      AUTH_CALLBACK_WINDOW_MS
    )
    if (!rl.allowed) {
      return NextResponse.redirect(`${origin}/auth?error=rate_limited`)
    }
  }

  // Handle OAuth errors
  if (error) {
    console.error("Auth callback error:", error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || "")}`
    )
  }

  if (code) {
    try {
      const supabase = await createClient()

      // Exchange code for session with timeout handling
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("Session exchange error:", exchangeError)

        // Provide more specific error messages
        let errorCode = "auth_failed"
        if (exchangeError.message?.includes("expired")) {
          errorCode = "code_expired"
        } else if (exchangeError.message?.includes("invalid")) {
          errorCode = "invalid_code"
        } else if (exchangeError.message?.includes("network") || exchangeError.message?.includes("fetch")) {
          errorCode = "network_error"
        }

        return NextResponse.redirect(`${origin}/auth?error=${errorCode}`)
      }

      // Log activity after successful authentication
      if (sessionData?.user) {
        try {
          await supabase.from('activity_logs').insert({
            user_id: sessionData.user.id,
            user_email: sessionData.user.email,
            activity_type: 'user_login',
            description: `${sessionData.user.email} sisteme giriş yaptı`,
          })
        } catch (logError) {
          console.error('Activity log error:', logError)
          // Don't block auth flow if logging fails
        }
      }

      // 1. Şifre Yenileme Kontrolü (Type recovery ise direkt reset-password'e)
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }

      // 2. 'next' parametresi varsa oraya, yoksa dashboard'a
      // Güvenlik: x-forwarded-host sadece izin listesindeki host'lara redirect eder
      const rawForwarded = request.headers.get("x-forwarded-host")?.toLowerCase().trim()
      const [hostname, port] = rawForwarded ? rawForwarded.split(":") : [null, null]
      const allowedHosts = getAllowedRedirectHosts()
      const hostAllowed = hostname && allowedHosts.some((h) => h === hostname)

      if (hostAllowed) {
        const protocol = request.url.includes("localhost") ? "http" : "https"
        const hostWithPort = port ? `${hostname}:${port}` : hostname
        return NextResponse.redirect(`${protocol}://${hostWithPort}${next}`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    } catch (err) {
      console.error("Auth callback unexpected error:", err)
      return NextResponse.redirect(`${origin}/auth?error=unexpected_error`)
    }
  }

  // No code provided
  return NextResponse.redirect(`${origin}/auth?error=missing_code`)
}

