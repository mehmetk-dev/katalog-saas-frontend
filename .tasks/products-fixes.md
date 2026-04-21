# 🔧 Ürün Sistemi Düzeltme Planı

> Oluşturulma: 2026-04-21 | Durum: Bekliyor

---

## P0 — Kritik (Veri Kaybı / Güvenlik / Yanıltıcı Veri)

### 1. Frontend validation images max=10, backend schema max=20 — tutarsızlık
- **Dosya:** `lib/validations/index.ts:127` vs `backend/src/controllers/products/schemas.ts:46`
- **Sorun:** Frontend `z.array(...).max(10)` ama backend `z.array(...).max(20)`. Frontend 11+ görseli reddeder, backend kabul eder. Kullanıcı import ile 11 görsel ekleyebilir ama manuel formda 10'dan fazlasını ekleyemez.
- **Çözüm:** İki tarafı aynı değere (20) eşitle

### 2. bulkImportProducts tüm ürünleri tek seferde insert ediyor — 10k ürün = potansiyel timeout
- **Dosya:** `backend/src/controllers/products/bulk.ts:210-213`
- **Sorun:** `supabase.from('products').insert(productsToInsert).select()` — 10k ürün tek sorguda. Supabase/PostgreSQL timeout veya connection limit aşılabilir. Frontend `BULK_IMPORT_MAX_ITEMS = 5000` ama backend schema `max(10000)` kabul ediyor.
- **Çözüm:** `chunkArray` ile 100'erlik batch'ler halinde insert yap, frontend limit'ini backend ile tutarlı hale getir

### 3. getProductStats tüm ürünleri N+1 batch ile çekiyor — 10k ürün = 10 sorgu
- **Dosya:** `backend/src/controllers/products/read.ts:309-335`
- **Sorun:** `stock` ve `price` hesaplamak için tüm satırları `BATCH_SIZE=1000` ile çekiyor. 10k üründe 10 sorgu, 100k üründe 100 sorgu. Bu bir RPC ile tek sorguda yapılabilir.
- **Çözüm:** PostgreSQL aggregate RPC oluştur (`get_product_stats`) — `SUM(stock * price)`, `COUNT(*) FILTER(WHERE stock >= 10)` vb.

### 4. checkProductsInCatalogs O(n×m) karşılaştırma — büyük veride yavaş
- **Dosya:** `backend/src/controllers/products/read.ts:262-273`
- **Sorun:** Her productId için tüm catalog'ların `product_ids` array'ini `.includes()` ile tarıyor. 1000 ürün × 50 katalog = 50.000 karşılaştırma. `product_ids` JSONB array — Supabase `.contains()` ile tek sorguda yapılabilir.
- **Çözüm:** Tek bir Supabase sorgusu ile tüm eşleşmeleri bul: `select('id, name, product_ids').contains('product_ids', productIds)` → JS tarafında map'le

### 5. useProducts staleTime: Infinity — SSR initialData ile zamanında güncellenmez
- **Dosya:** `lib/hooks/use-products.ts:38`
- **Sorun:** Analitik'teki aynı sorun — `staleTime: initialData ? Infinity : 5 * 60 * 1000`. Sayfa değişikliğinde veya filtre değişikliğinde eski veri dönmeye devam eder.
- **Çözüm:** `staleTime: 5 * 60 * 1000` yap, `refetchOnMount: true`

### 6. deleteProduct sonrası catalog product_ids temizlenmiyor — dangling referans
- **Dosya:** `backend/src/controllers/products/write.ts:281-341`
- **Sorun:** Ürün silindiğinde `catalogs.product_ids` array'inden silinen ürünün ID'si çıkarılmıyor. Katalog hâlâ silinmiş ürün ID'sine referans içeriyor → builder'da "ürün bulunamadı" hatası.
- **Çözüm:** Ürün silme sonrası kullanıcının tüm catalog'larından ilgili ID'yi çıkar (RPC veya batch update ile)

---

## P1 — Önemli (Performans / Doğruluk)

### 7. allCategories her ürün listesi sorgusunda ek sorgu — gereksiz yük
- **Dosya:** `backend/src/controllers/products/read.ts:89-104`
- **Sorun:** Her `getProducts` çağrısında ayrı bir sorgu ile tüm kategorileri çekiyor. Bu veri sadece filtre dropdown'ı için lazım ve çok sık değişmez.
- **Çözüm:** Kategorileri ayrı bir cache'li endpoint'a taşı, veya `select !== 'id'` koşulunda bile her seferinde çekme — client tarafında `allCategories`'i ayrı bir hook ile çek

