import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host")

      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}/dashboard`)
      }

      // Fallback to origin
      const { origin } = new URL(request.url)
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host")
  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}/auth?error=could_not_authenticate`)
  }

  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/auth?error=could_not_authenticate`)
}
