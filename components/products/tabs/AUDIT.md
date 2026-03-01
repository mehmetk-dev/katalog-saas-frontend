# 🔍 Tabs/ Klasörü — Güvenlik & Performans Audit Raporu

**Dosyalar:**  
- `product-basic-tab.tsx` (403 satır) — Temel bilgiler sekmesi  
- `product-images-tab.tsx` (~105 satır) — Görsel yönetimi sekmesi  
- `product-attributes-tab.tsx` (~140 satır) — Özel özellikler sekmesi  

**Tarih:** 28 Şubat 2026  
**Auditor:** Senior TypeScript/React Architect (15 yıl deneyim)  

---

## Genel Değerlendirme

✅ **Bu klasör projenin en temiz modülü.** Tüm component'ler `React.memo` ile sarılmış, prop drilling doğru uygulanmış, state yönetimi parent'a bırakılmış. Ancak birkaç iyileştirme noktası mevcut.

---

## 📄 product-basic-tab.tsx

### 1. 🔒 Güvenlik Sorunları

#### 🟡 ORTA: `productUrl` Input'unda Client-Side Validasyon Yok
**Satırlar:** ~302-310  
```tsx
<Input
    id="productUrl"
    type="url"
    value={productUrl}
    onChange={(e) => onProductUrlChange(e.target.value)}
/>
```
`type="url"` HTML5 validasyonu form submit'te çalışır ama bu bir controlled component — form submit yoksa validasyon tetiklenmez. `javascript:` veya `data:` URL'leri girilip kaydedilebilir.

**Çözüm:** `onChange`'de veya `onBlur`'da protokol kontrolü:
```tsx
onBlur={(e) => {
    const url = e.target.value
    if (url && !/^https?:\/\//i.test(url)) {
        toast.warning("URL http:// veya https:// ile başlamalıdır")
    }
}}
```

#### 🟢 DÜŞÜK: `generateSKU` Tahmin Edilebilir
**Satırlar:** ~83-87  
```tsx
const random = Math.random().toString(36).substring(2, 8).toUpperCase()
```
`Math.random()` kriptografik olarak güvenli değil ama SKU için güvenlik kritik değil. Sadece çakışma riski var (36^6 = ~2.2 milyar). Kabul edilebilir.

---

### 2. 🚀 Performans Sorunları

#### 🟢 DÜŞÜK: `MAGIC_DESCRIPTIONS` Her Import'ta Bellekte
**Satırlar:** ~14-36  
14 adet string (7 TR + 7 EN) modül düzeyinde tanımlanmış. Tree-shaking ile optimize edilemez ama boyut ihmal edilebilir (~2KB).

#### 🟢 DÜŞÜK: `allCategories` Prop Olarak Her Render'da Geçiliyor
Parent'ın bu prop'u memoize etmesi gerekiyor. Eğer parent her render'da yeni array referansı üretiyorsa, `memo` etkisizleşir.

---

### 3. 📐 Kod Kalitesi

#### 🟡 ORTA: `onBlur` ile Kategori Auto-Add — Beklenmeyen Davranış
**Satırlar:** ~234-238  
```tsx
onBlur={() => {
    if (categoryInput.trim()) {
        addNewCategory()
    }
}}
```
Input'ten focus'ı kaybettiğinde (örn. başka alana tıklama) yarım yazılmış bir kategori otomatik eklenir. Kullanıcı amacı bu olmayabilir. `onBlur` auto-add kaldırılmalı, yalnızca Enter ve buton ile eklenmeli.

#### 🟡 ORTA: `price` Input'u `type="text"` — Negatif Fiyat Girilir
**Satırlar:** ~338-350  
```tsx
onChange={(e) => onPriceChange(e.target.value.replace(/[^0-9.,]/g, ""))}
```
Regex `[^0-9.,]` sadece sayı, nokta ve virgülü filtreler ama birden fazla nokta (`12.34.56`) veya sadece nokta (`.`) girilmesine izin verir. Çift nokta kontrolü eklenmeli.

#### 🟢 DÜŞÜK: Inline SVG (Product URL Label)
**Satırlar:** ~285-293  
Lucide'den uygun bir icon kullanılabilir (örn. `Link2`). Inline SVG gereksiz markup oluşturuyor.

---

## 📄 product-images-tab.tsx

### 1. 🔒 Güvenlik Sorunları

✅ **Sorun Yok.** Accept attribute doğru set edilmiş (`image/png, image/jpeg, image/webp`). File validation parent'a delege edilmiş.

---

### 2. 🚀 Performans Sorunları

