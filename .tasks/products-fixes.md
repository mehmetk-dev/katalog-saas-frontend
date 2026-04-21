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
- **Sorun:** Her productId için tüm catalog'ların `product_ids` array'ini `.includes()` ile tarıyor. 1000 ürün × 50 katalog = 50.000 karşılaştırma. `product_ids` `uuid[]` (dizi) — JSONB değil.
- **Çözüm:** Supabase PostgreSQL `overlaps()` (dizi operatorü) ile tek sorguda eşleşen catalog'ları bul: `select('id, name, product_ids').overlaps('product_ids', productIds)` → JS tarafında map'le. Alternatif: birden fazla `.or()` + `.cs('product_ids', [id])` yerine toplu sorgu

### 5. useProducts staleTime: Infinity — SSR initialData ile zamanında güncellenmez
- **Dosya:** `lib/hooks/use-products.ts:38`
- **Sorun:** Analitik'teki aynı sorun — `staleTime: initialData ? Infinity : 5 * 60 * 1000`. Sayfa değişikliğinde veya filtre değişikliğinde eski veri dönmeye devam eder.
- **Çözüm:** `staleTime: 5 * 60 * 1000` yap, `refetchOnMount: true`

### 6. deleteProduct sonrası catalog product_ids temizlenmiyor — dangling referans
- **Dosya:** `backend/src/controllers/products/write.ts:281-341`
- **Sorun:** Backend kodunda ürün silme sonrası `catalogs.product_ids` cleanup yok. Ancak `supabase/migrations/product_catalog_cleanup.sql` içinde `remove_product_from_catalogs()` trigger fonksiyonu ve `on_product_deleted` trigger tanımı mevcut — **eğer bu migration üretim DB'ye uygulandıysa** sorun trigger ile çözülür. Kod seviyesinde cleanup eksikliği hâlâ risk.
- **Çözüm:** Migration'ı DB'ye uygula (henüz yapılmadıysa). Alternatif: backend delete handler'a catalog cleanup RPC'si ekle.

---

## P1 — Önemli (Performans / Doğruluk)

### 7. allCategories her ürün listesi sorgusunda ek sorgu — gereksiz yük
- **Dosya:** `backend/src/controllers/products/read.ts:89-104`
- **Sorun:** Her `getProducts` çağrısında ayrı bir sorgu ile tüm kategorileri çekiyor. Bu veri sadece filtre dropdown'ı için lazım ve çok sık değişmez.
- **Çözüm:** Kategorileri ayrı bir cache'li endpoint'a taşı, veya `select !== 'id'` koşulunda bile her seferinde çekme — client tarafında `allCategories`'i ayrı bir hook ile çek

### 8. getProducts birden fazla `order()` çağrısı — sadeleştirilebilir
- **Dosya:** `backend/src/controllers/products/read.ts:51-62`
- **Sorun:** `sortBy` + `display_order` + `created_at` + `id` — 4 `order()` çağrısı. PostgreSQL bunları tek `ORDER BY` zincirine çevirir, dolayısıyla 4 ayrı "sort yükü" oluşmaz. Ancak `id` ile sıralama gereksiz (tie-breaker değil, deterministik değil) ve kod kalitesini düşürür.
- **Çözüm:** Sadece `sortBy` + tek bir tie-breaker (örn. `created_at`) kullan, `id` sıralamasını kaldır

### 9. updateProduct `updated_at` JS tarafında üretiliyor — timezone/senkronizasyon riski
- **Dosya:** `backend/src/controllers/products/write.ts:233`
- **Sorun:** `updated_at: new Date().toISOString()` — Node.js sunucunun saatini kullanıyor. PostgreSQL `CURRENT_TIMESTAMP` ile tutarsız olabilir (farklı sunucular, timezone farkı). Repo içinde `products` tablosu için `update_updated_at_column` trigger'ı net olarak görünmüyor.
- **Çözüm:** `updated_at`'ı PostgreSQL trigger'ı ile otomatik yönet ve backend update payload'ından çıkar. Eğer trigger yoksa migration ekle.

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

---

## P0.5 — Yüksek (Doğruluk / Davranış Hatası) — Doğrulamada Atlananlar