### 8. getProducts 4 sıralama (order) uygulanıyor — gereksiz sort yükü
- **Dosya:** `backend/src/controllers/products/read.ts:51-62`
- **Sorun:** `sortBy` + `display_order` + `created_at` + `id` — 4 farklı `order()` çağrısı. PostgreSQL her biri için ayrı sort yapıyor. `id` ile sıralama gereksiz (tie-breaker değil, deterministik değil).
- **Çözüm:** Sadece `sortBy` + tek bir tie-breaker (örn. `created_at`) kullan, `id` sıralamasını kaldır

### 9. updateProduct `updated_at` JS tarafında üretiliyor — timezone/senkronizasyon riski
- **Dosya:** `backend/src/controllers/products/write.ts:233`
- **Sorun:** `updated_at: new Date().toISOString()` — Node.js sunucunun saatini kullanıyor. PostgreSQL `CURRENT_TIMESTAMP` ile tutarsız olabilir (farklı sunucular, timezone farkı).
- **Çözüm:** `updated_at`'ı PostgreSQL trigger'ı ile otomatik yönet (zaten `update_updated_at_column` fonksiyonu var), veya en azından Supabase update'den çıkar

### 10. bulkUpdatePrices her ürün için ayrı UPDATE sorgusu — N sorgu
- **Dosya:** `backend/src/controllers/products/bulk.ts:346-367`
- **Sorun:** 1000 ürün seçili = 1000 ayrı `supabase.update()` çağrısı. PostgreSQL `UPDATE ... FROM (VALUES ...)` ile tek sorguda yapılabilir.
- **Çözüm:** RPC fonksiyonu ile toplu fiyat güncelleme yap, veya en azından batch'leri daha büyük tut (UPDATE_BATCH_SIZE=50 → 200)

### 11. reorderProducts her ürün için ayrı UPDATE — N sorgu
- **Dosya:** `backend/src/controllers/products/bulk.ts:254-270`
- **Sorun:** `REORDER_BATCH_SIZE=200` ama her item için ayrı `supabase.update()` — 200 ürün = 200 UPDATE sorgusu.
- **Çözüm:** PostgreSQL `UPDATE products SET display_order = data.order FROM (VALUES ...) AS data(id, order) WHERE products.id = data.id::uuid` — tek sorgu

### 12. productCreateSchema frontend'de `images.max(10)`, backend'de `max(20)` — tutarsız
- **Dosya:** `lib/validations/index.ts:127` vs `backend/src/controllers/products/schemas.ts:41-46`
- **Sorun:** Frontend 10'dan fazla görseli reddeder ama backend 20'ye kadar kabul eder. Ayrıca frontend `safeUrl` ile image_url doğrularken backend `trustedImageUrl` ile doğruluyor — farklı kurallar.
- **Çözüm:** Ortak bir constant tanımla (`MAX_PRODUCT_IMAGES = 20`), her iki tarafı da buna bağla

### 13. bulkDeleteProducts — silinen ürünlerin catalog referansları temizlenmiyor
- **Dosya:** `backend/src/controllers/products/bulk.ts:60-134`
- **Sorun:** #6 ile aynı sorun ama toplu silme için. 100 ürün silindiğinde 100 catalog referansı dangling kalıyor.
- **Çözüm:** Bulk silme sonrası tüm affected catalog'lardan silinen ID'leri çıkar

### 14. handleDuplicate hardcoded Türkçe string — "KopyasÄ±" (encoding hatası)
- **Dosya:** `components/products/table/hooks/use-products-table.ts:106`
- **Sorun:** `${product.name} (KopyasÄ±)` — "ı" harfi bozuk. UTF-8 encoding sorunu. Ayrıca i18n kullanılmıyor.
- **Çözüm:** `t("products.copy", { name: product.name })` ile çeviriden çek, i18n key ekle

### 15. handleDuplicate `onDeleted('')` ile parent refresh tetikliyor — kötü isimlendirme
- **Dosya:** `components/products/table/hooks/use-products-table.ts:119`
- **Sorun:** Kopyalama başarılı olduktan sonra `onDeleted('')` çağrılıyor — bu isim kafa karıştırıcı, aslında bir silme değil "refresh" anlamında.
- **Çözüm:** `onRefresh` veya `onMutationComplete` gibi daha açık bir callback ismi kullan

