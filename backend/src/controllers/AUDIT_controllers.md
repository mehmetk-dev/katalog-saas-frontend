# 🔍 Audit Raporu: `backend/src/controllers/`

> **Tarih:** 28 Şubat 2026  
> **Denetçi:** Senior Security & Performance Architect  
> **Kapsam:** products.ts · products/* · catalogs.ts · catalogs/* · users.ts · notifications.ts

---

## 📄 `controllers/products/` — Ürün Yönetimi

### 📁 `products/read.ts`

#### 🔴 KRİTİK SORUNLAR

##### 1. getProducts — N+1 Sorgu Paterni (Kategori Fetch)
```typescript
// Ana sorgu
const { data, error, count } = await query...

// İkinci sorgu — TÜM kategorileri çek
const { data: categoryData } = await supabase
    .from('products')
    .select('category')
    .eq('user_id', userId)
    .not('category', 'is', null)
    .not('category', 'eq', '');
```
- **Risk:** Her getProducts çağrısında 2 ayrı DB sorgusu yapılıyor. Kategori listesi ürün sayısından bağımsız olarak TÜM ürünleri tarıyor.
- **Öneri:** Kategorileri ayrı bir endpoint'e taşıyın ve cache'leyin. Veya `DISTINCT category` SQL sorgusu kullanın (Supabase RPC ile).

##### 2. getProductStats — Waterfall Batch Fetching
```typescript
for (let batch = 0; batch < totalBatches; batch++) {
    const { data } = await supabase.from('products').select('stock, price')...
}
```
- **Risk:** 10K ürün × 1000 batch = 10 ardışık DB sorgusu (waterfall). Her biri 50-100ms = 500ms-1s toplam.
- **Öneri:** Tek bir Supabase RPC fonksiyonu ile aggregate edin:
```sql
SELECT 
    COUNT(*) FILTER (WHERE stock >= 10) as in_stock,
    COUNT(*) FILTER (WHERE stock > 0 AND stock < 10) as low_stock,
    COUNT(*) FILTER (WHERE stock = 0) as out_of_stock,
    COALESCE(SUM(stock * price), 0) as total_value
FROM products WHERE user_id = $1;
```

#### 🟡 ORTA SEVİYE SORUNLAR

##### 3. Image URL http→https Dönüşümü Her Render'da
```typescript
if (imgUrl && imgUrl.startsWith('http://') && !imgUrl.includes('localhost')) {
    imgUrl = imgUrl.replace('http://', 'https://');
}
```
- **Risk:** Bu kontrol performans sorunu yaratmaz ama migration script ile DB'deki tüm URL'leri bir kere düzeltmek daha temiz olur. Her istekte tekrarlanan dönüşüm gereksiz işlem.
- **Öneri:** Bir migration script çalıştırıp DB'deki tüm `http://` URL'leri `https://` ile değiştirin.

##### 4. `checkProductsInCatalogs` — O(N×M) Döngü
```typescript
for (const productId of productIds) {
    const catalogsContaining = catalogs?.filter(c =>
        c.product_ids?.includes(productId)
    )...
}
```
- **Risk:** N product × M catalog inner loop. 1000 ürün × 100 katalog = 100K iteration.
- **Öneri:** Product ID'lerini Set'e alıp lookup yapın, veya bu işlemi DB tarafında gerçekleştirin.

---

### 📁 `products/write.ts`

#### 🟢 İYİ PRATİKLER ✅
1. **Zod validation:** `createProductSchema` ve `updateProductSchema` ile giriş doğrulama.
2. **Plan limit kontrolü:** Ürün oluşturmadan önce plan limiti kontrol ediliyor.
3. **Cache invalidation:** Mutation sonrası cache temizleniyor ve `setProductsInvalidated` çağrılıyor.
4. **Photo cleanup:** Silme sırasında Cloudinary'den fotoğraflar taşınıyor.
5. **Activity logging:** Tüm CRUD operasyonları loglanıyor.
6. **`normalizeCoverAndImages`:** Cover ve images tutarlılığı sağlanıyor.

#### 🟡 DÜŞÜK SEVİYE

##### 5. `deleteProduct` — Silme Onayı Yok
- **Gözlem:** Tek seferde ürün silinebiliyor, geri dönüş yok.
- **Öneri:** Soft delete (is_deleted flag) veya "çöp kutusu" mekanizması düşünün.

---

### 📁 `products/bulk.ts`

#### 🔴 KRİTİK SORUNLAR

##### 6. `reorderProducts` — N Ayrı DB Güncelleme (N+1)
```typescript
const updatePromises = order.map(item =>
    supabase.from('products').update({ display_order: item.order })
        .eq('id', item.id).eq('user_id', userId)
);
await Promise.all(updatePromises);
```
- **Risk:** 500 ürün sıralaması = 500 ayrı UPDATE sorgusu. Her biri 10-20ms = 5-10 saniye.
- **Öneri:** Supabase RPC ile batch update fonksiyonu kullanın:
```sql
CREATE OR REPLACE FUNCTION batch_update_display_order(
    p_user_id UUID,
    p_updates JSONB -- [{"id": "...", "order": 1}, ...]
) RETURNS void AS $$
BEGIN
    UPDATE products SET display_order = (u->>'order')::int
    FROM jsonb_array_elements(p_updates) AS u
    WHERE products.id = (u->>'id')::uuid AND products.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

##### 7. `bulkUpdatePrices` — N Fetch + N Update (2N Sorgu)
```typescript
// N fetch sorgusu (chunk)
const fetchResults = await Promise.all(idChunks.map(chunk => ...));
// N update sorgusu (her ürün ayrı)
const updatePromises = priceUpdates.map(update => ...);
```
- **Risk:** 1000 ürün fiyat güncelleme = 10 fetch + 1000 update = 1010 DB sorgusu.
- **Öneri:** Fiyat hesaplamasını SQL'de yapın:
```sql
UPDATE products SET price = GREATEST(0, ROUND(
    CASE WHEN change_mode = 'percentage' THEN
        CASE WHEN change_type = 'increase' THEN price * (1 + amount/100)
             ELSE price * (1 - amount/100) END
    ELSE
        CASE WHEN change_type = 'increase' THEN price + amount
             ELSE price - amount END
    END, 2))
WHERE id = ANY($1) AND user_id = $2;
```

##### 8. `deleteCategoryFromProducts` — N Update + ilike Kullanımı
```typescript
const { data: products } = await supabase.from('products')
    .select('*').eq('user_id', userId)
    .ilike('category', `%${sanitizedCategoryName}%`);

const updatePromises = categoryUpdates.map(({ id, newCategory }) =>
    supabase.from('products').update({ category: newCategory })...
);
```
- **Risk:** `select('*')` + N ayrı update. Tüm ürün verileri çekilip tekrar yazılıyor.
- **Bilgi:** `renameCategory` zaten RPC kullanıyor, `deleteCategory` da aynı yaklaşımla yapılmalı.

#### 🟡 ORTA SEVİYE

##### 9. Reorder Hatasında Stack Trace Sızdırma
```typescript
res.status(500).json({ success: false, message: 'Sıralama kaydedilemedi', error: errorMessage });
```
- **Risk:** `error` alanı client'a gönderiliyor. Diğer controller'larda `{ error: message }` kullanılıyor, burada tutarsız.
- **Öneri:** İç hata detayını client'a göndermeyin.

---

### 📁 `products/schemas.ts`

#### 🟢 İYİ PRATİKLER ✅
1. **Trusted image host kontrolü:** `ALLOWED_IMAGE_HOSTS` whitelist — SSRF koruması.
2. **UUID validation:** Regex ile UUID formatı doğrulanıyor.
3. **Array size limitleri:** Bulk operation'larda max item sayısı (`max(10000)`, `max(5000)` vb.).
4. **`.strip()`:** Bilinmeyen alanlar otomatik temizleniyor — mass assignment koruması.
5. **Price/stock range:** Mantıklı üst limitler (1B, 10M).

#### ℹ️ NOT
- `updateProductSchema`'da `price` alanı `z.union([z.number(), z.string()])` kabul ediyor. Bu CSV import esnekliği için olabilir ama runtime'da unexpected behavior yaratabilir. `.transform(Number)` eklenerek normalize edilmeli.

---

### 📁 `products/media.ts`

#### 🟡 ORTA SEVİYE

##### 10. `deletePhotosFromSupabase` — `error: any`
```typescript
} catch (error: any) {
    console.error('[deletePhotosFromSupabase] Exception deleting photos:', error);
```
- **Öneri:** `error: unknown` kullanın.

#### 🟢 İYİ PRATİKLER
1. **Storage provider abstraction:** `resolveStorageProvider()` ile Cloudinary/Supabase ayrımı.
2. **Dedup:** `collectProductPhotoUrls` Set kullanarak tekrar eden URL'leri engelliyor.
3. **Graceful failure:** Fotoğraf silme hatası ürün silmeyi engellemiyor.

---

### 📁 `products/helpers.ts`

#### 🟢 SORUN YOK
- Temiz, minimal helper. `AuthenticatedRequest` interface kullanımı doğru.

---

## 📄 `controllers/catalogs/` — Katalog Yönetimi

### 📁 `catalogs/read.ts`

#### 🟡 ORTA SEVİYE

##### 11. `getCatalog` — İç İçe Cache Çağrıları (Waterfall)
```typescript
const data = await getOrSetCache(cacheKey, ...);
const allCatalogs = await getOrSetCache(...);
const plan = await getUserPlan(userId);
```
- **Risk:** 3 ardışık cache/DB çağrısı. Bunlar bağımsız olduğu için paralel yapılabilir.
- **Öneri:**
```typescript
const [data, allCatalogs, plan] = await Promise.all([
    getOrSetCache(cacheKey, ...),
    getOrSetCache(cacheKeys.catalogs(userId), ...),
    getUserPlan(userId)
]);
```

##### 12. `getCatalogs` — Cache Kullanılmıyor
```typescript
const { data, error } = await supabase.from('catalogs').select('*')...
```
- **Risk:** Her çağrıda doğrudan DB sorgusu. Diğer read operasyonları cache kullanırken burada yok.
- **Öneri:** `getOrSetCache` ile sarın.

---

### 📁 `catalogs/write.ts`

#### 🟡 ORTA SEVİYE

##### 13. `updateCatalog` — Bypass Riski: `req.body` Direkt Kullanım
```typescript
const parsed = catalogUpdateSchema.safeParse(req.body);
// ...
...pickDefinedFields(req.body, FIELDS_WITH_NULL_CHECK, FIELDS_WITHOUT_NULL_CHECK),
```
- **Risk:** Zod validation yapılıyor ama `pickDefinedFields` orijinal `req.body`'den okuyor, `parsed.data`'dan değil. Eğer schema'da `.strip()` kullanılmışsa Zod ekstra alanları temizler ama `req.body` temizlenmemiş veriyi içerir. Saldırgan `is_published: true` gibi extra field gönderebilir.
- **Öneri:** `pickDefinedFields`'i `parsed.data` üzerinden çalıştırın:
```typescript
const updateData = {
    updated_at: new Date().toISOString(),
    ...pickDefinedFields(parsed.data, FIELDS_WITH_NULL_CHECK, FIELDS_WITHOUT_NULL_CHECK),
};
```

##### 14. `createCatalog` — Aynı Sorun
```typescript
for (const key of INSERT_OPTIONAL_FIELDS) {
    if (req.body[key] !== undefined) {
        insertData[key] = req.body[key]; // ← raw body
    }
}
```
- **Risk:** Zod validate etmiş `parsed.data` yerine `req.body` kullanılıyor. Schema'da tanımlı olmayan alanlar insert'e sızabilir.
- **Öneri:** `req.body` yerine `parsed.data` kullanın.

##### 15. `deleteCatalog` — Ürün Fotoğrafları Temizlenmiyor
- **Gözlem:** Katalog silinirken sadece DB kaydı siliniyor. Kataloğa ait kapak görseli (`cover_image_url`) Cloudinary'de kalıyor.
- **Öneri:** `cover_image_url` varsa Cloudinary cleanup ekleyin.

---

### 📁 `catalogs/publish.ts`

#### 🟡 ORTA SEVİYE

##### 16. `is_published` Input Validation Yok
```typescript
const { is_published }: { is_published: boolean } = req.body;
```
- **Risk:** Body'den gelen `is_published` boolean olarak assume ediliyor ama doğrulanmıyor. String "true", sayı 1 vb. geçebilir.
- **Öneri:** `catalogPublishSchema` (schemas.ts'de zaten var) kullanın:
```typescript
const parsed = catalogPublishSchema.safeParse(req.body);
```

---

### 📁 `catalogs/public.ts`

#### 🔴 KRİTİK SORUNLAR

##### 17. MD5 Hash — Kriptografik Zayıflık
```typescript
const visitorHash = crypto.createHash('md5').update(`${ip}-${userAgent}`).digest('hex');
```
- **Risk:** MD5 collision-prone. İki farklı visitor aynı hash'e düşebilir. Bu analytics accuracy'yi etkiler.
- **Öneri:** SHA-256 kullanın:
```typescript
crypto.createHash('sha256').update(`${ip}-${userAgent}`).digest('hex');
```

##### 18. Public Catalog — XSS Riski (Product Data)
- **Gözlem:** Ürün verileri (name, description, custom_attributes) olduğu gibi döndürülüyor. Frontend'de render edilirken XSS koruması frontend'in sorumluluğunda.
- **Risk:** Eğer bir ürün adına `<script>` tag'ı enjekte edilmişse ve frontend `dangerouslySetInnerHTML` kullanıyorsa XSS oluşur.
- **Bilgi:** Backend API olarak bu kabul edilebilir ama defense-in-depth için output encoding düşünülebilir.

#### 🟡 ORTA SEVİYE

##### 19. `productIds` String Parsing — Edge Case
```typescript
if (typeof productIds === 'string') {
    productIds = (productIds as string).replace('{', '').replace('}', '').split(',')...
}
```
- **Risk:** PostgreSQL array notation (`{uuid1,uuid2}`) parsing'i fragile. Eğer UUID içinde `{` veya `}` varsa (ki UUID'de olmaz ama) bozulur. Ayrıca boş string'ler filter edilmiyor.
- **Öneri:** Supabase JS client zaten array'leri JSON array olarak döndürür. Bu check gereksiz olabilir — validasyon ekleyin.

##### 20. Owner Detection'da Auth API Call
```typescript
const { data: { user: authUser } } = await supabase.auth.getUser(token);
```
- **Risk:** Public endpoint'te opsiyonel auth kontrolü için Supabase API call yapılıyor. Auth middleware'deki aynı performans sorunu.
- **Öneri:** JWT'yi lokal verify edin (auth.ts audit'indeki öneri ile aynı).

---

### 📁 `catalogs/stats.ts`

#### 🟡 ORTA SEVİYE

##### 21. Dashboard Stats — Birden Fazla DB Sorgusu
```typescript
const [catalogsResult, productsResult] = await Promise.all([...]);
// ... sonra:
const { data: periodViewRows } = await supabase.from('catalog_views')...
// ... sonra:
const { data: vCount } = await supabase.rpc('get_unique_visitors_multi', ...);
```
- **Risk:** 3-4 ardışık DB sorgusu grubu. İlk grup paralel ama geri kalanı sequential.
- **Öneri:** Tüm bağımsız sorguları tek bir `Promise.all` altında birleştirin. Veya tüm stats hesaplamasını bir RPC fonksiyonuna taşıyın.

##### 22. Cache Kullanılmıyor
- **Gözlem:** Stats endpoint cache kullanmıyor. Her sayfa açılışında tüm veriler yeniden hesaplanıyor.
- **Öneri:** `getOrSetCache` ile 60-120 saniyelik TTL ekleyin.

---

### 📁 `catalogs/helpers.ts`

#### 🟢 İYİ PRATİKLER ✅
1. **`turkishToSlug`:** Türkçe karakter dönüşümü düzgün.
2. **`generateShareSlug`:** Timestamp tabanlı uniqueness — collision riski düşük.
3. **`pickDefinedFields`:** Null-check ve undefined-check ayrımı — doğru yaklaşım.

---

### 📁 `catalogs/schemas.ts`

#### 🟢 İYİ PRATİKLER ✅
1. **Slug regex validation:** `^[a-z0-9-]+$` — injection koruması.
2. **`.strip()`:** Mass assignment koruması.
3. **Max length'ler:** Tüm string alanlarında max length tanımlı.

---

## 📄 `controllers/users.ts` — Kullanıcı Yönetimi

### 🔴 KRİTİK SORUNLAR

##### 23. `getMe` — 3 Ardışık DB Sorgusu (Waterfall)
```typescript
let { data: profile } = await supabase.from('users')...
const { count: productsCount } = await supabase.from('products')...
const { count: catalogsCount } = await supabase.from('catalogs')...
```
- **Risk:** 3 sequential DB call. Her biri 20-50ms = 60-150ms toplam.
- **Öneri:**
```typescript
const [profileResult, productsCountResult, catalogsCountResult] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('catalogs').select('id', { count: 'exact', head: true }).eq('user_id', userId)
]);
```

##### 24. `incrementExportsUsed` — CAS Loop Sonsuz İstek Riski
```typescript
for (let attempt = 0; attempt < 3; attempt++) {
    const { data: profile } = await supabase.from('users').select(...)...
    const { data: updatedRows } = await supabase.from('users').update(...)...
}
return res.status(409).json({ error: 'Export counter update conflict' });
```
- **Risk:** 3 deneme × 2 DB call = 6 sorgu worst case. Yoğun trafikte tüm denemeler fail edebilir.
- **İyi:** CAS (Compare-And-Swap) pattern doğru uygulanmış — race condition engelleniyor. ✅
- **Öneri:** Supabase RPC ile atomic increment kullanın:
```sql
UPDATE users SET exports_used = exports_used + 1 
WHERE id = $1 AND exports_used < $2
RETURNING exports_used;
```

### 🟡 ORTA SEVİYE

##### 25. `getUserMeta` — `any` Kullanımı
```typescript
const getUserMeta = (req: Request) => (req as unknown as { user: { user_metadata: any } }).user.user_metadata;
```
- **Öneri:** `user_metadata`'yı typed yapın:
```typescript
interface UserMetadata {
    full_name?: string;
    avatar_url?: string;
}
```

##### 26. `upgradeToPro` — Dead Code
```typescript
return res.status(403).json({ ... });
// eslint-disable-next-line no-unreachable
const userId = getUserId(req);
```
- **Risk:** Return'dan sonraki ~50 satır dead code. Bakım yükü yaratıyor.
- **Öneri:** Dead code'u tamamen kaldırın veya ayrı bir dosyaya `_disabled_upgrade.ts` olarak taşıyın.

### 🟢 İYİ PRATİKLER ✅
1. **Zod validation:** `updateMeSchema`, `incrementExportsSchema` — input doğrulanıyor.
2. **CAS pattern:** Export counter'da race condition önleniyor.
3. **Subscription expiry check:** `getMe`'de otomatik downgrade — tutarlılık.

---

## 📄 `controllers/notifications.ts` — Bildirim Yönetimi

### 🟡 ORTA SEVİYE

##### 27. `getNotifications` — 2 Ayrı Sorgu (Waterfall)
```typescript
const { data } = await query;
const { count: unreadCount } = await supabase.from('notifications').select(...)...
```
- **Risk:** Bildirim listesi + okunmamış sayısı 2 ayrı sorgu.
- **Öneri:** `Promise.all` ile paralel yapın.

##### 28. `limit` Query Parameter Doğrulanmıyor
```typescript
const { limit = 20 } = req.query;
// ...
.limit(Number(limit));
```
- **Risk:** `limit=999999` gönderilirse tüm bildirimler çekilir. DoS riski.
- **Öneri:** `Math.min(Number(limit) || 20, 100)` ile sınırlayın.

### 🟢 İYİ PRATİKLER ✅
1. **User ownership:** Tüm sorgularda `user_id` filtresi — IDOR koruması.
2. **Notification templates:** Hazır mesaj şablonları — tutarlı UX.
3. **Silent notification failure:** Bildirim hatası ana işlemi engellemiyor.

---

## 📋 TOPLAM DÜZELTME ÖNCELİK TABLOSU

| # | Sorun | Dosya | Seviye | Tahmini Süre |
|---|-------|-------|--------|-------------|
| 6 | Reorder N+1 sorgu | bulk.ts | 🔴 Kritik | 1 saat |
| 7 | Price update 2N sorgu | bulk.ts | 🔴 Kritik | 1 saat |
| 2 | Product stats waterfall | read.ts | 🔴 Kritik | 1 saat |
| 13 | req.body bypass (catalog update) | write.ts | 🔴 Kritik | 15 dk |
| 14 | req.body bypass (catalog create) | write.ts | 🔴 Kritik | 15 dk |
| 17 | MD5 → SHA-256 | public.ts | 🔴 Kritik | 5 dk |
| 23 | getMe waterfall | users.ts | 🟡 Orta | 15 dk |
| 24 | CAS → atomic increment | users.ts | 🟡 Orta | 30 dk |
| 1 | getProducts N+1 kategori | read.ts | 🟡 Orta | 30 dk |
| 11 | getCatalog waterfall | catalogs/read.ts | 🟡 Orta | 15 dk |
| 16 | is_published no validation | publish.ts | 🟡 Orta | 10 dk |
| 22 | Stats cache yok | stats.ts | 🟡 Orta | 15 dk |
| 26 | Dead code upgrade | users.ts | 🟢 Düşük | 10 dk |
| 28 | Notification limit kontrolü | notifications.ts | 🟢 Düşük | 5 dk |
