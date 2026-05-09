import type { Language, ParsedAiResponse, PresetId, CatalogProfile } from "./schemas"
import type { CasualCategory, SensitiveCategory } from "./detection"
import { clampText, buildUserNoteLine, normalizeForMatch, includesAnyToken, UNSUPPORTED_CAPABILITY_PATTERNS } from "./helpers"

// ─── About FogCatalog Response ──────────────────────────────────────────────

export function buildAboutFogCatalogResponse(language: Language, profile?: CatalogProfile | null): ParsedAiResponse {
    if (language === "tr") {
        const userNote = buildUserNoteLine(profile || null, "tr")
        return {
            mode: "chat",
            assistantMessage: [
                "🌫️ **FogCatalog** — Profesyonel Dijital Katalog Platformu",
                "",
                "Ürünlerinizi saniyeler içinde etkileyici dijital kataloglara dönüştürmenizi sağlayan modern bir SaaS platformuyuz.",
                "",
                "✨ **Öne Çıkanlar:**",
                "• **Hızlı Tasarım:** Sürükle-bırak editör ve profesyonel şablonlar (Bauhaus, Minimal vb.)",
                "• **Çoklu Çıktı:** PDF export, interaktif sayfa çevirme ve özel QR kodlu paylaşımlar.",
                "• **Toplu İşlemler:** Excel/CSV import ile binlerce ürünü tek tıkla aktarma.",
                "• **Analitik:** Kataloglarınızın nerede, kim tarafından görüntülendiğini takip etme.",
                "",
                "🤖 **Ben Ne Yapıyorum?**",
                "Bu ekranda ürün verilerini topluca düzenleyebilir, fiyatları güncelleyebilir, yapay zeka ile açıklama ve isim üretebilir, yeni ürün fikirleri oluşturabilirim.",
                clampText(userNote),
            ].join("\n"),
        }
    }

    const userNote = buildUserNoteLine(profile || null, "en")
    return {
        mode: "chat",
        assistantMessage: [
            "🌫️ **FogCatalog** — Professional Digital Catalog Platform",
            "",
            "A modern SaaS platform that turns your products into stunning digital catalogs in seconds.",
            "",
            "✨ **Highlights:**",
            "• **Fast Design:** Drag-and-drop editor with professional templates (Bauhaus, Minimal, etc.)",
            "• **Multiple Outputs:** PDF export, interactive page flip, and custom QR code sharing.",
            "• **Bulk Actions:** Import thousands of products instantly via Excel/CSV.",
            "• **Analytics:** Track where and how your catalogs are being viewed.",
            "",
            "🤖 **What I Do Here:**",
            "In this screen, I help you bulk-edit product data, update prices, generate descriptions with AI, and create new product suggestions.",
            clampText(userNote),
        ].join("\n"),
    }
}

// ─── Identity Response ──────────────────────────────────────────────────────

export function buildIdentityResponse(language: Language, _profile?: CatalogProfile | null): ParsedAiResponse {
    if (language === "tr") {
        return {
            mode: "chat",
            assistantMessage: [
                "Ben FogCatalog AI Asistanıyım. 🤖",
                "",
                "📊 Toplu düzenleme — fiyat, stok, SKU, kategori, açıklama, çeviri, yuvarlama, temizleme",
                "✍️ İçerik üretimi — açıklama yaz/zenginleştir, isimleri düzelt, boş alanları doldur",
                "🆕 Ürün oluşturma — '5 kahve ürünü oluştur' gibi komutlarla",
                "⚠️ Stok kontrolü — düşük stoklu ürünleri listele",
                "",
                "Kapsam: seçili · sayfa · tüm ürünler",
                "Örnek: 'Seçili fiyatları %10 artır', 'Tüm ürünlere açıklama yaz', 'Boş alanları doldur'",
            ].join("\n"),
        }
    }

    return {
        mode: "chat",
        assistantMessage: [
            "I'm the FogCatalog AI Assistant. 🤖",
            "",
            "📊 Bulk editing — price, stock, SKU, category, descriptions, translate, rounding, clearing",
            "✍️ Content — write/enrich descriptions, fix names, fill blanks",
            "🆕 Product creation — e.g. 'create 5 coffee products'",
            "⚠️ Stock alerts — list low-stock items",
            "",
            "Scope: selected · page · all products",
            "Example: 'Increase selected prices by 10%', 'Write descriptions for all', 'Fill empty fields'",
        ].join("\n"),
    }
}

