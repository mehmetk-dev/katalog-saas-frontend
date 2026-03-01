# 🔍 Table/ Klasörü — Güvenlik & Performans Audit Raporu

**Dosyalar:**  
- `products-table.tsx` (52 satır) — Ana orchestrator  
- `types.ts` (47 satır) — TypeScript tanımları  
- `index.ts` — Re-export  
- `hooks/use-products-table.ts` (210 satır) — State & handler hook'u  
- `views/product-list-view.tsx` (290 satır) — Liste görünümü  
- `views/product-grid-view.tsx` (440 satır) — Grid görünümü  
- `components/product-preview-dialog.tsx` (226 satır) — Ürün önizleme  
- `components/delete-alert-dialog.tsx` (76 satır) — Silme onay dialog  
- `utils/product-helpers.ts` — Yardımcı fonksiyonlar  

**Tarih:** 28 Şubat 2026  
**Auditor:** Senior TypeScript/React Architect (15 yıl deneyim)  

---

## 📄 hooks/use-products-table.ts

### 1. 🚀 Performans Sorunları

#### 🔴 KRİTİK: `window.location.reload()` — Kopyalama Sonrası Tam Sayfa Yenileme
**Satır:** ~118  
```tsx
await createProduct(formData)
window.location.reload()  // ← TÜM UYGULAMA STATE'İ YOK OLUR
```
`handleDuplicate` sonrası sayfanın tamamı yenileniyor. Tüm React state'i, kullanıcı seçimleri, filtreler, scroll pozisyonu kayboluyor. `onDeleted` callback'i gibi bir `onDuplicated` callback oluşturulmalı.

**Çözüm:**
```tsx
// Parent'a eklenen product'ı bildir
const result = await createProduct(formData)
onProductCreated?.(result) // Parent state'i güncellesin
toast.success(t("common.success"))
```

#### 🟡 ORTA: `filteredProducts` Her Render'da Yeniden Hesaplanıyor
**Satırlar:** ~51-57  
```tsx
const filteredProducts = search
    ? products.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase())
        ...
    )
    : products
```
`useMemo` ile sarılmalı. 500+ üründe her keystroke'ta gereksiz filter hesaplaması.

**Çözüm:**
```tsx
const filteredProducts = useMemo(() => {
    if (!search) return products
    const searchLower = search.toLowerCase()
    return products.filter((p) => 
        p.name.toLowerCase().includes(searchLower) || ...
    )
}, [products, search])
```

#### 🟡 ORTA: `failedImages` Set Her Seferinde Yeni Referans Üretiyor
**Satırlar:** ~34-39  
```tsx
setFailedImages((prev: Set<string>) => {
    const newSet = new Set(prev)  // Her hata için yeni Set
    newSet.add(imageUrl)
    return newSet
})
```
Aynı URL için birden fazla kez çağrılırsa gereksiz re-render. Tekrar kontrolü eklenmeli:
```tsx
setFailedImages((prev) => {
    if (prev.has(imageUrl)) return prev  // Değişiklik yoksa aynı referans
    const newSet = new Set(prev)
    newSet.add(imageUrl)
    return newSet
})
```

#### 🟢 DÜŞÜK: Resize Event Listener Debounce'suz
**Satırlar:** ~43-47  
Her pixel'lik resize'da `setIsMobile()` çağrılıyor. `resize` event'i saniyede 60+ kez ateşlenir.

**Çözüm:** `matchMedia` API kullanın:
```tsx
const mql = window.matchMedia('(max-width: 767px)')
setIsMobile(mql.matches)
mql.addEventListener('change', (e) => setIsMobile(e.matches))
```

---

### 2. 🔒 Güvenlik Sorunları

#### 🟡 ORTA: Hardcoded Türkçe Duplicate Suffix
**Satır:** ~105  
```tsx
formData.append("name", `${product.name} (Kopyası)`)
```
XSS riski yok ama i18n ihlali. `t("products.copySuffix")` kullanılmalı.

#### 🟡 ORTA: Duplicate'da `images` ve `product_url` Kopyalanmıyor
**Satırlar:** ~104-114  
`product_url`, `images[]` array ve bazı `custom_attributes` kaybolabilir. Eksik veri kopyalama iş mantığı hatası.

---

### 3. 📐 Kod Kalitesi

