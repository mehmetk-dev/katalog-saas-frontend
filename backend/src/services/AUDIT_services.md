# 🔍 Audit Raporu: `backend/src/services/`

> **Tarih:** 28 Şubat 2026  
> **Denetçi:** Senior Security & Performance Architect  
> **Kapsam:** supabase.ts · cloudinary.ts · redis.ts · activity-logger.ts

---

## 📄 `supabase.ts` — Supabase Admin Client

### 🔴 KRİTİK SORUNLAR

#### 1. Service Role Key Eksikliğinde Sessiz Başlatma
```typescript
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
// ...
export const supabase = createClient(supabaseUrl, supabaseKey);
```
- **Risk:** Key boş string olsa bile client oluşturulur. Tüm sorguları `401 Unauthorized` ile fail eder ama runtime'da hata mesajları kafa karıştırıcı olur. Admin client boş key ile oluşturulursa RLS bypass garanti edilemez.
- **Öneri:** Key yoksa process'i başlatmayın veya en azından client'ı `null` yapıp her kullanımda kontrol edin.

### 🟡 ORTA SEVİYE SORUNLAR

#### 2. Üçlü dotenv.config Çağrısı
```typescript
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
```
- **Risk:** 3 farklı .env lokasyonu deneniyor. Bu, hangi `.env` dosyasının aktif olduğunu debug etmeyi zorlaştırır. Ayrıca `.env.local` frontend dosyasıdır ve backend'e ait `SUPABASE_SERVICE_ROLE_KEY` gibi hassas key'ler burada olmamalı.
- **Öneri:** Tek bir `.env` dosyası kullanın. Monorepo yapısında root'a koymak yerine `backend/.env` yeterli olmalı.

#### 3. `NEXT_PUBLIC_` Prefix'li Fallback
```typescript
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
```
- **Risk:** `NEXT_PUBLIC_` prefix'li değişkenler client-side'da görünür. Backend'in bunlara fallback yapması mimari karışıklık yaratır ve yanlışlıkla client key'in kullanılmasına neden olabilir.
- **Öneri:** Backend sadece `SUPABASE_URL` kullanmalı. Fallback kaldırılmalı.

---

## 📄 `cloudinary.ts` — Cloudinary Photo Management

### 🔴 KRİTİK SORUNLAR

#### 4. `any` Tip Kullanımı (2 Yer)
```typescript
} catch (error: any) {
    if (error.http_code === 404) { ... }
}
// ve
} catch (updateError: any) {
    console.warn(`...`, updateError.message);
}
```
- **Risk:** TypeScript tip güvenliği devre dışı. `error.http_code` property'si garanti değil.
- **Öneri:** 
```typescript
} catch (error: unknown) {
    const cloudinaryError = error as { http_code?: number; message?: string };
    if (cloudinaryError.http_code === 404) { ... }
}
```

### 🟡 ORTA SEVİYE SORUNLAR

#### 5. `extractPublicId` Fazla Karmaşık & Kırılgan
- **Gözlem:** ~70 satır heuristic-based parsing. Transformasyon vs klasör ayrımı hardcoded klasör isimleri (`products`, `categories`, `deleted-images`) ile yapılıyor.
- **Risk:** Yeni klasör eklendiğinde fonksiyon bozulur. Edge case'lerde yanlış public_id çıkarabilir (ör: folder adı `w_products`).
- **Öneri:** Cloudinary Admin API'sından `public_id`'yi sorgulamak veya upload sırasında `public_id`'yi DB'de saklamak daha güvenilir.

#### 6. Rate Limiting Yok — Parallel Photo Moves
```typescript
const results = await Promise.allSettled(
    photoUrls.map(url => movePhotoToDeletedFolder(url))
);
```
- **Risk:** 100+ fotoğrafı aynı anda taşımak Cloudinary API rate limitine takılabilir.
- **Öneri:** `p-limit` veya `p-queue` ile concurrency sınırlayın (max 5-10 paralel).

#### 7. Üçlü dotenv Tekrarı
- Aynı sorun `supabase.ts`'deki gibi. DRY ihlali.
- **Öneri:** Tek bir merkezi env loader modülü oluşturun.

---

## 📄 `redis.ts` — Cache Layer

### 🔴 KRİTİK SORUNLAR

#### 8. Memory Cache Sınırsız Büyüme Riski
```typescript
const memoryCache = new Map<string, { data: string; expires: number }>();
```
- **Risk:** Redis yoksa tüm cache verileri memory'de tutulur. GC interval her 1 dakikada expired key'leri temizliyor ama iki temizleme arası sınırsız veri yazılabilir. Yüksek trafikte OOM riski.
- **Öneri:** Max entry limit ekleyin:
```typescript
const MAX_MEMORY_CACHE_SIZE = 1000;
// setCache'te kontrol
if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
    // En eski entry'yi sil (LRU) veya tüm cache'i temizle
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
}
```

#### 9. Cache Poisoning — JSON.parse Unchecked
```typescript
if (data) return JSON.parse(data);
```
- **Risk:** Redis'teki veri bozulmuşsa (manual müdahale, encoding hatası) `JSON.parse` fırlatır ve request'i crashler.
- **Öneri:**
```typescript
try {
    return data ? JSON.parse(data) : null;
} catch {
    console.warn('Redis cache corrupted, ignoring:', key);
    await redis.del(key); // Bozuk veriyi temizle
    return null;
}
```

