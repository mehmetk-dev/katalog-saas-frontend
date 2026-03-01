# 🔍 Audit Raporu: `backend/src/index.ts` (Entry Point)

> **Tarih:** 28 Şubat 2026  
> **Denetçi:** Senior Security & Performance Architect  
> **Kapsam:** Güvenlik · Performans · Kod Kalitesi · Mimari

---

## 🔴 KRİTİK SORUNLAR

### 1. `trust proxy` Header Spoofing Riski
```typescript
app.set('trust proxy', 1);
```
- **Risk:** `trust proxy` etkin olduğunda `req.ip` ve `req.ips`, `X-Forwarded-For` header'ına güvenir. Eğer uygulamanız doğrudan internete açıksa (reverse proxy olmadan), saldırganlar IP adresini spoof edebilir.
- **Etki:** Rate limiting bypass, IP-based access control bypass, yanlış audit log kayıtları.
- **Öneri:** Production'da uygulamanızın mutlaka bir reverse proxy (Cloudflare, Nginx, AWS ALB) arkasında olduğundan emin olun. Yoksa `trust proxy` değerini `false` yapın veya `loopback` olarak ayarlayın.

### 2. Metrics Endpoint Token Güvenliği Zayıf
```typescript
const providedToken = req.query.token || req.headers['x-metrics-token'];
```
- **Risk:** Token'ın query string'de taşınması, URL loglarında, browser history'de, referrer header'larında görünmesine neden olur.
- **Öneri:** `req.query.token` seçeneğini kaldırın, sadece `x-metrics-token` header'ı kullanın. Ayrıca `METRICS_SECRET` yoksa endpoint'i tamamen kapatın.

### 3. Metrics Hata Yanıtında Raw Error Sızdırma
```typescript
res.status(500).end(err);
```
- **Risk:** `err` nesnesi doğrudan istemciye gönderiliyor. Bu, stack trace, iç sistem bilgileri ve modül yollarını sızdırabilir.
- **Öneri:**
```typescript
res.status(500).json({ error: 'Metrics unavailable' });
```

---

## 🟡 ORTA SEVİYE SORUNLAR

### 4. CORS `origin: null` İzin Verme
```typescript
if (!origin) {
    return callback(null, true);
}
```
- **Risk:** `null` origin'li istekler kabul ediliyor. `file://` protokolü, `data:` URI'ları ve redirect-based saldırılar `null` origin gönderir.
- **Bilgi:** Aşağıdaki defense-in-depth middleware bunu kısmen telafi ediyor (no-origin + mutation + no-auth reject) ancak GET istekleri koruma dışı kalıyor.
- **Öneri:** Public GET endpoint'lerinin hassas veri döndürmediğinden emin olun. Aksi halde null-origin GET'leri de kontrol edin.

### 5. Rate Limiter In-Memory Store (Tek Instance)
```typescript
const apiLimiter = rateLimit({ ... });
```
- **Risk:** Default `MemoryStore` kullanılıyor. Çoklu instance deploy'da her instance ayrı counter tutar, toplam rate sınırı `N * max` olur.
- **Öneri:** Production'da Redis-backed store kullanın: `rate-limit-redis` paketi ile `getOrSetCache` yerine özel Redis store.

### 6. Production Rate Limit Çok Yüksek
```typescript
max: isDev ? 10000 : 1000, // 15 dakika window
```
- **Risk:** 15 dakikada 1000 istek = saniyede ~1.1 istek ortalama. Bu tek IP için makul ama scraping/enumeration saldırıları için yeterince yüksek.
- **Öneri:** Endpoint tiplerine göre daha granüler rate limiting uygulayın (bulk operations, search vs read).

### 7. Helmet CSP Production'da Default
```typescript
contentSecurityPolicy: isDev ? false : undefined,
```
- **Risk:** Production'da Helmet'in default CSP'si, API'ler için sorun olmaz ama eğer backend HTML döndüren endpoint'ler eklerse XSS riski doğar.
- **Öneri:** Açıkça CSP policy tanımlayın veya API-only olduğunu comment ile belirtin.

---

## 🟢 İYİ PRATİKLER ✅

1. **Defense-in-depth middleware**: No-origin + mutation + no-auth bloklama — mükemmel yaklaşım.
2. **Helmet yapılandırması**: HSTS, X-Frame-Options, nosniff, XSS filter — tam kurulmuş.
3. **Auth rate limiter ayrımı**: Login/signup için 10 deneme/15dk — brute-force koruması uygun.
4. **Body size limit**: Default 2MB, bulk import için ayrı 50MB — DoS koruması doğru.
5. **gzip/brotli compression**: `compression()` middleware — performans için iyi.
6. **X-Powered-By kaldırma**: Server fingerprinting engellenmiş.
7. **`skipSuccessfulRequests`**: Auth rate limiter'da başarılı istekler sayılmıyor — UX dostu.

---

## 📋 DÜZELTME ÖNCELİK TABLOSU

| # | Sorun | Seviye | Tahmini Süre |
|---|-------|--------|-------------|
| 1 | Metrics raw error sızdırma | 🔴 Kritik | 5 dk |
| 2 | Metrics token query string | 🔴 Kritik | 10 dk |
| 3 | Trust proxy doğrulama | 🔴 Kritik | 15 dk |
| 4 | Rate limiter Redis store | 🟡 Orta | 30 dk |
| 5 | CORS null origin kontrolü | 🟡 Orta | 15 dk |
| 6 | Granüler rate limiting | 🟡 Orta | 45 dk |
