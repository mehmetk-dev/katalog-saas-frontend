import { describe, expect, it } from "vitest"

import { categoryMatchPattern } from "@/backend/src/controllers/products/category-filter"

// PostgreSQL ARE ile JS RegExp bu desen için aynı davranır (\s, ^, $, gruplar)
const matches = (category: string, value: string) =>
    new RegExp(categoryMatchPattern(category), "i").test(value)

describe("categoryMatchPattern", () => {
    it("matches a single exact category case-insensitively", () => {
        expect(matches("Masa", "Masa")).toBe(true)
        expect(matches("masa", "MASA")).toBe(true)
    })

    it("does not match categories that only contain the name", () => {
        expect(matches("Masa", "Masa Lambası")).toBe(false)
        expect(matches("Masa", "Ofis Masası")).toBe(false)
    })

    it("matches any entry of a comma-separated list, with or without spaces", () => {
        expect(matches("Sandalye", "Masa, Sandalye")).toBe(true)
        expect(matches("Sandalye", "Masa,Sandalye ,Dolap")).toBe(true)
        expect(matches("Masa", "Masa,Sandalye")).toBe(true)
        expect(matches("Dolap", "Masa, Sandalye")).toBe(false)
    })

    it("treats regex characters in the category as literal text", () => {
        expect(matches("No.1", "No.1")).toBe(true)
        expect(matches("No.1", "NoX1")).toBe(false)
        expect(matches("A+B (Set)", "A+B (Set), C")).toBe(true)
        expect(matches(".*", "Masa")).toBe(false)
    })
})
