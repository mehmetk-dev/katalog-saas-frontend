import { describe, expect, it } from "vitest"

import { isAboutFogCatalogQuestion, isIdentityOrCapabilitiesQuestion } from "@/lib/excel-ai/detection"
import {
    buildIdentityResponse,
    buildUnsupportedCapabilityGuardrail,
} from "@/lib/excel-ai/responses"

describe("excel-ai customer-facing capability responses", () => {
    it("routes direct capability questions to identity/capability handling", () => {
        const message = "Kimsin ve neler yapabiliyorsun?"

        expect(isIdentityOrCapabilitiesQuestion(message)).toBe(true)
        expect(isAboutFogCatalogQuestion(message)).toBe(false)
    })

    it("does not claim product creation is unavailable when generated products are supported", () => {
        const response = buildUnsupportedCapabilityGuardrail("tr")

        expect(response.mode).toBe("chat")
        expect(response.assistantMessage).not.toContain("ürün ekleme yapmam")
        expect(response.assistantMessage).toContain("yeni ürün")
        expect(response.assistantMessage).toContain("onayla tabloya ekleyebilirim")
    })

    it("lists the full Excel AI capability set in Turkish", () => {
        const response = buildIdentityResponse("tr")

        expect(response.mode).toBe("chat")
        expect(response.assistantMessage).toContain("Yeni ürün önerisi")
        expect(response.assistantMessage).toContain("Alan temizleme")
        expect(response.assistantMessage).toContain("Metin ekleme")
        expect(response.assistantMessage).toContain("Ortalama fiyat")
    })
})
