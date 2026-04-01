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
                "🌫️ FogCatalog — Profesyonel Dijital Ürün Kataloğu Platformu",
                "",
                "FogCatalog, işletmelerin ürünlerini profesyonel dijital kataloglar halinde sergilemesini sağlayan bir SaaS platformudur.",
                "",
                "📋 Temel Özellikler:",
                "• Gerçek zamanlı katalog editörü — sürükle-bırak, renk, logo, layout özelleştirme",
                "• 15+ profesyonel şablon — Bauhaus, Modern HUD, Archive Editorial gibi tasarım akımları",
                "• PDF export — yüksek kaliteli vektörel PDF çıktısı",
                "• QR kod & paylaşım — her katalog için özel URL ve otomatik QR kod",
                "• Dijital sayfa çevirme — interaktif katalog deneyimi",
                "• Analitik dashboard — görüntülenme, cihaz, coğrafi konum takibi",
                "• Excel/CSV import — toplu ürün aktarımı",
                "• Çoklu dil — Türkçe ve İngilizce tam destek",
                "",
                "💰 Planlar:",
                "• Free — 1 katalog, 50 ürün, 3 şablon",
                "• Plus — 10 katalog, 1000 ürün, tüm şablonlar",
                "• Pro — Sınırsız katalog ve ürün, analitik, öncelikli destek",
                "",
                "👨‍💻 Geliştirici: Fogİstanbul Ajansı tarafından tasarlandı ve geliştirildi.",
                "",
                "🤖 Bu Ekranda Ben:",
                "Bu ekranda ürün verilerinde toplu düzenleme yapabilirim — fiyat güncelleme, açıklama üretimi, kategori yerleştirme, SKU oluşturma gibi.",
                clampText(userNote),
            ].join("\n"),
        }
    }

    const userNote = buildUserNoteLine(profile || null, "en")
    return {
        mode: "chat",
        assistantMessage: [
            "🌫️ FogCatalog — Professional Digital Product Catalog Platform",
            "",
            "FogCatalog is a SaaS platform that helps businesses showcase products as professional digital catalogs.",
            "",
            "📋 Key Features:",
            "• Real-time catalog editor — drag-and-drop, colors, logos, layout customization",
            "• 15+ professional templates — inspired by Bauhaus, Modern HUD, Archive Editorial and more",
            "• PDF export — high-quality vector PDF output",
            "• QR code & sharing — unique URL and auto-generated QR code for each catalog",
            "• Interactive page flip — realistic digital catalog browsing experience",
            "• Analytics dashboard — views, devices, geographic tracking",
            "• Excel/CSV import — bulk product upload",
            "• Multi-language — full Turkish and English support",
            "",
            "💰 Plans:",
            "• Free — 1 catalog, 50 products, 3 templates",
            "• Plus — 10 catalogs, 1000 products, all templates",
            "• Pro — Unlimited catalogs and products, analytics, priority support",
            "",
            "👨‍💻 Developer: Designed and built by Fogİstanbul Agency.",
            "",
            "🤖 What I Do Here:",
            "In this screen I can make bulk edits to product data — price updates, description generation, category mapping, SKU creation and more.",
            clampText(userNote),
        ].join("\n"),
    }
}

// ─── Identity Response ──────────────────────────────────────────────────────

