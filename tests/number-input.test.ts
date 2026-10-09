import { describe, expect, it } from "vitest"

import { formatNumberForInput, parseLocalizedNumber } from "@/lib/utils/number-input"

describe("parseLocalizedNumber", () => {
  it.each([
    ["199,90", 199.9],
    ["1.250,50", 1250.5],
    ["1,250.50", 1250.5],
    ["1.250", 1250],
    ["1.250.000", 1250000],
    ["199.90", 199.9],
    ["1250", 1250],
    ["₺ 49,99", 49.99],
    ["0", 0],
  ])("tr: %s → %s", (input, expected) => {
    expect(parseLocalizedNumber(input, "tr")).toBe(expected)
  })

  it("en arayüzde tek nokta ondalık, 3 haneli virgül binliktir", () => {
    expect(parseLocalizedNumber("1.250", "en")).toBe(1.25)
    expect(parseLocalizedNumber("1,250", "en")).toBe(1250)
    expect(parseLocalizedNumber("19,99", "en")).toBe(19.99)
  })

  it.each(["", "abc", "1,2,3", "-5", "1.2.3,4.5"])("geçersiz: %s", (input) => {
    expect(parseLocalizedNumber(input, "tr")).toBeNull()
  })

  it("kayıtlı değer düzenlenip tekrar kaydedilince değişmez", () => {
    for (const value of [1.125, 199.9, 1250, 0.5]) {
      expect(parseLocalizedNumber(formatNumberForInput(value, "tr"), "tr")).toBe(value)
      expect(parseLocalizedNumber(formatNumberForInput(value, "en"), "en")).toBe(value)
    }
  })
})