### 16. handleDuplicate `onDeleted('')` davranış hatası üretiyor (isimlendirme de hatalı)
- **Dosya:** `components/products/table/hooks/use-products-table.ts:119` + `components/products/hooks/use-products-bulk-actions.ts:91`
- **Sorun:** Kopyalama başarılı olduktan sonra `onDeleted('')` çağrılıyor. Parent `handleProductDeleted('')` içinde `products.filter((p) => p.id !== '')` hiçbir ürünü filtrelemez (boş string eşleşmez), ama `adjustMetadataTotal(-1)` çalışır. Sonuç: **total 1 eksik gözükür, hiçbir ürün silinmemiştir**.
- **Çözüm:** `onDeleted` yerine `onRefresh` veya `onMutationComplete` callback'i kullan. Duplicate sonrası `handleProductSaved(newProduct)` çağrısı yap, metadata total artır.

### 17. priceRange ve stockFilter UI state "ghost" — gerçek filtreleme uygulanmıyor
- **Dosya:** `components/products/hooks/use-products-page-derived.ts:49`
- **Sorun:** `priceRange` ve `stockFilter` state'leri tanımlı (`use-products-page-state.ts:56`), `hasActiveFilters` içinde kontrol ediliyor, ama `paginatedProducts = products` (filtreleme yok). Kullanıcı slider/ dropdown kullanır ama ürün listesi değişmez.
- **Çözüm:** `useProductsPageDerived` içinde `priceRange` ve `stockFilter`'a göre `products.filter(...)` uygula. Veya eğer backend pagination kullanılıyorsa filtre parametrelerini `getProducts` query'ine ekle.

---

## P2 — Orta (Kod Kalitesi / UX)

### 19. priceRange default [0, 100000] — düşük fiyatlı ürünlerde slider verimsiz
- **Dosya:** `components/products/hooks/use-products-page-state.ts:56`
- **Sorun:** `priceRange` sabit `[0, 100000]` ile başlıyor. Ürün fiyatları 0-5000 arasındaysa slider'ın tamamı kullanılamaz. Ayrıca 100000 üstü fiyatlar filtrelenemez.
- **Çözüm:** `priceStats.max`'a göre dinamik range başlat, veya backend'den min/max fiyat dön

### 20. getAllProductIds while(true) döngüsü — stil riski
- **Dosya:** `lib/actions/products.ts:567-579`
- **Sorun:** `while (true)` ile sayfalama yapıyor. Break koşulu (`page >= totalPages`) nedeniyle pratikte sonsuz döngü olasılığı düşük, ama stil olarak riskli.
- **Çözüm:** Maksimum iterasyon sayısı ekle (örn. `maxPages = 100`), veya RPC ile tek sorguda tüm ID'leri çek

### 21. productModal 500ms DB consistency wait — hack
- **Dosya:** `components/products/modals/product-modal.tsx:144`
- **Sorun:** `await new Promise((r) => setTimeout(r, 500))` — update sonrası DB'nin güncellenmesini beklemek için. Bu race condition'ı gizler, garanti etmez.
- **Çözüm:** Backend update endpoint'ini güncel ürün verisini döndürecek şekilde değiştir (`RETURNING *`), frontend bekleme yerine dönen veriyi kullan

### 22. bulkImportProducts frontend limit 5000, backend schema 10000 — tutarsız
- **Dosya:** `lib/actions/products.ts:280` vs `backend/src/controllers/products/schemas.ts:101`
- **Sorun:** Frontend `BULK_IMPORT_MAX_ITEMS = 5000` ama backend `max(10000)` kabul ediyor. Kullanıcı 7500 ürün import etmeye çalışırsa frontend reddeder ama direkt API'ye istek yapılırsa backend kabul eder.
- **Çözüm:** Her iki tarafı aynı değere eşitle (5000 veya 10000)

### 23. searchParams Promise olarak alınıyor — Next.js 16 uyumlu, clamp/allowlist var
- **Dosya:** `app/dashboard/products/page.tsx:20-22`
- **Sorun:** `searchParams: Promise<{...}>` — Next.js 16'da doğru. Mevcut kodda `Number.isFinite` + `> 0` clamp ve `PRODUCTS_PAGE_SIZE_OPTIONS.includes` allowlist var, dolayısıyla tamamen güvensiz değil. Ancak `Number.parseInt` NaN dönebilir ve tip güvenliği zayıf.
- **Çözüm:** Zod ile searchParams'ı validate et (backend'deki `productsQuerySchema` gibi) — mevcut koruyucuların üzerine ek güvenlik katmanı

