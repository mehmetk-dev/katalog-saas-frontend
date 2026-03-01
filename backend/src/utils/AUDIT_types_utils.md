# 🔍 Audit Raporu: `backend/src/types/` & `backend/src/utils/`

> **Tarih:** 28 Şubat 2026  
> **Denetçi:** Senior Security & Performance Architect  
> **Kapsam:** types/auth.ts · utils/env-validation.ts · utils/safe-error.ts

---

## 📄 `types/auth.ts` — Auth Type Tanımları

### 🟢 SORUN YOK
- Minimal ve odaklı interface tanımı.
- `CheckProviderRequest` ve `CheckProviderResponse` tipleri route'da doğru kullanılıyor.

### ℹ️ İYİLEŞTİRME ÖNERİSİ

#### 1. Eksik Merkezi Tip Tanımları
- **Gözlem:** Proje genelinde `(req as unknown as { user: { id: string } }).user.id` gibi type cast'ler tekrarlanıyor. Her controller kendi `getUserId` helper'ını tanımlıyor.
- **Öneri:** Bu dosyada merkezi bir `AuthenticatedRequest` veya global Express type augmentation tanımlanmalı:
```typescript
// types/auth.ts veya types/express.d.ts
import { User } from '@supabase/supabase-js';

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export interface AuthenticatedRequest extends Request {
    user: User;
}
```
- Bu, tüm projedeki `as unknown as` double-cast'leri ortadan kaldırır.

---

## 📄 `utils/env-validation.ts` — Environment Doğrulama

### 🟡 ORTA SEVİYE SORUNLAR

#### 2. Cloudinary Credentials Doğrulaması Eksik
```typescript
const requiredEnvVars: EnvVar[] = [
    { key: 'SUPABASE_URL', required: true, ... },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', required: true, ... },
    // Cloudinary yok!
];
```
- **Risk:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` doğrulanmıyor. Cloudinary credentials eksik olduğunda sadece `cloudinary.ts`'deki `console.warn` ile sessizce geçiliyor.
- **Öneri:** Cloudinary env var'larını listeye ekleyin:
```typescript
{ key: 'CLOUDINARY_CLOUD_NAME', required: true, description: 'Cloudinary cloud name' },
{ key: 'CLOUDINARY_API_KEY', required: true, description: 'Cloudinary API key' },
{ key: 'CLOUDINARY_API_SECRET', required: true, description: 'Cloudinary API secret (do not log)' },
```

#### 3. `validateEnvAndExit` Sadece Production'da Çıkış Yapıyor
```typescript
if (!valid && process.env.NODE_ENV === 'production') {
    process.exit(1);
}
```
- **Risk:** Development'ta gerekli env var'lar eksik olsa bile sunucu başlar ve runtime hataları oluşur.
- **Öneri:** Development'ta da uyarı yerine startup'ta failed state bildirin. Ya da en azından `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` yoksa development'ta da çıkış yapın.

#### 4. Fonksiyon `index.ts`'de Çağrılmıyor
- **Gözlem:** `validateEnvAndExit()` tanımlı ama `backend/src/index.ts`'de hiçbir yerde import edilmemiş veya çağrılmamıştır.
- **Risk:** Tüm validation logic'i ölü kod. Hiçbir ortam değişkeni kontrolü yapılmıyor.
- **Öneri:** `index.ts`'in başında çağrılmalı:
```typescript
import { validateEnvAndExit } from './utils/env-validation';
validateEnvAndExit();
```

#### 5. Boş `else` Bloku
```typescript
} else {
    // değişken mevcut - sessiz geçiş
}
```
- **Risk:** Dead code. Debugging sırasında karmaşıklık yaratır.
- **Öneri:** Boş `else` bloğunu kaldırın.

### 🟢 İYİ PRATİKLER ✅
1. **Yapısal doğrulama:** `required` vs `optional` ayrımı temiz.
2. **Açıklayıcı mesajlar:** Emoji ile hata ve uyarı ayrımı okunabilir.
3. **Dönüş değeri:** `valid`, `errors`, `warnings` üçlüsü — test edilebilir.

---

## 📄 `utils/safe-error.ts` — Güvenli Hata Mesajı

### 🟢 İYİ PRATİKLER ✅
1. **Pattern-based sanitization:** PostgreSQL error codes, constraint names, table names filtreleniyor.
2. **Production-only filtering:** Development'ta gerçek hata mesajı görünür — debug kolaylığı.
3. **Defensive coding:** `error instanceof Error` kontrolü ile type safety.

### 🟡 ORTA SEVİYE SORUNLAR

#### 6. `safeErrorMessage` Proje Genelinde Kullanılmıyor
- **Gözlem:** Bu utility tanımlı ama controller'ların hiçbirinde import edilmemiş. Tüm controller'lar:
```typescript
const message = error instanceof Error ? error.message : 'Unknown error';
res.status(500).json({ error: message });
```
şeklinde raw error message döndürüyor.
- **Risk:** Production'da PostgreSQL hata mesajları (tablo adları, constraint'ler, query detayları) client'a sızıyor.
- **Öneri:** Tüm controller error handler'larını `safeErrorMessage` kullanacak şekilde güncelleyin:
```typescript
import { safeErrorMessage } from '../utils/safe-error';
// ...
res.status(500).json({ error: safeErrorMessage(error) });
```

#### 7. Eksik Pattern'lar
```typescript
const SENSITIVE_PATTERNS = [
    // Bunlar da eklenmeli:
    /password/i,
    /token/i,
    /secret/i,
    /authentication/i,
    /connection refused/i,
    /ECONNREFUSED/i,
    /timeout/i,
];
```
- **Risk:** Network hataları (`ECONNREFUSED`, `ETIMEOUT`) iç altyapı bilgisi sızdırabilir.
- **Öneri:** Network ve infrastructure error pattern'larını da ekleyin.

---

## 📋 DÜZELTME ÖNCELİK TABLOSU

| # | Sorun | Dosya | Seviye | Tahmini Süre |
|---|-------|-------|--------|-------------|
| 4 | env-validation çağrılmıyor | env-validation.ts + index.ts | 🔴 Kritik | 5 dk |
| 6 | safeErrorMessage kullanılmıyor | tüm controllers | 🔴 Kritik | 45 dk |
| 1 | Merkezi AuthenticatedRequest | types/auth.ts | 🟡 Orta | 30 dk |
| 2 | Cloudinary env validation | env-validation.ts | 🟡 Orta | 10 dk |
| 7 | Eksik sensitive patterns | safe-error.ts | 🟡 Orta | 10 dk |
| 3 | Dev'de de exit yapma | env-validation.ts | 🟢 Düşük | 10 dk |
| 5 | Boş else bloğu | env-validation.ts | 🟢 Düşük | 2 dk |

---

## 🏁 GENEL DEĞERLENDİRME

Bu iki klasör "utility" katmanı olup, doğru tanımlanmış ama **projenin geri kalanında aktif olarak kullanılmıyor**. En kritik sorun `safeErrorMessage`'ın controller'larda kullanılmaması ve `validateEnvAndExit`'in hiçbir yerde çağrılmamasıdır. Bu iki fonksiyon aktif edildiğinde backend güvenliği önemli ölçüde artacaktır.
