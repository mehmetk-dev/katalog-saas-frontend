import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { AI_FIELDS, AI_NUMERIC_FIELDS, AI_SCOPES, AI_TEXT_FIELDS } from "@/lib/excel-ai/types"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const PRESET_IDS = [
  "intro_capabilities",
  "increase_selected_price_10",
  "map_all_to_existing_categories",
  "set_all_stock_zero",
] as const

const requestSchema = z.object({
  message: z.string().trim().min(2).max(1200),
  selectedCount: z.number().int().min(0).max(200000),
  visibleCount: z.number().int().min(0).max(200000),
  totalCount: z.number().int().min(0).max(500000),
  search: z.string().trim().max(200).optional(),
  language: z.enum(["tr", "en"]).optional(),
  presetId: z.enum(PRESET_IDS).optional(),
})

const fieldSchema = z.enum(AI_FIELDS)
const numericFieldSchema = z.enum(AI_NUMERIC_FIELDS)
const textFieldSchema = z.enum(AI_TEXT_FIELDS)

const operationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("set"),
    field: fieldSchema,
    value: z.union([z.string(), z.number(), z.null()]),
  }),
  z.object({
    type: z.literal("multiply"),
    field: numericFieldSchema,
    value: z.number().positive().max(1000),
  }),
  z.object({
    type: z.literal("append_text"),
    field: textFieldSchema,
    text: z.string().trim().min(1).max(1000),
    separator: z.string().max(10).optional(),
  }),
  z.object({
    type: z.literal("prepend_text"),
    field: textFieldSchema,
    text: z.string().trim().min(1).max(1000),
    separator: z.string().max(10).optional(),
  }),
  z.object({
    type: z.literal("clear"),
    field: fieldSchema,
  }),
  z.object({
    type: z.literal("generate_description"),
    field: z.literal("description"),
    style: z.string().trim().min(1).max(200).optional(),
    maxLength: z.number().int().min(40).max(1200).optional(),
  }),
  z.object({
    type: z.literal("generate_category"),
    field: z.literal("category"),
    useExistingOnly: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("generate_sku"),
    field: z.literal("sku"),
    prefix: z.string().trim().min(1).max(40).optional(),
    length: z.number().int().min(4).max(24).optional(),
  }),
  z.object({
    type: z.literal("generate_price"),
    field: z.literal("price"),
    strategy: z.enum(["scope_average", "category_average"]).optional(),
  }),
])

const intentSchema = z.object({
  scope: z.enum(AI_SCOPES),
  operations: z.array(operationSchema).min(1).max(12),
  reason: z.string().trim().max(400).optional(),
})

const aiResponseSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("intent"),
    intent: intentSchema,
    assistantMessage: z.string().trim().min(1).max(2000).optional(),
  }),
  z.object({
    mode: z.literal("chat"),
    assistantMessage: z.string().trim().min(1).max(2000),
    capabilities: z.array(z.string().trim().min(1).max(220)).max(12).optional(),
  }),
  z.object({
    mode: z.literal("clarification"),
    assistantMessage: z.string().trim().min(1).max(2000),
    clarificationQuestion: z.string().trim().min(1).max(600),
    suggestedCommands: z.array(z.string().trim().min(1).max(220)).max(5).optional(),
  }),
])

type Language = "tr" | "en"
type PresetId = (typeof PRESET_IDS)[number]
type ParsedRequest = z.infer<typeof requestSchema>
type ParsedAiResponse = z.infer<typeof aiResponseSchema>

interface CatalogCategoryStat {
  name: string
  count: number
}

interface CatalogProfile {
  totalProducts: number
  topCategories: CatalogCategoryStat[]
  topKeywords: string[]
}

const PROFILE_SAMPLE_LIMIT = 250
const TOKEN_STOPWORDS = new Set([
  "ve",
  "ile",
  "icin",
  "için",
  "the",
  "and",
  "for",
  "set",
  "model",
  "pro",
  "plus",
  "new",
  "yeni",
  "urun",
  "ürün",
])

