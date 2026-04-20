import { NextResponse, type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"
import { checkRateLimit, AUTH_CALLBACK_LIMIT, AUTH_CALLBACK_WINDOW_MS } from "@/lib/services/rate-limit"

export async function middleware(request: NextRequest) {
    // Rate limit /auth routes to prevent brute-force attacks
    if (request.nextUrl.pathname.startsWith("/auth")) {
        const { allowed, resetAt } = checkRateLimit(
            request,
            "auth",
            AUTH_CALLBACK_LIMIT,
            AUTH_CALLBACK_WINDOW_MS
        )
        if (!allowed) {
            const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
            return new NextResponse(
                JSON.stringify({ error: "Too many requests", retryAfter }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "Retry-After": String(retryAfter),
                    },
                }
            )
        }
    }

    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (svg, png, jpg, etc.)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
