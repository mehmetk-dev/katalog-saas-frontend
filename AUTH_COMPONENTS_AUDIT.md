# 🔍 Auth Components — Production Audit Report

> **Tarih:** 28 Şubat 2026  
> **Kapsam:** `components/auth/` klasörü ve tüm alt klasörleri  
> **Auditor:** Senior TypeScript/React Architect (15 yıl deneyim)  
> **Önem Seviyeleri:** 🔴 KRİTİK · 🟠 YÜKSEK · 🟡 ORTA · 🟢 DÜŞÜK

---

## 📁 Bölüm 1: Kök Dosyalar (`components/auth/`)

Dosyalar: `auth-page-client.tsx`, `auth-form.tsx`, `auth-form-new.tsx`, `onboarding-modal.tsx`, `session-watcher.tsx`

---

### 🔴 KRİTİK BULGULAR

#### 1.1 `auth-form-new.tsx` — Dead Code / Legacy Dosya (Tüm Dosya)
- **Kategori:** Kod Kalitesi / Mimari
- **Sorun:** Bu dosya `auth-form.tsx` ve `auth-sections/` ile **aynı işlevselliği** tekrarlıyor. Projede kullanılıp kullanılmadığı belirsiz — klasik bir "eski versiyon kaldı" senaryosu.
- **Risk:** Bakım maliyeti artışı, hangisinin doğru olduğu konusunda kafa karışıklığı, security patch'lerin sadece bir versiyona uygulanması.
- **Çözüm:** Bu dosyanın import edildiği yerleri tarayın. Eğer hiçbir yerde import edilmiyorsa **silin**. Eğer kullanılıyorsa, `auth-form.tsx` ile birleştirin.

```bash
# Kullanımı kontrol edin:
grep -r "auth-form-new" --include="*.tsx" --include="*.ts" .
```

#### 1.2 `auth-form-new.tsx:41` — URL Parametresinden Gelen Veri Doğrudan Render Ediliyor
- **Kategori:** Güvenlik (XSS Riski)
- **Sorun:**
```typescript
// Satır 41 — urlError doğrudan kullanıcıya gösteriliyor
setError(errorMessages[urlError] || `Hata: ${urlError}`)
```
`urlError` değeri `searchParams.get("error")` ile URL'den alınıyor ve `errorMessages` map'inde eşleşme yoksa **doğrudan** error state'ine atanıyor. React JSX varsayılan olarak escape yapar, ancak bu yine de bir **sanitization eksikliği** ve kötü pratik.
- **Risk:** Potansiyel XSS (React escape bypass senaryolarında), kullanıcıya yanıltıcı/zararlı mesaj gösterme.
- **Çözüm:**
```typescript
// Bilinmeyen URL error değerlerini sanitize edin
setError(errorMessages[urlError] || t("auth.unknownError"))
// ASLA ham URL parametresini kullanıcıya göstermeyin
```

#### 1.3 `session-watcher.tsx:19` — Supabase Client Her Render'da Yeniden Oluşuyor
- **Kategori:** Performans / Mimari
- **Sorun:**
```typescript
export function SessionWatcher() {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient() // ⚠️ Her render'da yeni instance
```
`createClient()` component body'de çağrılıyor. Bu her render'da yeni bir Supabase client instance oluşturur. Ayrıca `refreshSession` callback'i `supabase.auth`'a depend ediyor — her render'da yeni referans olduğu için callback da yeniden oluşur, bu da `useEffect`'in her render'da yeniden çalışmasına sebep olur.
- **Risk:** Bellek sızıntısı, gereksiz event listener teardown/setup döngüsü, session kontrollerinin çok sık tetiklenmesi.
- **Çözüm:**
```typescript
// useMemo ile memoize edin veya modül seviyesinde tek instance kullanın
const supabase = useMemo(() => createClient(), [])
```

---

### 🟠 YÜKSEK BULGULAR

#### 1.4 `auth-form-new.tsx` — Hardcoded Türkçe Stringler (i18n Bypass)
- **Kategori:** Kod Kalitesi
- **Sorun:** Tüm dosya boyunca i18n sistemi kullanılmamış, Türkçe stringler hardcode edilmiş:
  - `"Bu e-posta adresi zaten kayıtlı"`
  - `"Şifre en az 6 karakter olmalıdır"`
  - `"E-posta veya şifre hatalı"`
  - `"Yönlendiriliyor"`, `"Panele yönlendiriliyorsunuz..."`
