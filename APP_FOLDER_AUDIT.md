# APP/ FOLDER — Production Audit Report

> **Auditor Profile:** 15 yıl deneyimli, güvenlik odaklı Senior TypeScript/React Mimarı  
> **Kapsam:** `app/` klasörü altındaki tüm dosya ve alt klasörler  
> **Tarih:** Haziran 2025  
> **Değerlendirme Alanları:** 🔒 Security · ⚡ Performance · 🏗️ Architecture · 🧹 Code Quality

---

## Severity Legend

| Emoji | Seviye | Açıklama |
|-------|--------|----------|
| 🔴 | **CRITICAL** | Production'da güvenlik açığı veya veri kaybı riski |
| 🟠 | **HIGH** | Ciddi performans/kalite sorunu, kısa vadede çözülmeli |
| 🟡 | **MEDIUM** | İyileştirme önerilir, orta vadede ele alınmalı |
| 🟢 | **LOW** | Küçük iyileştirme fırsatları, iyi pratikler |
| ✅ | **GOOD** | Doğru uygulama, övgüye değer |

---

## Özet İstatistikler

| Metrik | Değer |
|--------|-------|
| Toplam İncelenen Dosya | ~60+ |
| 🔴 Critical Bulgular | 3 |
| 🟠 High Bulgular | 8 |
| 🟡 Medium Bulgular | 16 |
| 🟢 Low Bulgular | 12 |
| ✅ İyi Pratikler | 11 |

---

## 1. Root Files (`app/layout.tsx`, `global-error.tsx`, `robots.ts`, `sitemap.ts`)

### 📄 `layout.tsx` (199 satır)

✅ **İyi Pratikler:**
- `next/font` ile font optimizasyonu (`display: 'swap'`, `preload: true`)
- JSON-LD structured data (SoftwareApplication + Organization) — SEO için doğru
- `viewport` export ayrı yapılmış (Next.js 14+ best practice)
- DNS prefetch ve preconnect tanımları mevcut

🟡 **MEDIUM — Sahte AggregateRating (SEO / Legal Risk)**
```typescript
aggregateRating: {
  '@type': 'AggregateRating',
  ratingValue: '4.8',
  ratingCount: '200',
}
```
> Hardcoded rating değerleri Google tarafından "structured data spam" olarak değerlendirilebilir. Gerçek veriye dayanmıyorsa Google Search Console'da manual action riski taşır.

**Öneri:** Rating verisi gerçek değilse bu bloğu tamamen kaldırın. Gerçekse dinamik olarak DB'den çekin.

🟡 **MEDIUM — Duplicate `manifest` Tanımı**
```tsx
// metadata objesinde:
manifest: "/manifest.json",

// <head> içinde tekrar:
<link rel="manifest" href="/manifest.json" />
```
> Next.js `metadata.manifest` otomatik olarak `<link>` tagı oluşturur. İkinci tanım gereksiz.

**Öneri:** `<head>` içindeki `<link rel="manifest">` satırını kaldırın.

🟢 **LOW — Yanlış Preconnect Domain**
```tsx
<link rel="preconnect" href="https://supabase.co" />
```
> `supabase.co` genel domain'dir, projenizin gerçek Supabase URL'si `xxx.supabase.co` gibi bir subdomain olmalı. Bu preconnect işe yaramaz.

**Öneri:** `NEXT_PUBLIC_SUPABASE_URL` env'den alınan gerçek URL'yi kullanın veya kaldırın.

🟢 **LOW — Google Fonts Preconnect Gereksiz**
```tsx
<link rel="dns-prefetch" href="//fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
```
> `next/font/google` zaten self-hosted font kullanır. Google'a bağlantı kurmaz. Bu satırlar gereksiz.

---

### 📄 `sitemap.ts` (108 satır)

🟡 **MEDIUM — URL Tutarsızlığı (SEO Impact)**
```typescript
// sitemap.ts:
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fogcatalog.app'

// layout.tsx:
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fogcatalog.com'

// robots.ts:
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fogcatalog.com'
```
> Fallback URL'ler tutarsız: `fogcatalog.app` vs `fogcatalog.com`. Env variable yoksa SEO'da canonical URL conflict oluşur.

**Öneri:** Tüm dosyalarda aynı fallback domain'i kullanın. İdeal olarak shared bir constant'a taşıyın:
```typescript
// lib/constants.ts
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fogcatalog.com'
```

🟢 **LOW — `lastModified: new Date()` Her Build'de Değişir**
> Statik sayfalar için `lastModified` her deployment'ta güncellenir. Google bu sinyali güvenilmez bulur.

**Öneri:** Statik sayfalar için sabit tarih kullanın, sadece blog yazıları için dinamik tarih bırakın.

---

### 📄 `global-error.tsx`

✅ **İyi Pratik:** `process.env.NODE_ENV === 'development'` kontrolü ile hata detayları sadece development'ta gösteriliyor. Sentry entegrasyonu mevcut.

---

### 📄 `robots.ts`

✅ **İyi Pratik:** Doğru yapılandırılmış. Dashboard ve auth sayfaları `disallow` listesinde.

---

## 2. `(main)/` — Landing Page

### 📄 `page.tsx` (65 satır)

