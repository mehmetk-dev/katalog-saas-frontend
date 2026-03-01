# 📋 Catalogs Component Audit Report

> **Tarih:** 28 Şubat 2026  
> **Kapsam:** `components/catalogs/` — 40+ dosya (templates, covers, dividers, root bileşenler)  
> **Perspektif:** Performance, Security, Architecture, Code Quality, i18n

---

## Özet

| Severity | Adet | Temel Endişeler |
|----------|------|-----------------|
| 🔴 **CRITICAL** | 1 | Unsanitized URL'ler CSS `url()` ve `href`'lerde (S2) |
| 🟡 **MEDIUM** | 7 | Registry tutarsızlığı, duplicate template registry, eksik `rel`, currency tekrarı, eksik `React.memo`, i18n boşlukları |
| 🟢 **LOW** | 6 | Dead code, type drift, no-op handler, duplicate background utils |

---

## 🏗️ Architecture Findings

### A1 — Registry Pattern Tutarsızlığı (MEDIUM)

**Dosyalar:** `covers/index.tsx`, `dividers/index.tsx`, `templates/registry.tsx`

Aynı kavram (tema anahtarı → component lookup) için 3 farklı pattern kullanılıyor:

| Registry | Yapı | Metadata | Lazy Loading |
|----------|------|----------|-------------|
| **Covers** | `{ name, component, description }` | ✅ Rich | ❌ Eager |
| **Dividers** | `key → Component` (flat) | ❌ Yok | ❌ Eager |
| **Templates** | `next/dynamic` lazy components | ❌ Yok | ✅ Lazy |

**Öneri:** Tüm registry'leri aynı yapıya getir. Covers metadata'sı varsa dividers'ta da olmalı. Covers/dividers'ı da lazy-load yap.

### A2 — `catalog-preview.tsx` Template Registry'yi Duplicate Ediyor (MEDIUM)

**Dosya:** `catalog-preview.tsx` (satır 1-21, 160-215)

16 template'in tamamı statik import ile yükleniyor + 60 satırlık switch-case ile seçiliyor. Oysa `templates/registry.tsx` zaten `next/dynamic` ile lazy-load yapıyor. Preview dosyası registry'yi tamamen ignore ediyor.

**Öneri:**
```tsx
import { ALL_TEMPLATES } from './templates/registry'
const Template = ALL_TEMPLATES[normalizedLayout] || ALL_TEMPLATES['modern-grid']
return <Template {...templateProps} />
```
Bu ~40 satır duplicate'ı siler ve code-splitting'i devreye sokar.

### A3 — `CatalogThumbnail` Lokal `Catalog` Interface Tanımlıyor (LOW)

**Dosya:** `catalog-thumbnail.tsx` (satır 5-11)

Kendi partial `Catalog` interface'ini tanımlıyor, canonical `@/lib/actions/catalogs`'tan import etmiyor. Type drift riski.

**Öneri:** `import type { Catalog } from "@/lib/actions/catalogs"` kullan.

---

## 🚀 Performance Findings

### P1 — Currency Formatting 18+ Kez Duplicate Edilmiş (MEDIUM)

**Dosyalar:** Tüm 16 template dosyası

Aynı inline IIFE her template'te tekrarlanıyor:
```tsx
{(() => {
    const currency = product.custom_attributes?.find((a) => a.name === "currency")?.value || "TRY"
    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₺"
    return `${symbol}${Number(product.price).toFixed(2)}`
})()}
```

**Öneri:** `templates/utils.ts`'e `formatProductPrice(product)` fonksiyonu çıkar. `lib/helpers.ts`'daki mevcut `formatCurrency` kullanılabilir. ~200 satır tekrar azalır.

### P2 — Hiçbir Template/Cover/Divider `React.memo` Kullanmıyor (MEDIUM)

**Dosyalar:** templates/ (16), covers/ (10), dividers/ (10)

Sadece `lazy-page.tsx` `React.memo` kullanıyor. Template'ler pure rendering components — props değişmedikçe çıktıları aynı. Builder'da sidebar etkileşimlerinde tüm template'ler gereksiz re-render oluyor.