- **Risk:** Çoklu dil desteği kırılır, tutarsız UX.
- **Çözüm:** Tüm stringleri `t()` fonksiyonu ile değiştirin.

#### 1.5 `onboarding-modal.tsx` — Seçim Hiçbir Yere Kaydedilmiyor
- **Kategori:** Kod Kalitesi / Dead Logic
- **Sorun:** Kullanıcı bir sektör seçiyor, `handleContinue` çağrılıyor, 800ms bekleniyor ve `/dashboard`'a yönlendiriliyor. **Seçilen sektör bilgisi hiçbir API'ye gönderilmiyor, hiçbir state'e kaydedilmiyor.**
```typescript
const handleContinue = async () => {
    if (!selected) return
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800)) // Sahte bekleme
    onOpenChange(false)
    router.push("/dashboard") // Seçim kayboldu!
}
```
- **Risk:** Kullanıcı verisi kaybı, yanıltıcı UX (kullanıcı seçim yaptığını düşünüyor).
- **Çözüm:** Ya sektör bilgisini bir API'ye gönderin (`PATCH /api/v1/users/me` gibi), ya da bu modal'ı kaldırın.

#### 1.6 `onboarding-modal.tsx` — İngilizce Hardcoded (i18n Tutarsızlığı)
- **Kategori:** Kod Kalitesi
- **Sorun:** Proje Türkçe/İngilizce i18n desteklerken, bu dosyada tüm stringler İngilizce hardcode:
  - `"What is your industry?"`, `"Furniture"`, `"Skip for now"`, `"Continue"`
- **Risk:** Türkçe kullanıcılar için kırık deneyim.

#### 1.7 `auth-form.tsx` — `onSignUpComplete` Prop'u Kullanılmıyor
- **Kategori:** Kod Kalitesi (Dead Code)
- **Sorun:**
```typescript
export function AuthForm({ onSignUpComplete: _onSignUpComplete }: AuthFormProps) {
```
`_onSignUpComplete` prefix underscore ile ignore edilmiş — hiçbir yerde çağrılmıyor.
- **Çözüm:** Interface'den ve prop'tan kaldırın veya implement edin.

---

### 🟡 ORTA BULGULAR

#### 1.8 `auth-form-new.tsx` — Supabase Client Her Submit'te Yeniden Oluşuyor
- **Kategori:** Performans
- **Sorun:** `handleSubmit` içinde `const supabase = createClient()` her çağrıda yeniden instance oluşturuluyor.
- **Çözüm:** Component seviyesinde `useMemo` ile bir kere oluşturun.

#### 1.9 `auth-form-new.tsx` — Activity Log'da PII Sızıntısı
- **Kategori:** Güvenlik
- **Sorun:**
```typescript
description: `${data.user.email} sisteme giriş yaptı`,
```
Kullanıcı e-posta adresi doğrudan `description` alanına yazılıyor. Bu log verileri admin panelinde veya üçüncü parti log servislerinde görünür durumda olabilir.
- **Çözüm:** `description` alanında PII yerine kullanıcı ID referansı kullanın:
```typescript
description: `Kullanıcı sisteme giriş yaptı`, // user_id zaten ayrı alanda
```

#### 1.10 `auth-form.tsx` — Aşırı Prop Drilling
- **Kategori:** Mimari
- **Sorun:** `AuthForm` → `AuthTabs` arasında **17+ prop** aktarılıyor. Her bir setter fonksiyonu (setSignInEmail, setSignInPassword vb.) parent'ın re-render olmasına sebep oluyor.
- **Çözüm:** Form state'ini `useReducer` veya React Context ile yönetin. Veya `react-hook-form` gibi bir form kütüphanesi kullanın.

#### 1.11 `session-watcher.tsx` — `refreshSession` Closure Sorunu
- **Kategori:** Performans / Doğruluk
- **Sorun:** `refreshSession` `useCallback` ile sarılmış ancak dependency'leri `[pathname, router, supabase.auth]`. `supabase` her render'da yeni oluştuğu için `supabase.auth` referansı da değişir → `refreshSession` her render'da yeniden oluşur → `useEffect` her render'da teardown/setup yapar.
- **Çözüm:** `supabase`'i `useMemo` ile oluşturun.

---

### 🟢 DÜŞÜK BULGULAR

#### 1.12 `auth-page-client.tsx` — Temiz Yapı ✅
- Sorumlulukları doğru delege ediyor. Sorun yok.