---

## İlerleme Takibi

| # | Durum | Not |
|---|-------|-----|
| 1 | ✅ | FE max(10)→max(20), MAX_PRODUCT_IMAGES constant eklendi |
| 2 | ✅ | chunkArray ile DB_CHUNK_SIZE=100 batch insert |
| 3 | ✅ | get_product_stats RPC migration + backend tek sorgu |
| 4 | ✅ | overlaps() ile DB-seviye filtreleme, O(n×m)→tek sorgu |
| 5 | ✅ | staleTime Infinity → 5dk, refetchOnMount: true |
| 6 | ✅ | deleteProduct sonrası remove_product_from_catalogs RPC çağrısı eklendi |
| 7 | ✅ | allCategories ayrı cache key + 4x TTL ile cache'lendi |
| 8 | ✅ | .order('id') kaldırıldı, sortBy + created_at yeterli |
| 9 | ✅ | JS updated_at kaldırıldı, PostgreSQL trigger migration eklendi |
| 10 | ✅ | bulk_update_product_prices RPC ile tek sorgu |
| 11 | ✅ | bulk_reorder_products RPC ile tek sorgu |
| 12 | ✅ | Ortak MAX_PRODUCT_IMAGES constant ile çözüldü (#1 ile birlikte) |
| 13 | ✅ | bulkDeleteProducts sonrası catalog cleanup eklendi (#6 ile aynı RPC) |
| 14 | ✅ | i18n key eklendi, encoding düzeltildi |
| 15 | ✅ | #16 ile birleştirildi (onSaved callback) |
| 16 | ✅ | onDeleted('') → onSaved(newProduct), metadata total artırılıyor |
| 17 | ✅ | priceRange/stockFilter filtreleme artık uygulanıyor |
| 18 | ✅ | (eski #16 slot, #16'ya taşındı) |
| 19 | ✅ | priceRange [0,100000] → dinamik maxPrice ile başlatılıyor |
| 20 | ✅ | while(true) → while(page<=maxPages), maxPages=100 |
| 21 | ✅ | setTimeout hack kaldırıldı, BE .select().single() + FE returned product |
| 22 | ✅ | FE BULK_IMPORT_MAX_ITEMS 5000→10000, BE ile eşitlendi |
| 23 | ✅ | Zod searchParamsSchema ile tip-güvenli parse eklendi |

---

## Doğrulama Özeti

| Kategori | Sayı | Durum |
|----------|------|-------|
| **Kesin Doğru** | 10 | Kodda doğrulanmış, değişiklik gerekiyor |
| **Kısmen Doğru** | 6 | Ana tespit doğru, teknik detay/öneride düzeltme yapıldı |
| **Atlanan Kritik** | 2 | Doğrulamada yoktu, kodda gerçek ve ciddi |

---

## Değiştirilecek Dosyalar (Tahmini)

| Dosya | İlgili Fix'ler |
|-------|---------------|
| `backend/src/controllers/products/read.ts` | #3, #4, #7, #8 |
| `backend/src/controllers/products/write.ts` | #6, #9 |
| `backend/src/controllers/products/bulk.ts` | #2, #10, #11, #13 |
| `backend/src/controllers/products/schemas.ts` | #1, #12, #22 |
| `lib/validations/index.ts` | #1, #12 |
| `lib/hooks/use-products.ts` | #5 |
| `lib/actions/products.ts` | #20, #22 |
| `components/products/table/hooks/use-products-table.ts` | #14, #16 |
| `components/products/hooks/use-products-bulk-actions.ts` | #16 |
| `components/products/hooks/use-products-page-derived.ts` | #17 |
| `components/products/hooks/use-products-page-state.ts` | #18, #19 |
| `components/products/modals/product-modal.tsx` | #21 |
| `app/dashboard/products/page.tsx` | #23 |
| `supabase/migrations/` | #3 (RPC), #6 (trigger/RPC), #9 (trigger) |
