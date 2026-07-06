import { describe, expect, it, vi } from "vitest"

const { updateSessionMock } = vi.hoisted(() => ({
  updateSessionMock: vi.fn(async () => ({ status: 200 })),
}))

vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: updateSessionMock,
}))

import { middleware } from "@/middleware"

describe("middleware auth rate limiting", () => {
  it("does not rate limit auth page RSC/prefetch requests", async () => {
    for (let i = 0; i < 20; i++) {
      const request = {
        nextUrl: new URL(`https://fogcatalog.com/auth?tab=signup&_rsc=${i}`),
        headers: new Headers(),
      } as never
      const response = await middleware(request)

      expect(response.status).not.toBe(429)
    }

    expect(updateSessionMock).toHaveBeenCalledTimes(20)
  })
})
