# AI Katalog Tasarımcısı — Teknik Gereksinim Dokümanı

> Kullanıcı doğal dilde yazarak sıfırdan katalog tasarımı oluşturabilsin.  
> Örnek: *"Lüks mücevher kataloğu, koyu arkaplan, altın tonları, 2 kolon, kapak sayfası olsun"*

---

## 1. Özellik Tanımı

Kullanıcı, builder sayfasında bir **AI chat paneli** açar ve doğal dilde katalog tasarımını tarif eder. AI, tüm tasarım parametrelerini (şablon, renkler, layout, kapak, gösterim ayarları) bir JSON olarak üretir. Kullanıcı önizlemede görür, beğenirse "Uygula" der.

**Kapsam:** Sadece tasarım parametreleri. Ürün ekleme/silme, görsel yükleme bu scope dışında.

---

## 2. Tam Olarak Ne Gerekiyor?

### 2.1 Yeni Dosyalar (Oluşturulacak)

| # | Dosya | Tür | Açıklama |
|---|-------|-----|----------|
| 1 | `app/api/catalog-ai/design/route.ts` | API Route | Groq çağrısı — sistem prompt + kullanıcı mesajı → tasarım JSON'u |
| 2 | `components/builder/ai/builder-ai-panel.tsx` | React Component | Chat UI — mesaj listesi, input, önizleme, uygula/reddet butonları |
| 3 | `components/builder/ai/types.ts` | TypeScript Types | `CatalogDesignIntent`, `DesignChatMessage`, `DesignPreset` tipleri |
| 4 | `components/builder/ai/design-presets.ts` | Constants | Hazır öneri prompt'ları (Quick Prompts) |
| 5 | `lib/validations/catalog-ai.ts` | Zod Schema | AI response validasyon şeması (whitelist kontrol) |

### 2.2 Güncellenecek Dosyalar

| # | Dosya | Değişiklik |
|---|-------|-----------|
| 1 | `components/builder/builder-page-client.tsx` | AI panel toggle state + panel render |
| 2 | `components/builder/toolbar/builder-toolbar.tsx` | AI buton ekleme (✨ ikonu) |
| 3 | `components/builder/builder-context.tsx` | `applyAiDesign(params)` fonksiyonu ekleme |
| 4 | `lib/translations/catalog.ts` | AI panel çevirileri (TR/EN) |

### 2.3 Dokunulmayacak Dosyalar

| Alan | Neden |
|------|-------|
| Veritabanı (migrations) | Tüm tasarım alanları zaten mevcut (37 sütun) |
| Backend controllers | Mevcut `PUT /api/v1/catalogs/:id` yeterli |
| Zod backend schemas | Mevcut `catalogUpdateSchema` AI output'u da valide eder |
| RLS policies | Mevcut `auth.uid() = user_id` yeterli |
| Template components | Şablonlar olduğu gibi kalıyor |

---

## 3. Her Dosyanın Detaylı Spesifikasyonu

### 3.1 API Route: `app/api/catalog-ai/design/route.ts`

**Amaç:** Kullanıcının doğal dil mesajını alıp Groq'a gönder, tasarım parametreleri JSON'u döndür.

**Request Body:**
```typescript
interface CatalogAiDesignRequest {
  message: string              // Kullanıcının doğal dil talebi (2-1200 karakter)
  language: 'tr' | 'en'       // UI dili
  userPlan: 'free' | 'plus' | 'pro'  // Plan → şablon kısıtlaması için
  currentProducts?: {          // Daha iyi öneri için ürün context'i
    totalCount: number
    categories: string[]       // Benzersiz kategori listesi
    sampleNames: string[]      // İlk 5 ürün adı
  }
  currentDesign?: Partial<CatalogDesignParams>  // Mevcut tasarım (iteratif iyileştirme için)
}
```

**Response Body:**
```typescript
interface CatalogAiDesignResponse {
  mode: 'design' | 'chat' | 'clarification'
  
  // mode === 'design' ise:
  design?: CatalogDesignParams
  reasoning?: string           // AI'ın neden bu seçimleri yaptığını açıklar
  
  // Her zaman:
  assistantMessage: string     // Kullanıcıya gösterilecek mesaj
}
```