function normalizeForMatch(input: string): string {
  return input
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim()
}

const SELECTED_SCOPE_TOKENS = ["secili", "isaretli", "checked", "selected"] as const
const ALL_SCOPE_TOKENS = ["tum", "hepsi", "hepsini", "all", "everything"] as const

const UNSUPPORTED_CAPABILITY_PATTERNS = [
  "urun ekle",
  "urun sil",
  "urun ara",
  "arama yap",
  "create product",
  "delete product",
  "search product",
] as const

function includesAnyToken(input: string, tokens: readonly string[]): boolean {
  return tokens.some((token) => input.includes(token))
}

function resolveScopeFromMessage(message: string): "selected" | "currentPage" | "all" {
  if (includesAnyToken(message, SELECTED_SCOPE_TOKENS)) return "selected"
  if (includesAnyToken(message, ALL_SCOPE_TOKENS)) return "all"
  return "currentPage"
}

function clampText(value: string, maxLength = 220): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1).trimEnd()}…`
}

function extractTopKeywords(productNames: string[]): string[] {
  const counts = new Map<string, number>()

  productNames.forEach((name) => {
    const tokens = name.split(/[^\p{L}\p{N}]+/u)
    tokens.forEach((token) => {
      const normalized = normalizeForMatch(token)
      if (!normalized || normalized.length < 3 || TOKEN_STOPWORDS.has(normalized)) return
      counts.set(normalized, (counts.get(normalized) || 0) + 1)
    })
  })

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))
    .slice(0, 3)
    .map(([keyword]) => keyword)
}

async function fetchCatalogProfile(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
): Promise<CatalogProfile | null> {
  const [countResult, sampleResult] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("products")
      .select("name, category, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(PROFILE_SAMPLE_LIMIT),
  ])

  if (sampleResult.error) {
    console.error("[excel-ai/intent] profile sample query failed:", sampleResult.error)
    return null
  }

  const rows = (sampleResult.data || []) as Array<{
    name: string | null
    category: string | null
    updated_at: string | null
  }>
  const totalProducts = countResult.count || rows.length

  if (rows.length === 0) {
    return {
      totalProducts,
      topCategories: [],
      topKeywords: [],
    }
  }

  const categoryCounts = new Map<string, number>()
  const productNames: string[] = []

  rows.forEach((row) => {
    const name = row.name?.trim()
    if (name) productNames.push(name)

    const rawCategory = row.category?.trim()
    if (!rawCategory) return

    rawCategory
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        categoryCounts.set(item, (categoryCounts.get(item) || 0) + 1)
      })
  })

  const topCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }))

  return {
    totalProducts,
    topCategories,
    topKeywords: extractTopKeywords(productNames),
  }
}

function buildUserNoteLine(profile: CatalogProfile | null, language: Language): string {
  if (!profile || profile.totalProducts === 0) {
    return language === "tr"
      ? "Kullanıcı notu: Katalog verin arttıkça daha hedefli öneriler verebilirim."
      : "User note: As your catalog grows, I can provide more tailored guidance."
  }

  const topCategory = profile.topCategories[0]?.name
  const topKeyword = profile.topKeywords[0]

  if (language === "tr") {
    if (topCategory && topKeyword) {
      return `Kullanıcı notu: Kataloğunda ${topCategory} kategorisi ve ${topKeyword} odaklı ürünler öne çıkıyor.`
    }
    if (topCategory) {
      return `Kullanıcı notu: Kataloğunda en yoğun kategori ${topCategory}.`
    }
    return `Kullanıcı notu: Kataloğunda ${profile.totalProducts} ürün bulunuyor.`
  }

  if (topCategory && topKeyword) {
    return `User note: Your catalog is strongest in ${topCategory} with ${topKeyword}-focused products.`
  }
  if (topCategory) {
    return `User note: Your most active category is ${topCategory}.`
  }
  return `User note: Your catalog currently has ${profile.totalProducts} products.`
}

function buildIdentityResponse(language: Language, profile?: CatalogProfile | null): ParsedAiResponse {
  if (language === "tr") {
    const userNote = buildUserNoteLine(profile || null, "tr")
    return {
      mode: "chat",
      assistantMessage: [
        "Ben FogCatalog Yapay Zeka Asistanıyım.",
        "Ürün verilerinde toplu fiyat, stok ve metin düzenlemeleri hazırlayabilirim.",
        "Açıklama üretimi, kategori yerleştirme, SKU üretimi ve ortalama fiyatlama işlemlerini de yönetebilirim.",
        clampText(userNote),
      ].join("\n"),
    }
  }

  const userNote = buildUserNoteLine(profile || null, "en")
  return {
    mode: "chat",
    assistantMessage: [
      "I am the FogCatalog AI Assistant.",
      "I can prepare bulk updates for prices, stock, and product text fields.",
      "I can also handle description generation, category mapping, SKU generation, and average pricing updates.",
      clampText(userNote),
    ].join("\n"),
  }
}

function buildGreetingResponse(language: Language, profile?: CatalogProfile | null): ParsedAiResponse {
  return buildIdentityResponse(language, profile)
}

function extractUserNameFromMessage(message: string): string | null {
  const trimmed = message.trim()
  if (!trimmed) return null

  const patterns = [
    /(?:benim adim|adim)\s+([a-zA-ZçğıöşüÇĞİÖŞÜ]{2,40})/i,
    /(?:my name is|i am)\s+([a-zA-ZçğıöşüÇĞİÖŞÜ]{2,40})/i,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    const candidate = match?.[1]?.trim()
    if (!candidate) continue
    return `${candidate.charAt(0).toLocaleUpperCase("tr")}${candidate.slice(1)}`
  }

  return null
}

function buildNameAwareResponse(language: Language, name: string, profile?: CatalogProfile | null): ParsedAiResponse {
  if (language === "tr") {
    return {
      mode: "chat",
      assistantMessage: [
        `Memnun oldum ${name}. Ben FogCatalog Yapay Zeka Asistanıyım.`,
        "Bu ekranda sadece ürün verilerinde toplu düzenleme hazırlayabilirim.",
        "Örnek: tüm ürünlerde SKU üret, seçili ürünlerin fiyatını %10 artır, ürün adına göre açıklama üret.",
        clampText(buildUserNoteLine(profile || null, "tr")),
      ].join("\n"),
    }
  }

  return {
    mode: "chat",
    assistantMessage: [
      `Nice to meet you ${name}. I am the FogCatalog AI Assistant.`,
      "In this screen I can only prepare bulk edits for product data.",
      "Example: generate SKU for all products, increase selected prices by 10%, generate descriptions from product names.",
      clampText(buildUserNoteLine(profile || null, "en")),
    ].join("\n"),
  }
}

function isSelfHarmMessage(message: string): boolean {
  const normalized = normalizeForMatch(message)
  const patterns = [
    "intihar",
    "kendime zarar",
    "kendimi oldur",
    "olmek istiyorum",
    "yasamak istemiyorum",
    "canima kiymak",
    "kill myself",
    "suicide",
    "hurt myself",
  ]
  return patterns.some((item) => normalized.includes(item))
}

function buildSelfHarmSupportResponse(language: Language): ParsedAiResponse {
  if (language === "tr") {
    return {
      mode: "chat",
      assistantMessage: [
        "Bunu paylaştığın için teşekkür ederim. Şu anda güvende olman çok önemli.",
        "Eğer kendine zarar verme riski varsa lütfen hemen 112 Acil'i ara.",
        "Mümkünse şu an güvendiğin bir yakınına haber ver ve yalnız kalma.",
        "İstersen burada kalıp önümüzdeki 10 dakikayı birlikte daha güvenli geçirmek için kısa bir plan yapabiliriz.",
      ].join("\n"),
    }
  }

  return {
    mode: "chat",
    assistantMessage: [
      "Thank you for sharing this. Your immediate safety matters most right now.",
      "If you might harm yourself, call emergency services now.",
      "Please contact someone you trust and avoid being alone.",
      "If you want, we can make a short 10-minute safety plan together right now.",
    ].join("\n"),
  }
}

function buildUnsupportedCapabilityGuardrail(language: Language): ParsedAiResponse {
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

function tryHighConfidenceIntent(input: ParsedRequest, language: Language): ParsedAiResponse | null {
  const normalized = normalizeForMatch(input.message)
  const scope = resolveScopeFromMessage(normalized)

  const wantsSku = normalized.includes("sku") && includesAnyToken(normalized, [
    "uret",
    "olustur",
    "ata",
    "gir",
    "oner",
    "rastgele",
    "benzersiz",
  ])

  if (wantsSku) {
    return {
      mode: "intent",
      assistantMessage:
        language === "tr"
          ? "Anladım. İstenen kapsamdaki ürünler için SKU üretimi önizlemesini hazırladım."
          : "Understood. I prepared a SKU generation preview for the requested scope.",
      intent: {
        scope,
        operations: [
          {
            type: "generate_sku",
            field: "sku",
          },
        ],
        reason: language === "tr" ? "Yüksek güven: SKU üretme isteği algılandı." : "High confidence: SKU generation request detected.",
      },
    }
  }

  const wantsCategory =
    normalized.includes("kategori") &&
    includesAnyToken(normalized, ["yerlestir", "eslestir", "siniflandir", "dagit", "uygun kategori"])

  if (wantsCategory) {
    return {
      mode: "intent",
      assistantMessage:
        language === "tr"
          ? "Anladım. Ürünleri mevcut kategorilere yerleştirmek için önizleme hazırladım."
          : "Understood. I prepared a preview to map products to existing categories.",
      intent: {
        scope,
        operations: [
          {
            type: "generate_category",
            field: "category",
            useExistingOnly: true,
          },
        ],
        reason: language === "tr" ? "Yüksek güven: kategori yerleştirme isteği algılandı." : "High confidence: category mapping request detected.",
      },
    }
  }

  const wantsDescription =
    normalized.includes("aciklama") && includesAnyToken(normalized, ["uret", "olustur", "yaz", "ekle", "tamamla"])

  if (wantsDescription) {
    return {
      mode: "intent",
      assistantMessage:
        language === "tr"
          ? "Anladım. Ürün adına göre açıklama üretimi için önizleme hazırladım."
          : "Understood. I prepared a preview for description generation from product names.",
      intent: {
        scope,
        operations: [
          {
            type: "generate_description",
            field: "description",
          },
        ],
        reason:
          language === "tr" ? "Yüksek güven: açıklama üretme isteği algılandı." : "High confidence: description generation request detected.",
      },
    }
  }

  return null
}

function buildPresetResponse(
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
        operations: [
          {
            type: "multiply",
            field: "price",
            value: 1.1,
          },
        ],
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
        operations: [
          {
            type: "generate_category",
            field: "category",
            useExistingOnly: true,
          },
        ],
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
      operations: [
        {
          type: "set",
          field: "stock",
          value: 0,
        },
      ],
      reason: language === "tr" ? "Preset: tüm ürünlerde stoku 0 yap." : "Preset: set stock to 0 for all products.",
    },
  }
}

function buildClarificationFallback(language: Language): ParsedAiResponse {
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

function buildAiServiceFallback(language: Language): ParsedAiResponse {
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

function normalizeChatResponse(response: Extract<ParsedAiResponse, { mode: "chat" }>, language: Language): ParsedAiResponse {
  const normalizedMessage = normalizeForMatch(response.assistantMessage)
  if (includesAnyToken(normalizedMessage, UNSUPPORTED_CAPABILITY_PATTERNS)) {
    return buildUnsupportedCapabilityGuardrail(language)
  }

  return {
    mode: "chat",
    assistantMessage: clampText(response.assistantMessage, 800),
  }
}

function isIdentityOrCapabilitiesQuestion(message: string): boolean {
  const normalized = normalizeForMatch(message)
  return [
    "kimsin",
    "sen kimsin",
    "ne yapabili",
    "neler yapabili",
    "yardim",
    "help",
    "who are you",
    "what can you do",
    "capabilities",
    "ozellik",
  ].some((token) => normalized.includes(token))
}

function isGreetingMessage(message: string): boolean {
  const normalized = normalizeForMatch(message)
  if (!normalized) return false

  const greetings = [
    "selam",
    "merhaba",
    "slm",
    "hey",
    "sa",
    "iyi gunler",
    "gunaydin",
    "iyi aksamlar",
    "hi",
    "hello",
    "hey there",
  ]

  return greetings.some((item) => normalized === item || normalized.startsWith(`${item} `))
}

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith("{")) return trimmed

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (codeBlockMatch?.[1]) return codeBlockMatch[1]

  const firstBrace = trimmed.indexOf("{")
  const lastBrace = trimmed.lastIndexOf("}")
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }

  return trimmed
}

function buildSystemPrompt(language: Language): string {
  if (language === "tr") {
    return [
      "Sen FogCatalog Yapay Zeka Asistanısın.",
      "Doğal konuşmayı anlayabilirsin, sadece komut parser değilsin.",
      "Mutlaka geçerli JSON döndür. Asla markdown, code fence veya düz metin döndürme.",
      "Sadece bu modlardan biriyle cevap ver:",
      '{"mode":"intent","intent":{"scope":"selected|currentPage|all","operations":[...],"reason":"kisa"},"assistantMessage":"kisa"}',
      '{"mode":"chat","assistantMessage":"metin","capabilities":["..."]}',
      '{"mode":"clarification","assistantMessage":"metin","clarificationQuestion":"soru","suggestedCommands":["..."]}',
      "Kural 1: Veride açık bir değişiklik talebi varsa mode=intent döndür.",
      "Kural 2: Kullanıcı kimlik/yetenek soruyorsa veya sohbet ediyorsa mode=chat döndür.",
      "Kural 3: İstek belirsizse mode=clarification döndür ve net takip sorusu sor.",
      "Asla desteklenmeyen yetenek söyleme: ürün ekleme, ürün silme, ürün arama gibi işlemleri yapabildiğini iddia etme.",
      "Kullanıcıya teknik operation isimlerini doğrudan listeleme.",
      "Desteklenen operation tipleri: set, multiply, append_text, prepend_text, clear, generate_description, generate_category, generate_sku, generate_price.",
      "Yüzde artış/azalış komutlarını multiply'a çevir. Örnek: %10 artır => 1.10, %10 azalt => 0.90.",
      "Scope kuralları: seçili/işaretli => selected, tüm/hepsi => all, aksi durumda currentPage.",
      "Doğal komut örneği: 'tüm ürünlere sku gir' => mode=intent + operation=generate_sku + scope=all.",
    ].join("\n")
  }

  return [
    "You are the FogCatalog AI Assistant.",
    "You can understand natural conversation, not only command parsing.",
    "Always return valid JSON only. Never return markdown or plain prose.",
    "Use exactly one mode:",
    '{"mode":"intent","intent":{"scope":"selected|currentPage|all","operations":[...],"reason":"short"},"assistantMessage":"short"}',
    '{"mode":"chat","assistantMessage":"text","capabilities":["..."]}',
    '{"mode":"clarification","assistantMessage":"text","clarificationQuestion":"question","suggestedCommands":["..."]}',
    "Rule 1: If there is a clear data-change request, return mode=intent.",
    "Rule 2: If user asks identity/capabilities or chats casually, return mode=chat.",
    "Rule 3: If request is ambiguous, return mode=clarification with a specific follow-up question.",
    "Never claim unsupported capabilities like adding, deleting, or searching products.",
    "Do not expose technical operation identifiers directly to the user.",
    "Supported operations: set, multiply, append_text, prepend_text, clear, generate_description, generate_category, generate_sku, generate_price.",
    "Convert percentage changes into multiply. Example: +10% => 1.10, -10% => 0.90.",
    "Scope rules: selected/checked => selected, all/everything => all, otherwise currentPage.",
    "Natural command example: 'fill SKU for all products' => mode=intent + operation=generate_sku + scope=all.",
  ].join("\n")
}

function buildUserPrompt(input: ParsedRequest): string {
  return [
    `message: ${input.message}`,
    `selectedCount: ${input.selectedCount}`,
    `visibleCount: ${input.visibleCount}`,
    `totalCount: ${input.totalCount}`,
    `search: ${input.search || ""}`,
    "allowedFields: name, sku, price, stock, category, description, product_url",
  ].join("\n")
}

export async function POST(request: NextRequest) {
  let resolvedLanguage: Language = "tr"

  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsedRequest = requestSchema.safeParse(body)

    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsedRequest.error.flatten(),
        },
        { status: 400 },
      )
    }

    const language = parsedRequest.data.language || "tr"
    resolvedLanguage = language
    const message = parsedRequest.data.message

    if (isSelfHarmMessage(message)) {
      return NextResponse.json(buildSelfHarmSupportResponse(language))
    }

    if (parsedRequest.data.presetId) {
      const needsProfile = parsedRequest.data.presetId === "intro_capabilities"
      const profile = needsProfile
        ? await fetchCatalogProfile(supabase, user.id).catch((error) => {
            console.error("[excel-ai/intent] profile fetch failed:", error)
            return null
          })
        : null

      return NextResponse.json(buildPresetResponse(parsedRequest.data.presetId, language, profile))
    }

    const introducedName = extractUserNameFromMessage(message)
    if (introducedName) {
      const profile = await fetchCatalogProfile(supabase, user.id).catch((error) => {
        console.error("[excel-ai/intent] profile fetch failed:", error)
        return null
      })
      return NextResponse.json(buildNameAwareResponse(language, introducedName, profile))
    }

    const highConfidenceIntent = tryHighConfidenceIntent(parsedRequest.data, language)
    if (highConfidenceIntent) {
      return NextResponse.json(highConfidenceIntent)
    }

    const wantsIdentity = isIdentityOrCapabilitiesQuestion(message)
    const wantsGreeting = isGreetingMessage(message)
    if (wantsIdentity || wantsGreeting) {
      const profile = await fetchCatalogProfile(supabase, user.id).catch((error) => {
        console.error("[excel-ai/intent] profile fetch failed:", error)
        return null
      })

      if (wantsIdentity) {
        return NextResponse.json(buildIdentityResponse(language, profile))
      }
      return NextResponse.json(buildGreetingResponse(language, profile))
    }

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      console.warn("[excel-ai/intent] GROQ_API_KEY is not configured.")
      return NextResponse.json(buildAiServiceFallback(language))
    }

    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b"

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(language),
          },
          {
            role: "user",
            content: buildUserPrompt(parsedRequest.data),
          },
        ],
      }),
    })

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.warn("[excel-ai/intent] Groq request failed", {
        status: groqResponse.status,
        details: errorText.slice(0, 300),
      })
      return NextResponse.json(buildAiServiceFallback(language))
    }

    const groqJson = (await groqResponse.json()) as {
      choices?: Array<{
        message?: {
          content?: string
        }
      }>
    }

    const content = groqJson.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json(buildClarificationFallback(language))
    }

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(extractJsonObject(content))
    } catch {
      return NextResponse.json(buildClarificationFallback(language))
    }

    const parsedModelResponse = aiResponseSchema.safeParse(parsedJson)
    if (!parsedModelResponse.success) {
      return NextResponse.json(buildClarificationFallback(language))
    }

    if (parsedModelResponse.data.mode === "chat") {
      return NextResponse.json(normalizeChatResponse(parsedModelResponse.data, language))
    }

    return NextResponse.json(parsedModelResponse.data)
  } catch (error) {
    console.error("[excel-ai/intent] Error:", error)
    return NextResponse.json(buildAiServiceFallback(resolvedLanguage))
  }
}