#### 🟡 ORTA: `isUploading` Overlay Pozisyonlama Sorunu
**Satırlar:** ~94-98  
```tsx
{isUploading && (
    <div className="absolute inset-0 bg-white/80 ...">
```
`absolute` pozisyonlu overlay, parent'ın `relative` olmasını bekliyor. Eğer parent `relative` değilse overlay yanlış yerde konumlanır. `images.map` sonrası grid'in dışında render ediliyor — viewport'a göre konumlanabilir.

**Çözüm:** Overlay'i grid container'ın içine alıp `relative` wrapper ekleyin.

---

### 3. 📐 Kod Kalitesi

#### 🟡 ORTA: `label` + `onClick` + Gizli `input` Pattern'ı Çakışıyor
**Satırlar:** ~73-93  
```tsx
<label onClick={onUploadClick} ...>
    ...
    <input type="file" className="hidden" onChange={...} />
</label>
```
`<label>` otomatik olarak içindeki `<input>`'a tıklamayı iletir. Ayrıca `onClick={onUploadClick}` de çağrılıyor. Bu iki mekanizma çakışarak dosya seçim dialog'unun 2 kez açılmasına veya upload logic'inin 2 kez tetiklenmesine yol açabilir.

**Çözüm:** Ya `label`'ın native davranışını kullanın (onClick kaldır), ya da `for` + `ref` ile explicit bağlayın.

#### 🟢 DÜŞÜK: Array Index Key (`key={idx}`)
**Satır:** ~41  
Görseller reorder edilmiyorsa kabul edilebilir ama URL'nin kendesi daha stabil bir key olur: `key={url}`.

---

## 📄 product-attributes-tab.tsx

### 1. 🔒 Güvenlik Sorunları

#### 🟡 ORTA: Attribute `name` ve `value` Sanitizasyonu Yok
**Satırlar:** ~53-55  
```tsx
const update = (index: number, field: keyof CustomAttribute, value: string) => {
    const next = [...attributes]
    next[index] = { ...next[index], [field]: ... }
```
Kullanıcı attribute name'e `<script>` veya `{{template}}` gibi payload girebilir. Backend'de sanitized edilse bile, defense-in-depth gereği client-side'da da temel kontrol yapılmalı.

---

### 2. 🚀 Performans Sorunları

#### 🟢 DÜŞÜK: `attributes.some()` Her Render'da Çağrılıyor
**Satır:** ~80  
```tsx
disabled={attributes.some((a) => a.name === label)}
```
QUICK_ATTRIBUTES (6 adet) × attributes uzunluğu kadar iteration. Normal kullanımda 6×10 = 60 — ihmal edilebilir.

---

### 3. 📐 Kod Kalitesi

#### 🟡 ORTA: `GripVertical` Drag Handle — Drag Fonksiyonu Yok
**Satır:** ~103  
```tsx
<GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
```
Sürükle-bırak ikonu gösteriliyor ama attributes sıralamasında drag&drop implementasyonu yok. Yanıltıcı UX. Ya ikonu kaldırın ya da drag&drop ekleyin.

#### 🟢 DÜŞÜK: `key={index}` Array Mutasyonunda Sorun
**Satır:** ~100  
Attribute silme/ekleme yapılıyor — index key kullanmak React'in DOM'u yanlış eşleştirmesine yol açabilir. UUID veya benzersiz key kullanılmalı.

---

## Mimari Öneriler

| # | Öneri | Öncelik |
|---|-------|---------|
| 1 | Product URL'de `isSafeUrl()` validasyonu ekle | 🟡 |
| 2 | `onBlur` auto-add kategori davranışını kaldır | 🟡 |
| 3 | `label`+`onClick`+hidden `input` çakışmasını çöz | 🟡 |
| 4 | `GripVertical` drag handle'ı kaldır veya DnD ekle | 🟡 |
| 5 | Attribute key'leri UUID'ye çevir | 🟢 |

---

## Özet

| Kategori | Kritik 🔴 | Orta 🟡 | Düşük 🟢 |
|----------|-----------|---------|----------|
| Performans | 0 | 1 | 3 |
| Güvenlik | 0 | 2 | 1 |
| Kod Kalitesi | 0 | 5 | 3 |
| Mimari | 0 | 0 | 0 |
| **TOPLAM** | **0** | **8** | **7** |

> ✅ **Sonuç:** Bu klasör iyi mühendislik pratiği sergiliyor. `React.memo`, prop-based state, clean interfaces. Kritik bulgu yok, sadece iyileştirme önerileri mevcut.
