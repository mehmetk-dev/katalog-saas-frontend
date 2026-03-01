# 🔍 Products Root — Güvenlik & Performans Audit Raporu

**Dosya:** `products-page-client.tsx` (~807 satır)  
**Tarih:** 28 Şubat 2026  
**Auditor:** Senior TypeScript/React Architect (15 yıl deneyim)  

---

## 1. 🚀 Performans Sorunları

### 🔴 KRİTİK: Aşırı State Sayısı — Gereksiz Re-render Kaynağı
**Satırlar:** ~80-115  
**Sorun:** Component'te **22+ ayrı `useState`** hook'u var. Bunların birçoğu birbirine bağımlı ve her state güncellemesi tüm component'in yeniden render olmasına neden oluyor.

```tsx
// Birleştirilebilecek state'ler:
const [priceChangeType, setPriceChangeType] = useState<"increase" | "decrease">("increase")
const [priceChangeMode, setPriceChangeMode] = useState<"percentage" | "fixed">("percentage")
const [priceChangeAmount, setPriceChangeAmount] = useState<number>(10)
```

**Çözüm:** `useReducer` kullanarak ilişkili state'leri grupla:
```tsx
// Modal state'leri
const [modalState, dispatchModal] = useReducer(modalReducer, initialModalState)

// Fiyat güncelleme state'leri
const [priceState, dispatchPrice] = useReducer(priceReducer, initialPriceState)
```

---

### 🔴 KRİTİK: `initialProducts` ile Senkron Sorunu
**Satırlar:** ~84-88  
```tsx
useEffect(() => {
    setProducts(initialProducts)
    setMetadata(initialMetadata)
    setStats(initialStats)
}, [initialProducts, initialMetadata, initialStats])
```

**Sorun:** Bu pattern `initialProducts` referansı her render'da değiştiğinde (parent'tan yeni array geldiğinde) tetiklenir ve kullanıcının client-side yaptığı state değişiklikleri (ekleme, silme) kaybolur. Object referans karşılaştırması React'te sığdır.

**Çözüm:** `key` prop'u ile component'i sıfırla veya `usePrevious` hook'u ile karşılaştır:
```tsx
const prevProducts = useRef(initialProducts)
useEffect(() => {
    if (prevProducts.current !== initialProducts) {
        setProducts(initialProducts)
        prevProducts.current = initialProducts
    }
}, [initialProducts])
```

---

### 🟡 ORTA: `downloadAllProducts` İçinde Inline CSV Üretimi
**Satırlar:** ~415-530  
**Sorun:** ~120 satırlık export mantığı component içinde. Her render'da bu fonksiyonun closure'ı yeniden oluşturulur.

**Çözüm:** CSV üretim mantığını `lib/utils/csv-exporter.ts` gibi ayrı bir modüle taşı.

---

### 🟡 ORTA: `categoryStats` Her Render'da Yeniden Hesaplanıyor
**Satır:** ~190  
```tsx
const categoryStats = useMemo(() => { ... }, [products, t])
```
**Sorun:** `t` fonksiyonu i18n provider'dan gelir ve genellikle referansı değişmez ama bazı provider'larda değişebilir. Bu durumda gereksiz yeniden hesaplama olur. Ayrıca `products` referansı da sık değişir.

---

### 🟡 ORTA: `selectAllProducts` — Backend Çağrısı ve window.location Kullanımı
**Satır:** ~532 (toolbar `onSelectAll`)  
```tsx
const { getAllProductIds } = await import('@/lib/actions/products');
const allIds = await getAllProductIds();
```
**Sorun:** Dynamic import her çağrıda modülü tekrar yükler (module cache ile optimize edilse de unnecessary indirection).

---

### 🟡 ORTA: `handleDuplicate` İçinde `window.location.reload()`
**Satır:** (use-products-table.ts)  
**Sorun:** Kopyalama işleminden sonra tüm sayfayı yeniden yüklemek unnecessary. UI state tamamen sıfırlanır.

---

## 2. 🔒 Güvenlik Sorunları

### 🔴 KRİTİK: CSV Export'ta XSS/Injection Riski
**Satırlar:** ~425-528  
**Sorun:** CSV'ye yazılan ürün verileri **formula injection**'a karşı sanitize edilmemiş. Excel'de `=HYPERLINK("http://evil.com")`, `=CMD(...)` gibi formüller product name veya description'a gömülürse çalıştırılabilir.

