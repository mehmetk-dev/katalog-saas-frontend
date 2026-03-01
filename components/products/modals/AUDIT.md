# 🔍 Modals/ Klasörü — Güvenlik & Performans Audit Raporu

**Dosyalar:**  
- `product-modal.tsx` (223 satır)  
- `import-export-modal.tsx` (200 satır)  
- `import-export/` alt klasörü (6 dosya: constants.ts, default-tabs.tsx, file-utils.ts, import-products.ts, mapping-step.tsx, types.ts)  

**Tarih:** 28 Şubat 2026  
**Auditor:** Senior TypeScript/React Architect (15 yıl deneyim)  

---

## 📄 product-modal.tsx

### 1. 🚀 Performans Sorunları

#### 🟡 ORTA: Modal Açıldığında Sıralı State Güncellemeleri
**Satırlar:** ~65-72  
`useEffect` içinde ~10 ayrı `setState` çağrısı yapılıyor. React 18 bunları effect içinde her zaman batch'lemez. Her biri potansiyel re-render kaynağı.

**Çözüm:** `useReducer` veya tek bir state objesi kullanın:
```tsx
const [formState, setFormState] = useState<ProductFormState>(initialState)
```

#### 🟢 DÜŞÜK: Yapay 500ms Gecikme
**Satır:** ~134  
```tsx
await new Promise((r) => setTimeout(r, 500)) // DB consistency wait
```
Race condition workaround'u. Backend response'unu direkt kullanın.

---

### 2. 🔒 Güvenlik Sorunları

#### 🟡 ORTA: Form Verileri Sanitize Edilmeden Gönderiliyor
**Satırlar:** ~83-84  
`name`, `description`, `sku`, `productUrl` gibi alanlar `FormData`'ya trim dışında sanitizasyon olmadan ekleniyor. Backend'de sanitizasyon yapılmak zorunda ama **defense in depth** prensibi gereği client-side'da da temel sanitizasyon uygulanmalı.

#### 🟢 DÜŞÜK: Blob URL Kontrolü Kırılgan
**Satırlar:** ~98-100  
`coverUrl?.startsWith("blob:")` → fallback boş string dönebilir, product'a boş `image_url` kaydedilir.

---

### 3. 📐 Kod Kalitesi

#### 🟡 ORTA: `eslint-disable react-hooks/exhaustive-deps`
**Satır:** ~73  
Effect dependency'leri eksik bırakılmış. `images.initFromProduct` ve `images.cleanup` callback referansları değiştiğinde effect yeniden çalışmaz.

#### 🟡 ORTA: SRP İhlali
Form state yönetimi, image upload koordinasyonu, form validasyonu, API submission ve UI render hepsi tek component'te. `useProductForm()` hook'una çıkarılmalı.

#### 🟡 ORTA: Zod Validasyonu Kullanılmamış
`lib/validations/` altında Zod şemaları mevcut ancak bu component'te kullanılmıyor. Manuel `if (!name.trim())` kontrolleri var. Client-server validasyon uyumsuzluğu riski.

#### 🟢 DÜŞÜK: Currency Custom Attribute Olarak Saklanıyor
`{ name: "currency", value: "TRY" }` — Para birimi custom_attributes içinde. Bu bir domain modeling hatası. Currency, product tablosunda ayrı bir kolon olmalı.

---

## 📄 import-export-modal.tsx

### 1. 🚀 Performans Sorunları

#### 🔴 KRİTİK: `buildImportProducts()` Main Thread'i Blokluyor
**Satırlar:** ~170-194  
10K+ satırlık CSV import'unda tüm parse/transform işlemi ana thread'de senkron çalışır. UI donar.

**Çözüm:** Web Worker'a taşıyın veya chunk'lara bölüp `requestIdleCallback` kullanın.

#### 🟡 ORTA: `requestAnimationFrame` + `setTimeout` Anti-Pattern
**Satırlar:** ~160-165  
```tsx
await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)))
```
React'in paint yapmasını zorlamak için hack. `React.startTransition` veya `flushSync` kullanılmalı.

---

### 2. 🔒 Güvenlik Sorunları

#### 🔴 KRİTİK: Dosya Boyutu Limiti Yok
**Satır:** ~123  
`handleFileUpload` fonksiyonunda dosya boyut kontrolü yok. 500MB'lık bir CSV dosyası yüklenirse browser OOM (Out of Memory) crash yaşar.

**Çözüm:**
```tsx
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
if (file.size > MAX_FILE_SIZE) {
    toast.error("Dosya boyutu çok büyük (Max 10MB)")
    return
}
```

#### 🟡 ORTA: Ham Hata Mesajı Sızıntısı
**Satır:** ~131  
```tsx
error instanceof Error ? error.message : t(...)
```
XLSX kütüphanesinin fırlattığı error'larda iç dosya yolları veya stack bilgisi sızabilir.

#### 🟡 ORTA: Import Tekrarlama (Double Submit) Koruması Yetersiz
**Satırlar:** ~156-165  
Hızlı çift tıklama ile `executeImport()` birden fazla tetiklenebilir. `importStatus` kontrolü var ama tam güvenli değil.

---

### 3. 📐 Kod Kalitesi

