import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export const SESSION_TIMER_COOKIE = "auth_session_timer"
/** Panelde bu kadar süre hareketsiz kalan oturum kapatılır */
export const MAX_SESSION_IDLE_MS = 12 * 60 * 60 * 1000

/**
 * Supabase'in "bu oturum artık kullanılamaz" anlamına gelen hata kodları. Bunlarda çerezler
 * temizlenmezse tarayıcı ölü token'ı göndermeye devam eder: sayfa açılır ama backend her
 * isteği "Invalid or expired token" ile reddeder.
 */
const DEAD_SESSION_ERROR_CODES = new Set([
  "refresh_token_not_found",
  "refresh_token_already_used",
  "session_not_found",
  "session_expired",
  "user_not_found",
  "user_banned",
  "bad_jwt",
])

function isDeadSessionError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    DEAD_SESSION_ERROR_CODES.has(String((error as { code: unknown }).code)),
  )
}

/**
 * Son panel etkinliği. Zamanlayıcı çerezi yoksa (ilk giriş ya da çerezin kendi süresi
 * dolacak kadar uzun bir ara) son giriş zamanı esas alınır; aksi halde uzun süre sonra
 * gelen kullanıcı hareketsizlik kontrolüne hiç takılmadan içeri giriyordu.
 */
function getLastActivityMs(timerCookie: string | undefined, lastSignInAt: string | undefined): number | null {
  const fromCookie = timerCookie ? Number.parseInt(timerCookie, 10) : Number.NaN
  if (Number.isFinite(fromCookie)) return fromCookie
  const fromSignIn = lastSignInAt ? Date.parse(lastSignInAt) : Number.NaN
  return Number.isFinite(fromSignIn) ? fromSignIn : null
}

/**
 * Clears all Supabase auth cookies from a response object.
 * Removes session timer + chunked auth-token cookies.
 */
function clearAuthCookies(request: NextRequest, response: NextResponse): void {
  response.cookies.delete(SESSION_TIMER_COOKIE)
  for (const { name } of request.cookies.getAll()) {
    if (name.startsWith("sb-") && name.includes("-auth-token")) {
      response.cookies.delete(name)
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

    const sessionTimerCookie = request.cookies.get(SESSION_TIMER_COOKIE)?.value
    const now = Date.now()

    const pathname = request.nextUrl.pathname
    const isProtectedRoute = pathname.startsWith("/dashboard") ||
      (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login"))

    const redirectToLogin = (reason?: "expired") => {
      const url = request.nextUrl.clone()
      url.pathname = "/auth"
      url.search = ""
      // Giriş sayfası tarayıcıdaki oturumu da kapatıp "oturum süresi doldu" mesajı gösterir
      if (reason === "expired") url.searchParams.set("session", "expired")
      // Girişten sonra kullanıcı istediği sayfaya geri dönebilsin
      if (request.method === "GET" && pathname.startsWith("/dashboard")) {
        const nextParams = new URLSearchParams(request.nextUrl.searchParams)
        nextParams.delete("_rsc")
        const nextQuery = nextParams.toString()
        url.searchParams.set("next", nextQuery ? `${pathname}?${nextQuery}` : pathname)
      }

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

    // 1. Kullanılamaz hale gelmiş oturum (refresh token yok/tekrar kullanılmış, oturum silinmiş…)
    if (isDeadSessionError(authError)) {
      // Public sayfalar ve /auth (döngüyü önlemek için) yönlendirilmez; yalnızca çerezler temizlenir.
      if (!isProtectedRoute) {
        clearAuthCookies(request, supabaseResponse)
        return supabaseResponse
      }

      const redirectResponse = redirectToLogin("expired")
      clearAuthCookies(request, redirectResponse)
      return redirectResponse
    }

    // 2. Hareketsizlik süresi
    if (user) {
      const lastActivity = getLastActivityMs(sessionTimerCookie, user.last_sign_in_at)
      if (lastActivity !== null && now - lastActivity > MAX_SESSION_IDLE_MS) {
        // Session too old, force logout. Public sayfalar (katalog linki, landing, blog)
        // yönlendirilmez; yalnızca oturum çerezleri temizlenir.
        const response = isProtectedRoute ? redirectToLogin("expired") : supabaseResponse
        clearAuthCookies(request, response)
        return response
      }

      // Panel ve admin etkinliği zamanlayıcıyı yeniler
      if (isProtectedRoute) {
        supabaseResponse.cookies.set(SESSION_TIMER_COOKIE, now.toString(), {
          maxAge: 60 * 60 * 24 * 7, // 1 week cookie life
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV !== "development",
          sameSite: "lax",
        });
      }
    } else if (sessionTimerCookie) {
      // No user, clear the timer
      supabaseResponse.cookies.delete(SESSION_TIMER_COOKIE);
    }

    // 3. Redirect to login if accessing dashboard without auth
    if (pathname.startsWith("/dashboard") && !user) {
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