#### 🟡 ORTA: `setIsCheckingCatalogs` State Kullanılmıyor
**Satır:** ~25  
```tsx
const [, setIsCheckingCatalogs] = useState(false)
```
Getter destructure edilmemiş. Dead state. Loading göstergesi kaldırılmış olabilir ama state kalmış.

#### 🟡 ORTA: `console.error("Sıralama kaydedilemedi")` — Hardcoded Turkish
**Satır:** ~164  
Kullanıcıya toast.error gösterilmiyor, sessiz hata. Loglama da Türkçe. Konsola log yetmez, kullanıcıya bilgi verilmeli.

---

## 📄 views/product-list-view.tsx

### 1. 🔒 Güvenlik Sorunları

#### 🔴 KRİTİK: `product_url` Protokol Doğrulaması Yok — XSS Riski
**Satırlar:** ~153-155  
```tsx
<a href={product.product_url} target="_blank" rel="noopener noreferrer">
```
`product_url` değeri `javascript:alert(document.cookie)` olabilir. `<a href>` ile doğrudan XSS çalıştırılır.

**Çözüm:**
```tsx
function isSafeUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        return ['http:', 'https:'].includes(parsed.protocol)
    } catch { return false }
}

{product.product_url && isSafeUrl(product.product_url) && (
    <a href={product.product_url} ...>
```

---

### 2. 🚀 Performans Sorunları

#### 🟡 ORTA: Her Satır İçin Inline IIFE (Image Render)
**Satırlar:** ~125-138  
```tsx
{(() => {
    const imageUrl = (product.image_url || product.images?.[0]) as string | undefined
    ...
})()}
```
Her render'da yeni fonksiyon oluşturuluyor. Ayrı bir `ProductImage` component'i çıkarılmalı.

#### 🟡 ORTA: Tüm Ürünler için Tüm `onClick` Handler'lar Inline
**Satırlar:** ~115, 233, 240, 248  
`onClick={(e) => { e.stopPropagation(); onEdit(product); }}` — Her satır ve her buton için yeni closure oluşturuluyor. `React.memo` + `useCallback` ile optimize edilebilir.

---

### 3. 📐 Kod Kalitesi

#### 🟡 ORTA: Hardcoded Türkçe String'ler
Birden fazla yerde:
- Satır ~179: `"adet"` → `t("products.unit")`
- Satır ~76: `"Ürün"`, `"Fiyat"`, `"Stok"` → i18n

#### 🟡 ORTA: `(e.target as HTMLElement).tagName` — Kırılgan Tıklama Kontrolü
**Satır:** ~115  
```tsx
if (isMobile && !e.defaultPrevented && (e.target as HTMLElement).tagName !== 'BUTTON' && ...)
```
Eğer Button içinde bir `<span>` veya `<svg>` varsa tıklama yanlışlıkla preview'ı açar. `e.target.closest('button, input')` kullanın.

---

## 📄 views/product-grid-view.tsx

### 1. 🔒 Güvenlik Sorunları

#### 🔴 KRİTİK: Aynı `product_url` XSS Riski (Grid Preview İçinde)
**Satırlar:** ~387-395  
```tsx
<a href={previewProduct.product_url} target="_blank" rel="noopener noreferrer">
```
List view ile aynı güvenlik açığı. `javascript:` protokolü koruması yok.

---

### 2. 🚀 Performans Sorunları

#### 🟡 ORTA: Preview Dialog Kodu Grid View İçinde Inline (DRY İhlali)
**Satırlar:** ~226-438  
Preview dialog'u `product-list-view.tsx`'te `ProductPreviewDialog` component'i kullanıyor ama `product-grid-view.tsx`'te aynı UI ~200 satır inline yazılmış. İkisi de widget'lar arasında senkronize tutulmalı.

**Çözüm:** Grid view'ın da `<ProductPreviewDialog>` component'ini kullanması gerekiyor.

#### 🟢 DÜŞÜK: `activeImageIndex` State Closure Riski
**Satır:** ~64  
`useState(0)` → `useEffect` ile product değişince reset ediliyor ama set ile state update arasında stale closure riski var. Mevcut implementasyon işlevsel ama fragile.

---

### 3. 📐 Kod Kalitesi

#### 🔴 KRİTİK: ~200 Satır Kod Tekrarı (Grid Preview vs ProductPreviewDialog)
`product-grid-view.tsx` satır 226-438 arası ile `components/product-preview-dialog.tsx` neredeyse birebir aynı kod. **Bu DRY ihlali güvenlik açığı taşır** — birinde yapılan XSS fix'i diğerine otomatik uygulanmaz.

