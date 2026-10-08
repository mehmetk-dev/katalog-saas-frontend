import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }))

// vitest.setup.ts next/server'ı global olarak mock'luyor; middleware gerçek NextResponse ile test edilmeli
vi.mock("next/server", async () => await vi.importActual<typeof import("next/server")>("next/server"))

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    from: vi.fn(() => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { is_admin: false } }) }) }) })),
  })),
}))

import { updateSession } from "@/lib/supabase/proxy"

const THIRTEEN_HOURS_MS = 13 * 60 * 60 * 1000

function request(path: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(`https://fogcatalog.test${path}`)
  for (const [name, value] of Object.entries(cookies)) req.cookies.set(name, value)
  return req
}

describe("updateSession", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"
    getUserMock.mockReset()
  })

  it("redirects anonymous dashboard visits to /auth with the original target", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null })

    const response = await updateSession(request("/dashboard/products?page=2&_rsc=abc"))

    expect(response.status).toBe(303)
    const location = new URL(response.headers.get("location")!)
    expect(location.pathname).toBe("/auth")
    expect(location.searchParams.get("next")).toBe("/dashboard/products?page=2")
    expect(location.searchParams.has("page")).toBe(false)
  })

  it("does not bounce public pages when the inactivity timer has expired", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
    const staleTimer = String(Date.now() - THIRTEEN_HOURS_MS)

    const response = await updateSession(request("/catalog/spring-2026", { auth_session_timer: staleTimer }))

    expect(response.headers.get("location")).toBeNull()
    expect(response.cookies.get("auth_session_timer")?.value).toBe("")
  })

  it("still logs out dashboard visits when the inactivity timer has expired", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
    const staleTimer = String(Date.now() - THIRTEEN_HOURS_MS)

    const response = await updateSession(request("/dashboard", { auth_session_timer: staleTimer }))

    expect(response.status).toBe(303)
    expect(new URL(response.headers.get("location")!).pathname).toBe("/auth")
  })

  it("does not bounce public pages on a stale refresh token", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: { code: "refresh_token_not_found" } })

    const response = await updateSession(request("/catalog/spring-2026"))

    expect(response.headers.get("location")).toBeNull()
  })
})