**`CatalogDesignParams` — AI'ın Ürettiği Parametre Seti:**
```typescript
interface CatalogDesignParams {
  // Şablon
  layout: string               // Template ID (whitelist'den)
  columnsPerRow: number        // 1-6

  // Renkler
  primaryColor: string         // HEX (#xxxxxx)
  headerTextColor: string      // HEX
  backgroundColor: string      // HEX
  backgroundGradient?: string | null  // CSS gradient veya null

  // Branding
  logoPosition: string         // 9 opsiyon
  logoSize: 'small' | 'medium' | 'large'
  titlePosition: 'left' | 'center' | 'right'

  // Görüntüleme
  showPrices: boolean
  showDescriptions: boolean
  showAttributes: boolean
  showSku: boolean
  showUrls: boolean
  productImageFit: 'cover' | 'contain' | 'fill'
  backgroundImageFit: 'cover' | 'contain' | 'fill'

  // Kapak & Hikaye
  enableCoverPage: boolean
  coverTheme?: string          // 10 tema ID'sinden biri
  coverDescription?: string    // AI tarafından üretilen kapak metni (max 500 char)
  enableCategoryDividers: boolean
}
```

**System Prompt Yapısı:**

```
Sen FogCatalog AI Tasarım Asistanısın.
Kullanıcının doğal dil talebine göre katalog tasarım parametreleri üretiyorsun.

KURALLAR:
1. SADECE geçerli JSON döndür, markdown/prose ASLA.
2. response_format: json_object aktif.

MEVCUT ŞABLONLAR (layout alanı için):
- "modern-grid": Temiz ızgara, genel amaçlı [FREE]
- "compact-list": Sık liste, geniş envanter [FREE]
- "product-tiles": Kompakt karolar [FREE]
- "magazine": Editoryal, büyük görseller [PRO]
- "minimalist": Boşluk ve tipografi odaklı [PRO]
- "bold": Yüksek kontrast, kalın yazı [PRO]
- "elegant-cards": Lüks kart tasarımı [PRO]
- "classic-catalog": Profesyonel iş formatı [PRO]
- "showcase": Vitrin, koyu tema [PRO]
- "catalog-pro": 3 kolonlu profesyonel [PRO]
- "fashion-lookbook": Moda hero layout [PRO]
- "industrial": Teknik ürünler [PRO]
- "luxury": Altın tema, premium [PRO]
- "tech-modern": Modern teknoloji [PRO]
- "clean-white": Saf beyaz minimal [PRO]
- "retail": Perakende odaklı [PRO]

KAPAK TEMALARI (coverTheme alanı için):
modern | minimal | fashion | magazine | industrial | corporate | luxury | tech | artistic | bold

KULLANICI PLANI: {{userPlan}}
→ free ise SADECE modern-grid, compact-list, product-tiles kullan
→ plus/pro ise tüm şablonlar kullanılabilir

RENK KURALLARI:
- HEX formatı zorunlu: #xxxxxx
- Arkaplan ile yazı rengi arasında yeterli kontrast olmalı
- Sektöre uygun palet seç (mücevher=altın/koyu, teknoloji=mavi/beyaz, moda=siyah/beyaz)

LOGO POZİSYONLARI:
header-left | header-center | header-right | footer-left | footer-center | footer-right | none

ÇIKTI FORMATI:
{
  "mode": "design",
  "design": { ... tüm parametreler ... },
  "reasoning": "Neden bu seçimler yapıldı (1-2 cümle)",
  "assistantMessage": "Kullanıcıya gösterilecek mesaj"
}
```

**Groq Çağrı Paterni (mevcut Excel AI ile aynı):**
```typescript
const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
  },
  body: JSON.stringify({
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    temperature: 0.3,  // Biraz yaratıcılık (Excel AI'da 0 ama tasarım için 0.3)
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  }),
})
```

**Güvenlik Kontrolleri:**
```typescript
// 1. API key kontrolü
if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: "AI not configured" }, { status: 500 })

// 2. Auth kontrolü
const supabase = await createServerSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

// 3. Rate limiting (per-user)
// Öneri: free=10/gün, plus=50/gün, pro=200/gün

// 4. Input validation (Zod)
const parsed = requestSchema.safeParse(body)

// 5. Output validation — AI response'u whitelist'e karşı kontrol
const validated = designResponseSchema.safeParse(parsed)
// Geçersiz template ID → fallback to 'modern-grid'
// Geçersiz hex → fallback to default color
// Free user + Pro template → override to free template
```

