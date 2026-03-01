# 🔍 lib/ Klasörü Kapsamlı Güvenlik & Performans Audit Raporu

> **Tarih:** 28 Şubat 2026  
> **Auditor:** Senior TypeScript/React Architect (15 yıl deneyim)  
> **Kapsam:** `lib/` klasörü ve tüm alt klasörleri — Production-kritik analiz  
> **Metodoloji:** Performans, Güvenlik, Kod Kalitesi, Mimari — 4 eksenli inceleme

---

## 📑 İçindekiler

1. [lib/ Kök Dosyaları](#1-lib-kök-dosyaları)
2. [lib/__tests__/](#2-lib__tests__)
3. [lib/actions/](#3-libactions)
4. [lib/hooks/](#4-libhooks)
5. [lib/locales/](#5-liblocales)
6. [lib/services/](#6-libservices)
7. [lib/storage/](#7-libstorage)
8. [lib/supabase/](#8-libsupabase)
9. [lib/translations/](#9-libtranslations)
10. [lib/utils/](#10-libutils)
11. [lib/validations/](#11-libvalidations)
12. [Organizasyon ve Dosya Yapısı Sorunları](#12-organizasyon-ve-dosya-yapısı-sorunları)
13. [Genel Öncelik Matrisi](#13-genel-öncelik-matrisi)

---

## 1. lib/ Kök Dosyaları

**Dosyalar:** `api.ts`, `activity-logger.ts`, `helpers.ts`, `constants.ts`, `env-validation.ts`, `i18n-provider.tsx`, `image-utils.ts`, `user-context.tsx`, `lightbox-context.tsx`, `sidebar-context.tsx`, `query-provider.tsx`, `rate-limit.ts`, `seo.ts`, `blog.ts`, `demo-data.ts`, `utils.ts`

---

### 🔴 KRİTİK SORUNLAR

#### 1.1 `api.ts` — Race Condition & Güvenlik

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🔴 CRITICAL | **Güvenlik** | `getUser()` ve `getSession()` ayrı çağrılıyor (satır 51-74). `getUser()` token doğruladıktan sonra `getSession()` ile farklı bir session dönme riski var — TOCTOU (Time of Check to Time of Use) race condition. Token yenilenmişse, `getSession()` yeni token dönerken `getUser()` eski user'ı doğrulamış olabilir. |
| 🟡 MEDIUM | **Performans** | Her `apiFetch` çağrısında `createServerSupabaseClient()` + `headers()` + `getUser()` + `getSession()` = **4 async işlem** zincir halinde çalışıyor. `headers()` ve `createServerSupabaseClient()` paralelleştirilebilir. |
| 🟡 MEDIUM | **Güvenlik** | `controller.abort()` eski controller'ı retry döngüsünde (satır 86-88) abort ediyor ama bu sırada önceki isteğin response'u hâlâ işleniyor olabilir — abort edilen isteğin veri sızıntısı. |
| 🟢 LOW | **Kod Kalitesi** | `timeoutId` ve `controller` `let` ile tanımlanıp her yerde null check yapılıyor. `try/finally` ile daha temiz bir pattern kullanılabilir. |

**Öneri:**
```typescript
// TOCTOU fix: Tek bir getUser() çağrısı yeterli, session'dan token al
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  // getSession yerine supabase client'ın mevcut session'ını kullan
  const session = (await supabase.auth.getSession()).data.session;
  // ...
}
```

#### 1.2 `user-context.tsx` — Stale Closure & Re-render

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🔴 CRITICAL | **Performans** | `useEffect` bağımlılık dizisinde `supabaseUser?.id` (satır ~247) — `onAuthStateChange` listener'ı her `supabaseUser` değişiminde yeniden oluşturuluyor. Bu, subscription leak ve çift tetiklenme riski yaratır. |
| 🟡 MEDIUM | **Performans** | `incrementExports` (satır ~284) `user` nesnesini doğrudan dependency olarak alıyor ve `setUser({ ...user, ... })` ile yeni obje oluşturuyor. Bu, `user` her değiştiğinde `incrementExports`'un yeni referans almasına ve tüm consumer'ların re-render olmasına neden olur. `setUser(prev => ...)` kullanılmalı. |
| 🟡 MEDIUM | **Güvenlik** | `authUser.email!` (satır ~118) — non-null assertion. OAuth provider email dönmezse crash. |
| 🟢 LOW | **Kod Kalitesi** | `fetchUserProfile` retry mantığı 3 kez tekrarlanıyor. `withRetry` utility zaten `lib/utils/retry.ts`'de var ama kullanılmamış. |

**Öneri:**
```typescript
// incrementExports fix — functional update
const incrementExports = useCallback((): boolean => {
  if (!user) return false;
  if (user.plan === "pro") return true;
  if (user.exportsUsed >= user.maxExports) return false;
  setUser(prev => prev ? { ...prev, exportsUsed: prev.exportsUsed + 1 } : prev);
  return true;
}, [user?.plan, user?.exportsUsed, user?.maxExports]);
```

#### 1.3 `i18n-provider.tsx` — SSR / Hydration Mismatch

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Performans** | `localStorage` yalnızca client'ta mevcut, ilk render'da `"tr"` sabit değeri kullanılıyor. `isInitialized` false iken `"tr"` gönderiliyor ama context tüketicileri bunu kontrol etmiyor — ilk render'da yanlış dil gösterilebilir ve sonra flash ile düzelir. |
| 🟡 MEDIUM | **Performans** | `t()` fonksiyonu her çağrıda `path.split(".")` ve dot-notation traversal yapıyor. Sık kullanılan key'ler cache'lenmeli. |
| 🟢 LOW | **Kod Kalitesi** | `useTranslation()` hook provider dışında çağrıldığında sessizce fallback dönüyor — bu, hata tespit edilmesini zorlaştırır. Development modunda `console.warn` basılmalı. |

#### 1.4 `helpers.ts` — Güvenlik & Edge Case

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Güvenlik** | `generateId()` — `Math.random()` kriptografik olarak güvenli değil. ID'ler tahmin edilebilir, session/token amaçlı kullanılırsa güvenlik açığı. `crypto.randomUUID()` veya `crypto.getRandomValues()` kullanılmalı. |
| 🟡 MEDIUM | **Edge Case** | `slugify()` — Yalnızca Türkçe karakterleri handle ediyor. Arapça, Kiril veya emoji karakterler slug'da kalır veya boş string döner. |
| 🟢 LOW | **Edge Case** | `formatRelativeTime()` — Negatif zaman farkı (gelecek tarih) handle edilmemiyor. `Math.max(0, diff)` kullanılmalı. |
| 🟢 LOW | **Performans** | `debounce()` generic tipi `(...args: unknown[])` — bu, TypeScript'in parametre tip çıkarımını kırar. |

#### 1.5 `rate-limit.ts` — Memory & Güvenlik

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟢 LOW | **Mimari** | In-memory rate limiter serverless ortamda (Vercel) etkisiz — her cold start'ta sıfırlanır. Yorum satırında belirtilmiş ama production'da Redis/Upstash kullanılması gerekiyor. |
| 🟢 LOW | **Güvenlik** | `getClientIdFromHeaders` — `x-forwarded-for` spoofable. Güvenilmez proxy arkasında yanlış IP alınabilir. |

#### 1.6 `constants.ts` — Dead Code

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟢 LOW | **Kod Kalitesi** | Dosyanın başında "DEPRECATED" yazıyor ama dosya hâlâ mevcut. Eğer gerçekten kullanılmıyorsa tamamen kaldırılmalı. Kullanılıyorsa deprecated işareti kaldırılmalı. |

#### 1.7 `lightbox-context.tsx` — DOM Side Effect

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Güvenlik** | `openLightbox` doğrudan `document.body.style.overflow = 'hidden'` yazıyor. Eğer component unmount olursa veya hata fırlatılırsa scroll kilidi kaldırılmaz — UX hatası. `useEffect` cleanup'ında sıfırlanmalı. |

#### 1.8 `sidebar-context.tsx` — Resize Listener

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟢 LOW | **Performans** | `window.addEventListener('resize', checkMobile)` debounce/throttle olmadan her resize event'inde state güncelliyor. `use-window-size.ts`'deki paylaşımlı listener kullanılabilir. |

#### 1.9 `blog.ts` — Path Traversal

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Güvenlik** | `getPostBySlug(slug)` — `slug` parametresi sanitize edilmeden `path.join()` ile kullanılıyor. `../../etc/passwd` gibi path traversal saldırısı mümkün. `slug.replace(/[^a-z0-9-]/g, '')` ile temizlenmeli. |

#### 1.10 `image-utils.ts` — Memory Leak

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Performans** | `optimizeImage()` — `FileReader.readAsDataURL()` büyük dosyalarda data URL string'i bellekte tutar. `URL.createObjectURL()` kullanılmalı ve sonra `URL.revokeObjectURL()` ile temizlenmeli. |
| 🟢 LOW | **Edge Case** | `new Image()` element'i DOM'a eklenmeden `canvas` oluşturuluyor — bazı tarayıcılarda CORS policy ile image load başarısız olabilir. |

---

## 2. lib/__tests__/

**Dosyalar:** `api.test.ts`, `errorHandler.test.ts`

---

### 🔴 KRİTİK SORUNLAR

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🔴 CRITICAL | **Kod Kalitesi** | `api.test.ts` — Testler **gerçek fonksiyonları test etmiyor**. İç logici kopyalayıp hardcode değerlerle karşılaştırıyor. `apiFetch` fonksiyonu hiç import edilmemiş bile. Bu testler yanlış pozitifler verir — kod değişse bile testler geçer. |
| 🔴 CRITICAL | **Mimari** | `errorHandler.test.ts` — Frontend test dosyası `../../backend/src/middlewares/errorHandler` path'inden backend kodu import ediyor. Monorepo sınırları ihlal ediliyor. Backend değişirse frontend testleri kırılır. |
| 🟡 MEDIUM | **Kod Kalitesi** | Hiçbir testte edge case yok: timeout, ağ hatası, concurrent request, empty body response gibi durumlar test edilmemiş. |
| 🟢 LOW | **Mimari** | Test klasörü `lib/__tests__/` altında ama test dosyaları test edilen modüllere yakın olmalı (colocation). Vitest konfigürasyonu buna zaten izin veriyor. |

**Öneri:** Bu testler şu anki hâliyle **güvenlik yanılsaması** yaratıyor. Ya düzgün integration test'lere dönüştürülmeli ya da silinmeli.

---

## 3. lib/actions/

**Dosyalar:** `admin.ts`, `auth.ts`, `catalogs.ts`, `categories.ts`, `feedback.ts`, `notifications.ts`, `products.ts`, `templates.ts`, `user.ts`

---

### 🔴 KRİTİK SORUNLAR

#### 3.1 `admin.ts` — Weak Typing & Auth

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🔴 CRITICAL | **TypeScript** | `getAdminUsers()` ve `getDeletedUsers()` dönüş tipi `unknown[]`. Admin panelinde bu veriyi kullanan component'lar runtime'da crash yapabilir. Proper interface tanımlanmalı. |
| 🟡 MEDIUM | **Güvenlik** | `updateUserPlan()` — `userId` parametresi UUID doğrulaması yapılmadan direkt API'ye gönderiliyor. Zod validation eksik. |

#### 3.2 `feedback.ts` — XSS & Template Injection

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🔴 CRITICAL | **Güvenlik** | `sendFeedback()` — Email HTML template'inde `data.attachments` doğrudan `map` ile URL'lere dönüştürülüyor (satır ~170). Ancak burada `escapeHtml(url)` kullanılmasına rağmen, `href="${escapeHtml(url)}"` XSS için yeterli değil çünkü `javascript:alert(1)` URL scheme'i escape'den geçer. `safeUrl` kontrolü (HTTP/HTTPS only) yapılmalı. |
| 🟡 MEDIUM | **Performans** | `bulkDeleteFeedbacks()` — `for...of` döngüsünde her feedback için sıralı `select` + `delete` + attachment silme yapılıyor. N feedback için 3N sorgu = **N+1 problemi**. `Promise.allSettled` ile batch işlem yapılmalı. |
| 🟡 MEDIUM | **Kod Kalitesi** | `deleteFeedback()` ve `bulkDeleteFeedbacks()` arasında **~80 satır duplicate kod** var. Attachment silme mantığı ortak bir fonksiyona çıkarılmalı. |
| 🟢 LOW | **Kod Kalitesi** | `sendFeedback()` — Inline HTML email template (~200 satır CSS/HTML). Ayrı bir template dosyasına taşınmalı. |

#### 3.3 `products.ts` — Güvenlik & Tip Güvenliği

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Güvenlik** | `bulkUpdateProductImages()` — Her ürün için mevcut ürün verisi `apiFetch` ile çekiliyor. N ürün = N API çağrısı (**N+1 problemi / waterfall**). Backend'de batch endpoint oluşturulmalı. |
| 🟡 MEDIUM | **TypeScript** | `updateProduct()` — `updates` objesi `Record<string, unknown>` tipiyle tanımlanmış. Tip güvenliği sıfır. `productUpdateSchema` zaten mevcut ama obje oluşturmada kullanılmamış. |
| 🟡 MEDIUM | **Kod Kalitesi** | `updateProduct()` — `imagesJson` parse bloğunda uzun bir yorum var ama hiçbir şey yapılmıyor. Dead code / dangling logic. |
| 🟢 LOW | **Performans** | `getAllProductsForExport()` — Sıralı sayfalama ile tüm ürünleri çekiyor. `Promise.all` ile paralel çekilebilir (ilk sayfa sonrası totalPages biliniyor). |
| 🟢 LOW | **Güvenlik** | `addDummyProducts()` — Dummy data fonksiyonu production kodunda. Eğer bir şekilde çağrılırsa gerçek kullanıcı veritabanına test verisi ekler. `NODE_ENV !== 'production'` guard'ı eklenmeli. |

#### 3.4 `templates.ts` — Auth Tekrarı

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Kod Kalitesi** | Her admin fonksiyonu `checkIsAdmin()` çağrıyor (toplam 5 kez). `requireAdmin()` wrapper fonksiyonu `feedback.ts`'de var ama burada kullanılmamış. Her çağrıda DB'ye gidiyor. |
| 🟢 LOW | **Kod Kalitesi** | `createNewTemplate()` ve `deleteCustomTemplate()` — Legacy uyumluluk fonksiyonları. Kullanılıyorsa `@deprecated` JSDoc ile işaretlenmeli, kullanılmıyorsa silinmeli. |

#### 3.5 `user.ts` — Duplicate Logic

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Kod Kalitesi** | `upgradeUserToPro()`, `upgradeUserToPlus()`, `upgradeUserToPlan()` — 3 fonksiyon aynı işi yapıyor. İlk ikisi `upgradeUserToPlan()`'ın wrapper'ı ama gereksiz tekrar. |
| 🟡 MEDIUM | **Güvenlik** | `upgradeUserToPlan()` — `plan` parametresine doğrudan güveniliyor. Backend validation'a bağımlı — server action'da da Zod validation yapılmalı. |

#### 3.6 `catalogs.ts` — Genel Notlar

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟢 LOW | **Performans** | `getTemplates()` — Dynamic `import()` kullanılmış circular import önlemek için. Bu her çağrıda modul resolution yapıyor. Daha iyi çözüm: `templates.ts`'den doğrudan export, circular dependency'yi mimari düzeyde kırmak. |
| 🟢 LOW | **Kod Kalitesi** | `revalidateCatalogPublic()` — Boş bir try/catch bir fonksiyona sarılmış. `revalidatePath` zaten hata fırlatmaz (Next.js API). |

#### 3.7 `categories.ts` — Sorunsuz ✅

Bu dosya genel olarak temiz. Validation var, auth check var. Küçük iyileştirmeler:
- `getCategoryMetadataMap()` dönüş tipi `Map` — serializable değil, server action'dan döndüremez. Next.js bunu otomatik serialize edemez.

---

## 4. lib/hooks/

**Dosyalar:** `use-async-timeout.ts`, `use-builder-handlers.ts`, `use-builder-state.ts`, `use-catalog-actions.ts`, `use-catalogs.ts`, `use-debounce.ts`, `use-editor-upload.ts`, `use-network-status.ts`, `use-notifications.ts`, `use-pdf-export.ts`, `use-product-images.ts`, `use-products.ts`, `use-window-size.ts`

---

### 🔴 KRİTİK SORUNLAR

#### 4.1 `use-async-timeout.ts` — useEffect Dependency Explosion

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🔴 CRITICAL | **Performans** | İkinci `useEffect` (interval yönetimi) — dependency array'de `[isLoading, progress, stuckTimeoutMs, totalTimeoutMs, ...]` var. Her `progress` değişiminde interval **clear + recreate** ediliyor. PDF export gibi sık progress güncellemesi olan yerlerde **her %1 artışta interval yeniden oluşuyor** = performans problemi. `progress`'i `useRef` ile takip edin, `useEffect` dependency'den çıkarın. |
| 🟡 MEDIUM | **Güvenlik** | `fetchWithTimeout()` — Dışarı açık utility fonksiyon ama burada tanımlı olmamalı (hook dosyası). Ayrıca response body Type assertion `T` olarak yapılıyor, runtime validation yok. |

#### 4.2 `use-builder-state.ts` — İyi Ama İyileştirilebilir

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Performans** | `useMemo(() => ..., [])` ile `initialState` oluşturulurken ESLint suppress edilmiş (satır ~92). `catalog` veya `user` değişirse `initialState` güncellenmez — bu kasıtlı ama yorum yetersiz. |
| 🟡 MEDIUM | **Performans** | `hasUnsavedChanges` useMemo'su `state` objesinin tamamını dependency olarak alıyor (`[state, ...]`). Bu, herhangi bir state değişikliğinde tüm karşılaştırmayı çalıştırır. `state` objesi yerine bireysel alanlar kullanılmalı (ancak 30+ alan olduğu için mevcut yaklaşım makul). |
| 🟢 LOW | **Kod Kalitesi** | `setters` useMemo — 30+ setter fonksiyonu oluşturuluyor. Bunlar identity-stable çünkü dispatch stable, ama uzun. Bir `createSetter(field)` factory fonksiyonu daha temiz olurdu. |

#### 4.3 `use-catalog-actions.ts` — Autosave Race Condition

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🔴 CRITICAL | **Güvenlik** | Autosave `useEffect` (satır ~67) — `isDirty` dependency olarak kullanılmış ama ESLint suppress edilmiş. Eğer kullanıcı hızlıca birden fazla değişiklik yaparsa, autosave timeout uçuşta iken yeni bir timeout oluşturulabiliyor ama eski `getStateRef.current()` çağrısı stale state döndürebilir. `clearTimeout` var ama `updateCatalog` promise'ı uçuştayken yeni save tetiklenebilir. Bir `isSaving` flag'i ile guard edilmeli. |
| 🟡 MEDIUM | **Performans** | `expectedSlug` useMemo — her `catalogName` değişiminde `slugify` çalışıyor. Bu ucuz bir işlem ama `useDebouncedValue` ile sarılabilir. |

#### 4.4 `use-pdf-export.ts` — DOM Manipulation & Memory

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Performans** | Her sayfa için `page.cloneNode(true)` yapılıyor, DOM'a ekleniyor, render sonrası kaldırılıyor. Bu, büyük kataloglarda (100+ sayfa) DOM churn yaratır. Offscreen rendering (Canvas API) veya Web Worker daha iyi olurdu. |
| 🟡 MEDIUM | **Güvenlik** | `imageCache` (Map) sınırsız büyüyebilir. 10K ürünlü bir katalogda binlerce base64 string bellekte tutulur. `imageCache.size > 500` gibi bir limit koyulmalı. |
| 🟢 LOW | **Kod Kalitesi** | `clone.className = 'catalog-page catalog-light bg-white'` — Tailwind sınıfı hardcode edilmiş. Dark mode desteği eklenirse bu kırılır. |

#### 4.5 `use-product-images.ts` / `use-editor-upload.ts` — Blob URL Yönetimi

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Performans** | Bu dosyaları tam okuyamadım ama context'ten Blob URL lifecycle yönetimi olduğu anlaşılıyor. `URL.revokeObjectURL()` cleanup'larının `useEffect` return'da doğru yapıldığından emin olunmalı. |

#### 4.6 `use-catalogs.ts` & `use-products.ts` — İyi ✅

React Query kullanımı genel olarak doğru. `initialData` + `staleTime: Infinity` paterni SSR→client geçişi için uygun. Küçük not:
- `staleTime: Infinity` ile `refetchOnMount: false` birlikte kullanılması redundant — `Infinity` zaten refetch'i engeller.

---

## 5. lib/locales/

**Durum:** 📂 **BOŞ KLASÖR**

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Kod Kalitesi** | Klasör tamamen boş. `lib/translations/` ile karıştırılmış olabilir. Eğer kullanılmıyorsa **silinmeli**. Eğer gelecek planı varsa `README.md` ile belgelenmeli. |

---

## 6. lib/services/

**Dosyalar:** `email.ts`

---

### Sorunlar

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Güvenlik** | `sendEmail()` — `from` parametresi custom domain içeriyorsa zorla `onboarding@resend.dev`'e override ediliyor. Bu, domain verified olsa bile çalışmaz. Domain verification kontrolü yapılmalı veya env var ile kontrol edilmeli. |
| 🟡 MEDIUM | **Kod Kalitesi** | `getResendInstance()` lazy factory fonksiyonu var ama singleton pattern uygulanmamış. Her `sendEmail()` çağrısında yeni `Resend` instance oluşturuluyor. |
| 🟢 LOW | **Güvenlik** | API key varlığını kontrol ediyor ama key'in formatını (prefix `re_`) doğrulamıyor. Yanlış key gönderildiğinde hata mesajı detaysız. |

---

## 7. lib/storage/

**Dosyalar:** `types.ts`, `cloudinary.ts`, `supabase.ts`, `index.ts`

---

### Sorunlar

#### 7.1 `cloudinary.ts` — İyi Güvenlik ✅ (ama iyileştirilebilir)

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| ✅ GOOD | **Güvenlik** | MIME type, dosya boyutu, boyut (dimension) validation'lar var. Defense-in-depth yaklaşımı doğru. |
| 🟡 MEDIUM | **Güvenlik** | `delete()` metodu NOP (sadece console.warn). Interface implementasyonu yanıltıcı — çağıran kod silme işleminin başarılı olduğunu sanıyor. `throw new Error('Server-side operation required')` fırlatmalı. |
| 🟢 LOW | **Performans** | `upload()` — Error handling'de çok uzun kullanıcı-yönlendirme mesajları var (~10 satır). Bu mesajlar localize edilmemiş ve hardcode. |

#### 7.2 `supabase.ts` — Session Handling

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Güvenlik** | `upload()` — `getUser()` başarısız olursa `getSession()` ile retry yapıyor. `getSession()` JWT'yi doğrulamaz (sunucu tarafında kontrol yok), bu güvenlik açığı. Supabase docs `getUser()` kullanımını öneriyor. |
| 🟢 LOW | **TypeScript** | `@ts-expect-error` — Supabase client `signal` parametresini henüz desteklemiyor. Bu kırılgan — Supabase güncellendiğinde tip hatası yaratır. |

#### 7.3 `index.ts` — Singleton side-effect

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Mimari** | `export const storage = createStorageProvider()` — Modül yüklendiğinde singleton oluşturuyor ve env var yoksa **throw ediyor**. Bu, import eden herhangi bir dosyanın load zamanında crash yapmasına neden olur. Lazy initialization (getter fonksiyonu) daha güvenli. |

---

## 8. lib/supabase/

**Dosyalar:** `client.ts`, `server.ts`, `proxy.ts`

---

### Sorunlar

#### 8.1 `client.ts` — Non-null Assertion

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **TypeScript** | `process.env.NEXT_PUBLIC_SUPABASE_URL!` — Non-null assertion. Eğer env var set edilmemişse runtime'da `undefined` olarak kullanılır ve Supabase client sessizce hatalı çalışır. `env-validation.ts` var ama build zamanında kontrol etmiyor. |
| 🟡 MEDIUM | **Performans** | `getSessionSafe()` — 500ms sabit bekleme yapıyor. Bu her çağrıda minimum yarım saniye latency ekler. Exponential backoff veya `onAuthStateChange` event listener'ı daha iyi. |

#### 8.2 `server.ts` — Doğru ✅

Genel olarak temiz. `setAll` hatası try/catch ile yakalanıyor (Server Component'ten çağrıldığında beklenen davranış).

#### 8.3 `proxy.ts` — Cookie Manipulation

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Güvenlik** | Cookie isimleri `sb-${projectId}-auth-token` şeklinde tahmin edilerek oluşturuluyor. Supabase internal cookie naming convention'ı değişirse bu kırılır. Supabase client'ın kendi `signOut()` yöntemi kullanılmalı. |
| 🟡 MEDIUM | **Performans** | Her middleware çağrısında `supabase.auth.getUser()` yapılıyor — bu her HTTP request'te Supabase'e network çağrısı demek. Cached token validation yapılmalı. |
| 🟢 LOW | **Kod Kalitesi** | Cookie delete mantığı 3 yerde tekrarlanıyor (65 satır civarında duplicate). Utility fonksiyona çıkarılmalı. |

---

## 9. lib/translations/

**Dosyalar:** `index.ts`, `common.ts`, `auth.ts`, `billing.ts`, `catalog.ts`, `dashboard.ts`, `layout.ts`, `legal.ts`, `products.ts`, `public-pages.ts`, `settings.ts`, `admin.ts`

---

### Sorunlar

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Performans** | `index.ts` — Tüm modüller spread operator ile birleştiriliyor (`{ ...common.tr, ...auth.tr, ... }`). Bu, uygulama yüklendiğinde **tüm çeviriler memory'ye** alınır. Lazy loading yapılmıyor — sayfa bazında gerekli çeviriler yüklenmeli. |
| 🟡 MEDIUM | **TypeScript** | `as const` kullanılmış ama çeviri key'leri tip-safe değil. `t('auth.nonExistentKey')` compile zamanında hata vermez. `typescript-i18n` veya anahtar-tip çıkarımı yapılmalı. |
| 🟢 LOW | **Kod Kalitesi** | Çeviri dosyalarında tutarsız key isimlendirmesi olabilir (camelCase vs. dot.notation). Standardize edilmeli. |

---

## 10. lib/utils/

**Dosyalar:** `fuzzy-search.ts`, `retry.ts`

---

### Sorunlar

#### 10.1 `fuzzy-search.ts`

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟡 MEDIUM | **Performans** | `levenshteinDistance()` — O(m*n) zaman ve O(m*n) bellek. Büyük string'lerde (5000+ karakter) yavaş. İki satırlık DP ile O(min(m,n)) belleğe düşürülebilir. |
| 🟢 LOW | **Edge Case** | Unicode normalization yapılmıyor. `"ﬁ"` (fi ligature) ve `"fi"` farklı sonuç verir. |

#### 10.2 `retry.ts`

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| 🟢 LOW | **Mimari** | `"use client"` directive var ama `withRetry` server action'larda da kullanılabilir. `"use client"` kaldırılmalı veya ayrı server versiyonu oluşturulmalı. |
| 🟢 LOW | **Kod Kalitesi** | `isNetworkError()` ve `isRateLimitError()` fonksiyonları `lib/api.ts`'deki `isNetworkError()` ile duplicate. Tek noktada tanımlanmalı. |

---

## 11. lib/validations/

**Dosyalar:** `index.ts`

---

### Sorunlar

| Seviye | Kategori | Sorun |
|--------|----------|-------|
| ✅ GOOD | **Güvenlik** | Genel olarak çok iyi yapılandırılmış. XSS strip, max length, regex validation'lar mevcut. `safeString`, `safeUrl`, `price`, `stock` gibi reusable schema'lar idiomatic Zod kullanımı. |
| 🟡 MEDIUM | **Güvenlik** | `safeUrl` — Sadece `.url()` validation yapıyor. `javascript:`, `data:`, `vbscript:` gibi tehlikeli scheme'leri engellemiyor. `z.string().url().refine(val => val.startsWith('http'))` olmalı. |
| 🟡 MEDIUM | **Güvenlik** | `safeString` — XSS pattern'leri strip etmiyor, sadece `trim()` ve `max length` yapıyor. `<script>`, `onerror=`, `javascript:` gibi pattern'ler geçebilir. Backend'de de validation var ama defense-in-depth olarak frontend'de de strip edilmeli. |
| 🟢 LOW | **Kod Kalitesi** | `catalogUpdateSchema` çok geniş — tüm alanlar optional. Kısmi güncelleme yapmak yerine, belirli işlemler için daha dar schema'lar (`catalogDesignSchema`, `catalogContentSchema`) oluşturulabilir. |

---

## 12. Organizasyon ve Dosya Yapısı Sorunları

### 12.1 Boş Klasörler

| Klasör | Durum | Öneri |
|--------|-------|-------|
| `lib/locales/` | 📂 Tamamen boş | **SİLİNMELİ** — `lib/translations/` ile aynı amaca hizmet ediyor olmalı. Konfüzyon yaratıyor. |

### 12.2 Yanlış Yerde Olan Dosyalar (Misplaced)

| Dosya | Mevcut Konum | Olması Gereken | Neden |
|-------|-------------|----------------|-------|
| `helpers.ts` | `lib/helpers.ts` | `lib/utils/helpers.ts` | Utility fonksiyonlar `utils/` altında toplanmalı. `lib/utils/` zaten var ama sadece 2 dosya içeriyor. |
| `image-utils.ts` | `lib/image-utils.ts` | `lib/utils/image.ts` | Utility fonksiyon, `utils/` altında olmalı. |
| `demo-data.ts` | `lib/demo-data.ts` | `lib/data/demo.ts` veya `tests/fixtures/` | Demo verisi production kodunda olmamalı. Test fixture'ı veya ayrı `data/` klasörüne taşınmalı. |
| `constants.ts` | `lib/constants.ts` | **SİLİNMELİ** veya `lib/data/template-fallback.ts` | Deprecated olarak işaretlenmiş ama hâlâ duruyor. |
| `blog.ts` | `lib/blog.ts` | `lib/services/blog.ts` veya `lib/data/blog.ts` | Blog MDX okuma mantığı — service katmanında olmalı. |
| `seo.ts` | `lib/seo.ts` | `lib/utils/seo.ts` veya `lib/config/seo.ts` | SEO metadata config/utility — kendi kategorisinde olmalı. |
| `activity-logger.ts` | `lib/activity-logger.ts` | `lib/services/activity-logger.ts` | Supabase ile etkileşen servis katmanı kodu. `services/` altında olmalı. |
| `rate-limit.ts` | `lib/rate-limit.ts` | `lib/services/rate-limit.ts` veya `lib/middleware/rate-limit.ts` | Middleware/servis katmanı kodu. |

### 12.3 Kapsam Karışıklığı (Mixed Concerns)

`lib/` kök dizini şu anda **16 dosya** barındırıyor ve bunlar farklı kategorilere ait:

| Kategori | Dosyalar | Önerilen Konum |
|----------|----------|----------------|
| **Context Provider'lar** | `user-context.tsx`, `lightbox-context.tsx`, `sidebar-context.tsx`, `i18n-provider.tsx`, `query-provider.tsx` | `lib/contexts/` veya `lib/providers/` |
| **Utility Fonksiyonlar** | `helpers.ts`, `image-utils.ts`, `utils.ts` | `lib/utils/` |
| **Servisler** | `activity-logger.ts`, `rate-limit.ts`, `blog.ts` | `lib/services/` |
| **Konfigürasyon** | `constants.ts`, `seo.ts`, `env-validation.ts` | `lib/config/` |
| **Veri** | `demo-data.ts` | `lib/data/` veya `tests/fixtures/` |
| **API** | `api.ts` | `lib/api/` (client + types ayrılabilir) |

### 12.4 Duplicate/Overlapping Fonksiyonlar

| Fonksiyon | Konum 1 | Konum 2 | Aksiyon |
|-----------|---------|---------|---------|
| `isNetworkError()` | `lib/api.ts` | `lib/utils/retry.ts` | Tek yere taşı, birini kaldır |
| `slugify()` | `lib/helpers.ts` | `components/builder/builder-utils.ts` | Kimin canonical olduğunu belirle |
| Admin auth check | `actions/admin.ts → checkIsAdmin()` | `actions/feedback.ts → requireAdmin()` | Birleştir |
| `createClient()` | `lib/supabase/client.ts` | `lib/supabase/server.ts` (alias) | İsim çakışması — `createBrowserClient` / `createServerClient` olarak ayrılmalı |

---

## 13. Genel Öncelik Matrisi

### 🔴 Hemen Düzeltilmeli (P0 — Güvenlik/Stabilite)

| # | Dosya | Sorun | Etki |
|---|-------|-------|------|
| 1 | `api.ts` | TOCTOU race condition (`getUser` vs `getSession`) | Auth bypass riski |
| 2 | `user-context.tsx` | `onAuthStateChange` subscription leak | Memory leak, çift tetikleme |
| 3 | `__tests__/api.test.ts` | Testler gerçek kodu test etmiyor | Yanlış güvenlik hissi |
| 4 | `feedback.ts` | XSS — `javascript:` URL scheme email'de | XSS saldırı vektörü |
| 5 | `use-catalog-actions.ts` | Autosave race condition | Veri kaybı/çakışma |
| 6 | `blog.ts` | Path traversal — slug sanitize edilmemiş | Sunucu dosya okuma |

### 🟡 Kısa Vadede Düzeltilmeli (P1 — Performans/Kalite)

| # | Dosya | Sorun |
|---|-------|-------|
| 1 | `feedback.ts` | N+1 sorgu — bulkDeleteFeedbacks |
| 2 | `products.ts` | N+1 sorgu — bulkUpdateProductImages |
| 3 | `use-async-timeout.ts` | useEffect dependency — progress |
| 4 | `validations/index.ts` | safeUrl/safeString XSS bypass |
| 5 | `user-context.tsx` | incrementExports stale closure |
| 6 | `storage/index.ts` | Singleton throw at import time |
| 7 | `lib/locales/` | Boş klasör — silinmeli |
| 8 | Çoklu dosya | Duplicate fonksiyonlar (isNetworkError, slugify, admin check) |

### 🟢 Planlı İyileştirme (P2 — Mimari/Refactor)

| # | Sorun |
|---|-------|
| 1 | `lib/` kök dosyalarını kategorik alt klasörlere taşı (`contexts/`, `config/`, `data/`) |
| 2 | `helpers.ts` + `image-utils.ts` → `lib/utils/` altına taşı |
| 3 | `demo-data.ts` → test fixtures'a taşı veya dev-only guard ekle |
| 4 | `constants.ts` deprecated — sil veya güncelle |
| 5 | Çeviri key'lerini tip-safe yap |
| 6 | `rate-limit.ts` — Production'da Redis'e geçiş |
| 7 | `proxy.ts` — Cookie delete mantığını DRY yap |
| 8 | `feedback.ts` — Email template'ini ayrı dosyaya çıkar |

---

> **Sonuç:** `lib/` klasörü fonksiyonel olarak çalışıyor ancak **güvenlik (TOCTOU, XSS, path traversal)**, **performans (N+1, subscription leak)** ve **organizasyon (misplaced files, duplicate code)** açılarından iyileştirme gerektiriyor. En kritik 6 sorun hemen ele alınmalı.
