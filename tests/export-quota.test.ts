import { describe, expect, it } from "vitest"

import { getExportQuotaPeriodStart, getNextExportQuotaReset } from "@/lib/billing/export-quota"

describe("aylık PDF hakkı dönemi (Türkiye saati)", () => {
  it("ayın ilk günü 00:00 TSİ'den başlar", () => {
    expect(getExportQuotaPeriodStart(new Date("2026-10-15T12:00:00Z")).toISOString()).toBe("2026-09-30T21:00:00.000Z")
  })

  it("UTC'de önceki ay olsa da Türkiye'de yeni ay başladıysa yeni dönem sayılır", () => {
    // 1 Kasım 01:00 TSİ = 31 Ekim 22:00 UTC
    expect(getExportQuotaPeriodStart(new Date("2026-10-31T22:00:00Z")).toISOString()).toBe("2026-10-31T21:00:00.000Z")
  })

  it("yıl dönümünde bir sonraki yenileme Ocak başıdır", () => {
    expect(getNextExportQuotaReset(new Date("2026-12-20T10:00:00Z")).toISOString()).toBe("2026-12-31T21:00:00.000Z")
  })
})
