import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

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

      // If it's an API request or Server Action, return 401 instead of redirecting
      // this prevents the browser from trying to POST to the login page
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

      // For standard navigations, use 303 See Other to ensure the browser performs a GET
      return NextResponse.redirect(url, 303)
    }

    // 1. Handle invalid refresh tokens (common after database resets or token expiry)
    if (authError && typeof authError === 'object' && authError !== null && 'code' in authError && (authError as { code: string }).code === 'refresh_token_not_found') {
      console.warn("Middleware: Invalid refresh token detected. Redirecting to login.")
      const response = redirectToLogin()
      response.cookies.delete("auth_session_timer")
      return response
    }

    // 2. Session Expiry Logic
    if (user) {
      if (sessionAgeCookie) {
        const lastAuth = parseInt(sessionAgeCookie);
        if (now - lastAuth > MAX_SESSION_AGE) {
          // Session too old, force logout
          await supabase.auth.signOut();
          const response = redirectToLogin();
          response.cookies.delete("auth_session_timer");
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

    return supabaseResponse
  } catch (err) {
    // Catch any other unexpected errors during auth check
    console.error("Middleware Unexpected Auth Error:", err)

    // If accessing a protected route and something blew up, send to login
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth"
      return NextResponse.redirect(url, 303)
    }

    return supabaseResponse
  }
}