#### 🟡 ORTA: `onImport` Tipi `unknown[]`
**Satır:** ~34  
Tüm type safety kaybediliyor. `Partial<Product>[]` veya spesifik bir import DTO tipi kullanılmalı.

#### 🟡 ORTA: Row-Level Validasyon Eksik
`executeImport` sadece mapping kontrolü yapar. Gerçek veri değerleri (fiyat valid mi? URL geçerli mi? isim boş mu?) doğrulanmıyor. Geçersiz satırlar backend'e gönderiliyor.

---

## 📄 import-export/ Alt Klasörü

### file-utils.ts

#### 🔴 KRİTİK: Excel Formula Injection Sıyrılmıyor
**Satırlar:** ~83-84  
Excel hücre değerleri olduğu gibi kullanılıyor. `=HYPERLINK(...)`, `=CMD(...)` gibi formüller parse edilip stored XSS olarak kaydedilir.

**Çözüm:**
```tsx
function sanitizeCellValue(value: string): string {
    const trimmed = value.trim()
    if (/^[=+\-@\t\r]/.test(trimmed)) {
        return `'${trimmed}` // Prefix ile formula çalışmasını engelle
    }
    return trimmed
}
```

#### 🟡 ORTA: Hardcoded Codepage 1254 (Türkçe)
**Satır:** ~78  
```tsx
XLSX.read(..., { codepage: 1254 })
```
Türkçe dışı locale'lerde (Çince, Arapça vb.) veri bozulur. Auto-detection veya varsayılan encoding kullanılmalı.

#### 🟡 ORTA: `readAsBinaryString` Kullanımdan Kaldırılmış
**Satır:** ~77  
Deprecated API. `readAsArrayBuffer` ve `{ type: 'array' }` parametresi kullanılmalı.

---

### import-products.ts

#### 🟡 ORTA: URL Validasyonu Yok
**Satırlar:** ~86-89  
`image_url` ve `product_url` alanları validasyon olmadan kabul ediliyor. `javascript:alert(1)` gibi URL'ler saklanabilir ve `<a href>` olarak render edildiğinde XSS tetikler.

**Çözüm:**
```tsx
function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
        return false
    }
}
```

#### 🟡 ORTA: Kırılgan Fiyat Parse Heuristiği
**Satırlar:** ~56-79  
`12.500` → 12500 mü yoksa 12.5 mi? Locale bilgisi olmadan karar verilemez. Kullanıcı geri bildirimi olmadan yanlış parse edilebilir.

#### 🟡 ORTA: Sanitize Edilmemiş Custom Attribute İsimleri
**Satırlar:** ~49-51  
CSV header'ları direkt attribute name olarak kullanılıyor. `<script>alert(1)</script>` header'ı stored XSS kaynağı olabilir.

#### 🟢 DÜŞÜK: Free Kullanıcılara Sessiz Kategori Kaldırma
**Satır:** ~102  
`product.category = isFreeUser ? null : value || null` — Kullanıcıya bilgi verilmeden kategori siliniyor.

---

### mapping-step.tsx

#### 🔴 KRİTİK: 1000+ Controlled Input Performans Sorunu
**Satırlar:** ~130-148  
100 satır × 10 kolon = 1000 controlled `<Input>` component'i. Her keystroke'ta parent state değişir ve tüm input'lar yeniden render olur. UI tamamen donar.

**Çözüm:**
1. `react-window` ile satır sanallaştırma
2. Uncontrolled input'lar + refs
3. `onCellEdit` debounce

#### 🟡 ORTA: Her Kolon Başlığı İçin Full Select + Portal
**Satırlar:** ~97-125  
20+ kolon için 20 adet `<SelectContent>` portal'ı aynı anda yönetiliyor. Sadece açık olan'ı render edin.

---

### constants.ts

#### 🟢 DÜŞÜK: Alias Çakışma Riski
"url" → `product_url` haritalama ile kullanıcı farklı anlamda URL alanı kastedebilir.

---

### types.ts

#### 🟢 DÜŞÜK: `systemField: string | null` — Loose Typing
`typeof SYSTEM_FIELDS_KEYS[number] | 'skip' | null` kullanılmalı.

---

## Mimari Öneriler

| # | Öneri | Öncelik |
|---|-------|---------|
| 1 | `useProductForm()` hook'u çıkar — state, validasyon ve submission ayrımı | 🔴 |
| 2 | `useImportWorkflow()` hook'u çıkar — FSM pattern (idle→mapping→loading→done) | 🔴 |
| 3 | `buildImportProducts()` Web Worker'a taşı | 🔴 |
| 4 | mapping-step'te `react-window` sanallaştırma ekle | 🔴 |
| 5 | Import pipeline'ına Zod validasyonu entegre et | 🟡 |
| 6 | `sanitizeImportValue()` utility oluştur (formula injection, URL validation) | 🔴 |

---

## Özet

| Kategori | Kritik 🔴 | Orta 🟡 | Düşük 🟢 |
|----------|-----------|---------|----------|
| Performans | 2 | 2 | 1 |
| Güvenlik | 2 | 5 | 1 |
| Kod Kalitesi | 0 | 5 | 3 |
| Mimari | 0 | 2 | 0 |
| **TOPLAM** | **4** | **14** | **5** |
