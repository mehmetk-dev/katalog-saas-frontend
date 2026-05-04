import { describe, expect, it } from "vitest"

import { arrayFingerprint } from "@/components/builder/builder-utils"

describe("builder-utils", () => {
  it("detects adjacent product reorder in large arrays", () => {
    const original = Array.from({ length: 100 }, (_, index) => `p-${index}`)
    const reordered = [...original]

    ;[reordered[10], reordered[11]] = [reordered[11], reordered[10]]

    expect(arrayFingerprint(reordered)).not.toBe(arrayFingerprint(original))
  })
})
