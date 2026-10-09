import { beforeEach, describe, expect, it, vi, type Mock } from "vitest"

const { redirectMock, getUserMock, getSessionMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT;replace;${url};307;` })
  }),
  getUserMock: vi.fn(),
  getSessionMock: vi.fn(),
}))

vi.mock("next/navigation", () => ({ redirect: redirectMock }))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ auth: { getUser: getUserMock, getSession: getSessionMock } }),
}))

import { apiFetch } from "@/lib/api"

global.fetch = vi.fn()

function unauthorizedResponse() {
  return { ok: false, status: 401, json: async () => ({ error: "Invalid or expired token" }) }
}

describe("apiFetch — backend token'ı reddettiğinde", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("oturumlu istekte hata sayfası yerine girişe yönlendirir", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } })
    getSessionMock.mockResolvedValue({ data: { session: { access_token: "stale-token" } } })
    ;(global.fetch as Mock).mockResolvedValueOnce(unauthorizedResponse())

    await expect(apiFetch("/catalogs/c1")).rejects.toThrow("NEXT_REDIRECT")
    expect(redirectMock).toHaveBeenCalledWith("/auth?session=expired")
  })

  it("oturumsuz istekte yönlendirmez, hatayı fırlatır", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    getSessionMock.mockResolvedValue({ data: { session: null } })
    ;(global.fetch as Mock).mockResolvedValueOnce(unauthorizedResponse())

    await expect(apiFetch("/catalogs/c1")).rejects.toThrow("Invalid or expired token")
    expect(redirectMock).not.toHaveBeenCalled()
  })
})