🟡 **MEDIUM — Tüm Landing Page Client-Side Render**
```tsx
"use client"
```
> Homepage tamamen client component olarak işaretli. Bu, ilk render'ın tamamen tarayıcıda yapılması demek. SEO crawler'ları JavaScript çalıştırmayabilir. `HeroSection`, `FeaturesSection` gibi statik içerik server component olabilir.

**Öneri:** Page'i server component yapın, sadece interaktif parçaları (auth error handling) client'a taşıyın:
```tsx
// page.tsx (server)
export default function HomePage() {
  return (
    <div>
      <AuthErrorRedirector /> {/* "use client" */}
      <HeroSection />        {/* server - statik */}
      <FeaturesSection />     {/* server - statik */}
    </div>
  )
}
```

🟡 **MEDIUM — `document.title` Override ile Metadata Conflict**
```tsx
useEffect(() => {
  document.title = t('common.siteTitle')
}, [language, t])
```
> `layout.tsx`'de zaten `metadata.title` tanımlı. Client-side title override SSR metadata ile çelişir.

**Öneri:** i18n title için Next.js `generateMetadata` kullanın veya sadece client-side i18n ile yönetin. İkisini birden yapmayın.

---

### 📄 `_components/` (7 dosya)

✅ **İyi Pratikler:**
- Tüm bileşenler `React.memo()` ile sarılmış
- `as const` ile statik array'ler tanımlanmış
- Shared `TranslationFn` type tanımı (DRY)
- Bileşenler tek sorumluluk prensibine uygun

---

## 3. `admin/` — Yönetim Paneli

### 📄 `error.tsx` (43 satır)

🔴 **CRITICAL — Production'da Error Stack Trace Sızıntısı**
```tsx
<span className="font-mono text-xs text-red-400">{error.message}</span>

{error.stack && (
  <div className="mt-4 text-left max-w-2xl overflow-auto bg-slate-900 p-4 rounded text-xs text-slate-300 font-mono">
    {error.stack}
  </div>
)}
```
> **Hiçbir environment kontrolü yok.** `error.message` ve `error.stack` production'da doğrudan kullanıcıya gösteriliyor. Bu, dahili dosya yolları, dependency versiyonları ve uygulama yapısını ifşa eder.

**Karşılaştırma:** `global-error.tsx` doğru şekilde `process.env.NODE_ENV === 'development'` kontrolü yapıyor. Bu dosyada o kontrol eksik.

**Çözüm:**
```tsx
{process.env.NODE_ENV === "development" && (
  <>
    <span className="font-mono text-xs text-red-400">{error.message}</span>
    {error.stack && (
      <div className="mt-4 ...">
        {error.stack}
      </div>
    )}
  </>
)}
```

---

### 📄 `login/page.tsx` (218 satır)

🟠 **HIGH — Client-Side Admin Yetki Doğrulama**
```tsx
const { data: profile } = await supabase
  .from("users")
  .select("is_admin")
  .eq("id", data.user.id)
  .single()

if (!profile?.is_admin) {
  await supabase.auth.signOut()
  setError("Bu hesabın admin yetkisi bulunmuyor")
  return
}
```
> Admin kontrolü tamamen client-side yapılıyor. DevTools ile bu kontrol bypass edilebilir. Login sonrası `/admin` sayfasına direkt navigasyon mümkün.

**Öneri:** Admin kontrolü **mutlaka server-side** yapılmalı. `app/admin/layout.tsx` veya middleware'de RLS + server-side admin check ekleyin.

🟡 **MEDIUM — Mount'ta Mevcut Oturum Sonlandırma**
```tsx
useEffect(() => {
  const signOutExisting = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsReady(true)
  }
  signOutExisting()
}, [])
```
> Admin login sayfasına yanlışlıkla gelen normal kullanıcı oturumu otomatik sonlandırılır. Bu, kullanıcı deneyimi açısından tehlikeli — bookmark veya doğrudan URL ile gelen kullanıcılar session kaybeder.

**Öneri:** Sign out yerine, mevcut admin session varsa otomatik yönlendirme yapın. Normal kullanıcıysa uyarı gösterin.

🟡 **MEDIUM — 7 Ayrı useState**
```tsx
const [email, setEmail] = useState("")
const [password, setPassword] = useState("")
const [showPassword, setShowPassword] = useState(false)
const [error, setError] = useState("")
const [isLoading, setIsLoading] = useState(false)
const [isGoogleLoading, setIsGoogleLoading] = useState(false)
const [isReady, setIsReady] = useState(false)
```
> 7 ayrı state, birbiriyle ilişkili ve race condition'a açık.

**Öneri:** `useReducer` ile birleştirin:
```typescript
type State = {
  email: string; password: string; showPassword: boolean;
  error: string; isLoading: boolean; isGoogleLoading: boolean; isReady: boolean;
}
```

---

## 4. `api/` — API Routes

### 📄 `admin/activity-logs/route.ts`

🟡 **MEDIUM — parseInt NaN Kontrolü Eksik**
```typescript
const page = parseInt(searchParams.get("page") || "1")
const limit = parseInt(searchParams.get("limit") || "50")
```
> `parseInt("abc")` → `NaN`. Bu değer downstream query'lere aktarılır ve beklenmedik sonuçlara yol açar.

**Öneri:**
```typescript
const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1)
const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50") || 50))
```

