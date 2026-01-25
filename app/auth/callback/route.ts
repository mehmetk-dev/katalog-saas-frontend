import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")
  const next = searchParams.get("next") || "/dashboard"
  const type = searchParams.get("type")

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
      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocal = request.url.includes("localhost")

      if (forwardedHost && !isLocal) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
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