// ─── Greeting Response ──────────────────────────────────────────────────────

export function buildGreetingResponse(language: Language, _profile?: CatalogProfile | null): ParsedAiResponse {
    if (language === "tr") {
        return {
            mode: "chat",
            assistantMessage: "Selam! 👋 Nasıl yardımcı olabilirim?",
        }
    }

    return {
        mode: "chat",
        assistantMessage: "Hey! 👋 How can I help?",
    }
}

// ─── Casual Conversation Response ───────────────────────────────────────────

export function buildCasualConversationResponse(category: CasualCategory, language: Language): ParsedAiResponse {
    const responses: Record<CasualCategory, { tr: string; en: string }> = {
        thanks: {
            tr: "Rica ederim! 😊 Başka bir şey lazım olursa buradayım.",
            en: "You're welcome! 😊 Let me know if you need anything else.",
        },
        acknowledgment: {
            tr: "Tamam, hazırım! Başka bir komutun varsa yaz. 🚀",
            en: "Got it! Ready for your next command. 🚀",
        },
        goodbye: {
            tr: "Görüşürüz! İyi çalışmalar! ✌️",
            en: "See you! Have a great day! ✌️",
        },
        positive_feedback: {
            tr: "Teşekkürler, çok naziksin! 😊 Başka bir konuda yardım edebilir miyim?",
            en: "Thanks, that's kind! 😊 Anything else I can help with?",
        },
        how_are_you: {
            tr: "İyiyim, teşekkür ederim! 😊 Sen nasılsın? Bugün ürünlerle ilgili ne yapalım?",
            en: "I'm great, thanks for asking! 😊 How about you? What shall we work on today?",
        },
        laughter: {
            tr: "😄 Keyifli sohbetimiz var! Peki, bir komutun var mı?",
            en: "😄 Fun times! So, got a command for me?",
        },
    }

    const resp = responses[category]
    return {
        mode: "chat",
        assistantMessage: language === "tr" ? resp.tr : resp.en,
    }
}

// ─── Name Aware Response ────────────────────────────────────────────────────

export function buildNameAwareResponse(language: Language, name: string, _profile?: CatalogProfile | null): ParsedAiResponse {
    if (language === "tr") {
        return {
            mode: "chat",
            assistantMessage: `Memnun oldum ${name}! 👋 Ürünlerinde toplu değişiklik yapmak istersen buradayım. Ne yapmamı istersin?`,
        }
    }

    return {
        mode: "chat",
        assistantMessage: `Nice to meet you ${name}! 👋 I'm here to help with bulk product edits. What would you like to do?`,
    }
}

// ─── Sensitive Content Response ─────────────────────────────────────────────

export function buildSensitiveContentResponse(category: SensitiveCategory, language: Language): ParsedAiResponse {
    if (category === "violence") {
        if (language === "tr") {
            return {
                mode: "chat",
                assistantMessage: "Bu tür içeriklere yanıt veremem. Ben sadece ürün verilerinde toplu düzenleme yapan bir katalog asistanıyım.",
            }
        }
        return {
            mode: "chat",
            assistantMessage: "I cannot respond to this type of content. I am a catalog assistant that only handles bulk product data edits.",
        }
    }

    if (language === "tr") {
        return {
            mode: "chat",
            assistantMessage: "Bu isteği işleyemem. Ben FogCatalog ürün verisi asistanıyım. Örnek komut: 'seçili ürünlerin fiyatını %10 artır'.",
        }
    }
    return {
        mode: "chat",
        assistantMessage: "I cannot process this request. I am the FogCatalog product data assistant. Example: 'increase selected prices by 10%'.",
    }
}

