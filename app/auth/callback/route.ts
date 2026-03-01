import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import {
  checkRateLimit,
  AUTH_CALLBACK_LIMIT,
  AUTH_CALLBACK_WINDOW_MS,
} from "@/lib/services/rate-limit"

const DEFAULT_NEXT_PATH = "/dashboard"

function resolveOrigin(rawOrigin: string): string {
  return rawOrigin.includes("0.0.0.0")
    ? rawOrigin.replace("0.0.0.0", "localhost")
    : rawOrigin
}

function sanitizeNextPath(rawNext: string | null): string {
  if (!rawNext) return DEFAULT_NEXT_PATH
  const isValidRelativePath = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\")
  return isValidRelativePath ? rawNext : DEFAULT_NEXT_PATH
}

function mapExchangeErrorToCode(message?: string): string {
  const normalizedMessage = message?.toLowerCase() || ""
  if (normalizedMessage.includes("expired")) return "code_expired"
  if (normalizedMessage.includes("invalid")) return "invalid_code"
  if (normalizedMessage.includes("network") || normalizedMessage.includes("fetch")) return "network_error"
  return "auth_failed"
}

function buildForwardedRedirect(request: Request, nextPath: string): string | null {
  const rawForwarded = request.headers.get("x-forwarded-host")?.toLowerCase().trim()
  if (!rawForwarded) return null

  const [hostname, port] = rawForwarded.split(":")
  if (!hostname) return null

  const allowedHosts = getAllowedRedirectHosts()
  const hostAllowed = allowedHosts.includes(hostname)
  if (!hostAllowed) return null

  const protocol = request.url.includes("localhost") ? "http" : "https"
  const hostWithPort = port ? `${hostname}:${port}` : hostname
  return `${protocol}://${hostWithPort}${nextPath}`
}

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
  const urlObj = new URL(request.url)
  const searchParams = urlObj.searchParams
  const origin = resolveOrigin(urlObj.origin)

  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")
  const next = sanitizeNextPath(searchParams.get("next"))
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
        const errorCode = mapExchangeErrorToCode(exchangeError.message)
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
        } catch {
          // Don't block auth flow if logging fails
        }
      }

      // 1. Şifre Yenileme Kontrolü (Type recovery ise direkt reset-password'e)
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }

      const forwardedRedirect = buildForwardedRedirect(request, next)
      if (forwardedRedirect) return NextResponse.redirect(forwardedRedirect)

      return NextResponse.redirect(`${origin}${next}`)
    } catch {
      return NextResponse.redirect(`${origin}/auth?error=unexpected_error`)
    }
  }

  // No code provided
  return NextResponse.redirect(`${origin}/auth?error=missing_code`)
}