#### 1.13 `auth-form-new.tsx:49-55` — `getSiteUrl()` `0.0.0.0` Kontrolü
- **Kategori:** Kod Kalitesi
- **Sorun:** `0.0.0.0` → `localhost` dönüşümü Docker/WSL senaryoları için var ama production'da gereksiz çalışır.
- **Çözüm:** `NODE_ENV === 'development'` koşuluna sarın.

---

## 📁 Bölüm 2: `auth-form/` Alt Klasörü

Dosyalar: `auth-tabs.tsx`, `error-alert.tsx`, `google-auth-button.tsx`, `legal-notice.tsx`, `loading-status.tsx`, `redirect-overlay.tsx`, `status-banner.tsx`, `types.ts`, `use-auth-form-controller.tsx`

---

### 🔴 KRİTİK BULGULAR

#### 2.1 `use-auth-form-controller.tsx:67` — URL Parametresi Sanitize Edilmeden Render Ediliyor
- **Kategori:** Güvenlik (XSS / Mesaj Enjeksiyonu)
- **Sorun:** Kök dosyadaki 1.2 bulgusunun aynısı burada da mevcut:
```typescript
setError(errorMessages[urlError] || `${t("auth.errorPrefix")} ${urlError}`)
```
`urlError` URL'den `searchParams.get("error")` ile alınıyor. Map'te eşleşmezse ham değer error mesajında gösteriliyor.
- **Risk:** Kullanıcıya yanıltıcı mesaj gösterme, phishing saldırıları (ör: `?error=Hesabınız+askıya+alındı.+0555+123+4567+arayın`).
- **Çözüm:**
```typescript
// Bilinmeyen error kodlarını göstermeyin
setError(errorMessages[urlError] || t("auth.unknownError"))
```

#### 2.2 `use-auth-form-controller.tsx` — `abortControllerRef` Oluşturuluyor Ama Hiç Kullanılmıyor
- **Kategori:** Kod Kalitesi (Dead Code) + Güvenlik
- **Sorun:**
```typescript
const abortControllerRef = useRef<AbortController | null>(null)
```
Bu ref oluşturulup `startLoadingTimers`'da timeout'ta `abortControllerRef.current.abort()` çağrılıyor, ancak **hiçbir fetch/request'e bağlanmamış**. Yani abort edecek bir şey yok.
- **Risk:** Timeout olduğunda Supabase auth çağrısı hâlâ devam ediyor — kullanıcı "timeout" görse bile arka planda işlem tamamlanabilir, çift session oluşabilir.
- **Çözüm:** Supabase client AbortSignal desteklemiyorsa, en azından timeout'da state'i düzgün temizleyin ve kullanıcıya işlemin hâlâ devam edebileceğini belirtin. `abortControllerRef`'i kaldırın veya gerçekten kullanın.

#### 2.3 `use-auth-form-controller.tsx:193-198` — Race Condition: `finally` Bloğunda Stale Closure
- **Kategori:** Performans / Doğruluk
- **Sorun:**
```typescript
} finally {
    if (loadingPhase !== "redirecting") {  // ⚠️ Stale closure!
        setIsLoading(false)
    }
}
```
`loadingPhase` state değişkeni `finally` bloğunda okunuyor. Ancak `handleSignIn` fonksiyonu içinde `setLoadingPhase("redirecting")` çağrıldıktan sonra, React batching yüzünden `loadingPhase` hâlâ eski değerini tutar (closure capture). Bu yüzden koşul her zaman `true` olabilir ve redirect sırasında loading state'i yanlışlıkla kapatılabilir.
- **Çözüm:** Ref ile takip edin:
```typescript
const isRedirectingRef = useRef(false)
// redirect anında:
isRedirectingRef.current = true
// finally'de:
if (!isRedirectingRef.current) setIsLoading(false)
```

---

### 🟠 YÜKSEK BULGULAR

#### 2.4 `use-auth-form-controller.tsx` — 8 Bağımsız useState: State Patlaması
- **Kategori:** Performans / Mimari
- **Sorun:** Form alanları için 8 ayrı `useState` çağrısı var:
```typescript
const [signInEmail, setSignInEmail] = useState("")
const [signInPassword, setSignInPassword] = useState("")
const [signUpName, setSignUpName] = useState("")
const [signUpCompany, setSignUpCompany] = useState("")
const [signUpEmail, setSignUpEmail] = useState("")
const [signUpPassword, setSignUpPassword] = useState("")
```
Artı 8 ayrı yardımcı state (`isLoading`, `error`, `loadingPhase` vb.) — toplam **14 useState**.
- **Risk:** Her bir setter çağrısı bağımsız re-render tetikler. Kullanıcı bir karakter yazdığında component ağacının tamamı yeniden render olur.
- **Çözüm:**
```typescript
// useReducer ile birleştirin
const [formState, dispatch] = useReducer(authFormReducer, initialState)
```
Ya da `react-hook-form` kullanarak controlled→uncontrolled'a geçin (daha az re-render).