✅ **İyi Pratik:** Auth + Admin role check düzgün yapılmış. Error handling try/catch ile mevcut.

---

### 📄 `health/route.ts`

🟢 **LOW — `process.uptime()` Bilgi Sızıntısı**
```typescript
uptime: process.uptime(),
```
> Uptime bilgisi saldırganlara sunucunun ne zaman restart edildiğini ve potansiyel maintenance window'ları bildirir.

**Öneri:** Public health endpoint'ten uptime'ı kaldırın, sadece internal monitoring için saklayın.

---

## 5. `auth/` — Authentication

### 📄 `callback/route.ts` (145 satır)

✅ **İyi Pratikler (Güvenlik Açısından Örnek Dosya):**
- `sanitizeNextPath()` — Open redirect koruması (`//`, `\` kontrolü)
- Rate limiting — `checkRateLimit()` ile brute-force engeli
- `getAllowedRedirectHosts()` — x-forwarded-host whitelist
- `mapExchangeErrorToCode()` — Kullanıcıya detay sızdırmadan hata yönetimi
- Activity logging — başarılı auth sonrası log kaydı (non-blocking)

---

### 📄 `reset-password/page.tsx` (193 satır)

🟠 **HIGH — Zayıf Şifre Politikası**
```tsx
if (password.length < 6) {
  setError("Şifre en az 6 karakter olmalıdır.")
}

<input type="password" required minLength={6} ... />
```
> 6 karakter minimum çok zayıf. Modern güvenlik standartları en az 8 karakter + karmaşıklık kuralı gerektirir. OWASP önerisi minimum 8 karakter.

**Öneri:**
```typescript
const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireNumber: true,
}
```

🟡 **MEDIUM — Confirm Password'de minLength Eksik**
```tsx
// İlk input:
<input type="password" required minLength={6} ... />

// İkinci input (confirm):
<input type="password" required ... /> // minLength yok!
```
> Tarayıcı native validation tutarsız. Confirm field validation sadece JS tarafında yapılıyor.

🟡 **MEDIUM — Retry Logic'te Hardcoded Delay**
```tsx
if (!session) {
  await new Promise(resolve => setTimeout(resolve, 800))
  const retry = await supabase.auth.getSession()
  session = retry.data.session
}
```
> 800ms hardcoded delay. Yavaş bağlantılarda yetersiz, hızlı bağlantılarda gereksiz gecikme.

**Öneri:** Exponential backoff veya event-based session listener kullanın.

---

### 📄 `forgot-password/page.tsx`

🟡 **MEDIUM — External API Call for Provider Check**
> `${API_URL}/auth/check-provider` backend call'u ile Google kullanıcıları tespit ediliyor. Bu, ek latency ve backend bağımlılığı ekliyor.

**Öneri:** Bu bilgiyi Supabase'in `auth.getUser()` response'undan alabilirsiniz (provider bilgisi mevcut).

---

### 📄 `confirm-recovery/page.tsx` (140 satır)

✅ **İyi Pratik:** Email scanner koruması — otomatik link tıklamasını engelleyen ara sayfa. Hem PKCE (code) hem implicit (hash) flow desteği.

---

## 6. `blog/` — Blog Sistemi

### 📄 `page.tsx` (334 satır)

🟠 **HIGH — Blog Verisi Component İçinde Hardcoded**
```tsx
"use client"

// Component içinde:
const blogPosts = [
  { id: '1', slug: 'dijital-katalog-ile-satis-artirma', title: '...', ... },
  { id: '2', slug: 'neden-dijital-katalog-kullanmalisiniz', title: '...', ... },
  // ...
]
```
> Blog listesi tamamen client-side hardcoded. Bu:
> - SEO'yu olumsuz etkiler (client render)
> - Yeni yazı eklemek kod değişikliği gerektirir
> - MDX dosyalarıyla senkron değil (veri tekrarı)

**Öneri:** `getAllPosts()` fonksiyonunu server component içinde kullanarak blog listesini çekin:
```tsx
// page.tsx (server component)
export default function BlogPage() {
  const posts = getAllPosts()
  return <BlogListClient posts={posts} />
}
```

---

### 📄 `[slug]/page.tsx` (243 satır)

🟡 **MEDIUM — JSX İçinde IIFE Pattern (Code Smell)**
```tsx
<Badge>
  {(() => {
    const trCategories: Record<string, string> = {
      'guides': 'Rehberler',
      'product-updates': 'Ürün Güncellemeleri',
      // ...
    }
    return trCategories[post.category] || post.category
  })()}
</Badge>
```
> IIFE (Immediately Invoked Function Expression) JSX içinde okunabilirliği ciddi şekilde düşürür. Aynı mapping dosyada 2 kez tekrarlanıyor.

**Öneri:** Shared utility function:
```typescript
const CATEGORY_LABELS: Record<string, string> = {
  'guides': 'Rehberler',
  'product-updates': 'Ürün Güncellemeleri',
  'ecommerce-tips': 'E-ticaret İpuçları',
  'success-stories': 'Başarı Hikayeleri',
}