```tsx
// MEVCUT: Sadece tırnak kaçışı
const stringValue = String(field ?? "").replace(/"/g, '""')
return `"${stringValue}"`
```

**Çözüm:** `=`, `+`, `-`, `@`, `\t`, `\r` ile başlayan hücrelere `'` prefix'i ekle:
```tsx
function sanitizeCsvCell(value: string): string {
    const trimmed = value.trim()
    if (/^[=+\-@\t\r]/.test(trimmed)) {
        return `'${trimmed}`
    }
    return trimmed
}
```

---

### 🟡 ORTA: `product_url` Açık Redirect / XSS Riski
**Satırlar:** product-list-view.tsx, ~140  
```tsx
<a href={product.product_url} target="_blank" rel="noopener noreferrer">
```
**Sorun:** `product_url` kullanıcı tarafından girilir. `javascript:alert(1)` gibi protocol injection'a karşı doğrulama yok.

**Çözüm:** URL'i render etmeden önce validate et:
```tsx
function isSafeUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
        return false
    }
}
```

---

### 🟡 ORTA: Error Loglama — Stack Trace Sızıntısı
**Çeşitli satırlar**  
```tsx
console.error('Bulk import failed:', error)
console.error("Export error:", error)
```
**Sorun:** Production'da `error` objesi iç yapısal detayları (stack traces, DB error messages) console'a yazdırır. Kullanıcı DevTools'tan görebilir.

**Çözüm:** Production'da detaylı error loglamayı devre dışı bırak veya Sentry'ye yönlendir.

---

## 3. 📐 Kod Kalitesi

### 🔴 SRP İhlali: Component Çok Fazla Sorumluluk Taşıyor
800+ satır, sorumlu olduğu işler:
- State management (22+ state)
- URL yönetimi (routing)
- CRUD operasyonları
- CSV export mantığı
- Fiyat güncelleme mantığı
- Test data oluşturma
- Modal koordinasyonu

**Çözüm:** Custom hook'lara parçala:
```
useProductsState()        → state yönetimi
useProductsCrud()         → CRUD operasyonları
useProductsFilters()      → filtreleme/sıralama
useProductsExport()       → CSV export
useProductsBulkOps()      → toplu işlemler
```

---

### 🟡 ORTA: Stats Güncelleme Mantığı Tekrarlanıyor
Stats delta hesaplama kodu `handleTestImport` ve `onImport` içinde birebir tekrarlanıyor (~15 satır).

**Çözüm:** `calculateStatsDelta(products: Product[]): Partial<ProductStats>` helper fonksiyonu.

---

### 🟡 ORTA: TypeScript `as string` Cast'leri Yaygın
```tsx
t("products.deleteConfirmTitle") as string
t("toasts.productLimitReached", { ... }) as string
```
**Sorun:** `t()` fonksiyonunun dönüş tipi `string | React.ReactNode` ise her yerde `as string` cast etmek yerine `t()` tip tanımını düzeltmek gerekir.

---

## 4. 🏗️ Mimari Sorunlar

### 🔴 Ölçeklenemez State Yönetimi
Tüm ürün listesi state'i (`products`, `metadata`, `stats`) tek bir component'te tutuluyor. Ürün sayısı arttıkça memory kullanımı lineer artacak. Daha büyük ölçekte Zustand veya React Query gibi çözümlerere geçilmeli.

### 🟡 Test Edilemezlik
`downloadAllProducts` fonksiyonu doğrudan DOM manipülasyonu yapıyor (`document.createElement`, `document.body.appendChild`). Bu fonksiyon unit test'e uygun değil.

**Çözüm:** DOM operasyonlarını soyutla:
```tsx
function downloadBlob(blob: Blob, filename: string) { ... }
```

---

## Özet

| Kategori | Kritik 🔴 | Orta 🟡 | Düşük 🟢 |
|----------|-----------|---------|----------|
| Performans | 2 | 4 | 0 |
| Güvenlik | 1 | 2 | 0 |
| Kod Kalitesi | 1 | 2 | 0 |
| Mimari | 1 | 1 | 0 |
| **TOPLAM** | **5** | **9** | **0** |
