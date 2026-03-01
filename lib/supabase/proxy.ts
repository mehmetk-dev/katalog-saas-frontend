import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Clears all Supabase auth cookies from a response object.
 * Removes session timer + chunked auth-token cookies.
 */
function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete("auth_session_timer")
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
      const projectId = url.hostname.split('.')[0]
      const name = `sb-${projectId}-auth-token`
      response.cookies.delete(name)
      response.cookies.delete(`${name}.0`)
      response.cookies.delete(`${name}.1`)
    } catch {
      // ignore malformed URL
    }
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // --- Session Expiry Logic & Redirection Helpers ---
    const MAX_SESSION_AGE = 12 * 60 * 60 * 1000; // 12 Hours in ms
    const sessionAgeCookie = request.cookies.get("auth_session_timer")?.value;
    const now = Date.now();

    const redirectToLogin = () => {
      const url = request.nextUrl.clone()
      url.pathname = "/auth"

      const isApiOrAction = request.nextUrl.pathname.startsWith('/api') ||
        request.headers.get('accept')?.includes('application/json') ||
        request.headers.has('next-action') ||
        request.method !== 'GET';

      if (isApiOrAction && request.method !== 'GET') {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized', message: 'Session expired' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return NextResponse.redirect(url, 303)
    }

    // 1. Handle invalid refresh tokens (common after database resets or token expiry)
    // Simplified logic to avoid Edge Runtime hangs or infinite loops
    if (authError && typeof authError === 'object' && authError !== null && 'code' in authError && (authError as { code: string }).code === 'refresh_token_not_found') {

      // If we are already on the auth page, proceed (clearing cookies via response if needed)
      // preventing infinite redirect loop.
      if (request.nextUrl.pathname.startsWith("/auth")) {
        clearAuthCookies(supabaseResponse)
        return supabaseResponse
      }

      // Otherwise, redirect to /auth and clear cookies on the redirect response
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = "/auth"
      const redirectResponse = NextResponse.redirect(loginUrl, 307)
      clearAuthCookies(redirectResponse)
      return redirectResponse
    }

    // 2. Session Expiry Logic
    if (user) {
      if (sessionAgeCookie) {
        const lastAuth = parseInt(sessionAgeCookie);
        if (now - lastAuth > MAX_SESSION_AGE) {
          // Session too old, force logout
          const response = redirectToLogin();
          clearAuthCookies(response)
          return response;
        }
      }

      // Update activity timer if on a dashboard route
      if (request.nextUrl.pathname.startsWith("/dashboard")) {
        supabaseResponse.cookies.set("auth_session_timer", now.toString(), {
          maxAge: 60 * 60 * 24 * 7, // 1 week cookie life
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
      }
    } else {
      // No user, clear the timer
      supabaseResponse.cookies.delete("auth_session_timer");
    }

    // 3. Redirect to login if accessing dashboard without auth
    if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
      return redirectToLogin()
    }

    // 4. Admin panel protection (except /admin/login)
    if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin/login")) {
      if (!user) {
        const adminLoginUrl = request.nextUrl.clone()
        adminLoginUrl.pathname = "/admin/login"
        return NextResponse.redirect(adminLoginUrl, 303)
      }

      // Server-side admin role check via Supabase
      const { data: adminProfile } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single()

      if (!adminProfile?.is_admin) {
        const adminLoginUrl = request.nextUrl.clone()
        adminLoginUrl.pathname = "/admin/login"
        return NextResponse.redirect(adminLoginUrl, 303)
      }
    }

    return supabaseResponse
  } catch (err) {
    // Catch any other unexpected errors during auth check
    console.error("Middleware Unexpected Auth Error:", err)

    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth"
      return NextResponse.redirect(url, 303)
    }

    return supabaseResponse
  }
}
