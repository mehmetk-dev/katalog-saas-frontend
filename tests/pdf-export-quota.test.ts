import { describe, expect, it } from "vitest"

import { shouldConsumePdfExportQuota } from "@/backend/src/workers/pdf-export-usage"

describe("PDF export quota lifecycle", () => {
  it.each([
    ["queued", false],
    ["processing", false],
    ["failed", false],
    ["cancelled", false],
    ["completed", true],
  ])("consumes quota for %s = %s", (status, expected) => {
    expect(shouldConsumePdfExportQuota(status)).toBe(expected)
  })
})