// ─── Unsupported Capability Guardrail ───────────────────────────────────────

export function buildUnsupportedCapabilityGuardrail(language: Language): ParsedAiResponse {
    if (language === "tr") {
        return {
            mode: "chat",
            assistantMessage: [
                "Bu ekranda belirsiz ürün ekleme, ürün silme veya ürün arama işlemini doğrudan yapmam.",
                "Mevcut ürünler için toplu düzenleme önizlemesi oluştururum; sayı ve tema verirsen yeni ürün önerileri oluşturup onayla tabloya ekleyebilirim.",
                "Örnek: '5 kahve ürünü oluştur', 'seçili ürünlerin fiyatını %10 artır', 'tüm ürünlere SKU üret', 'ürün adına göre açıklama yaz'.",
            ].join("\n"),
        }
    }

    return {
        mode: "chat",
        assistantMessage: [
            "I do not directly handle vague product add, delete, or search requests in this screen.",
            "I prepare bulk edit previews for existing products; if you provide a count and theme, I can generate new product suggestions and add them to the table after confirmation.",
            "Example: 'create 5 coffee products', 'increase selected prices by 10%', 'generate SKU for all products', 'generate descriptions from product names'.",
        ].join("\n"),
    }
}

// ─── Preset Response ────────────────────────────────────────────────────────

export function buildPresetResponse(
    presetId: PresetId,
    language: Language,
    profile?: CatalogProfile | null,
): ParsedAiResponse {
    if (presetId === "intro_capabilities") {
        return buildIdentityResponse(language, profile)
    }

    if (presetId === "increase_selected_price_10") {
        return {
            mode: "intent",
            assistantMessage:
                language === "tr"
                    ? "İsteği anladım. Seçili ürünlerde fiyatı %10 artırmak için önizleme hazırladım."
                    : "Understood. I prepared a preview to increase selected products by 10%.",
            intent: {
                scope: "selected",
                operations: [{ type: "multiply", field: "price", value: 1.1 }],
                reason: language === "tr" ? "Preset: seçili ürünlerde fiyatı %10 artır." : "Preset: increase selected prices by 10%.",
            },
        }
    }

    if (presetId === "map_all_to_existing_categories") {
        return {
            mode: "intent",
            assistantMessage:
                language === "tr"
                    ? "İsteği anladım. Tüm ürünleri mevcut kategorilere akıllı şekilde yerleştirmek için önizleme hazırladım."
                    : "Understood. I prepared a preview to map all products into existing categories.",
            intent: {
                scope: "all",
                operations: [{ type: "generate_category", field: "category", useExistingOnly: true }],
                reason:
                    language === "tr"
                        ? "Preset: tüm ürünleri mevcut kategorilere akıllı yerleştir."
                        : "Preset: map all products to existing categories.",
            },
        }
    }

    return {
        mode: "intent",
        assistantMessage:
            language === "tr"
                ? "İsteği anladım. Tüm ürünlerde stok değerini 0 yapmak için önizleme hazırladım."
                : "Understood. I prepared a preview to set stock to 0 for all products.",
        intent: {
            scope: "all",
            operations: [{ type: "set", field: "stock", value: 0 }],
            reason: language === "tr" ? "Preset: tüm ürünlerde stoku 0 yap." : "Preset: set stock to 0 for all products.",
        },
    }
}

// ─── Fallback Responses ─────────────────────────────────────────────────────

export function buildClarificationFallback(language: Language): ParsedAiResponse {
    if (language === "tr") {
        return {
            mode: "clarification",
            assistantMessage: "İsteğini netleştirirsen hemen yardımcı olabilirim.",
            clarificationQuestion: "Ne yapmak istediğini biraz daha açık yazar mısın?",
            suggestedCommands: [
                "Seçili ürünlerin fiyatını %10 artır",
                "Tüm ürünler için ürün adına göre açıklama üret",
                "Tüm ürünlere SKU üret",
            ],
        }
    }

    return {
        mode: "clarification",
        assistantMessage: "I can help as soon as the request is a bit more specific.",
        clarificationQuestion: "Could you clarify what you want to change?",
        suggestedCommands: [
            "Increase selected products by 10%",
            "Generate descriptions for all products from product names",
            "Generate SKU for all products",
        ],
    }
}