#### 2.5 `auth-tabs.tsx` — Prop Drilling Karmaşıklığı (17 Prop)
- **Kategori:** Mimari / Bakım
- **Sorun:** `AuthTabsProps` interface'i **17 prop** içeriyor. Bu seviyede prop drilling bakım kabusuna dönüşür.
```typescript
interface AuthTabsProps {
    defaultTab, isLoading, isGoogleLoading, isOnline, loadingPhase,
    signInEmail, signInPassword, signUpName, signUpCompany,
    signUpEmail, signUpPassword,
    onSignIn, onSignUp,
    onSignInEmailChange, onSignInPasswordChange,
    onSignUpNameChange, onSignUpCompanyChange,
    onSignUpEmailChange, onSignUpPasswordChange, t
}
```
- **Çözüm:** Prop'ları gruplayın:
```typescript
interface AuthTabsProps {
    formState: AuthFormState
    handlers: AuthFormHandlers
    uiState: AuthUIState
    t: TranslationFn
}
```

#### 2.6 `use-auth-form-controller.tsx` — Activity Log'da PII Sızıntısı
- **Kategori:** Güvenlik
- **Sorun:** (Kök dosya bulgsu 1.9 ile aynı) Sign-in ve sign-up handler'larında:
```typescript
description: `${signInData.user.email || signInEmail} sisteme giriş yaptı`,
description: `${data.user.email || signUpEmail} yeni hesap oluşturdu`,
```
- **Çözüm:** User email'i `description` yerine sadece `user_email` alanında tutun; description jenerik olsun.

#### 2.7 `redirect-overlay.tsx` — Hardcoded Türkçe + Duplikasyon
- **Kategori:** Kod Kalitesi
- **Sorun:**
```tsx
<p className="text-sm text-muted-foreground">Panele yönlendiriliyorsunuz...</p>
```
i18n ile `t("auth.redirecting")` kullanılırken hemen altında hardcoded Türkçe string var. Ayrıca `auth-sections/redirect-overlay.tsx` ile neredeyse aynı component — **DRY ihlali**.
- **Çözüm:** Tek bir `RedirectOverlay` component'i oluşturun ve her iki yerden import edin. Hardcoded string'i `t()` ile değiştirin.

---

### 🟡 ORTA BULGULAR

#### 2.8 `use-auth-form-controller.tsx` — Sign-in ve Sign-up Arasında Ayrı Email/Password State'leri
- **Kategori:** Kod Kalitesi / UX
- **Sorun:** Sign-in ve sign-up formları için **ayrı** email ve password state'leri var (`signInEmail` ≠ `signUpEmail`). Kullanıcı sign-in tab'ında email yazar, sign-up'a geçerse email kaybolur.
- **Çözüm:** Tek bir `email` ve `password` state'i kullanın, mod değiştiğinde sadece ekstra alanları temizleyin.

#### 2.9 `use-auth-form-controller.tsx:120-130` — Timer Cleanup Pattern Anti-Pattern
- **Kategori:** Kod Kalitesi
- **Sorun:**
```typescript
useEffect(() => {
    const timeoutId = timeoutRef.current    // Snapshot anındaki değer
    const slowConnectionId = slowConnectionRef.current
    const abortController = abortControllerRef.current
    return () => {
        if (timeoutId) clearTimeout(timeoutId)        // Stale olabilir
        if (slowConnectionId) clearTimeout(slowConnectionId)
        if (abortController) abortController.abort()
    }
}, [])
```
Effect mount anında ref değerleri null'dır (henüz timer başlatılmamış). Unmount'ta temizlenecek değerler zaten null olacaktır. Timer'lar `startLoadingTimers` tarafından **sonradan** oluşturulur — bu cleanup onları yakalayamaz.
- **Çözüm:**
```typescript
useEffect(() => {
    return () => {
        // Ref'in GÜNCEL değerini oku
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (slowConnectionRef.current) clearTimeout(slowConnectionRef.current)
    }
}, [])
```

