# 🔍 Audit Raporu: `backend/src/routes/`

> **Tarih:** 28 Şubat 2026  
> **Denetçi:** Senior Security & Performance Architect  
> **Kapsam:** products.ts · catalogs.ts · users.ts · admin.ts · health.ts · notifications.ts · auth.ts

---

## 📄 `routes/admin.ts` — Admin Panel Routes

### 🔴 KRİTİK SORUNLAR

#### 1. Admin Route'larda İnline Business Logic (Mimari İhlali)
- **Gözlem:** Admin route dosyası (~120 satır) içinde doğrudan Supabase sorguları, cache logic ve iş mantığı barındırıyor. Tüm diğer route dosyaları sadece routing tanımı yaparken admin dosyası controller görevi görüyor.
- **Risk:** 
  - SRP (Single Responsibility) ihlali
  - Test edilemezlik — route dosyası mock'lanamaz
  - Hata yönetimi tutarsız (diğer route'lar controller'a bırakıyor)
- **Öneri:** Bir `controllers/admin.ts` oluşturun, tüm logic'i oraya taşıyın. Route dosyası sadece `router.get('/users', AdminController.getUsers)` şeklinde olmalı.

#### 2. Admin Stats'da Tüm Kullanıcı Export Verisi Çekiliyor
```typescript
supabase.from('users').select('exports_used')
```
- **Risk:** Kullanıcı sayısı arttıkça tüm `exports_used` değerlerini çekmek N satır veri transferi yaratır. 100K kullanıcıda ciddi performans sorunu.
- **Öneri:** Supabase RPC veya aggregate fonksiyonu kullanın:
```sql
SELECT COALESCE(SUM(exports_used), 0) FROM users;
```

#### 3. Admin Users Endpoint'i Tüm Alanları Döndürüyor
```typescript
supabase.from('users').select('*')
```
- **Risk:** `select('*')` ile kullanıcıların tüm hassas bilgileri (subscription details, internal flags) döner.
- **Öneri:** Sadece gerekli alanları seçin: `select('id, email, full_name, plan, created_at, is_admin')`.

### 🟡 ORTA SEVİYE SORUNLAR

#### 4. Plan Güncelleme'de UUID Validasyonu Yok
```typescript
const { id } = req.params;
const { plan } = req.body;
```
- **Risk:** `id` parametresi UUID formatında doğrulanmıyor. Supabase RLS korur ama yanlış formatla gereksiz DB çağrısı yapılır.
- **Öneri:** UUID regex validation ekleyin veya Zod schema kullanın.

#### 5. `requireAdmin` Her İstekte DB Sorgusu
```typescript
const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
```
- **Risk:** Auth middleware zaten Supabase API call yapıyor, admin middleware ikinci DB call ekliyor. Her admin isteği 2 network call ile başlıyor.
- **Öneri:** Admin durumunu cache'leyin veya auth middleware'den dönen JWT claims'e `is_admin` ekleyin.

---

## 📄 `routes/catalogs.ts` — Catalog Routes

### 🟢 İYİ PRATİKLER
- Public vs Protected route ayrımı net.
- `requireAuth` doğru yerlerde uygulanmış.
- Slim route tanımı — logic controller'da.

### ℹ️ NOT
- `getPublicCatalog` ve `getPublicCatalogMeta` public endpoint'ler. Rate limiting `apiLimiter` altında. Public endpoint'lere özel, daha düşük rate limit düşünülmeli (scraping koruması).

---

## 📄 `routes/products.ts` — Product Routes

### 🟡 ORTA SEVİYE SORUNLAR

#### 6. Bulk Import 50MB Body Limit — DoS Riski
```typescript
router.post('/bulk-import', express.json({ limit: '50mb' }), ProductController.bulkImportProducts);
```
- **Risk:** 50MB JSON body parse etmek RAM'de ~200-400MB kullanabilir (JSON.parse overhead). Eşzamanlı birkaç istek sunucuyu OOM yapabilir.
- **Öneri:** 
  - Dosya boyutunu stream ile kontrol edin
  - Eşzamanlı bulk import sayısını sınırlayın (semaphore/queue)
  - 50MB yerine 10MB düşünün (10K ürün × ~500 byte = ~5MB)

### 🟢 İYİ PRATİKLER
- Tüm route'lar `requireAuth` middleware altında.
- Statik route'lar dinamik `:id` route'larından önce tanımlanmış — route öncelik sorunu yok.