**Öneri:** Her export'u `React.memo` ile sar:
```tsx
export const ModernGridTemplate = React.memo(function ModernGridTemplate(props: TemplateProps) { ... })
```

### P3 — `_getImageFitClass` Dead Code — 10 Template'te (LOW)

**Dosyalar:** `classic-catalog.tsx`, `magazine.tsx`, `showcase.tsx`, `minimalist.tsx`, `luxury.tsx`, `industrial.tsx`, `elegant-cards.tsx`, `fashion-lookbook.tsx`, `catalog-pro.tsx`, `bold.tsx`

`ProductImageGallery`'ye migration sonrası `_getImageFitClass` fonksiyonu kaldı. Underscore prefix ile unused statüsünde.

**Öneri:** 10 dosyadan dead code'u sil.

### P4 — `getBackgroundStyle()` Her Render'da Yeniden Hesaplanıyor (LOW)

**Dosya:** `catalog-preview.tsx` (satır 103-130)

`getBackgroundStyle()` inline fonksiyon, her render'da yeni style objesi oluşturuyor. Ayrıca template'ler kendi background style'larını da bağımsızca hesaplıyor — çift hesaplama.

**Öneri:** `useMemo` kullan veya template'lere background style'ı prop olarak geç.

---

## 🔒 Security Findings

### S1 — Eksik `rel="noopener noreferrer"` (MEDIUM)

**Dosya:** `templates/magazine.tsx` (satır ~181)

