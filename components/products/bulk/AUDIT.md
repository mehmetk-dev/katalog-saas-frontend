# 🔍 Bulk/ Klasörü — Güvenlik & Performans Audit Raporu

**Dosyalar:**  
- `bulk-actions-modal.tsx` (397 satır)  
- `bulk-image-upload-modal.tsx` (305 satır)  
- `bulk-price-modal.tsx` (~200 satır)  
- `bulk-image-upload/` alt klasörü (5 dosya)  

**Tarih:** 28 Şubat 2026  
**Auditor:** Senior TypeScript/React Architect  

---

## 1. 🚀 Performans Sorunları

### 🔴 KRİTİK: N+1 Sorgu Paterni — `bulk-actions-modal.tsx`
**Satırlar:** ~65-135 (handleApply)  
```tsx
for (let i = 0; i < selectedProducts.length; i++) {
    const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)
}
```

**Sorun:** Her ürün için **ayrı bir Supabase sorgusu** gönderiliyor. 100 ürün seçildiğinde 100 ayrı HTTP isteği yapılır. Bu klasik N+1 problemidir.

**Çözüm:** Batch update kullanın:
```tsx
// Tüm ürünleri tek sorguda güncelle
const productIds = selectedProducts.map(p => p.id)
const { error } = await supabase
    .from('products')
    .update(updateData)
    .in('id', productIds)
```
Veya fiyat/stok gibi ürüne göre farklı değerler gerekiyorsa, backend'e toplu güncelleme endpoint'i ekleyin (`bulkUpdatePrices` gibi mevcut server action).

---

### 🔴 KRİTİK: Client-Side Supabase Direkt Erişimi
**Satır:** ~18, ~68  
```tsx
import { createClient } from "@/lib/supabase/client"
// ...
const supabase = createClient()
const { error } = await supabase.from('products').update(updateData).eq('id', product.id)
```

**Sorun:** `bulk-actions-modal.tsx` doğrudan client-side Supabase kullanıyor ancak `products-page-client.tsx` ise server actions kullanıyor. Bu tutarsızlık, RLS bypass edilemese bile mimari bütünlüğü bozar.

**Çözüm:** Tüm veri işlemlerini server actions üzerinden yapın. `bulk-actions-modal.tsx` de `bulkUpdatePrices` ve benzeri server action'ları kullanmalı.

---

### 🟡 ORTA: `upload-service.ts` — Timeout Promise Memory Leak
**Satırlar:** upload-service.ts ~75-78  
```tsx
const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("UPLOAD_TIMEOUT")), TIMEOUT_MS)
})
const result = await Promise.race([uploadPromise, timeoutPromise])
```

**Sorun:** `setTimeout` asla temizlenmiyor. Upload başarılı olsa bile timeout timer arka planda çalışmaya devam eder. Çok sayıda upload'da memory leak'e neden olur.

**Çözüm:**
```tsx
const result = await Promise.race([
    uploadPromise,
    new Promise<never>((_, reject) => {
        const timerId = setTimeout(() => reject(new Error("UPLOAD_TIMEOUT")), TIMEOUT_MS)
        // Upload bittiğinde timeout'u temizle
        uploadPromise.finally(() => clearTimeout(timerId))
    })
])
```

---

### 🟡 ORTA: `bulk-image-upload-modal.tsx` — `images` Array Her Update'te Kopyalanıyor
**Satırlar:** ~120, ~145, ~155  
```tsx
setImages((prev) => prev.map((img) => (img.id === id ? { ...img, status, error } : img)))
```
**Sorun:** Her görsel durum değişikliğinde tüm images array'i kopyalanıp yeni referans oluşturuluyor. 50+ görselde performans etkisi olur.

**Çözüm:** `Map<id, ImageFile>` yapısına geçiş veya `immer` kullanımı düşünülebilir.

---

### 🟡 ORTA: `ImageCard` — Her Card'a Tüm `images` Array'i Props Olarak Geçiliyor
**Satırlar:** bulk-image-upload-modal.tsx ~260  
```tsx
<ImageCard
    image={image}
    index={index}
    images={images}    // ← Tüm array her card'a geçiyor
    products={products}
    sortedProducts={sortedProducts}
    ...
/>
```
**Sorun:** `images` array'i değiştiğinde tüm `ImageCard` component'leri yeniden render olur. `ImageCard` memoize edilmemiş.

**Çözüm:** `ImageCard`'a sadece ihtiyaç duyduğu bilgiyi geçir (`pendingBefore` değerini parent'ta hesapla) ve `React.memo` ile sarmala.

---

## 2. 🔒 Güvenlik Sorunları

### 🔴 KRİTİK: RLS Bypass Riski — Client-Side Direkt Supabase
**Dosya:** `bulk-actions-modal.tsx`  
**Sorun:** Supabase client tarafında kullanılıyor. RLS politikaları doğru yapılandırılmışsa güvenli olabilir ancak:
1. RLS'de bir açık varsa tüm ürünlere erişilebilir
2. Server action'ların sağladığı ek validasyon katmanını atlar
3. Rate limiting uygulanamaz