---

## 📄 `routes/users.ts` — User Routes

### 🟢 SORUN YOK
- Tüm route'lar `requireAuth` korumalı.
- Sadece `/me` endpoint'leri — IDOR riski yok (kullanıcı sadece kendi verisine erişiyor).
- Route tanımları temiz ve minimal.

---

## 📄 `routes/health.ts` — Health Check Routes

### 🟡 ORTA SEVİYE SORUNLAR

#### 7. Health Full Endpoint'te Hassas Bilgi
```typescript
checks: { database: dbStatus, redis: redisStatus }
```
- **Risk:** Altyapı bileşenlerinin durumunu açığa çıkarıyor. Saldırgan hangi servislerin down olduğunu öğrenebilir.
- **Öneri:** `/health/full` endpoint'ine auth veya token koruması ekleyin (Prometheus metrics gibi).

#### 8. `profiles` Tablosu var mı?
```typescript
await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
```
- **Risk:** Diğer tüm dosyalarda tablo adı `users`. Burada `profiles` kullanılmış. Eğer `profiles` tablosu yoksa health check her zaman DB'yi "down" olarak raporlar.
- **Öneri:** Tablo adını `users` ile değiştirin veya doğru tabloyu kullanın.

#### 9. Readiness Check Gerçek Kontrol Yapmıyor
```typescript
router.get('/ready', async (req, res) => {
    try {
        res.status(200).json({ ready: true });
```
- **Risk:** Kubernetes readiness probe gerçek hazırlık kontrolü yapmıyor. DB bağlantısı olmadan bile "ready" dönüyor.
- **Öneri:** En azından DB bağlantısını kontrol edin.

---

## 📄 `routes/notifications.ts` — Notification Routes

### 🟡 ORTA SEVİYE SORUNLAR

#### 10. Route Sıralaması — Wildcard Çakışma Riski
```typescript
router.delete('/delete-all', deleteAllNotifications);
router.delete('/:id', deleteNotification);
```
- **Risk:** Express'te route sırası önemlidir. `/delete-all` önce tanımlı olduğu için çakışma olmaz ama gelecekte yeni endpoint'ler eklenirken dikkatli olunmalı.
- **Bilgi:** Mevcut yapıda sorun yok, ama `read-all` ile `/:id/read` arasında sıra doğru olmalı.

### 🟢 SORUN YOK
- Tüm route'lar `requireAuth` korumalı.
- Cancel subscription mantıksal olarak notifications altında olması tartışılabilir (ayrı bir billing route daha uygun olabilir).

---

## 📄 `routes/auth.ts` — Authentication Routes

### 🟢 İYİ PRATİKLER
- **User enumeration koruması:** `check-provider` endpoint'i her zaman `{ exists: true }` döndürüyor — saldırgan email'in kayıtlı olup olmadığını öğrenemiyor.
- **Zod validation:** Email formatı doğrulanıyor.
- **Email normalization:** `toLowerCase()` ile normalize ediliyor.

### 🟡 DÜŞÜK SEVİYE

#### 11. Gereksiz DB Sorgusu
```typescript
const _ = await supabase.from('users').select('id').ilike('email', cleanEmail).maybeSingle();
```
- **Risk:** Sonuç kullanılmıyor (`_` değişkenine atanıyor). Gereksiz DB call ve latency.
- **Öneri:** Bu sorguyu kaldırın veya amacını netleştirin. "observability/compatibility" yorumu yeterli gerekçe değil.

---

## 📋 DÜZELTME ÖNCELİK TABLOSU

| # | Sorun | Dosya | Seviye | Tahmini Süre |
|---|-------|-------|--------|-------------|
| 1 | Admin inline logic → controller | admin.ts | 🔴 Kritik | 2 saat |
| 2 | Admin stats N+1 sorgu | admin.ts | 🔴 Kritik | 30 dk |
| 3 | Select * hassas veri sızdırma | admin.ts | 🟡 Orta | 15 dk |
| 6 | Bulk import 50MB DoS riski | products.ts | 🟡 Orta | 1 saat |
| 8 | Health check yanlış tablo | health.ts | 🟡 Orta | 5 dk |
| 9 | Readiness probe boş | health.ts | 🟡 Orta | 15 dk |
| 11 | Gereksiz DB sorgusu auth | auth.ts | 🟢 Düşük | 5 dk |
