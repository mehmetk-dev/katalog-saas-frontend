import { describe, expect, it } from "vitest"

import { firstProductImage } from "@/components/catalogs/cover-image"
import { fitTitleFontSize } from "@/components/catalogs/covers/fit-title"

describe("kapak yardımcıları", () => {
    it("kapak görseli yoksa görseli olan ilk ürünün görselini döndürür", () => {
        expect(firstProductImage([
            { image_url: null, images: [] },
            { image_url: null, images: ["https://ornek.com/b.jpg"] },
            { image_url: "https://ornek.com/c.jpg" },
        ])).toBe("https://ornek.com/b.jpg")
        expect(firstProductImage([{ image_url: null }])).toBeUndefined()
        expect(firstProductImage(undefined)).toBeUndefined()
    })

    it("en uzun kelime sığmıyorsa başlık puntosunu orantılı küçültür", () => {
        expect(fitTitleFontSize("Yaz 2026", 120, 7)).toBe(120)
        expect(fitTitleFontSize("Yaz Koleksiyonu 2026", 120, 7)).toBe(76)
        // Türkçe harfler tek karakter sayılır
        expect(fitTitleFontSize("ÇİĞDEMİŞ", 80, 8)).toBe(80)
    })
})