// JSX'de:
<Badge>{CATEGORY_LABELS[post.category] ?? post.category}</Badge>
```

🟡 **MEDIUM — `getAllPosts()` JSX Render Ağacında Çağrılıyor**
```tsx
{(() => {
  const allPosts = getAllPosts()
  const relatedPosts = allPosts
    .filter(p => p.slug !== post.slug && p.language === post.language)
    .slice(0, 2)
  return relatedPosts.map(...)
})()}
```
> `getAllPosts()` her render'da çağrılıyor. Server component olduğu için re-render riski düşük, ancak JSX içinde data fetching kötü bir pattern.

**Öneri:** Component'ın üst seviyesinde çağırın:
```tsx
export default async function BlogPostPage({ params }) {
  const post = getPostBySlug(slug)
  const relatedPosts = getAllPosts()
    .filter(p => p.slug !== slug && p.language === post.language)
    .slice(0, 2)
  // ...
}
```

✅ **İyi Pratik:** `generateStaticParams()` ile statik sayfa üretimi. JSON-LD BlogPosting schema doğru yapılandırılmış.

---

## 7. `catalog/[slug]/` — Public Katalog Görüntüleme

### 📄 `page.tsx` (63 satır)

✅ **İyi Pratikler (Mimari Açıdan Örnek Dosya):**
- Metadata fetch (lightweight) ve content fetch (heavy) ayrılmış
- `Suspense` boundary ile streaming — skeleton anında gösteriliyor
- `generateMetadata` server-side çalışıyor

---

### 📄 `public-catalog-client.tsx`

🟡 **MEDIUM — Çok Fazla Sorumluluk (God Component)**
> Tek component'ta: arama, filtreleme, PDF export, fullscreen, mobile zoom, lightbox, share URL, ürün listeleme, template rendering.

**Öneri:** Custom hook'lara ayrıştırma doğru başlanmış (`use-catalog-pages.ts`, `use-public-pdf-export.ts`), devam edilmeli.

✅ **İyi Pratik:** `useMemo` kullanımı backgroundStyle, pageStyle, preloaderProducts için doğru. `typeof window !== 'undefined'` SSR guard mevcut.

---

### 📄 `_hooks/use-public-pdf-export.ts`

✅ **İyi Pratikler:**
- Dynamic import ile code splitting (`jsPDF`, `html-to-image` lazy loaded)
- `yieldToMain()` ile UI thread blocking önleniyor
- Cancellation support via `useRef`
- Chunked processing ile büyük katalogları parçalı render

---

## 8. `contact/` — İletişim Sayfası

### 📄 `page.tsx` (356 satır)

🔴 **CRITICAL — Form Çalışmıyor (İşlevsiz Submit)**
```tsx
<form className="flex-1 space-y-6 md:space-y-8" onSubmit={(e) => e.preventDefault()}>
  {/* ... inputs ... */}
  <Button>Gönder</Button>
</form>
```
> Form submit handler sadece `e.preventDefault()` çağırıyor. **Hiçbir veri gönderilmiyor.** Kullanıcı formu doldurur, "Gönder"e tıklar ve hiçbir şey olmaz. Geri bildirim yok, hata yok, başarı mesajı yok.

**Etkiler:**
- Kullanıcı güvenini zedeler
- İş fırsatları kaybedilir
- Ziyaretçi UX açısından ciddi hasar

**Çözüm:** Form verilerini backend'e gönderin veya en azından email servisi (Resend) ile iletin:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmitting(true)
  try {
    await apiFetch('/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, subject: selectedSubject, message })
    })
    toast.success('Mesajınız gönderildi!')
  } catch (err) {
    toast.error('Mesaj gönderilemedi.')
  } finally {
    setIsSubmitting(false)
  }
}
```

🟠 **HIGH — Form Input'larında `name` Attribute Eksik**
```tsx
<Input id="name" placeholder=" " ... />
<Input id="email" type="email" placeholder=" " ... />
<Textarea id="message" placeholder=" " ... />
```
> Hiçbir input'ta `name` attribute yok. Sunucu taraflı form processing veya `FormData` ile veri çekmek mümkün değil.

🟠 **HIGH — Form Validation Yok**
> Email format, minimum uzunluk, required kontrolü yok. Required attribute bile kullanılmamış.

🟡 **MEDIUM — Üçüncü Parti Bağımlılık (Background Texture)**
```tsx
"bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"
```
> Harici bir domain'den SVG yükleniyor. Bu domain kapanırsa veya değişirse sayfa etkilenir. CORS veya CSP sorunlarına da yol açabilir.

**Öneri:** SVG dosyasını `/public` klasörüne kopyalayın.

🟡 **MEDIUM — Tam i18n Desteği Eksik**
> Sayfanın tamamı Türkçe hardcoded. `useTranslation()` kullanılmıyor.

---

## 9. `create-demo/` — Demo Builder

### 📄 `page.tsx` (15 satır)

✅ **İyi Pratik:** Minimal page component, mantık `DemoBuilder` component'a delege edilmiş.

🟢 **LOW — Metadata/SEO Eksik**
> `generateMetadata` veya `export const metadata` yok. Demo sayfası SEO açısından invisible.

---

## 10. `dashboard/` — Kullanıcı Paneli

### 📄 `layout.tsx` (103 satır)

✅ **İyi Pratikler:**
- `Promise.all` ile paralel veri çekme (profile + products count + catalogs count)
- Server-side auth guard (`redirect("/auth")`)
- UserProvider ile context paylaşımı