#### 🟡 ORTA: Hardcoded Türkçe String'ler
- `"Düzenle"`, `"Kopyala"`, `"Sil"`, `"adet"`, `"Fiyat"`, `"Stok"`, `"Kategori"`, `"Açıklama"`, `"Özellikler"`, `"Kapat"` → Tümü i18n'e taşınmalı.

---

## 📄 components/product-preview-dialog.tsx

### 1. 🔒 Güvenlik Sorunları

#### 🔴 KRİTİK: `product_url` Protokol Doğrulaması Yok
**Satırlar:** ~189-198  
Üçüncü kez aynı güvenlik açığı. Tüm `<a href={product.product_url}>` kullanımlarında `javascript:` saldırısı mümkün.

---

### 2. 🚀 Performans Sorunları

#### 🟡 ORTA: Bağımsız `failedImages` State — Parent ile Senkron Değil
**Satır:** ~23  
```tsx
const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
```
Hook'taki `failedImages` ile bu component'teki `failedImages` ayrı. Bir görselin başarısız olduğu bilgisi paylaşılmıyor — aynı broken image tekrar tekrar yükleniyor.

**Çözüm:** `failedImages` prop olarak alınmalı:
```tsx
interface Props {
    product: Product
    failedImages: Set<string>
    onImageError: (url: string) => void
    ...
}
```

---

### 3. 📐 Kod Kalitesi

#### 🟡 ORTA: Hardcoded Türkçe String'ler
`"Fiyat"`, `"Stok"`, `"Kategori"`, `"Açıklama"`, `"Ürün Linki"`, `"Özellikler"`, `"Düzenle"`, `"Kapat"`, `"adet"` → i18n

---

## 📄 components/delete-alert-dialog.tsx

### 📐 Kod Kalitesi

#### 🟡 ORTA: Hardcoded Türkçe String'ler
**Satırlar:** ~48, ~55, ~63  
```tsx
"⚠️ Bu ürün {deleteCatalogs.length} katalogda kullanılıyor:"
"Silme işlemi sonrası ürün bu kataloglardan otomatik kaldırılacaktır."
"Yine de Sil"
```
Kısmi i18n: Bazı string'ler `t()` ile alınıyor, bazıları hardcoded. Tutarsız.

---

## 📄 products-table.tsx (Ana Orchestrator)

### 📐 Kod Kalitesi

✅ **Temiz:** 52 satır. Sorumluluğu views ve hook'a delege ediyor. SRP'ye uygun. Sorun yok.

---

## 📄 utils/product-helpers.ts

### 📐 Kod Kalitesi

✅ **Temiz:** Pure fonksiyonlar. `getStockStatus`, `getCurrencySymbol`, `formatPrice` doğru implement edilmiş.

---

## Mimari Öneriler

| # | Öneri | Öncelik |
|---|-------|---------|
| 1 | **`isSafeUrl()` utility** oluştur ve TÜM `<a href={product_url}>` noktalarında kullan (3 dosya) | 🔴 |
| 2 | Grid view inline preview → `<ProductPreviewDialog>` kullanımına geçir (~200 satır kazanç) | 🔴 |
| 3 | `window.location.reload()` → optimistic update callback | 🔴 |
| 4 | `filteredProducts` → `useMemo` ile sar | 🟡 |
| 5 | `failedImages` → parent'tan prop olarak geç, tek kaynaktan yönet | 🟡 |
| 6 | Tüm hardcoded Türkçe string'leri i18n'e taşı | 🟡 |
| 7 | `setIsCheckingCatalogs` dead state'i temizle | 🟢 |
| 8 | Resize event → `matchMedia` API | 🟢 |

---

## Özet

| Kategori | Kritik 🔴 | Orta 🟡 | Düşük 🟢 |
|----------|-----------|---------|----------|
| Performans | 1 | 4 | 2 |
| Güvenlik | 3 | 2 | 0 |
| Kod Kalitesi | 1 | 7 | 0 |
| Mimari | 0 | 0 | 0 |
| **TOPLAM** | **5** | **13** | **2** |

> ⚠️ **En Kritik Bulgu:** `product_url` XSS açığı **3 ayrı dosyada** tekrarlanıyor. Tek bir `isSafeUrl()` utility ile merkezi çözüm uygulanmalıdır.