export function buildIdentityResponse(language: Language, profile?: CatalogProfile | null): ParsedAiResponse {
    if (language === "tr") {
        const userNote = buildUserNoteLine(profile || null, "tr")
        return {
            mode: "chat",
            assistantMessage: [
                "Ben FogCatalog Yapay Zeka Asistanıyım.",
                "",
                "Bu platformda ürün verilerinde toplu düzenleme yapmanıza yardımcı oluyorum:",
                "• Fiyat güncelleme — seçili veya tüm ürünlerde yüzdelik artış/azalış",
                "• Açıklama üretimi — ürün adına göre profesyonel açıklamalar",
                "• Açıklama zenginleştirme — mevcut açıklamaları daha detaylı hale getirme",
                "• Kategori yerleştirme — ürünleri mevcut kategorilere akıllı eşleme",
                "• SKU oluşturma — otomatik stok kodu üretimi",
                "• İsim düzeltme — ürün adlarını profesyonelleştirme",
                "• Çeviri — ürün verilerini Türkçe/İngilizce'ye çevirme",
                "• Fiyat yuvarlama — düzgün fiyat formatına dönüştürme",
                "• Boş alan doldurma — eksik alanları akıllıca tamamlama",
                "• Stok uyarısı — düşük stoklu ürünleri listeleme",
                "",
                "Örnek komutlar:",
                "→ 'Seçili ürünlerin fiyatını %10 artır'",
                "→ 'Tüm ürünlere SKU üret'",
                "→ 'Ürün adına göre açıklama yaz'",
                "→ 'Açıklamaları zenginleştir'",
                "→ 'Ürün isimlerini düzelt'",
                "→ 'Açıklamaları İngilizce'ye çevir'",
                "→ 'Fiyatları yuvarla'",
                "→ 'Boş açıklamaları doldur'",
                "→ 'Düşük stoklu ürünleri göster'",
                "",
                "FogCatalog hakkında bilgi almak için 'FogCatalog nedir?' diye sorabilirsiniz.",
                clampText(userNote),
            ].join("\n"),
        }
    }

    const userNote = buildUserNoteLine(profile || null, "en")
    return {
        mode: "chat",
        assistantMessage: [
            "I am the FogCatalog AI Assistant.",
            "",
            "I help you make bulk edits to product data on this platform:",
            "• Price updates — percentage increase/decrease for selected or all products",
            "• Description generation — professional descriptions from product names",
            "• Description enrichment — enhance existing descriptions with more detail",
            "• Category mapping — smart mapping of products to existing categories",
            "• SKU generation — automatic stock code creation",
            "• Name fixing — capitalize and professionalize product names",
            "• Translation — translate product data to Turkish/English",
            "• Price rounding — clean up price formatting",
            "• Fill empty fields — auto-complete missing data",
            "• Stock alert — list products with low stock levels",
            "",
            "Example commands:",
            "→ 'Increase selected prices by 10%'",
            "→ 'Generate SKU for all products'",
            "→ 'Write descriptions from product names'",
            "→ 'Enrich existing descriptions'",
            "→ 'Fix product names'",
            "→ 'Translate descriptions to English'",
            "→ 'Round prices'",
            "→ 'Fill empty descriptions'",
            "→ 'Show low stock products'",
            "",
            "Ask 'What is FogCatalog?' to learn about the platform.",
            clampText(userNote),
        ].join("\n"),
    }
}

// ─── Greeting Response ──────────────────────────────────────────────────────

export function buildGreetingResponse(language: Language, profile?: CatalogProfile | null): ParsedAiResponse {
    if (language === "tr") {
        return {
            mode: "chat",
            assistantMessage: [
                "Selam! 👋 İyiyim, teşekkürler.",
                "Ürün verilerinde toplu düzenleme yapman gerekirse buradayım.",
                "Örnek: 'seçili fiyatları %10 artır', 'tüm ürünlere SKU üret', 'boş açıklamaları doldur'.",
                clampText(buildUserNoteLine(profile || null, "tr")),
            ].join("\n"),
        }
    }

    return {
        mode: "chat",
        assistantMessage: [
            "Hey! 👋 I'm doing well, thanks.",
            "I'm here whenever you need bulk edits on your product data.",
            "Example: 'increase selected prices by 10%', 'generate SKU for all', 'fill empty descriptions'.",
            clampText(buildUserNoteLine(profile || null, "en")),
        ].join("\n"),
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

export function buildNameAwareResponse(language: Language, name: string, profile?: CatalogProfile | null): ParsedAiResponse {
    if (language === "tr") {
        return {
            mode: "chat",
            assistantMessage: [
                `Memnun oldum ${name}! Ben FogCatalog Yapay Zeka Asistanıyım. 👋`,
                "",
                "Bu ekranda ürün verilerinde toplu düzenleme yapıyorum:",
                "• Fiyat güncelleme, açıklama üretimi, kategori yerleştirme, SKU oluşturma",
                "",
                "Hemen dene:",
                "→ 'Seçili ürünlerin fiyatını %10 artır'",
                "→ 'Tüm ürünlere SKU üret'",
                "→ 'Ürün adına göre açıklama yaz'",
                "",
                "FogCatalog hakkında bilgi almak için 'FogCatalog nedir?' diye sorabilirsin.",
                clampText(buildUserNoteLine(profile || null, "tr")),
            ].join("\n"),
        }
    }

    return {
        mode: "chat",
        assistantMessage: [
            `Nice to meet you ${name}! I am the FogCatalog AI Assistant. 👋`,
            "",
            "In this screen I make bulk edits to product data:",
            "• Price updates, description generation, category mapping, SKU creation",
            "",
            "Try it out:",
            "→ 'Increase selected prices by 10%'",
            "→ 'Generate SKU for all products'",
            "→ 'Write descriptions from product names'",
            "",
            "Ask 'What is FogCatalog?' to learn about the platform.",
            clampText(buildUserNoteLine(profile || null, "en")),
        ].join("\n"),
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
                "Bu ekranda ürün ekleme, silme veya arama işlemi yapmam.",
                "Sadece mevcut ürünler için toplu düzenleme önizlemesi oluştururum.",
                "Örnek: seçili ürünlerin fiyatını %10 artır, tüm ürünlere SKU üret, ürün adına göre açıklama yaz.",
            ].join("\n"),
        }
    }

    return {
        mode: "chat",
        assistantMessage: [
            "I do not add, delete, or search products in this screen.",
            "I only prepare bulk edit previews for existing products.",
            "Example: increase selected prices by 10%, generate SKU for all products, generate descriptions from product names.",
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
