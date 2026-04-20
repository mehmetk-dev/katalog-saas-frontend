# 🔒 Güvenlik & ⚡ Performans Denetim Raporu

**Proje:** CatalogPro (katalog-app)  
**Tarih:** 16 Nisan 2026  
**Kapsam:** Builder (öncelikli), Auth/Middleware, API Layer, Storage, Hooks, Genel Mimari

---

## İçindekiler

1. [Yönetici Özeti](#1-yönetici-özeti)
2. [Builder — Güvenlik Bulguları](#2-builder--güvenlik-bulguları)
3. [Builder — Performans Bulguları](#3-builder--performans-bulguları)
4. [Auth & Middleware](#4-auth--middleware)
5. [API Katmanı (lib/api.ts)](#5-api-katmanı)
6. [Server Actions](#6-server-actions)
7. [Storage (Cloudinary/Supabase)](#7-storage)
8. [Rate Limiting](#8-rate-limiting)
9. [Bağımlılık & Yapılandırma](#9-bağımlılık--yapılandırma)
10. [Genel Performans](#10-genel-performans)
11. [Öncelikli Aksiyon Planı](#11-öncelikli-aksiyon-planı)

---

## 1. Yönetici Özeti

| Kategori | Kritik | Yüksek | Orta | Düşük |
|----------|--------|--------|------|-------|
| Güvenlik | 2 | 4 | 5 | 3 |
| Performans | 1 | 3 | 6 | 4 |

**Genel Değerlendirme:** Proje güvenlik açısından iyi bir temele sahip — Zod validasyonları, XSS koruması, safeUrl kontrolleri ve rate limiting mevcut. Ancak birkaç kritik noktada iyileştirme gerekiyor. Performans tarafında builder zaten iyi optimize edilmiş (React.memo, useReducer, rAF throttle, lazy loading) fakat büyük kataloglarda bellek yönetimi ve bundle size konularında fırsatlar var.

---

## 2. Builder — Güvenlik Bulguları

### 🔴 S-B1: `process.env.NEXT_PUBLIC_APP_URL` Client Tarafında Açık (KRİTİK)

**Dosya:** `components/builder/builder-page-client.tsx:182`

```tsx
shareUrl={catalog?.share_slug 
  ? `${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/catalog/${catalog.share_slug}` 
  : ""}
```

**Sorun:** `NEXT_PUBLIC_APP_URL` fallback olarak `window.location.origin` kullanılıyor. Bir saldırgan proxy/custom domain üzerinden uygulamayı yükleyip `window.location.origin`'i manipüle edebilir. Bu, paylaşılan URL'lerin kötü amaçlı sitelere yönlenmesine neden olabilir.

**Öneri:**
- Share URL oluşturma mantığını server-side'a taşıyın.
- `NEXT_PUBLIC_APP_URL` boşsa client-side fallback yerine hata fırlatın veya URL göstermeyin.

---

### 🟡 S-B2: `dangerouslySetInnerHTML` Yok Ama `catalogName` Sanitizasyon Eksikliği (ORTA)

**Dosya:** `components/builder/builder-utils.ts:40-71`

`buildCatalogPayload` fonksiyonunda `catalogName` doğrudan `name` alanına atanıyor. Zod şemasında (`catalogUpdateSchema`) name alanı sadece `max(255)` ve `trim()` uyguluyor ama HTML/script tag'leri filtrelenmemiyor.

**Öneri:**
- `safeString` helper'ı HTML entity encode'lamayı da içermeli (en azından `<`, `>`, `"` karakterleri).
- Katalog adı public sayfada render ediliyorsa, React'in otomatik escaping'i yeterli olsa da, PDF export ve e-posta template'lerinde dikkat edilmeli.

---

### 🟡 S-B3: PDF Export — DOM Manipulation ile Potansiyel XSS (YÜKSEK)

**Dosya:** `lib/hooks/use-pdf-export.ts:186-200`

```tsx
const clone = page.cloneNode(true) as HTMLElement
document.body.appendChild(clone)
```

PDF export sırasında DOM elemanları klonlanıp body'ye ekleniyor. Eğer ürün adı/açıklaması içinde escape edilmemiş HTML varsa, `cloneNode` bunu kopyalar. `html-to-image` kütüphanesi bu DOM'u render ederken script çalışmaz ama stil injection (CSS injection) mümkündür.

**Öneri:**
- Klonlanan DOM üzerinde `<script>`, `<style>`, `on*` attribute'larını temizleyen bir sanitizer çalıştırın.
- Alternatif: Server-side PDF generation (Puppeteer/Playwright) kullanın.

---

### 🟢 S-B4: Upload — File Type Bypass Riski (DÜŞÜK)

**Dosya:** `lib/hooks/use-editor-upload.ts:155-156`

```tsx
const limit = type === 'logo' ? 2 : 10
if (file.size > limit * 1024 * 1024) { ... }
```

Client-side validasyon yapılıyor, ancak `file.type` browser tarafından ayarlanır ve kolayca spoof edilebilir. Cloudinary provider'da ek validasyon var ama Supabase provider'da bu kadar detaylı kontrol olmayabilir.

**Öneri:**
- Supabase storage provider'da da MIME type ve magic bytes kontrolü ekleyin.
- Server-side'da Supabase Storage RLS policy'lerinde dosya türü kısıtlaması olmalı.

---

## 3. Builder — Performans Bulguları

### 🔴 P-B1: CatalogPreview Çift Render — PDF Export (KRİTİK)

**Dosya:** `components/builder/builder-page-client.tsx:204-248`

```tsx
{handlers.isExporting && (
  <div id="catalog-export-container" ...>
    <CatalogPreview ... products={state.selectedProducts} ... />
  </div>
)}
```

PDF export sırasında **tüm ürünlerle** ikinci bir `CatalogPreview` mount ediliyor. 1000+ ürünlü bir katalogda bu:
- ~1000 ürün kartını DOM'a ekliyor (ghost container)
- Template hesaplamalarını tekrar yapıyor
- Tüm ürün görsellerini yüklemeye başlıyor

**Tahmini Etki:** 1000 ürünlü katalogda ~2-5 saniye ek TTI, ~200MB+ bellek kullanımı

**Öneri:**
- Ghost container'a ürünleri chunk'lar halinde yükleyin (zaten `use-pdf-export.ts`'de chunk mantığı var ama DOM mount'ta yok).
- Veya export sırasında sadece görünen sayfaları render edin, diğerlerini lazy mount edin.

---

### 🟡 P-B2: `useMemo` Dependency'de `state` Objesi (YÜKSEK)

**Dosya:** `lib/hooks/use-builder-state.ts:486`

```tsx
return useMemo(() => ({ ... }), [state, setters, ...])
```

`state` objesi `useReducer`'dan geldiği için her dispatch'te yeni referans alıyor. Bu, dönüş objesi her dispatch'te yeni referans aldığı anlamına gelir → BuilderContext value her dispatch'te değişir → **tüm consumer'lar re-render olur**.

**Öneri:**
- `state` yerine individual state field'larını dependency'ye koyun, veya
- `useMemo` içinde `state` objesi üzerinden selector pattern kullanın.
- En iyisi: Context'i parçalayın (state context + dispatch context).

---

### 🟡 P-B3: `EditorDesignTab` Prop Drilling — 70+ Prop (YÜKSEK)

**Dosya:** `components/builder/editor/catalog-editor.tsx:433-509`

`EditorDesignTab`'a ~70 prop geçiriliyor. Bu:
- Parent'taki herhangi bir state değişikliğinde tüm prop referanslarının yeniden oluşmasına
- `EditorDesignTab`'ın her render'da yeni prop objesi almasına neden oluyor

**Öneri:**
- `EditorDesignTab` kendi içinde `useBuilder()` context hook'unu kullansın.
- Veya prop'ları gruplandırılmış obje olarak geçirin ve `React.memo` + custom areEqual kullanın.

---

### 🟡 P-B4: Color Picker — Global `mousedown` Listener (ORTA)

**Dosya:** `components/builder/editor/catalog-editor.tsx:178-196`

3 ayrı color picker için tek bir `mousedown` event listener ekleniyor. Her açılışta/kapanışta listener'lar yeniden oluşuyor.

**Öneri:**
- Radix `Popover` veya headless UI dropdown kullanarak outside-click handling'i kütüphaneye bırakın.
- Veya tek bir "any picker open" state'i ile tek listener kullanın.

---

### 🟢 P-B5: `selectedProducts` Derived Array Her Render'da Yeniden Hesaplanıyor (ORTA)

**Dosya:** `lib/hooks/use-builder-state.ts:302-306`

```tsx
const selectedProducts = useMemo(() =>
    state.selectedProductIds.map((id) => productMap.get(id)).filter(...),
    [state.selectedProductIds, productMap]
)
```

Bu doğru şekilde memoize edilmiş ancak `productMap` her `upsertLoadedProducts` çağrısında yeni referans alıyor. `upsertLoadedProducts` sayfa değiştirildiğinde tetikleniyor → `selectedProducts` gereksiz yere yeniden hesaplanıyor.

**Öneri:**
- `productMap` referansını sadece gerçekten yeni ürün eklendiğinde değiştirin (structural equality check).

---

### 🟢 P-B6: `arrayFingerprint` Collision Riski (DÜŞÜK)

**Dosya:** `components/builder/builder-utils.ts:117-135`

Fingerprint fonksiyonu O(1) ama sadece 5 sample point + rolling checksum kullanıyor. Ortadaki elemanların yer değiştirmesi algılanamayabilir → "unsaved changes" algılaması yanlış negatif verebilir.

**Öneri:**
- Bu bir hash collision olasılığı: çok düşük ama mümkün. Kritik save/publish işlemlerinde tam karşılaştırma yapılabilir.

---

## 4. Auth & Middleware

### 🔴 S-A1: Middleware'de DB Sorgusu — Admin Kontrolü (KRİTİK)

**Dosya:** `lib/supabase/proxy.ts:138-148`

```tsx
const { data: adminProfile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single()
```

Her admin route isteğinde bir DB sorgusu yapılıyor. Bu:
- **Performans:** Her middleware çağrısında ~50-100ms ek latency
- **Güvenlik:** `is_admin` field'ı Supabase'de RLS ile korunmuyor olabilir — bir kullanıcı kendi profilini güncelleyerek `is_admin: true` yapabilir

**Öneri:**
- Admin kontrolünü JWT custom claim'e taşıyın (Supabase Auth Hook ile).
- Veya admin check'i Redis/edge-cache ile önbelleğe alın.
- **Kesinlikle:** `is_admin` field'ının RLS policy ile sadece service_role tarafından güncellenebilir olduğundan emin olun.

---

### 🟡 S-A2: Session Timer Cookie — `httpOnly` Ama `secure` Sadece Production'da (YÜKSEK)

**Dosya:** `lib/supabase/proxy.ts:111-117`

```tsx
supabaseResponse.cookies.set("auth_session_timer", now.toString(), {
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
})
```

Development'ta `secure: false` olması beklenen davranış, ancak staging ortamında da HTTP üzerinden çalışıyorsa session hijack riski var.

**Öneri:**
- Staging/preview ortamları için de `secure: true` olmalı.
- `sameSite: "strict"` kullanmayı değerlendirin (cross-site isteğe gerek yoksa).

---

### 🟡 S-A3: `getSession()` vs `getUser()` Paralel Çağrı (ORTA)

**Dosya:** `lib/api.ts:78-81`

```tsx
const [{ data: { user } }, { data: { session } }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
])
```

Yorum doğru bir şekilde TOCTOU race condition'ı açıklıyor. Ancak `getSession()` cached/unvalidated session döndürür. Eğer JWT expire olmuşsa ama refresh henüz gerçekleşmemişse, `getUser()` null dönerken `session.access_token` hâlâ mevcut olabilir. Mevcut kod bu durumu doğru handle ediyor (`if (user && session?.access_token)`).

**Durum:** ✅ Doğru implemente edilmiş, ek aksiyon gerekmez.

---

### 🟡 S-A4: Auth Callback Rate Limiting Eksik (YÜKSEK)

Middleware'de auth route'ları için rate limiting yok. `/auth` endpointine brute-force deneme yapılabilir.

**Öneri:**
- Middleware'e `/auth` route'ları için IP-bazlı rate limiting ekleyin.
- Supabase Auth'un kendi rate limit'i var ama ek bir katman faydalı olur.

---

## 5. API Katmanı

### 🟡 S-API1: Backend URL Açık — `NEXT_PUBLIC_API_URL` (YÜKSEK)

**Dosya:** `lib/api.ts:5`

```tsx
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
```

`NEXT_PUBLIC_` prefix'i bu URL'i client bundle'a expose eder. Server action'lar üzerinden çağrılsa da, bundle'da görünür. Backend'in doğrudan erişime açık olup olmadığı network konfigürasyonuna bağlı.

**Öneri:**
- Bu değişkeni `NEXT_PUBLIC_` olmadan kullanın — zaten sadece server-side'da (`"use server"` action'lar) kullanılıyor.
- Mevcut kullanımı kontrol edin: `apiFetch` sadece server action'lardan mı çağrılıyor?

---

### 🟢 S-API2: Retry Mantığı — Exponential Backoff Yok (DÜŞÜK)

**Dosya:** `lib/api.ts:160-161`

```tsx
const delay = response.status === 429 ? connectionError.retryAfter || 30000 : retryDelay * (attempts + 1)
```

Linear backoff kullanılıyor (`retryDelay * (attempts + 1)`). 429 durumunda `Retry-After` header'ı kullanılıyor (doğru). Ancak 5xx hataları için exponential backoff + jitter daha iyi olur.

**Öneri:**
```tsx
const delay = retryDelay * Math.pow(2, attempts) + Math.random() * 500
```

---

## 6. Server Actions

### 🟡 S-SA1: `deleteAccount` — Silme Sonrası Redirect Race Condition (ORTA)

**Dosya:** `lib/actions/auth.ts:84-96`

```tsx
export async function deleteAccount() {
    const supabase = await createServerSupabaseClient()
    await apiFetch("/users/me", { method: "DELETE" })
    await supabase.auth.signOut()
    redirect("/")
}
```

API silme başarılı ama `signOut` başarısız olursa, kullanıcı silinmiş ama hâlâ oturum açık kalır. Sonraki isteklerde 401 hataları alır.

**Öneri:**
- Try-catch ile `signOut` hatasını handle edin ve yine de redirect yapın.

---

### 🟡 S-SA2: `bulkImportProducts` — Payload Boyutu Sınırı Yok (ORTA)

**Dosya:** `lib/actions/products.ts:280-296`

```tsx
export async function bulkImportProducts(products: ...) {
    const importedProducts = await apiFetch<Product[]>("/products/bulk-import", {
        method: "POST",
        body: JSON.stringify({ products }),
        retries: 3,
        timeout: 120000,
    })
}
```

`products` array'inin boyutu sınırlanmamış. 100.000 ürünlük bir import isteği:
- JSON serialization sırasında bellek tüketebilir
- Backend'de timeout'a neden olabilir

**Öneri:**
- Frontend'de chunk'lama mantığı ekleyin (ör: 500 ürünlük batch'ler).
- Zod schema'ya `max(5000)` gibi bir sınır ekleyin.

---

### ✅ S-SA3: Zod Validasyonları Kapsamlı (İYİ)

`lib/validations/index.ts` dosyasında:
- URL'ler `javascript:`, `data:` gibi scheme'lere karşı korunuyor
- String'ler max length ve trim ile sanitize ediliyor
- Fiyat/stok değerleri bound'lu
- Instagram/YouTube URL'leri domain-restricted

---

## 7. Storage

### 🟡 S-ST1: Cloudinary Unsigned Upload — Abuse Riski (YÜKSEK)

**Dosya:** `lib/storage/cloudinary.ts:85-86`

```tsx
formData.append('upload_preset', this.config.uploadPreset)
```

Unsigned upload preset kullanılıyor. Bu, cloud name ve preset name'i bilen herkesin API'ye doğrudan upload yapmasına olanak tanır. Client bundle'da bu değerler görünür.

**Öneri:**
- Cloudinary preset'inde şu kısıtlamaları uygulayın:
  - Maksimum dosya boyutu: 10MB
  - Sadece izin verilen klasörler
  - İzin verilen format'lar: jpg, png, webp, gif, avif
  - Rate limiting
- Veya signed upload'a geçin (backend endpoint üzerinden).

---

### ✅ S-ST2: Client-Side Validasyon İyi (İYİ)

`cloudinary.ts` dosyasında:
- MIME type kontrolü ✓
- Dosya boyutu kontrolü ✓
- Extension kontrolü ✓
- Image dimension kontrolü ✓

---

## 8. Rate Limiting

### 🟡 S-RL1: In-Memory Rate Limiter — Serverless Uyumsuz (YÜKSEK)

**Dosya:** `lib/services/rate-limit.ts`

In-memory `Map` kullanılıyor. Serverless (Vercel/Edge) ortamında:
- Her cold start'ta rate limit state sıfırlanır
- Birden fazla instance paralel çalıştığında state paylaşılmaz
- Bir saldırgan farklı instance'lara istek göndererek limit'i bypass edebilir

**Öneri:**
- Production'da `@upstash/ratelimit` + Redis kullanın.
- Minimum: Contact form ve feedback gibi public endpoint'ler için.

---

### ✅ S-RL2: LRU Eviction ve Cleanup İyi (İYİ)

`MAX_STORE_SIZE = 10_000` ile bellek sınırı var. `evictOldest()` ve periyodik cleanup mevcut. DoS vektörü engellenmiş.

---

## 9. Bağımlılık & Yapılandırma

### 🟡 P-D1: `latest` Tag Kullanımı — Deterministik Olmayan Build'ler (YÜKSEK)

**Dosya:** `package.json`

```json
"@supabase/ssr": "latest",
"@supabase/supabase-js": "latest",
"date-fns": "latest",
"sonner": "latest"
```

4 paket `latest` tag'i ile tanımlı. Bu:
- Build'ler arası tutarsızlıklara
- Breaking change'lerin fark edilmeden girmesine
- Supply chain attack yüzeyinin genişlemesine neden olabilir

**Öneri:**
- Tüm bağımlılıkları sabit versiyona pin'leyin (ör: `"@supabase/ssr": "^0.5.2"`).

---

### 🟡 P-D2: `reactStrictMode: false` (ORTA)

**Dosya:** `next.config.mjs:12`

```tsx
reactStrictMode: false,
```

`react-pageflip` için kapatılmış. Strict Mode useEffect double-invoke'u geliştirme hatalarını erken yakalamaya yardımcı olur.

**Öneri:**
- Strict Mode'u açık tutup `react-pageflip` kullanılan sayfalara özel bir wrapper yazın.
- Veya sadece builder sayfasında kapatın (Next.js bunu desteklemiyor ama workaround mümkün).

---

### 🟢 P-D3: Bundle Optimizasyonları İyi (İYİ)

`next.config.mjs`:
- `optimizePackageImports` ✓ (lucide-react, date-fns, recharts)
- `poweredByHeader: false` ✓
- `compress: true` ✓
- `removeConsole` (production) ✓
- Image formats: AVIF + WebP ✓
- Bundle analyzer mevcut ✓

---

### 🟢 P-D4: `@sentry/nextjs` v10 — Tree Shaking Aktif (İYİ)

```tsx
treeshake: { removeDebugLogging: true }
```

---

## 10. Genel Performans

### 🟡 P-G1: `EditorContentTab`'a 30+ Prop Geçilmesi (ORTA)

**Dosya:** `components/builder/editor/catalog-editor.tsx:390-429`

Context pattern zaten `BuilderProvider` ile uygulanmış ancak `EditorContentTab` hâlâ props üzerinden besleniyor. Bu, parent'taki her state değişikliğinde prop objesi yenilenmesi → component re-render demek.

**Öneri:** `EditorContentTab` ve `EditorDesignTab`'ı doğrudan `useBuilder()` context hook'u kullanacak şekilde refactor edin.

---

### 🟡 P-G2: PDF Export — Bellek Yönetimi (ORTA)

**Dosya:** `lib/hooks/use-pdf-export.ts`

İyi pratikler mevcut:
- Image cache limit (500) ✓
- Chunk processing ✓
- DOM clone temizliği ✓

Ama eksikler:
- `toJpeg` sonucu `imgData` null'a atanıyor ama `pdf.addImage` referansı tutuyor — jsPDF tüm sayfaları bellekte tutar.
- 200+ sayfalık bir katalogda toplam ~500MB+ bellek kullanımı olabilir.

**Öneri:**
- Çok büyük kataloglar (200+) için kullanıcıya uyarı gösterin.
- Server-side PDF generation alternatifi sunun.

---

### 🟢 P-G3: Lazy Loading İyi Uygulanmış (İYİ)

- `EditorDesignTab` → `dynamic()` ile lazy load ✓
- Preview panel → `requestAnimationFrame` ile deferred mount ✓
- All product IDs → hover/focus'ta lazy fetch ✓
- Split preview → 1000 ürün sampling ✓

---

### 🟢 P-G4: useReducer + Stable Setters Pattern (İYİ)

`use-builder-state.ts` dosyasında 30+ `useState` yerine tek `useReducer` kullanılmış. Setter'lar `useMemo([])` ile stabil. Bu, gereksiz re-render'ları önlüyor.

---

### 🟢 P-G5: Debounced Callbacks (İYİ)

- Color picker: 50ms debounce ✓
- Search: 200ms debounce + `useTransition` ✓
- Autosave: 3000ms debounce ✓

---

## 11. Öncelikli Aksiyon Planı

### 🔴 Kritik (Hemen)

| # | Bulgu | Dosya | Tahmini Etki |
|---|-------|-------|-------------|
| 1 | S-A1: Middleware admin DB sorgusu — RLS kontrolü | `lib/supabase/proxy.ts` | Auth bypass riski |
| 2 | S-B1: Share URL origin manipulation | `builder-page-client.tsx` | Phishing riski |
| 3 | P-B1: PDF export ghost container memory | `builder-page-client.tsx` | 200MB+ memory spike |

### 🟡 Yüksek (1-2 Hafta)

| # | Bulgu | Dosya | Tahmini Etki |
|---|-------|-------|-------------|
| 4 | P-D1: `latest` tag bağımlılıkları pin'le | `package.json` | Build güvenilirliği |
| 5 | S-ST1: Cloudinary unsigned upload kısıtlamaları | Cloudinary Dashboard | Abuse önleme |
| 6 | S-RL1: Redis-based rate limiting | `lib/services/rate-limit.ts` | Serverless uyumluluk |
| 7 | S-A4: Auth route rate limiting | `middleware.ts` | Brute-force koruması |
| 8 | P-B2: Context value stability | `use-builder-state.ts` | Re-render azaltma |
| 9 | P-B3: EditorDesignTab prop drilling | `catalog-editor.tsx` | Re-render azaltma |
| 10 | S-API1: `NEXT_PUBLIC_API_URL` kaldır | `lib/api.ts` | Backend URL gizleme |

### 🟢 Orta (Sprint Planlaması)

| # | Bulgu | Dosya | Tahmini Etki |
|---|-------|-------|-------------|
| 11 | S-B2: catalogName HTML sanitizasyon | `builder-utils.ts` | XSS koruması |
| 12 | S-B3: PDF DOM sanitizer | `use-pdf-export.ts` | CSS injection koruması |
| 13 | S-SA1: deleteAccount race condition | `lib/actions/auth.ts` | UX iyileştirme |
| 14 | S-SA2: bulkImport payload limit | `lib/actions/products.ts` | DoS koruması |
| 15 | P-G1: EditorContentTab context refactor | `catalog-editor.tsx` | Performans |
| 16 | P-G2: Büyük katalog PDF uyarısı | `use-pdf-export.ts` | UX |

---

## Sonuç

Proje genel olarak **iyi bir güvenlik ve performans temeline** sahip. Özellikle:
- Zod validasyon katmanı kapsamlı
- Builder state yönetimi (useReducer + stable setters) iyi optimize edilmiş
- Lazy loading stratejileri doğru uygulanmış
- XSS koruması (contact form'da escapeHtml, Zod'da safeUrl) mevcut

Kritik öncelikli 3 madde (admin RLS, share URL, PDF memory) ele alındığında, güvenlik ve performans profili önemli ölçüde iyileşecektir. Uzun vadede Redis-based rate limiting ve server-side PDF generation değerlendirilmelidir.
