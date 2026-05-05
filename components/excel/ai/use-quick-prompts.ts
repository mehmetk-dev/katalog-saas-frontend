import { useMemo } from "react"

import type { Language } from "@/lib/translations"
import type { QuickPrompt } from "./types"

export function useQuickPrompts(language: Language): QuickPrompt[] {
    return useMemo<QuickPrompt[]>(() => {
        if (language === "tr") {
            return [
                { id: "intro_capabilities", text: "Kimsin ve neler yapabiliyorsun?" },
                { id: "increase_selected_price_10", text: "Seçili ürünlerin fiyatını %10 artır" },
                { id: "map_all_to_existing_categories", text: "Tüm ürünleri mevcut kategorilere akıllı şekilde yerleştir" },
                { id: "set_all_stock_zero", text: "Tüm ürünlerin stokunu 0 yap" },
            ]
        }
        return [
            { id: "intro_capabilities", text: "Who are you and what can you do?" },
            { id: "increase_selected_price_10", text: "Increase selected products' price by 10%" },
            { id: "set_all_stock_zero", text: "Set stock to 0 for all products" },
        ]
    }, [language])
}

export function initialAssistantMessage(language: Language): string {
    if (language === "tr") {
        return [
            "Ben FogCatalog Yapay Zeka Asistanıyım.",
            "Bu panelde ürünleri toplu düzenler, yeni ürün önerisi oluşturur ve düşük stok kontrolü yaparım.",
            "Kapsamı yaz: seçili, mevcut sayfa veya tüm ürünler.",
            "Örnek: tüm ürünlere SKU üret, seçili ürünlerin fiyatını %10 artır, açıklamaları zenginleştir, ürün adlarını düzelt, 5 kahve ürünü oluştur.",
            "Not: Değişiklikleri önce yerelde uygularım, veritabanına sadece Kaydet ile yazarım.",
        ].join("\n")
    }
    return [
        "I am the FogCatalog AI Assistant.",
        "You can ask for bulk edits, new product suggestions, or low-stock checks.",
        "Example: Increase selected products by 10%, enrich descriptions, fix product names, create 5 coffee products, or ask what can you do?",
        "Note: edits stay local until Save.",
    ].join("\n")
}