🟡 **MEDIUM — `select("*")` ile Gereksiz Veri Çekme**
```tsx
const [profileResult, productsResult, catalogsResult] = await Promise.all([
  supabase.from("users").select("*").eq("id", user.id).single(),
  // ...
])
```
> `select("*")` tüm kolonları çeker. Sadece `full_name`, `company`, `avatar_url`, `plan`, `exports_used` yeterli.

**Öneri:**
```typescript
supabase.from("users")
  .select("full_name, company, avatar_url, plan, exports_used")
  .eq("id", user.id).single()
```

---

### 📄 `builder/page.tsx` (139 satır)

🟠 **HIGH — 10,000 Ürün Client'a Aktarılıyor**
```tsx
const BUILDER_MAX_PRODUCTS = 10_000
const BUILDER_PAGE_SIZE = 2000

async function getBuilderProducts(maxProducts = BUILDER_MAX_PRODUCTS) {
  // 5 paralel sayfa → 10K ürün fetch
  // Hepsi client component'a props olarak aktarılıyor
}
```
> 10,000 ürün server'dan client'a aktarılıyor. Her ürün ~1KB olarak hesaplanırsa ~10MB HTML payload üretilir. Bu:
> - TTFB (Time to First Byte) süresini dramatik artırır
> - Client tarafında memory pressure oluşturur
> - Mobile cihazlarda crash riski taşır

**Öneri:** Virtualized list + server-side pagination kullanın. Builder'da anlık olarak sadece görünen ürünleri render edin.

🟡 **MEDIUM — Plan Limit Kontrolünde Tekrarlı DB Sorgusu**
```tsx
if (!catalogId) {
  const { createServerSupabaseClient } = await import("@/lib/supabase/server")
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  // ... profile + catalog count sorguları
}
```
> `dashboard/layout.tsx`'de zaten user, profile ve catalog count çekiliyor. Builder page aynı verileri tekrar sorgulıyor.

**Öneri:** Layout'tan gelen context'i kullanın veya middleware-level check yapın.

✅ **İyi Pratik:** `Suspense` boundary ile skeleton anında gösteriliyor. Paralel ürün fetch iyi tasarlanmış.

---

### 📄 `products/loading.tsx`

🟠 **HIGH — Boş Loading State**
```tsx
export default function Loading() {
  return null
}
```
> Loading component `null` döndürüyor. Sayfa geçişlerinde kullanıcı boş bir ekran görür (flash of nothing). UX açısından ciddi sorun.

**Öneri:** Skeleton veya spinner ekleyin:
```tsx
export default function Loading() {
  return <ProductsTableSkeleton />
}
```

---

### 📄 `admin/page.tsx`

🟡 **MEDIUM — Server-Side Admin Kontrolü Yok**
```tsx
import { redirect } from "next/navigation"

export default function LegacyAdminPage() {
  redirect("/admin")
}
```
> Auth veya admin role kontrolü olmadan doğrudan `/admin`'e yönlendirme. Admin page'in kendi guard'ı olduğu varsayılıyor ama defense-in-depth prensibi gereği burada da kontrol olmalı.

---

### 📄 `categories/page.tsx`

🟡 **MEDIUM — Sequential Query Sonra Parallel Query**
> Ürünler paralel çekilip kategoriler derive edildikten sonra, user profile ayrı bir sequential query ile çekiliyor. Layout'taki profile verisi tekrar kullanılabilir.

---

### 📄 `analytics/page.tsx`, `catalogs/page.tsx`, `settings/page.tsx`, `templates/page.tsx`

✅ **İyi Pratikler:** Minimal server components, client component'lara doğru delege. Auth guard layout'ta merkezi.

---

## 11. `blog/` — Blog Static Pages