Hero ürünün "Discover Online" linki `target="_blank"` ile açılıyor ama `rel="noopener noreferrer"` eksik. [Reverse tabnabbing](https://owasp.org/www-community/attacks/Reverse_Tabnabbing) açığı.

### S2 — CSS `url()` Injection via Unsanitized Background URLs (CRITICAL)

**Dosyalar:** `catalog-preview.tsx`, `modern-grid.tsx`, `magazine.tsx`, `luxury.tsx`, `fashion-lookbook.tsx`, `classic-catalog.tsx`

Background image URL'leri kullanıcı input'undan direkt CSS'e interpolasyonla giriyor:
```tsx
backgroundImage: `url(${backgroundImage})`
```
Malformed URL (`);content:"hack`) CSS injection yapabilir.

Ayrıca `product_url` değerleri tüm template'lerde `href` olarak validate edilmeden render ediliyor. `javascript:` URI'si XSS yapabilir.

**Öneri:**
1. `backgroundImage` URL'lerini sanitize et — sadece `https://` ve izin verilen domain'ler
2. `product_url`'leri validate et — `javascript:`, `data:` scheme'lerini reddet

---

## 🌐 i18n Findings

### S3 — Template/Cover/Divider i18n Desteği Yok (MEDIUM)

Covers, dividers ve çoğu template'te hardcoded Türkçe string'ler var. `useTranslation()` kullanmıyorlar (tek istisna: `luxury.tsx`).

**Örnekler:**
| Dosya | String |
|-------|--------|
| `covers/modern.tsx` | `"Katalog İçeriği"`, `"Görsel Seçilmedi"` |
| `covers/minimal.tsx` | `"Sayı"`, `"MİNİMALİST."`, `"ŞEKİL 1.0"`, `"İndeks"` |
| `dividers/modern.tsx` | `"Kategori"` |
| `dividers/minimal.tsx` | `"Bölüm"`, `"İndeks"` |
| `dividers/artistic.tsx` | `"Özel Seçki"` |
| `templates/modern-grid.tsx` | `"Sayfa {n} / {m}"` |
| `catalog-thumbnail.tsx` | `"Ürün Yok"` |
| `covers/index.tsx` | Tüm `name` ve `description` değerleri (10 entry) |

### S4 — `catalogs-page-client.tsx` Limit Modal Hardcoded (MEDIUM)

Dosyanın geri kalanı `t()` kullanmasına rağmen limit modal'ındaki plan kartlarında:
- `"Başlangıç"`, `"Mevcut planınız"`, `"Profesyonel"`, `"Büyüyen işletmeler için"`, `"Business"`, `"Sınırsız operasyon"`

### S5 — `share-modal.tsx` Tamamen Türkçe (MEDIUM)

322 satırlık dosyada sıfır `useTranslation()` çağrısı. 15+ hardcoded Türkçe string:
- `"Kataloğu Paylaş"`, `"Link Paylaş"`, `"QR Kod"`, `"Katalog Yayında Değil"`, `"Linki Kopyala"`, `"Hızlı Paylaş"`, `"Mobil Uyumlu"`, `"PDF Destekli"`, `"Canlı Link"`, `"Kapat"` vb.

---

## 🧹 Code Quality Findings

### Q1 — Underscore-Prefixed Unused Props (LOW)

8+ template'te `_showAttributes`, `_showSku`, `_totalPages`, `_columnsPerRow` gibi unused prop'lar var. `TemplateProps` interface'i her template'in ihtiyaç duymadığı prop'ları dayatıyor.

### Q2 — `CatalogPreview` Var Olmayan Props Alıyor (LOW)

**Dosya:** `catalogs-page-client.tsx` (satır 244-260)

`builder/preview/catalog-preview` import ediliyor (`catalogs/catalog-preview` değil). `enableCoverPage`, `enableCategoryDividers`, `theme`, `showControls` gibi prop'lar gönderiliyor ama `CatalogPreviewProps`'ta tanımlı değil.

### Q3 — `onDownloadPdf` No-Op Handler (LOW)

**Dosya:** `catalogs-page-client.tsx` (satır 493)

`ShareModal`'a `onDownloadPdf={async () => { }}` geçiliyor. "PDF Olarak İndir" butonu görünür ama tıklanınca hiçbir şey yapmıyor.

### Q4 — Background Style Hesaplama 5 Template'te Duplicate (LOW)

`modern-grid.tsx`, `magazine.tsx`, `luxury.tsx`, `fashion-lookbook.tsx`, `classic-catalog.tsx`'te yaklaşık aynı ~15 satır background style oluşturma kodu var.

**Öneri:** `templates/utils.ts`'e `buildBackgroundStyle()` fonksiyonu çıkar.

### Q5 — Unused `NextImage` Imports (LOW)

Bazı template'ler `NextImage` import ediyor ama `ProductImageGallery`'ye geçtikten sonra artık kullanmıyor olabilir. Dosya başına kontrol gerekli.

---

## 📋 Önceliklendirilmiş Aksiyon Planı

### Sprint 1 — Kritik & Güvenlik (1-2 gün)

| # | Finding | Aksiyon |
|---|---------|--------|
| 1 | S2 | URL sanitization: `backgroundImage` ve `product_url` için validate/sanitize fonksiyonu |
| 2 | S1 | `magazine.tsx`'e `rel="noopener noreferrer"` ekle |
| 3 | A2 | `catalog-preview.tsx`'i template registry kullanacak şekilde refactor et |

### Sprint 2 — Performance & DRY (2-3 gün)

| # | Finding | Aksiyon |
|---|---------|--------|
| 4 | P1 | `formatProductPrice()` shared utility yaz, 16 template'tan duplicate'ı sil |
| 5 | P2 | Tüm template/cover/divider export'larını `React.memo` ile sar |
| 6 | Q4 | `buildBackgroundStyle()` shared utility yaz |
| 7 | P3 | 10 template'tan `_getImageFitClass` dead code'u sil |

### Sprint 3 — i18n & Cleanup (3-5 gün)

| # | Finding | Aksiyon |
|---|---------|--------|
| 8 | S5 | `share-modal.tsx`'e `useTranslation()` entegre et |
| 9 | S4 | `catalogs-page-client.tsx` limit modal string'lerini i18n'e taşı |
| 10 | S3 | Covers, dividers, templates i18n entegrasyonu |
| 11 | A1 | Registry pattern'i birleştir |
| 12 | A3, Q1-Q3, Q5 | Type cleanup, dead code, unused imports |

---

> **Not:** Bu audit `components/admin/` audit'inin devamıdır. Admin klasörü fix'leri tamamlanmış ve compile-check geçmiştir.