---

### 3.2 Chat Panel: `components/builder/ai/builder-ai-panel.tsx`

**Amaç:** Excel AI chat panel'inin builder'a adapte edilmiş versiyonu.

**Props:**
```typescript
interface BuilderAiPanelProps {
  language: Language
  userPlan: PlanType
  products: Product[]          // Mevcut ürünler (context için)
  currentDesign: Partial<CatalogDesignParams>  // Mevcut tasarım (iterasyon için)
  onApplyDesign: (design: CatalogDesignParams) => void  // Builder state'i güncelle
  onClose: () => void
}
```

**İç State:**
```typescript
const [input, setInput] = useState('')
const [messages, setMessages] = useState<DesignChatMessage[]>([])
const [pendingDesign, setPendingDesign] = useState<CatalogDesignParams | null>(null)
const [isGenerating, setIsGenerating] = useState(false)
const messagesEndRef = useRef<HTMLDivElement>(null)
```

**UI Layout (mobil-friendly side panel):**
```
┌─────────────────────────────────┐
│ ✨ AI Tasarımcı          [X]   │  ← Header + close
├─────────────────────────────────┤
│                                 │
│ 🤖 Merhaba! Katalog tasarımını │  ← Mesaj listesi
│    tarif edin, sizin için      │
│    oluşturayım.                │
│                                 │
│          Lüks mücevher      👤 │  ← Kullanıcı mesajı
│          kataloğu istiyorum    │
│                                 │
│ 🤖 Hazırladım! Lüks koleksiyon│  ← AI yanıtı
│    şablonu, altın tonları...   │
│                                 │
│ ┌─────────────────────────────┐│
│ │ 📋 Tasarım Önizleme        ││  ← Pending design card
│ │ Şablon: Lüks Koleksiyon    ││
│ │ Renkler: ■ #d4a843 ■ #1a1a ││
│ │ Kolon: 2 | Kapak: ✓        ││
│ │                             ││
│ │ [✅ Uygula]  [❌ Reddet]   ││
│ └─────────────────────────────┘│
│                                 │
├─────────────────────────────────┤
│ 💡 Hızlı Öneriler:            │  ← Quick presets (ilk açılışta)
│ [Lüks mücevher] [Minimalist]  │
│ [Teknoloji] [Moda lookbook]   │
├─────────────────────────────────┤
│ ┌───────────────────────┐ [➤] │  ← Input + gönder
│ │ Tasarımınızı tarif... │      │
│ └───────────────────────┘      │
└─────────────────────────────────┘
```

**Quick Preset Örnekleri:**
```typescript
const DESIGN_PRESETS = {
  tr: [
    { label: "Lüks mücevher kataloğu", prompt: "Lüks mücevher kataloğu, koyu arkaplan, altın tonları, 2 kolon, kapak sayfası olsun" },
    { label: "Minimalist teknoloji", prompt: "Minimalist teknoloji ürün kataloğu, beyaz arkaplan, mavi vurgular, 3 kolon" },
    { label: "Moda lookbook", prompt: "Moda lookbook stili, siyah-beyaz, büyük görseller, 1-2 kolon, editoryal kapak" },
    { label: "Endüstriyel katalog", prompt: "Endüstriyel ürün kataloğu, kompakt liste, SKU ve fiyat göster, gri tonlar" },
    { label: "Zarif butik", prompt: "Zarif butik kataloğu, pastel renkler, kart tasarımı, kapak sayfası, açıklamalar görünsün" },
    { label: "Perakende mağaza", prompt: "Perakende mağaza kataloğu, canlı renkler, 4 kolon grid, fiyatlar büyük" },
  ],
  en: [
    { label: "Luxury jewelry", prompt: "Luxury jewelry catalog, dark background, gold tones, 2 columns, enable cover page" },
    { label: "Minimalist tech", prompt: "Minimalist tech product catalog, white background, blue accents, 3 columns" },
    // ...
  ]
}
```

---

### 3.3 Validasyon: `lib/validations/catalog-ai.ts`

**Amaç:** AI response'unun asla geçersiz değer içermemesini garanti et.