export function buildAiServiceFallback(language: Language): ParsedAiResponse {
    if (language === "tr") {
        return {
            mode: "clarification",
            assistantMessage: "Yapay zeka servisine şu an erişemiyorum.",
            clarificationQuestion: "Komutu kısa ve net yazarak tekrar dener misin?",
            suggestedCommands: [
                "Seçili ürünlerin fiyatını %10 artır",
                "Tüm ürünlerde ürün adına göre açıklama üret",
                "Tüm ürünlere SKU üret",
            ],
        }
    }

    return {
        mode: "clarification",
        assistantMessage: "I cannot reach the AI service right now.",
        clarificationQuestion: "Could you try again with a short and clear command?",
        suggestedCommands: [
            "Increase selected products by 10%",
            "Generate descriptions from product names for all products",
            "Generate SKU for all products",
        ],
    }
}

// ─── Low Stock Alert Response ───────────────────────────────────────────────

export async function buildLowStockAlertResponse(
    supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createServerSupabaseClient>>,
    userId: string,
    language: Language,
    threshold: number,
): Promise<ParsedAiResponse> {
    const { data: lowStockProducts, error } = await supabase
        .from("products")
        .select("name, stock, category")
        .eq("user_id", userId)
        .lte("stock", threshold)
        .order("stock", { ascending: true })
        .limit(20)

    if (error || !lowStockProducts) {
        return {
            mode: "chat",
            assistantMessage: language === "tr"
                ? "Stok verilerine erişirken bir sorun oluştu."
                : "There was a problem accessing stock data.",
        }
    }

    if (lowStockProducts.length === 0) {
        return {
            mode: "chat",
            assistantMessage: language === "tr"
                ? `Tebrikler! Stok sayısı ${threshold} ve altında olan ürün bulunmuyor.`
                : `Great news! No products found with stock at or below ${threshold}.`,
        }
    }

    const productLines = lowStockProducts.map((p) => {
        const name = (p.name as string) || "—"
        const stock = p.stock as number
        const category = (p.category as string) || ""
        const categoryInfo = category ? ` (${category})` : ""
        return `• ${name}${categoryInfo} — stok: ${stock}`
    })

    if (language === "tr") {
        return {
            mode: "chat",
            assistantMessage: [
                `⚠️ Stok Uyarısı: ${lowStockProducts.length} ürün, stok sayısı ${threshold} ve altında:`,
                "",
                ...productLines,
                "",
                lowStockProducts.length === 20 ? "Not: Sadece ilk 20 ürün gösteriliyor." : "",
                "İpucu: Bu ürünlerin stoklarını güncellemek için 'stoku X yap' komutu kullanabilirsin.",
            ].filter(Boolean).join("\n"),
        }
    }

    return {
        mode: "chat",
        assistantMessage: [
            `⚠️ Stock Alert: ${lowStockProducts.length} products with stock at or below ${threshold}:`,
            "",
            ...productLines,
            "",
            lowStockProducts.length === 20 ? "Note: Showing only the first 20 products." : "",
            "Tip: Use 'set stock to X' to update stock levels for these products.",
        ].filter(Boolean).join("\n"),
    }
}

// ─── Normalize Chat Response ────────────────────────────────────────────────

export function normalizeChatResponse(response: Extract<ParsedAiResponse, { mode: "chat" }>, language: Language): ParsedAiResponse {
    const normalizedMessage = normalizeForMatch(response.assistantMessage)
    if (includesAnyToken(normalizedMessage, UNSUPPORTED_CAPABILITY_PATTERNS)) {
        return buildUnsupportedCapabilityGuardrail(language)
    }

    return {
        mode: "chat",
        assistantMessage: clampText(response.assistantMessage, 800),
    }
}
