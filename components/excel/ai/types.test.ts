import { describe, expect, it } from "vitest"

import { extractApiError } from "./types"

describe("extractApiError", () => {
    it("prefers customer-facing API message over technical error code", () => {
        const result = extractApiError({
            error: "Rate limit exceeded",
            message: "Günlük AI kullanım limitinize ulaştınız (25 istek). Yaklaşık 30 dakika sonra tekrar deneyebilirsiniz.",
        })

        expect(result).toBe(
            "Günlük AI kullanım limitinize ulaştınız (25 istek). Yaklaşık 30 dakika sonra tekrar deneyebilirsiniz.",
        )
    })

    it("keeps Unauthorized as a stable technical code for auth handling", () => {
        expect(extractApiError({ error: "Unauthorized" })).toBe("Unauthorized")
    })
})
