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
        return "Merhaba! 👋 Ürünlerinde toplu değişiklik yapmak istersen buradayım. Aşağıdaki hızlı komutları dene veya ne istediğini yaz."
    }
    return "Hey! 👋 I'm here to help with bulk product edits. Try the quick commands below or tell me what you need."
}