```typescript
import { z } from 'zod'

// Geçerli template ID'leri (whitelist)
const VALID_TEMPLATES = [
  'modern-grid', 'compact-list', 'product-tiles',
  'magazine', 'minimalist', 'bold', 'elegant-cards',
  'classic-catalog', 'showcase', 'catalog-pro',
  'fashion-lookbook', 'industrial', 'luxury',
  'tech-modern', 'clean-white', 'retail'
] as const

const FREE_TEMPLATES = ['modern-grid', 'compact-list', 'product-tiles'] as const

// Geçerli kapak temaları (whitelist)
const VALID_COVER_THEMES = [
  'modern', 'minimal', 'fashion', 'magazine', 'industrial',
  'corporate', 'luxury', 'tech', 'artistic', 'bold'
] as const

const VALID_LOGO_POSITIONS = [
  'header-left', 'header-center', 'header-right',
  'footer-left', 'footer-center', 'footer-right', 'none'
] as const

// HEX renk validasyonu
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Geçerli HEX renk kodu olmalı')

export const catalogDesignParamsSchema = z.object({
  layout: z.enum(VALID_TEMPLATES),
  columnsPerRow: z.number().int().min(1).max(6),

  primaryColor: hexColor,
  headerTextColor: hexColor,
  backgroundColor: hexColor,
  backgroundGradient: z.string().max(500).nullable().optional(),

  logoPosition: z.enum(VALID_LOGO_POSITIONS),
  logoSize: z.enum(['small', 'medium', 'large']),
  titlePosition: z.enum(['left', 'center', 'right']),

  showPrices: z.boolean(),
  showDescriptions: z.boolean(),
  showAttributes: z.boolean(),
  showSku: z.boolean(),
  showUrls: z.boolean(),
  productImageFit: z.enum(['cover', 'contain', 'fill']),
  backgroundImageFit: z.enum(['cover', 'contain', 'fill']),

  enableCoverPage: z.boolean(),
  coverTheme: z.enum(VALID_COVER_THEMES).optional(),
  coverDescription: z.string().max(500).optional(),
  enableCategoryDividers: z.boolean(),
})

// Plan bazlı template kontrolü
export function enforceUserPlan(
  design: CatalogDesignParams, 
  plan: 'free' | 'plus' | 'pro'
): CatalogDesignParams {
  if (plan === 'free' && !FREE_TEMPLATES.includes(design.layout)) {
    return { ...design, layout: 'modern-grid' }  // Fallback
  }
  return design
}
```

---

### 3.4 Builder Context Güncellemesi

**`components/builder/builder-context.tsx`'ye eklenecek:**

```typescript
// Yeni fonksiyon: AI tasarım parametrelerini builder state'ine uygula
const applyAiDesign = useCallback((design: CatalogDesignParams) => {
  dispatch({
    type: 'UPDATE',
    payload: {
      layout: design.layout,
      columnsPerRow: design.columnsPerRow,
      primaryColor: design.primaryColor,
      headerTextColor: design.headerTextColor,
      backgroundColor: design.backgroundColor,
      backgroundGradient: design.backgroundGradient ?? null,
      logoPosition: design.logoPosition,
      logoSize: design.logoSize,
      titlePosition: design.titlePosition,
      showPrices: design.showPrices,
      showDescriptions: design.showDescriptions,
      showAttributes: design.showAttributes,
      showSku: design.showSku,
      showUrls: design.showUrls,
      productImageFit: design.productImageFit,
      backgroundImageFit: design.backgroundImageFit,
      enableCoverPage: design.enableCoverPage,
      coverTheme: design.coverTheme,
      coverDescription: design.coverDescription,
      enableCategoryDividers: design.enableCategoryDividers,
    }
  })
}, [dispatch])
```

> **Not:** `dispatch({ type: 'UPDATE' })` zaten partial merge yapıyor. Yeni action eklemeye gerek yok.

---

### 3.5 Toolbar Butonu

**`components/builder/toolbar/builder-toolbar.tsx`'ye eklenecek:**

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setShowAiPanel(!showAiPanel)}
  className="gap-1.5"
>
  <Sparkles className="h-4 w-4" />
  <span className="hidden sm:inline">AI Tasarım</span>