#### 2.10 `legal-notice.tsx` — Kırılgan Dil Kontrolü
- **Kategori:** Kod Kalitesi
- **Sorun:**
```typescript
{language === "tr" ? ( /* Türkçe JSX */ ) : ( /* İngilizce JSX */ )}
```
Sadece 2 dil destekler. Üçüncü bir dil eklendiğinde default olarak İngilizce gösterir — bu doğru bir fallback olabilir ama explicit değil.
- **Çözüm:** i18n key'lerini kullanarak tamamen translation'a taşıyın veya en azından bir yorum ekleyin.

#### 2.11 `types.ts` — `TranslationFn` Tip Güvenliği Zayıf
- **Kategori:** TypeScript
- **Sorun:**
```typescript
export type TranslationFn = (key: string) => string
```
`key` tamamen `string` — herhangi bir typo compile-time'da yakalanmaz.
- **Çözüm:** Translation key'lerinizi union type olarak tanımlayın:
```typescript
type TranslationKey = "auth.signin" | "auth.signup" | "auth.email" | ...
export type TranslationFn = (key: TranslationKey) => string
```

---

### 🟢 DÜŞÜK BULGULAR

#### 2.12 `error-alert.tsx` — Temiz ✅
- Sorumluluk tek, props minimal, hata yok.

#### 2.13 `google-auth-button.tsx` — Temiz ✅
- Presentational component, iyi yapılandırılmış.

#### 2.14 `status-banner.tsx` — Temiz ✅
- Null-return pattern doğru uygulanmış.

#### 2.15 `loading-status.tsx` — Temiz ✅
- Proper conditional rendering, renk mantığı tutarlı.

---

## 📁 Bölüm 3: `auth-sections/` Alt Klasörü

Dosyalar: `auth-form.tsx`, `hero-panel.tsx`, `index.ts`, `redirect-overlay.tsx`, `types.ts`, `use-auth.ts`

---

### 🔴 KRİTİK BULGULAR

#### 3.1 `use-auth.ts:339-348` — Kullanıcı Enumeration Zafiyeti
- **Kategori:** Güvenlik
- **Sorun:**
```typescript
const checkProvider = useCallback(async (emailAddr: string): Promise<ProviderInfo> => {
    const response = await fetch(`${API_URL}/auth/check-provider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sanitizedEmail }),
    })
    // response: { exists: true/false, isOAuth: true/false, provider: "google" }