---

## P2 — Orta (Kod Kalitesi / UX)

### 16. priceRange default [0, 100000] — düşük fiyatlı ürünlerde filtre çalışmaz
- **Dosya:** `components/products/hooks/use-products-page-state.ts:56`
- **Sorun:** `priceRange` sabit `[0, 100000]` ile başlıyor. Ürün fiyatları 0-5000 arasındaysa slider'ın tamamı kullanılamaz. Ayrıca 100000 üstü fiyatlar filtrelenemez.
- **Çözüm:** `priceStats.max`'a göre dinamik range başlat, veya backend'den min/max fiyat dön

### 17. getAllProductIds while(true) döngüsü — sonsuz döngü riski
- **Dosya:** `lib/actions/products.ts:567-579`
- **Sorun:** `while (true)` ile sayfalama yapıyor. Eğer backend hep aynı `totalPages` dönerse sonsuz döngüye girer. Güvenlik sınırı yok.
- **Çözüm:** Maksimum iterasyon sayısı ekle (örn. `maxPages = 100`), veya RPC ile tek sorguda tüm ID'leri çek

### 18. productModal 500ms DB consistency wait — hack
- **Dosya:** `components/products/modals/product-modal.tsx:144`
- **Sorun:** `await new Promise((r) => setTimeout(r, 500))` — update sonrası DB'nin güncellenmesini beklemek için. Bu race condition'ı gizler, garanti etmez.
- **Çözüm:** Backend update endpoint'ini güncel ürün verisini döndürecek şekilde değiştir (`RETURNING *`), frontend bekleme yerine dönen veriyi kullan

### 19. bulkImportProducts frontend limit 5000, backend schema 10000 — tutarsız
- **Dosya:** `lib/actions/products.ts:280` vs `backend/src/controllers/products/schemas.ts:101`
- **Sorun:** Frontend `BULK_IMPORT_MAX_ITEMS = 5000` ama backend `max(10000)` kabul ediyor. Kullanıcı 7500 ürün import etmeye çalışırsa frontend reddeder ama direkt API'ye istek yapılırsa backend kabul eder.
- **Çözüm:** Her iki tarafı aynı değere eşitle (5000 veya 10000)

### 20. searchParams Promise olarak alınıyor — Next.js 16 uyumu ama tip güvensiz
- **Dosya:** `app/dashboard/products/page.tsx:20-22`
- **Sorun:** `searchParams: Promise<{...}>` — Next.js 16'da doğru ama `await searchParams` sonrası tip güvenliği yok (string|undefined). `Number.parseInt` NaN dönebilir.
- **Çözüm:** Zod ile searchParams'ı validate et (backend'deki `productsQuerySchema` gibi)

---

## İlerleme Takibi

| # | Durum | Not |
|---|-------|-----|
| 1 | ⬜ | |
| 2 | ⬜ | |
| 3 | ⬜ | |
| 4 | ⬜ | |
| 5 | ⬜ | |
| 6 | ⬜ | |
| 7 | ⬜ | |
| 8 | ⬜ | |
| 9 | ⬜ | |
| 10 | ⬜ | |
| 11 | ⬜ | |
| 12 | ⬜ | |
| 13 | ⬜ | |
| 14 | ⬜ | |
| 15 | ⬜ | |
| 16 | ⬜ | |
| 17 | ⬜ | |
| 18 | ⬜ | |
| 19 | ⬜ | |
| 20 | ⬜ | |

---

## Değiştirilecek Dosyalar (Tahmini)

| Dosya | İlgili Fix'ler |
|-------|---------------|
| `backend/src/controllers/products/read.ts` | #3, #4, #7, #8 |
| `backend/src/controllers/products/write.ts` | #6, #9 |
| `backend/src/controllers/products/bulk.ts` | #2, #10, #11, #13 |
| `backend/src/controllers/products/schemas.ts` | #1, #12, #19 |
| `lib/validations/index.ts` | #1, #12 |
| `lib/hooks/use-products.ts` | #5 |
| `lib/actions/products.ts` | #17, #19 |
| `components/products/table/hooks/use-products-table.ts` | #14, #15 |
| `components/products/modals/product-modal.tsx` | #18 |
| `components/products/hooks/use-products-page-state.ts` | #16 |
| `app/dashboard/products/page.tsx` | #20 |
| `supabase/migrations/` | #3 (RPC), #6 (trigger/RPC) |