</Button>
```

---

## 4. Veri Akış Diyagramı

```
┌─────────────────────────────────────────────────────────────────────────┐
│  KULLANICI                                                              │
│  "Lüks mücevher kataloğu, koyu arkaplan, altın, 2 kolon, kapak olsun" │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FRONTEND: BuilderAiPanel                                               │
│  1. Input validasyonu (2-1200 char)                                     │
│  2. Ürün context'i hazırla (categories, sampleNames)                   │
│  3. POST /api/catalog-ai/design                                        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  API ROUTE: /api/catalog-ai/design/route.ts                            │
│  1. Auth kontrolü (Supabase JWT)                                        │
│  2. Rate limit kontrolü                                                 │
│  3. Request Zod validasyonu                                             │
│  4. System prompt oluştur (şablonlar + temalar + plan bilgisi)         │
│  5. Groq API çağrısı (temperature: 0.3, json_object mode)              │
│  6. Response Zod validasyonu (whitelist check)                          │
│  7. Plan enforcement (free user → sadece free templates)                │
│  8. Return { mode, design, assistantMessage }                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FRONTEND: Pending Design Preview                                       │
│  - Renk chip'leri göster (■ #d4a843  ■ #1a1a2e)                       │
│  - Şablon adını göster ("Lüks Koleksiyon")                             │
│  - Layout detayları (2 kolon, kapak aktif, SKU kapalı)                 │
│  - [✅ Uygula] [❌ Reddet] butonları                                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ Kullanıcı "Uygula" derse
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  BUILDER CONTEXT: applyAiDesign(design)                                 │
│  - dispatch({ type: 'UPDATE', payload: design })                        │
│  - isDirty = true olur                                                  │
│  - Önizleme anında güncellenir (mevcut reactive render)                │
│  - Auto-save 3sn sonra tetiklenir (mevcut debounce)                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  MEVCUT SAVE FLOW (değişiklik yok)                                      │
│  - PUT /api/v1/catalogs/:id (snake_case payload)                        │
│  - Backend Zod validation (catalogUpdateSchema)                         │
│  - Supabase UPDATE (RLS: user_id = auth.uid())                         │
│  - Toast success                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. İteratif Tasarım (Konuşarak İyileştirme)

AI tek seferlik değil, **konuşma bazlı** çalışmalı:

```
👤 "Lüks mücevher kataloğu yap"
🤖 → layout: luxury, primaryColor: #d4a843, bg: #1a1a2e, 2 kolon
                                                         [Uygula ✅]
👤 "Renkleri biraz daha soğuk yap"
🤖 → (mevcut tasarımı alır) → primaryColor: #c0c0c0, bg: #0d1117
                                                         [Uygula ✅]
👤 "Kapak açıklaması da yaz, fiyatları gizle"
🤖 → showPrices: false, coverDescription: "Eşsiz mücevher..."
                                                         [Uygula ✅]
```

Bunun için `currentDesign` her istekte API'ye gönderilmeli ki AI mevcut state üzerinden iyileştirme yapabilsin.

---

## 6. Rate Limiting Stratejisi

| Plan | Günlük AI Tasarım İsteği | Gerekçe |
|------|--------------------------|---------|
| Free | 5 | Deneme amaçlı |
| Plus | 30 | Normal kullanım |
| Pro | 100 | Yoğun kullanım |

**Implementasyon:** API route'ta in-memory counter (Redis varsa Redis, yoksa `Map<userId, { count, resetAt }>`). Mevcut Excel AI'da rate limiting yok ama bu özellik için eklenmeli.

---

## 7. Maliyet Analizi (Groq)

| Metrik | Değer |
|--------|-------|
| System prompt token | ~800 token (şablon listesi + kurallar) |
| User prompt token | ~100-300 token (mesaj + ürün context) |
| Response token | ~200-400 token (tasarım JSON + reasoning) |
| **Toplam per istek** | **~1000-1500 token** |
| Groq fiyatı | Çoğu model ücretsiz / çok düşük |
| Günlük 1000 kullanıcı × 5 istek | ~7.5M token/gün → Groq'ta ihmal edilebilir maliyet |

---

## 8. Hata Senaryoları ve Fallback'ler

