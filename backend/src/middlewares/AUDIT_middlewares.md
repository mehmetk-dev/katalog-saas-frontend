# 🔍 Audit Raporu: `backend/src/middlewares/`

> **Tarih:** 28 Şubat 2026  
> **Denetçi:** Senior Security & Performance Architect  
> **Kapsam:** auth.ts · errorHandler.ts

---

## 📄 `auth.ts` — JWT Authentication Middleware

### 🔴 KRİTİK SORUNLAR

#### 1. Her İstekte Supabase API Çağrısı (Performans Darboğazı)
```typescript
const { data: { user }, error } = await supabase.auth.getUser(token);
```
- **Risk:** Her authenticated request'te Supabase Auth API'sine network call yapılıyor. Bu:
  - **Latency:** Her request'e +50-200ms ekleniyor.
  - **Rate limit:** Supabase Auth API rate limitine takılma riski.
  - **SPOF:** Supabase Auth API'si down ise tüm backend çöker.
- **Öneri:** JWT'yi lokal olarak decode + verify edin (`jose` veya `jsonwebtoken` kütüphanesi ile). Supabase JWT secret'ı ile imza doğrulaması yapın. Kullanıcı bilgilerini cache'leyin. `getUser()` sadece ilk auth veya yenileme sırasında çağrılsın.
```typescript
// Önerilen yaklaşım
import { jwtVerify } from 'jose';
const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);
const { payload } = await jwtVerify(token, secret);
```

#### 2. Token Expiry Kontrolsüz
- **Risk:** `supabase.auth.getUser()` expired token kontrolü yapsa da, lokal JWT verify'a geçildiğinde `exp` claim'i manuel kontrol edilmeli.
- **Öneri:** JWT verify sırasında `clockTolerance` parametresi ile 30 saniyelik tolerans uygulayın.

### 🟡 ORTA SEVİYE SORUNLAR

#### 3. Tip Güvenliği Zayıf — Zorla Cast
```typescript
(req as unknown as { user: unknown }).user = user;
```
- **Risk:** `as unknown as` double cast kullanımı tip güvenliğini tamamen devre dışı bırakıyor. `user` property'si typed değil.
- **Öneri:** Express Request'i extend eden typed interface kullanın:
```typescript
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
```

#### 4. Console.error ile Hata Detayı Loglanıyor
```typescript
console.error('Auth middleware error:', err);
```
- **Risk:** `err` nesnesi token bilgisi, stack trace veya hassas veri içerebilir. Merkezi log sistemine gidiyorsa bu bilgiler kalıcı hale gelir.
- **Öneri:** Sadece error message ve code loglanmalı, full error nesnesi değil. Structured logging kullanın.

---

## 📄 `errorHandler.ts` — Global Error Handler

### 🔴 KRİTİK SORUNLAR

#### 5. Stack Trace Sızdırma (Dev Modda)
```typescript
...(process.env.NODE_ENV !== 'production' && !isOperational && { stack: err.stack })
```
- **Risk:** `NODE_ENV` setlenmemişse (undefined), development olarak davranır ve stack trace döner.
- **Öneri:** Default'u production yapın:
```typescript
const isProduction = process.env.NODE_ENV === 'production' || !process.env.NODE_ENV;
```

#### 6. `notFoundHandler`'da Path Injection
```typescript
next(new ApiError(`Endpoint bulunamadı: ${req.method} ${req.path}`, 404));
```
- **Risk:** `req.path` kullanıcı kontrollüdür. Saldırgan `GET /api/<script>alert(1)</script>` gibi bir path ile XSS payloadu enjekte edebilir. API JSON döndürdüğü sürece doğrudan tehlike yok ama log dosyalarında HTML injection olabilir.
- **Öneri:** Path'i sanitize edin veya hata mesajında kullanmayın:
```typescript
const safePath = req.path.substring(0, 200).replace(/[<>"'&]/g, '');
next(new ApiError(`Endpoint bulunamadı: ${req.method} ${safePath}`, 404));
```

### 🟢 İYİ PRATİKLER ✅

1. **ApiError sınıfı:** Static factory methods (badRequest, unauthorized vb.) — Clean API.
2. **`isOperational` ayrımı:** Beklenen vs beklenmeyen hata ayrımı — doğru yaklaşım.
3. **`asyncHandler` wrapper:** Controller'larda try-catch boilerplate'ini ortadan kaldırıyor.
4. **`Error.captureStackTrace`:** Stack trace'te ApiError constructor'ı görünmüyor — temiz debug.

---

### 🟡 İYİLEŞTİRME ÖNERİLERİ

#### 7. `asyncHandler` Kullanılmıyor
- **Gözlem:** `asyncHandler` tanımlanmış ama proje genelinde controller'larda `try/catch` blokları yerine doğrudan kullanılmıyor. Her controller kendi try/catch'ini yazıyor.
- **Öneri:** Tüm controller'ları `asyncHandler` ile sarın ve tekrarlayan try/catch bloklarını kaldırın.

#### 8. Error Mesajlarında Tutarsız Dil
- **Gözlem:** ApiError static methods Türkçe mesajlar ("Geçersiz istek", "Kaynak bulunamadı") kullanıyor ama controller'lar İngilizce ("Unknown error") döndürüyor.
- **Öneri:** Tek dilde standartlaşın veya i18n error code sistemi kullanın.

---

## 📋 DÜZELTME ÖNCELİK TABLOSU

| # | Sorun | Dosya | Seviye | Tahmini Süre |
|---|-------|-------|--------|-------------|
| 1 | Auth her istekte API call | auth.ts | 🔴 Kritik | 2 saat |
| 5 | Stack trace sızdırma default | errorHandler.ts | 🔴 Kritik | 5 dk |
| 6 | Path injection in 404 | errorHandler.ts | 🟡 Orta | 10 dk |
| 3 | Tip güvenliği double cast | auth.ts | 🟡 Orta | 30 dk |
| 7 | asyncHandler kullanımı yaygınlaştır | tüm controllers | 🟡 Orta | 1 saat |