### 🟡 ORTA SEVİYE SORUNLAR

#### 10. `deleteCache` Pattern Matching — ReDoS Riski
```typescript
const regexPattern = new RegExp('^' + searchPattern.replace(/\*/g, '.*') + '$');
```
- **Risk:** Kullanıcı kontrollü input'tan regex oluşturuluyor. `.*` içeren pattern'lar backtracking'e yol açabilir (ReDoS). Ancak bu fonksiyona kullanıcı input'u doğrudan gelmiyor gibi görünüyor.
- **Bilgi:** Cache key'leri iç sistem tarafından üretildiği için gerçek risk düşük, ama defensive coding açısından:
```typescript
const regexPattern = new RegExp('^' + searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*') + '$');
```

#### 11. Redis Error Silme — `any` Kullanımı
```typescript
const deletionPromises: Promise<any>[] = [];
```
- **Öneri:** `Promise<unknown[]>[]` veya `Promise<[Error | null, unknown][] | undefined>[]` kullanın.

#### 12. `productsInvalidatedUntil` Memory Leak
```typescript
const productsInvalidatedUntil = new Map<string, number>();
```
- **Risk:** Expired entry'ler sadece okunduğunda temizleniyor. Eğer bir userId bir kez mutation yapıp bir daha sorgulanmazsa entry kalıcı olur.
- **Öneri:** GC interval'a ekleyin veya TTL bazlı otomatik temizleme yapın.

### 🟢 İYİ PRATİKLER ✅

1. **Graceful degradation:** Redis yokken memory cache fallback — doğru yaklaşım.
2. **`setProductsInvalidated`:** Mutation sonrası 5 saniyelik invalidation penceresi — race condition önleme.
3. **Production kontrolü:** `isProductKey` ile production'da memory cache kullanmama — multi-instance tutarlılık.
4. **`unref()` interval:** Process'in sadece timer için ayakta kalmasını önlüyor.
5. **TLS desteği:** Upstash gibi `rediss://` bağlantılarını destekliyor.
6. **Cache key helper'ları:** Konsistent key üretimi — collision riski düşük.

---

## 📄 `activity-logger.ts` — Activity Logging

### 🟡 ORTA SEVİYE SORUNLAR

#### 13. Loglama Sessiz Başarısızlık (Silent Failure)
```typescript
if (error) {
    console.error('[Activity Logger] Failed to log activity:', error.message)
}
```
- **Risk:** Activity log yazma hatası sadece console'a loglanıp yok sayılıyor. Kritik güvenlik olayları (account_deleted, plan_upgrade) kaybolabilir.
- **Öneri:** Kritik activity tipleri için retry mekanizması ve fallback (dosyaya yazma vb.) ekleyin.

#### 14. IP Adresi Güven Zinciri
```typescript
const xForwardedFor = req.headers['x-forwarded-for']
const ipAddress = (Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor)?.split(',')[0]
```
- **Risk:** `X-Forwarded-For` header'ını ilk eleman alınıyor. Eğer birden fazla proxy varsa, ilk eleman spoofable. `trust proxy` ayarıyla tutarlı olmalı.
- **Bilgi:** Express'in `req.ip` zaten `trust proxy` ayarına göre doğru IP'yi verir. Bu fonksiyon onu override ediyor.
- **Öneri:** `req.ip`'yi ana kaynak olarak kullanın, diğerleri fallback olsun.

### 🟢 İYİ PRATİKLER ✅

1. **Tip güvenliği:** `ActivityType` union type — geçersiz activity type'ları derleme zamanında yakalanıyor.
2. **Cache kullanımı:** Kullanıcı profili cache'ten okunuyor — performans dostu.
3. **Activity descriptions:** Türkçe açıklamalar — audit trail okunabilirliği yüksek.
4. **Non-blocking:** Activity log hatası request'i bloklamıyor — UX korunuyor.

---

## 📋 DÜZELTME ÖNCELİK TABLOSU

| # | Sorun | Dosya | Seviye | Tahmini Süre |
|---|-------|-------|--------|-------------|
| 1 | Service key sessiz başlatma | supabase.ts | 🔴 Kritik | 15 dk |
| 8 | Memory cache sınırsız büyüme | redis.ts | 🔴 Kritik | 30 dk |
| 9 | JSON.parse crash riski | redis.ts | 🔴 Kritik | 15 dk |
| 4 | `any` tip kullanımı | cloudinary.ts | 🟡 Orta | 15 dk |
| 5 | extractPublicId karmaşıklığı | cloudinary.ts | 🟡 Orta | 2 saat |
| 6 | Parallel rate limiting yok | cloudinary.ts | 🟡 Orta | 30 dk |
| 12 | productsInvalidated leak | redis.ts | 🟡 Orta | 15 dk |
| 13 | Kritik log silent failure | activity-logger.ts | 🟡 Orta | 30 dk |
| 2 | Üçlü dotenv çağrısı | supabase.ts | 🟢 Düşük | 20 dk |
| 3 | NEXT_PUBLIC fallback | supabase.ts | 🟢 Düşük | 5 dk |