| Senaryo | Çözüm |
|---------|-------|
| Groq API down | `mode: "chat"` döndür, "Şu an AI hizmeti kullanılamıyor" mesajı |
| GROQ_API_KEY tanımsız | 500 + "AI yapılandırılmamış" mesajı, panel UI'da bilgi göster |
| AI geçersiz template ID döndürür | Zod validation fails → `layout` fallback: `modern-grid` |
| AI geçersiz HEX renk döndürür | Regex fail → ilgili renk default'a döner |
| Free user + Pro template döner | `enforceUserPlan()` override → free template |
| AI boş/bozuk JSON döndürür | `extractJsonObject()` + try-catch → clarification mode |
| Kullanıcı çok kısa mesaj yazar | `mode: "clarification"` → "Biraz daha detay verir misiniz?" |

---

## 9. Güvenlik Kontrol Listesi

- [x] **API key server-side** — Browser'a sızmaz (Next.js API route)
- [x] **Auth zorunlu** — Supabase JWT kontrolü
- [x] **Input sanitize** — Zod trim + max length (1200 char)
- [x] **Output whitelist** — Template ID, renk, enum hepsi whitelist'ten
- [x] **Plan enforcement** — Free user pro template seçemez
- [x] **Rate limiting** — Per-user günlük limit
- [x] **XSS koruması** — coverDescription zaten safeString'den geçiyor (backend)
- [x] **RLS koruması** — Kayıt sırasında `user_id = auth.uid()` (mevcut)
- [x] **Prompt injection** — System prompt'ta "SADECE JSON döndür" kuralı + response validation

---

## 10. i18n Gereksinimleri

`lib/translations/catalog.ts`'ye eklenecek anahtarlar:

```typescript
// TR
aiDesigner: "AI Tasarımcı",
aiDesignerDescription: "Katalog tasarımınızı doğal dilde tarif edin",
aiGenerating: "Tasarım oluşturuluyor...",
aiApplyDesign: "Uygula",
aiRejectDesign: "Reddet",
aiDesignApplied: "Tasarım uygulandı!",
aiRateLimitReached: "Günlük AI kullanım limitinize ulaştınız",
aiNotConfigured: "AI hizmeti yapılandırılmamış",
aiDescribeDesign: "Katalog tasarımınızı tarif edin...",
aiQuickPrompts: "Hızlı Öneriler",
aiDesignPreview: "Tasarım Önizleme",
aiTemplate: "Şablon",
aiColors: "Renkler",
aiLayout: "Düzen",
aiCover: "Kapak",

// EN
aiDesigner: "AI Designer",
aiDesignerDescription: "Describe your catalog design in natural language",
aiGenerating: "Generating design...",
aiApplyDesign: "Apply",
aiRejectDesign: "Dismiss",
aiDesignApplied: "Design applied!",
aiRateLimitReached: "Daily AI usage limit reached",
aiNotConfigured: "AI service not configured",
aiDescribeDesign: "Describe your catalog design...",
aiQuickPrompts: "Quick Suggestions",
aiDesignPreview: "Design Preview",
aiTemplate: "Template",
aiColors: "Colors",
aiLayout: "Layout",
aiCover: "Cover",
```

---

## 11. Test Planı

| Test | Dosya | Tür |
|------|-------|-----|
| AI response validation (valid design) | `tests/catalog-ai-validation.test.ts` | Unit |
| AI response validation (invalid template) | `tests/catalog-ai-validation.test.ts` | Unit |
| Plan enforcement (free + pro template) | `tests/catalog-ai-validation.test.ts` | Unit |
| HEX color regex | `tests/catalog-ai-validation.test.ts` | Unit |
| BuilderAiPanel render | `tests/builder-ai-panel.test.tsx` | Component |
| BuilderAiPanel apply flow | `tests/builder-ai-panel.test.tsx` | Component |
| API route auth check | `tests/catalog-ai-route.test.ts` | Integration |
| API route rate limiting | `tests/catalog-ai-route.test.ts` | Integration |

---

## 12. Özet

| Soru | Cevap |
|------|-------|
| Yeni dosya sayısı | 5 |
| Güncellenen dosya sayısı | 4 |
| DB migration | 0 |
| Yeni backend endpoint | 0 (Next.js API route yeterli) |
| Yeni npm dependency | 0 |
| Groq model değişikliği | Hayır (aynı model) |
| Risk seviyesi | Düşük |
| Mevcut kodu bozma riski | Yok (additive change) |