**Çözüm:** Server actions üzerinden çalıştır.

---

### 🟡 ORTA: Dosya Tipi Validasyonu Yetersiz — `handleFiles`
**Satır:** bulk-image-upload-modal.tsx ~70  
```tsx
if (!file.type.startsWith("image/")) continue
```

**Sorun:** `file.type` browser tarafından dosya uzantısına göre atanır ve **spoofable**'dır. `evil.exe` dosyası `.jpg` uzantısıyla yüklenebilir.

**Çözüm:** Magic bytes (file signature) kontrolü ekle:
```tsx
async function validateImageFile(file: File): Promise<boolean> {
    const buffer = await file.slice(0, 4).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    // JPEG: FF D8 FF, PNG: 89 50 4E 47, WebP: 52 49 46 46
    const validHeaders = [
        [0xFF, 0xD8, 0xFF],        // JPEG
        [0x89, 0x50, 0x4E, 0x47],  // PNG
        [0x52, 0x49, 0x46, 0x46],  // WebP (RIFF)
    ]
    return validHeaders.some(header =>
        header.every((byte, i) => bytes[i] === byte)
    )
}
```

---

### 🟡 ORTA: Upload Dosya Adı — Path Traversal
**Satır:** upload-service.ts ~37  
```tsx
const extension = image.file.name.split(".").pop() || "jpg"
const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
```

**Sorun:** `extension` olarak `../../etc/passwd` gibi bir path gelebilir (dosya adı manipülasyonu). `split(".")` sonrası `.pop()` güvenli ama extension sınırlaması yok.

**Çözüm:** Extension'ı whitelist'le:
```tsx
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
const ext = (image.file.name.split(".").pop() || "").toLowerCase()
const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : 'jpg'
```

---

### 🟡 ORTA: `matcher.ts` — ReDoS Riski
**Satır:** matcher.ts ~86  
```tsx
const skuPattern = new RegExp(`(^|[-_ ])${normalizedSku.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[-_ ])`)
```

**Sorun:** SKU değeri escape ediliyor (iyi), ancak `normalizedSku` çok uzun olursa regex backtracking problemi oluşabilir. SKU uzunluk sınırı yok.

**Çözüm:** Input uzunluk kontrolü ekle:
```tsx
if (normalizedSku.length > 100) return false  // Makul SKU uzunluğu
```

---

## 3. 📐 Kod Kalitesi

### 🟡 Hardcoded Türkçe Stringler — `bulk-actions-modal.tsx`
**Çeşitli satırlar**  
```tsx
toast.error("Hiç ürün seçilmedi")
toast.success(`${successCount} ürün başarıyla güncellendi`)
```
**Sorun:** i18n sistemi kullanılmamış. Çoklu dil desteğinde çevrilmeyecektir.

---

### 🟡 Hardcoded Türkçe Stringler — `bulk-image-upload-modal.tsx`
```tsx
toast.error("Yüklenecek uygun ve eşleşmiş fotoğraf bulunamadı.")
```
**Sorun:** Aynı i18n eksikliği.

---

### 🟡 `bulk-price-modal.tsx` — Aşırı Prop Drilling
**Satırlar:** ~17-32  
18 ayrı prop alan component. Bu, component hiyerarşisinde coupling'i artırır.

**Çözüm:** Props'ları gruplandır:
```tsx
interface PriceConfig {
    type: "increase" | "decrease"
    mode: "percentage" | "fixed"
    amount: number
}
interface SelectionConfig {
    selectedIds: string[]
    onSelectedIdsChange: (ids: string[]) => void
}
```

---

### 🟢 İYİ: `matcher.ts` — Temiz Algoritma
Tokenization ve fuzzy matching algoritması iyi yapılandırılmış, MIN_SCORE threshold'u uygun, SKU exact match öncelikli.

---

### 🟢 İYİ: `upload-service.ts` — Retry ve Abort Desteği
Retry mekanizması (exponential backoff), abort controller, concurrent upload limiti iyi tasarlanmış.

---

## 4. 🏗️ Mimari Sorunlar

### 🔴 Tutarsız Veri Erişim Katmanı
`bulk-actions-modal.tsx` → Doğrudan Supabase client  
`products-page-client.tsx` → Server actions  

Bu tutarsızlık, güvenlik politikalarının farklı uygulanmasına ve bakım zorluğuna yol açar.

### 🟡 Test Edilemezlik
`upload-service.ts` doğrudan `storage.upload()` ve `bulkUpdateProductImages()` çağırıyor. Bu bağımlılıklar inject edilemiyor, mock'lanamıyor.

---

## Özet

| Kategori | Kritik 🔴 | Orta 🟡 | Düşük 🟢 |
|----------|-----------|---------|----------|
| Performans | 2 | 3 | 0 |
| Güvenlik | 1 | 3 | 0 |
| Kod Kalitesi | 0 | 3 | 2 |
| Mimari | 1 | 1 | 0 |
| **TOPLAM** | **4** | **10** | **2** |