```
Bu endpoint bir e-posta adresinin sistemde kayıtlı olup olmadığını **açıkça** söylüyor (`exists: true/false`). Saldırgan, e-posta listesini bu endpoint'e karşı brute-force ederek registered user'ları tespit edebilir.
- **Risk:** OWASP'de listelenen "User Enumeration" zafiyeti. Brute-force, credential stuffing ve hedefli phishing saldırılarına zemin hazırlar.
- **Çözüm:**
  - Backend'de `check-provider` endpoint'ini rate-limit'leyin (agresif: 3 req/dk/IP).
  - Dönüş değerinde `exists` alanını kaldırın. Kayıtlı olmayan kullanıcılar için de "şifre sıfırlama linki gönderildi" mesajı gösterin.
  - CAPTCHA ekleyin.

#### 3.2 `auth-form.tsx` — 476 Satırlık Dev Component (SRP İhlali)
- **Kategori:** Mimari / Bakım
- **Sorun:** Bu dosya TEK bir component'te şunları barındırıyor:
  1. Form rendering (sign-in, sign-up, forgot-password)
  2. Google OAuth warning UI
  3. Password success state UI
  4. Error display logic
  5. SVG dekoratif elementler (dalga efekti)
  6. `inputCls` yardımcı fonksiyonu
  7. `GoogleIcon` alt component'i
  8. Mode switching logic
  9. Back button navigasyonu
- **Risk:** Bakım kabusuna dönüşür, test edilemez, bir kısmı değiştirildiğinde tüm form etkilenir.
- **Çözüm:** Şu parçalara bölün:
  - `AuthFormHeader.tsx` — başlık, açıklama, back button
  - `AuthFormFields.tsx` — input alanları
  - `AuthFormActions.tsx` — submit, Google, mode switcher
  - `AuthFormAlerts.tsx` — error, success, Google warning

---

### 🟠 YÜKSEK BULGULAR

#### 3.3 `auth-form.tsx` — `inputCls` Fonksiyonu Her Render'da Yeniden Oluşuyor
- **Kategori:** Performans
- **Sorun:**
```typescript
export function AuthForm({ t, state, handlers }: AuthFormProps) {
    // ...
    const inputCls = (hasError: boolean, isShaking: boolean, extra?: string) =>
        cn(/* ... */)
```
Bu fonksiyon `AuthForm`'un her render'ında yeniden oluşturulur. `cn()` çağrıları da her seferinde yapılır.
- **Çözüm:** Component dışına taşıyın (pure function, state'e bağımlı değil):
```typescript
// Dosyanın en üstüne taşıyın
const inputCls = (hasError: boolean, isShaking: boolean, extra?: string) =>
    cn(/* ... */)
```

#### 3.4 `auth-form.tsx` — GoogleIcon Duplikasyonu
- **Kategori:** Kod Kalitesi (DRY İhlali)
- **Sorun:** `GoogleIcon` component'i bu dosyada inline tanımlanmış. Aynı SVG `auth-form/google-auth-button.tsx`'te de var. İki ayrı yerde aynı ikon — biri değiştirildiğinde diğeri eski kalır.
- **Çözüm:** Tek bir `GoogleIcon` component'i oluşturup `components/ui/icons/` altına koyun, her iki yerden import edin.

#### 3.5 `hero-panel.tsx` — Dış Kaynak Görseli (Unsplash) + `unoptimized` Flag
- **Kategori:** Performans / Güvenlik
- **Sorun:**
```tsx
<NextImage
    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
    alt="Background"
    fill
    className="object-cover"
    unoptimized  // ⚠️ Next.js image optimization devre dışı
/>
```
1. **Performans:** `unoptimized` flag Next.js'in otomatik WebP dönüşümü, lazy loading ve responsive srcset özelliklerini devre dışı bırakır. 2564px genişliğinde ham JPEG yüklenir.
2. **Güvenlik/Güvenilirlik:** Unsplash URL'si üçüncü parti servise bağımlılık oluşturur. Unsplash URL yapısı değişirse veya hizmet kesilirse görsel kaybolur.
3. **Maliyet:** Her sayfa yüklemesinde Unsplash'ten yüksek çözünürlüklü görsel çekilir.
- **Çözüm:**
  - Görseli self-host edin (`public/images/auth-hero.webp`).
  - `unoptimized` flag'ini kaldırın.
  - `next.config.mjs`'de Unsplash domain'i tanımlıysa bile lokal kopyayı tercih edin.

#### 3.6 `hero-panel.tsx` — Hardcoded Türkçe Stringler
- **Kategori:** Kod Kalitesi
- **Sorun:**
```tsx
<h2>Müşterilerinizi Etkileyen Kataloglar Hazırlayın</h2>
// ...
"Excel ile Toplu Ürün Yükleme",
"WhatsApp Sipariş Entegrasyonu"
```
i18n sistemi `t()` fonksiyonuyla kullanılırken bazı stringler hardcoded. Feature listesinde 3 tanesi `t()` ile gelirken 2 tanesi hardcoded — tutarsız.
- **Çözüm:** Tüm stringleri `t()` ile çevirin:
```tsx
t('marketing.feature4'), // "Excel ile Toplu Ürün Yükleme"
t('marketing.feature5'), // "WhatsApp Sipariş Entegrasyonu"
```

#### 3.7 `use-auth.ts` — `handleSubmit` İçinde `handleForgotPassword`'a Return Delegation
- **Kategori:** Mimari / Potansiyel Race Condition
- **Sorun:**
```typescript
const handleSubmit = useCallback(async (e: React.FormEvent) => {
    // ...
    if (mode === "forgot-password") {
        return handleForgotPassword(e)  // ⚠️ Delegasyon
    }
    setIsLoading(true)
    // ...
```
`handleForgotPassword` da bir async fonksiyon ve kendi `setIsLoading` çağrılarını yapıyor. İki handler arasında loading state yönetimi bölünmüş durumda. `handleSubmit`'in try/finally bloğu `handleForgotPassword` üzerinde etkili olmuyor (early return).
- **Risk:** `handleForgotPassword` bir hata fırlatırsa `handleSubmit`'in finally bloğu bunu görmez gerçi çünkü `return` ile delegasyon yapılıyor — ama bu akış karmaşık ve kırılgan.
- **Çözüm:** `handleForgotPassword`'ı ayrı bir form submit handler olarak bağlayın, veya `handleSubmit` içinde açıkça çağırırken try/catch ile sarın.

---

### 🟡 ORTA BULGULAR

#### 3.8 `redirect-overlay.tsx` — Duplikasyon (auth-form/redirect-overlay.tsx ile)
- **Kategori:** Kod Kalitesi (DRY)
- **Sorun:** İki farklı `RedirectOverlay` component'i neredeyse aynı işi yapıyor:
  - `auth-form/redirect-overlay.tsx`: BookOpen ikon, primary renk
  - `auth-sections/redirect-overlay.tsx`: Loader2 ikon, backdrop-blur
- **Çözüm:** Tek bir component, variant prop'u ile farklılaştırın.

#### 3.9 `types.ts` — `TranslateFn` ≠ `TranslationFn` Tip Tutarsızlığı
- **Kategori:** TypeScript
- **Sorun:** `auth-form/types.ts`'de `TranslationFn`, `auth-sections/types.ts`'de `TranslateFn` — iki farklı isimle aynı şeyi tanımlıyor:
```typescript
// auth-form/types.ts
export type TranslationFn = (key: string) => string

// auth-sections/types.ts
export type TranslateFn = (key: string, params?: Record<string, unknown>) => string
```
`TranslateFn` opsiyonel `params` parametresi destekliyor, `TranslationFn` desteklemiyor. İkisi uyumsuz.
- **Çözüm:** Tek bir tip tanımlayın ve her iki yerden import edin. `params` destekleyen versiyonu tercih edin.

#### 3.10 `use-auth.ts` — `createClient()` Callback'ler İçinde Çoklu Çağrı
- **Kategori:** Performans
- **Sorun:** `handleForgotPassword`, `handleSignUp`, `handleSignIn`, `handleGoogleAuth`, `handleContinueAnyway`, `handleAuthSessionRedirect` — her birinde ayrı ayrı `createClient()` çağrılıyor. Toplam **6 yerde** yeni Supabase client instance oluşturuluyor.
- **Risk:** Her çağrıda yeni GoTrue/PostgREST client bootstrap'ı yapılır.
- **Çözüm:** Hook seviyesinde bir kere `useMemo(() => createClient(), [])` ile oluşturup tüm callback'lerde kullanın.

#### 3.11 `use-auth.ts` — `checkProvider` Rate Limiting Eksikliği
- **Kategori:** Güvenlik
- **Sorun:** `checkProvider` fonksiyonu herhangi bir client-side throttle/debounce olmadan çağrılabiliyor. Forgot-password akışında her submit'te çağrılıyor.
- **Çözüm:** Client-side debounce veya son X saniye içinde aynı email için cache ekleyin.

#### 3.12 `auth-form.tsx` — `t()` Dönüş Değerinde `as string` Zorlaması
- **Kategori:** TypeScript
- **Sorun:** Dosya boyunca `t("key") as string` pattern'ı tekrarlanıyor (30+ kez). Bu, `t()` fonksiyonunun dönüş tipinin `string` olmadığını gösteriyor — tip tanımı zayıf.
- **Çözüm:** `TranslateFn` tipini doğru tanımlayın. `t()` zaten string dönüyorsa `as string` gereksiz; dönmüyorsa tip düzeltin.

---

### 🟢 DÜŞÜK BULGULAR

#### 3.13 `index.ts` — Temiz Barrel Export ✅

#### 3.14 `use-auth.ts` — İyi Pratikler ✅
- `sanitizeText()`, `sanitizeErrorToken()`, `safeDecodeURIComponent()` gibi yardımcı fonksiyonlar iyi güvenlik pratikleri.
- URL'den hata parametrelerini temizleme (`removeAuthErrorParamsFromUrl`) doğru uygulanmış.
- `validateAuthFields` ile client-side validation mevcut.
- Error mapping stratejisi (strategy pattern) bakım kolaylığı sağlıyor.

---

## 📊 Genel Özet Tablosu

| Klasör | 🔴 Kritik | 🟠 Yüksek | 🟡 Orta | 🟢 Düşük | Toplam |
|--------|-----------|-----------|---------|----------|--------|
| **Kök (`auth/`)** | 3 | 4 | 3 | 2 | **12** |
| **`auth-form/`** | 3 | 4 | 4 | 4 | **15** |
| **`auth-sections/`** | 2 | 5 | 5 | 2 | **14** |
| **TOPLAM** | **8** | **13** | **12** | **8** | **41** |

---

## 🎯 Öncelikli Aksiyon Planı — Uygulama Durumu

> **Son Güncelleme:** 28 Şubat 2026  
> ✅ = Tamamlandı · ⏭️ = Atlandı (risk nedeniyle) · ⬜ = Bekliyor

### Sprint 1 — Kritik Düzeltmeler ✅ TAMAMLANDI
1. ✅ `auth-form-new.tsx` dosyası **silindi** — dead code temizlendi (bulgu 1.1, 1.4, 1.8, 1.9)
2. ✅ URL parametresi sanitization düzeltildi — bilinmeyen hata kodları artık `t("auth.unexpectedError")` ile gösteriliyor (bulgu 1.2, 2.1)
3. ✅ `session-watcher.tsx`'te `createClient()` `useMemo` ile memoize edildi (bulgu 1.3, 1.11)
4. ✅ `use-auth-form-controller.tsx` — stale closure düzeltildi: `isRedirectingRef` eklendi, `finally` bloğunda ref kullanılıyor (bulgu 2.3)
5. ✅ Timer cleanup pattern düzeltildi — unmount'ta ref'in güncel değeri okunuyor (bulgu 2.9)
6. ✅ `abortControllerRef` kaldırıldı, yerine `isRedirectingRef` kullanılıyor (bulgu 2.2)

### Sprint 2 — Yüksek Öncelikli İyileştirmeler ✅ TAMAMLANDI
7. ✅ `auth-form.tsx` — `onSignUpComplete` dead prop kaldırıldı (bulgu 1.7, 2.2)
8. ✅ Activity log'lardan PII kaldırıldı — email yerine jenerik mesajlar (bulgu 1.9, 2.6)
9. ✅ `GoogleIcon` — tek paylaşılan component oluşturuldu (`components/auth/google-icon.tsx`), her iki auth-form'dan import edildi (bulgu 3.4, 2.7 kısmen)
10. ✅ `auth-sections/auth-form.tsx` — `inputCls` fonksiyonu component dışına taşındı (bulgu 3.3)
11. ⏭️ Sign-in/Sign-up state birleştirme ATLANDIdı — `AuthTabs` 17-prop interface'ini kırmamak için (bulgu 2.8)
12. ✅ `TranslationFn` tipi güncellendi: `params` opsiyonel parametresi eklendi (bulgu 2.11, 3.9)

### Sprint 3 — i18n & Performans ✅ TAMAMLANDI
13. ✅ Tüm hardcoded stringler i18n'e taşındı:
    - `hero-panel.tsx` başlık → `t('marketing.authHeroTitle')` (bulgu 3.6)
    - `hero-panel.tsx` feature4/5 → `t('marketing.feature4/5')` (bulgu 3.6)
    - `redirect-overlay.tsx` → `t('auth.redirectingDesc')` (bulgu 2.7)
    - `onboarding-modal.tsx` → tüm stringler i18n'e taşındı (bulgu 1.6)
    - Yeni çeviri key'leri eklendi: `auth.ts` (onboarding), `public-pages.ts` (marketing)
14. ✅ `use-auth.ts` — 6 ayrı `createClient()` çağrısı kaldırıldı, tek `useMemo` ile hook seviyesinde memoize edildi (bulgu 3.10)
15. ✅ Unsplash görseli self-host edildi (`/auth-hero-bg.webp`), `unoptimized` flag kaldırıldı, `priority` eklendi (bulgu 3.5)

### Hâlâ Bekleyen Maddeler ⬜
- ⬜ `check-provider` endpoint rate limiting (backend tarafı) (bulgu 3.1)
- ⬜ `auth-sections/auth-form.tsx` 476 satırı 4-5 dosyaya parçalama (bulgu 3.2)
- ⬜ State'leri `useReducer` veya `react-hook-form` ile birleştirme (bulgu 2.4, 2.5)
- ⬜ `onboarding-modal.tsx` — seçim bilgisini API'ye gönderme veya modal'ı kaldırma (bulgu 1.5)
- ⬜ İki `RedirectOverlay` component'ini tek variant-based component'e birleştirme (bulgu 3.8)
- ⬜ `TranslationFn` için union type key'ler (bulgu 2.11 genişletme)
- ⬜ `handleSubmit` ↔ `handleForgotPassword` delegasyon karmaşıklığını düzeltme (bulgu 3.7)
- ⬜ `checkProvider` client-side debounce/throttle (bulgu 3.11)
- ⬜ `t()` dönüşlerindeki `as string` zorlamalarını kaldırma (bulgu 3.12)

---

> **Not:** Bu rapor statik kod analizi ve mimari incelemeye dayanmaktadır. Runtime profiling, penetration testing ve load testing ile desteklenmesi önerilir.