_(Ana bulgular yukarıda Section 6'da)_

### 📄 Statik Blog Sayfaları (`dijital-katalog-ile-*/page.tsx`)

🟢 **LOW — MDX Yerine Hardcoded TSX Sayfalar**
> 3 blog yazısı hem MDX dosyası hem de doğrudan TSX page olarak mevcut. Bu content tekrarı ve maintenance burden oluşturur.

---

## 12. `faq/` — Sıkça Sorulan Sorular

### 📄 `page.tsx` (348 satır)

🟡 **MEDIUM — Büyük Dosya & Hardcoded Data**
> 348 satırlık tek dosya. FAQ verileri component içinde hardcoded. Hem UI hem data aynı dosyada.

**Öneri:** FAQ verilerini ayrı bir dosyaya taşıyın:
```typescript
// data/faq-data.ts
export const FAQ_ITEMS = [ ... ]
```

🟡 **MEDIUM — "use client" Gereksiz**
> FAQ sayfası tamamen statik. İnteraktif element sadece accordion open/close. Bu, server component + client accordion pattern ile çözülebilir.

### 📄 `layout.tsx`

✅ **İyi Pratik:** JSON-LD FAQPage schema doğru yapılandırılmış.

---

## 13. `features/` — Özellikler Sayfası

### 📄 `page.tsx` (845 satır)

🟠 **HIGH — SRP İhlali (Single Responsibility Principle)**
> 845 satırlık tek dosya. Tüm feature sections, animasyonlar, helper components tek dosyada.

**Öneri:** Feature section'ları ayrı componentlere bölün:
```
features/
  _components/
    bulk-upload-section.tsx
    link-sharing-section.tsx
    publishing-section.tsx
    bento-grid-section.tsx
    cta-section.tsx
  page.tsx (orchestrator)
```

🟡 **MEDIUM — "use client" Gereksiz**
> Sayfa büyük ölçüde statik. Hover efektleri CSS ile yapılabilir. Client component olarak tüm 845 satır JavaScript bundle'a dahil ediliyor.

---

## 14. `how-it-works/` — Nasıl Çalışır

### 📄 `page.tsx` (94 satır)

🟢 **LOW — "use client" Gereksiz**
> Sayfa tamamen statik. `useCallback` ve `useTranslation` dışında client-side logic yok.

🟢 **LOW — Step Card Tekrarı**
> 3 adım kartı neredeyse aynı JSX yapısına sahip. Ortak component çıkarılabilir.

**Öneri:**
```tsx
function StepCard({ icon: Icon, color, badge, title, description }) {
  return (
    <div className="bg-white rounded-2xl border p-8 hover:shadow-lg transition-all">
      <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center mb-6`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <div className={`text-sm font-medium text-${color}-600 mb-2`}>{badge}</div>
      <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
      <p className="text-slate-500">{description}</p>
    </div>
  )
}
```

---

## 15. `pricing/` — Fiyatlandırma

### 📄 `page.tsx` (225 satır)

🟡 **MEDIUM — `plans` Array Her Render'da Yeniden Oluşturuluyor**
```tsx
export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true)
  const { t } = useTranslation()

  const plans = [ /* 3 plan objesi, her biri t() çağrısı içeriyor */ ]
  const faqs = [ /* 3 FAQ objesi */ ]
}
```
> `plans` ve `faqs` her render'da yeniden oluşturulur. `useMemo` ile optimize edilebilir.

**Öneri:**
```tsx
const plans = useMemo(() => [
  { id: "free", name: t('pricingPage.free'), ... },
  // ...
], [t, isYearly])
```

🟡 **MEDIUM — Kısmi i18n Kullanımı**
> Plan adları `t()` ile çeviriliyor ama feature listesi, subtitle, FAQ cevapları Türkçe hardcoded.

**Öneri:** Tüm metin içeriğini i18n'e taşıyın.

---

## 16. `privacy/` — Gizlilik Politikası

### 📄 `layout.tsx`

🟢 **LOW — "GDRP" Yazım Hatası**
```tsx
description: "FogCatalog privacy policy, data security and GDRP compliance information."
```
> "GDRP" → "GDPR" (General Data Protection Regulation) olmalı.

### 📄 `page.tsx` (103 satır)

🟡 **MEDIUM — i18n Desteği Yok**
> Tüm içerik Türkçe hardcoded. Uygulama TR/EN destekliyorsa bu sayfa da desteklemeli.

---

## 17. `terms/` — Kullanım Koşulları

### 📄 `page.tsx` (82 satır)

🟡 **MEDIUM — i18n Desteği Yok**
> Privacy sayfasıyla aynı sorun. Tüm içerik Türkçe hardcoded.

---

## 18. `legal/` — Yasal Sayfalar

### Genel Bulgular

🟡 **MEDIUM — Tekrarlı İptal Sayfaları**
> İki ayrı iptal/iade sayfası mevcut:
> - `legal/cancellation-policy/` — i18n destekli, styled
> - `legal/cancellation-refund-policy/` — hardcoded Türkçe, basit layout
>
> Bu SEO açısından duplicate content riski oluşturur ve bakım yükünü artırır.

**Öneri:** Birini kaldırın ve diğerine `redirect()` ekleyin.

🟡 **MEDIUM — Tutarsız i18n Stratejisi**
| Sayfa | i18n | Pattern |
|-------|------|---------|
| `kvkk/content.tsx` | ✅ Var | Separate content component |
| `cookie-policy/content.tsx` | ✅ Var | Separate content component |
| `cancellation-policy/content.tsx` | ✅ Var | Separate content component |
| `distance-sales-agreement/content.tsx` | ✅ Var | Separate content component |
| `cancellation-refund-policy/page.tsx` | ❌ Yok | Inline hardcoded |
| `explicit-consent/page.tsx` | ❌ Yok | Server component, hardcoded |

**Öneri:** Tüm yasal sayfaları aynı pattern'a getirin: i18n desteği + separate content component.

### 📄 `kvkk/content.tsx` (213 satır)

✅ **İyi Pratik:** Scroll-based section tracking ile sticky sidebar navigation. İyi UX pattern.

### 📄 `distance-sales-agreement/content.tsx` (243 satır)

✅ **İyi Pratik:** Adres bilgileriyle çalışırken sanitization pattern kullanılmış.

---

## Genel Mimari Bulgular (Cross-Cutting Concerns)

### 🟠 HIGH — "use client" Aşırı Kullanımı

Aşağıdaki sayfalar gereksiz yere client component:

| Sayfa | Satır | Neden Gereksiz |
|-------|-------|----------------|
| `(main)/page.tsx` | 65 | Sadece auth error redirect interaktif |
| `features/page.tsx` | 845 | Büyük ölçüde statik HTML |
| `faq/page.tsx` | 348 | Sadece accordion interaktif |
| `how-it-works/page.tsx` | 94 | Tamamen statik |
| `pricing/page.tsx` | 225 | Sadece toggle interaktif |
| `blog/page.tsx` | 334 | Sadece filter interaktif |
| `contact/page.tsx` | 356 | Form interaktif ama yine de ayrılabilir |

**Toplam Etki:** ~2,267 satır kod gereksiz yere client bundle'da. Bu:
- Initial JS bundle size'ı şişirir
- FCP (First Contentful Paint) süresini artırır
- SEO index kalitesini düşürür (crawler JS çalıştırmayabilir)

**Çözüm Pattern'ı:**
```tsx
// page.tsx (SERVER)
export default function Page() {
  return (
    <div>
      <StaticHeroSection />           {/* Server rendered */}
      <InteractiveFilter />            {/* "use client" */}
      <StaticContentSection />         {/* Server rendered */}
    </div>
  )
}
```

---

### 🟠 HIGH — Tutarsız i18n Kapsam

| Kapsam | Durum |
|--------|-------|
| Dashboard | ✅ Tam i18n |
| Auth sayfaları | ✅ Tam i18n |
| Landing page | ✅ Tam i18n |
| Blog listing | ⚠️ Kısmi |
| Pricing | ⚠️ Kısmi |
| FAQ | ⚠️ Kısmi |
| Contact | ❌ Yok |
| Privacy/Terms | ❌ Yok |
| Legal sayfaları | ⚠️ Karışık |

> Uygulama TR/EN dual-language destekliyorsa, tüm public sayfalar tutarlı olmalı.

---

### 🟡 MEDIUM — Shared Constants Eksikliği

Birden fazla dosyada tekrarlanan değerler:
- Site URL fallback'leri (3 farklı dosya, 2 farklı domain)
- Blog kategori çeviri mapping'i (2 kez aynı dosyada)
- Plan limitleri (builder page + layout'ta ayrı tanımlar)

**Öneri:** `lib/constants.ts`'e merkezi tanımlar ekleyin.

---

## Aksiyon Planı (Öncelik Sırasına Göre)

### 🔴 Hemen Yapılmalı (Bu Sprint)

1. **admin/error.tsx** — Production'da error stack gösterimini kaldırın
2. **contact/page.tsx** — Form submission logic'i implement edin
3. **reset-password** — Şifre politikasını güçlendirin (min 8 karakter)

### 🟠 Kısa Vadede (1-2 Hafta)

4. **admin/login.tsx** — Server-side admin yetki kontrolü ekleyin
5. **dashboard/builder** — 10K ürün fetch'i virtualized pagination ile değiştirin
6. **products/loading.tsx** — Skeleton ekleyin
7. **features/page.tsx** — 845 satırı componentlere bölün
8. **"use client" review** — Gereksiz client component'ları server component'a dönüştürün

### 🟡 Orta Vadede (2-4 Hafta)

9. **URL tutarsızlığını** düzeltin (fogcatalog.app vs .com)
10. **i18n kapsamını** tüm public sayfalara genişletin
11. **Blog verilerini** client component'tan çıkarın
12. **Tekrarlı yasal sayfaları** birleştirin
13. **Plans/FAQ verilerini** `useMemo` ile optimize edin
14. **Shared constants** dosyası oluşturun

### 🟢 İyileştirme Fırsatları

15. Sahte AggregateRating'i kaldırın
16. Gereksiz preconnect/dns-prefetch satırlarını temizleyin
17. parseInt → NaN-safe parsing
18. Health endpoint'ten uptime'ı kaldırın
19. Step card tekrarlarını giderin
20. GDPR typo fix

---

> **Sonuç:** Proje genel olarak iyi yapılandırılmış ve modern Next.js pratiklerini kullanıyor. Ancak 3 kritik sorun (admin error leak, işlevsiz contact form, zayıf şifre politikası) production'da acil müdahale gerektiriyor. "use client" aşırı kullanımı en büyük mimari borç; bunu düzeltmek SEO ve performance'ı önemli ölçüde iyileştirecektir.

---

## Yapılan Düzeltmeler (Şubat 2026)

Aşağıdaki tüm maddeler tamamlanmıştır.

### 🔴 Critical (#1–#3)

1. **admin/error.tsx — Stack trace sızıntısı kapatıldı.** `error.message` ve `error.stack` artık sadece `process.env.NODE_ENV === "development"` altında gösteriliyor.
2. **contact/page.tsx — Form işlevsel hale getirildi.** Resend email servisi ile backend'e bağlandı, Zod validasyon eklendi, rate limiting eklendi, başarı/hata toast'ları eklendi.
3. **reset-password/page.tsx — Şifre politikası güçlendirildi.** Minimum 8 karakter, büyük harf + rakam zorunluluğu, confirm input'a da minLength eklendi.

### 🟠 High (#4–#8)

4. **admin/login — Server-side admin auth guard eklendi.** `app/admin/layout.tsx`'e server-side `is_admin` kontrolü konuldu.
5. **dashboard/builder — 10K ürün fetch azaltıldı.** `BUILDER_MAX_PRODUCTS` 10000→2000, `BUILDER_PAGE_SIZE` 2000→1000 (backend cap'e eşitlendi). Plan limitleri `getPlanLimits()` ile DRY hale getirildi.
6. **products/loading.tsx — Skeleton eklendi.** Boş `return null` yerine tablo skeleton bileşeni eklendi.
7. **features/page.tsx — SRP uygulandı.** 845 satırlık monolith → 42 satırlık orchestrator + 7 ayrı bileşene bölündü (`_components/` altında).
8. **"use client" review yapıldı.** Blog sayfaları server component'a dönüştürüldü. StepCard (how-it-works) extract edildi. Kök neden: client-side `useTranslation()` hook'u — server-side i18n mimarisi gerektirir (mimari borç olarak belgelendi).

### 🟡 Medium (#9–#14)

9. **URL tutarsızlığı giderildi.** `SITE_URL` sabiti `lib/constants.ts`'e eklendi. `sitemap.ts`, `robots.ts`, `layout.tsx`, `seo.ts` bu sabiti kullanacak şekilde güncellendi. `fogcatalog.app` vs `.com` farkı ortadan kaldırıldı.
10. **i18n kapsam genişletme** — Mimari/içerik çalışması olarak belgelendi. Tüm public sayfalar (contact, privacy, terms, FAQ) çeviri string'lerine ihtiyaç duyuyor.
11. **Blog verisi client component'tan çıkarıldı.** `blog/page.tsx` artık server component. Hardcoded post array'i kaldırıldı, `getAllPosts()` servisi kullanılıyor. `blog/[slug]/page.tsx`'de 2 adet IIFE kaldırıldı, `CATEGORY_LABELS` sabit olarak çıkarıldı, `getAllPosts()` çağrısı JSX'ten component üst seviyesine taşındı.
12. **Tekrarlı yasal sayfa birleştirildi.** `legal/cancellation-refund-policy/page.tsx` (71 satır hardcoded içerik) → `redirect("/legal/cancellation-policy")` ile değiştirildi.
13. **Plans/FAQ `useMemo` optimizasyonu uygulandı.** `pricing/page.tsx`'deki `plans` ve `faqs` array'leri `useMemo` ile sarıldı.
14. **Shared constants dosyası oluşturuldu.** `lib/constants.ts`'e `SITE_URL`, `EMAILS`, `PlanType`, `PLAN_LIMITS`, `getPlanLimits()` eklendi. `dashboard/layout.tsx`, `builder/page.tsx`, `catalogs-page-client.tsx` bu sabitleri kullanacak şekilde güncellendi.

### 🟢 Low / İyileştirme (#15–#20)

15. **Sahte AggregateRating kaldırıldı.** `layout.tsx`'deki hardcoded 4.8/200 rating bloğu silindi.
16. **Gereksiz preconnect/dns-prefetch temizlendi.** Google Fonts preconnect (next/font self-host kullanıyor) ve yanlış `supabase.co` preconnect kaldırıldı.
17. **parseInt NaN-safe yapıldı.** `activity-logs/route.ts`'de `Math.max(1, parseInt(...) || 1)` ve `Math.min(100, ...)` guard'ları eklendi.
18. **Health endpoint'ten uptime kaldırıldı.** `process.uptime()` bilgi sızıntısı engellendi.
19. **StepCard pattern extract edildi.** `how-it-works/page.tsx`'de 3 tekrarlı div → `StepCard` bileşeni + `steps` config array + JIT-safe `colorMap` objesi.
20. **GDPR typo düzeltildi.** `privacy/layout.tsx`'de "GDRP" → "GDPR".

### Ekstra İyileştirmeler (Aksiyon planı dışında)

- **Duplicate manifest tanımı kaldırıldı.** `layout.tsx`'deki `<link rel="manifest">` satırı silindi (metadata.manifest zaten otomatik oluşturuyor).
- **3 statik blog sayfası silindi.** `dijital-katalog-ile-satis-artirma/`, `neden-dijital-katalog-kullanmalisiniz/`, `why-digital-catalog/` TSX sayfaları MDX `[slug]` route ile aynı içeriği tekrarlıyordu. Silindi, `blog-post-layout.tsx` de kaldırıldı.
- **Harici texture URL lokal yapıldı.** `grainy-gradients.vercel.app/noise.svg` → `/public/noise.svg` kopyalandı. `contact/page.tsx` (2 yerde) ve `pricing/page.tsx` (1 yerde) güncellendi.
- **Categories sayfa sorguları paralelleştirildi.** `dashboard/categories/page.tsx`'de sequential profile + products sorguları `Promise.all()` ile paralel hale getirildi.
- **Dashboard `select("*")` optimize edildi.** `dashboard/layout.tsx`'de `select("*")` → `select("full_name, company, avatar_url, plan, exports_used")` ve count sorguları `select("id", { count: ... })` olarak daraltıldı.
- **Create-demo SEO metadata eklendi.** `app/create-demo/layout.tsx` oluşturuldu, title ve description metadata eklendi.
- **Blog [slug] JSON-LD URL'leri `SITE_URL` sabitine bağlandı.**

### Kalan Mimari Borçlar

| Madde | Durum | Açıklama |
|-------|-------|----------|
| "use client" aşırı kullanımı | Mimari | Kök neden: client-side `useTranslation()`. Server-side i18n redesign gerektirir |
| i18n kapsam genişletme | İçerik | contact, privacy, terms, FAQ sayfalarına çeviri eklenmeli |
| Homepage `document.title` çakışması | Mimari | i18n mimarisi ile bağlantılı, `HomePageTitleUpdater` component'ı mevcut ama kullanılmıyor |
