# Components & UI Audit Report

> **Tarih:** 28 Şubat 2026  
> **Kapsam:** `components/error-boundary.tsx`, `components/home-page-title-updater.tsx`, `components/theme-provider.tsx` ve `components/ui/*` (31 dosya)  
> **Denetçi:** Senior TypeScript/React Architect — 15 yıllık deneyim, güvenlik odaklı  
> **Metodoloji:** Performans → Güvenlik → Kod Kalitesi → Mimari (her klasör/dosya için)

---

## İçindekiler

1. [components/ (Root Dosyalar)](#1-components-root-dosyalar)
2. [components/ui/ — Shadcn/Radix Primitives](#2-componentsui--shadcnradix-primitives)
3. [components/ui/ — Custom Bileşenler (İş Mantığı İçerenler)](#3-componentsui--custom-bileşenler)
4. [Genel Özet & Öncelikli Aksiyon Planı](#4-genel-özet--öncelikli-aksiyon-planı)

---

## 1. components/ (Root Dosyalar)

### 1.1 `error-boundary.tsx`

#### Performans

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **Her render'da yeniden oluşan fonksiyonlar** | `handleReset`, `handleReload`, `handleGoHome` metotları class component'te arrow function olarak tanımlı. Bu, class component için kabul edilebilir bir pattern'dir (bound methods). Ancak `ErrorContent` fonksiyonel bileşeninde `onReload` ve `onGoHome` prop olarak iletiliyor, bu prop'lar her error durumunda yeni referanslar alır. Kritik bir performans etkisi yoktur çünkü error state'i nadiren tetiklenir. |

#### Güvenlik

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🔴 YÜKSEK | **Hata mesajı iç detayları sızdırabilir** | `process.env.NODE_ENV === 'development'` koşuluyla korunuyor ancak `NODE_ENV` runtime'da client bundle'ına nasıl iletildiğine bağlı. Next.js bu değeri derleme zamanında inline eder, bu yüzden production build'de doğru çalışır. Yine de `error.message` içinde stack trace veya veritabanı bağlantı bilgisi bulunabilir. **Öneri:** Development modunda bile `error.message`'ı truncate edin (max 500 karakter). |
| 🟡 ORTA | **`window.location.href = '/'` open redirect riski yok** | Sabit string olduğu için güvenli. Ancak gelecekte dinamik değer alırsa risk oluşturur. Mevcut haliyle kabul edilebilir. |

#### Kod Kalitesi

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **Yorum satırındaki Sentry kodu (dead code)** | `componentDidCatch` içinde Sentry entegrasyonu yorum satırında. Ya temizlenmeli ya da aktifleştirilmeli. Production'da hata takibi yapılmıyor demek. |
| 🟡 ORTA | **`ErrorContent` içinde `useTranslation` hook'u** | Class component'lerin `render()` metodundan çağrılan fonksiyonel bileşende hook kullanmak geçerlidir, ancak error boundary'nin kendisi hata yakalayıcıyken, `useTranslation` context'i de hatalıysa sonsuz döngü riski var. **Öneri:** `ErrorContent`'i try/catch ile sarın veya translation'lar için fallback string'leri zorunlu tutun (zaten `||` ile yapılmış — iyi). |
| 🟢 DÜŞÜK | **`getDerivedStateFromError` return tipi** | `errorInfo: null` döndürüyor ama `State` interface'inde `errorInfo: React.ErrorInfo | null` tanımlı, tutarlı. |

#### Mimari

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **Test edilebilirlik** | `window.location.reload()` ve `window.location.href` doğrudan çağrılıyor. Dependency injection eksik. **Öneri:** `onReload` ve `onGoHome` callback'lerini prop olarak kabul edin veya bir `navigationService` inject edin. |

---

### 1.2 `home-page-title-updater.tsx`

#### Performans

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟢 DÜŞÜK | **`useEffect` bağımlılıkları** | `[language, t]` — `t` fonksiyonu her render'da yeni referans alıyorsa bu effect gereksiz yere tetiklenir. Ancak etkisi sadece `document.title` ataması, bu yüzden pratik performans sorunu yok. **Öneri:** `language` tek başına yeterli bağımlılık olabilir, `t` kaldırılabilir. |

#### Güvenlik

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **XSS riski — `document.title` ataması** | `t('common.siteTitle')` çıktısı kontrol edilmeden doğrudan `document.title`'a atanıyor. `document.title` HTML olarak render edilmez, bu yüzden XSS riski minimal. Ancak translation dosyasına kötü niyetli metin enjekte edilirse tarayıcı tab'ında gösterilir. **Risk seviyesi düşük.** |

#### Kod Kalitesi

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟢 DÜŞÜK | **Minimal ve temiz** | Bileşen sadece bir iş yapıyor (SRP uyumlu). `return null` doğru pattern. |

---

### 1.3 `theme-provider.tsx`

#### Performans / Güvenlik / Kod Kalitesi

| Seviye | Sorun | Detay |
|--------|-------|-------|
| ✅ | **Sorun yok** | Standart next-themes wrapper. Thin wrapper pattern doğru uygulanmış. Tip güvenliği tam (`ThemeProviderProps`). |

---

## 2. components/ui/ — Shadcn/Radix Primitives

Bu bölümdeki dosyalar büyük ölçüde **shadcn/ui** tarafından generate edilmiş standart bileşenlerdir. Genel değerlendirme:

### İncelenen Dosyalar

`alert.tsx`, `alert-dialog.tsx`, `avatar.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `checkbox.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `input.tsx`, `label.tsx`, `popover.tsx`, `progress.tsx`, `radio-group.tsx`, `scroll-area.tsx`, `select.tsx`, `separator.tsx`, `skeleton.tsx`, `slider.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `tooltip.tsx`

#### Performans

| Seviye | Sorun | Detay |
|--------|-------|-------|
| ✅ | **Genel durum iyi** | Shadcn bileşenleri başlık düzeyinde sorun yok. `cn()` utility doğru kullanılıyor. `cva` ile variant yönetimi verimli. |
| 🟡 ORTA | **Stil tutarsızlığı: `forwardRef` vs. function component** | `popover.tsx`, `radio-group.tsx`, `scroll-area.tsx`, `sheet.tsx`, `slider.tsx` dosyaları eski `React.forwardRef` pattern'ini kullanırken, diğer tüm dosyalar yeni React 19 function component pattern'ini kullanıyor (`React.ComponentProps<>`). Bu karma yapı kafa karıştırıcı ve bakım zorlaştırır. **Öneri:** Tüm bileşenleri React 19 function pattern'ine geçirin. |

#### Güvenlik

| Seviye | Sorun | Detay |
|--------|-------|-------|
| ✅ | **Risk yok** | Bu bileşenler yalnızca UI primitive'leridir. Kullanıcı girdisi işlemezler. |

#### Kod Kalitesi

| Seviye | Sorun | Detay | Dosya(lar) |
|--------|-------|-------|------------|
| 🟡 ORTA | **`dialog.tsx` — `aria-describedby={undefined}`** | `DialogContent` bileşeninde `aria-describedby` zorunlu olarak `undefined` yapılmış. Bu, Radix'in accessibility uyarısını bastırır ama eğer `DialogDescription` kullanılmazsa erişilebilirlik bozulur. **Öneri:** Prop olarak dışarıdan geçirilebilir yapın veya sadece `DialogDescription` yokken `undefined` olacak şekilde koşullu yapın. | `dialog.tsx` |
| 🟡 ORTA | **`switch.tsx` — Hardcoded renk** | `data-[state=checked]:bg-[#cf1414]` — kırmızı renk hardcoded. Tema sistemiyle uyumsuz, dark mode'da çalışır ama design token'ı yok. **Öneri:** `bg-primary` veya custom CSS variable kullanın. | `switch.tsx` |
| 🟡 ORTA | **`tooltip.tsx` — Export eksik** | `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent` tanımlı ama dosya sonunda `export` statement yok/kesik. Bu runtime hataya neden olabilir. **Doğrulama gerekir.** | `tooltip.tsx` |
| 🟢 DÜŞÜK | **`slider.tsx` — `value` optional chaining sorunu** | `props.value?.map(...)` ile thumb render ediliyor. Eğer `value` undefined ise fallback olarak tek `Thumb` render ediliyor (`||` ile). Bu pattern çalışır ama `defaultValue` ile kullanıldığında `props.value` undefined kalır ve her zaman tek thumb gösterir. **Öneri:** `value` veya `defaultValue`'yu kontrol edin. | `slider.tsx` |

#### Mimari

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **Tutarsız API yüzeyi** | Bazı bileşenlerde custom prop'lar var (`dialog.tsx` → `showCloseButton`, `select.tsx` → `size`), diğerleri tamamen shadcn varsayılanı. Tip tanımları tutarsız — bazıları inline, bazıları ayrı interface. **Öneri:** Custom prop'lar için tutarlı bir naming convention belirleyin. |
| 🟢 DÜŞÜK | **`sheet.tsx` Radix Dialog'u Sheet olarak kullanıyor** | `@radix-ui/react-dialog` import edip Sheet olarak kullanmak shadcn pattern'idir, sorun yok. Ancak `SheetPortal` export ediliyor ama `SheetPrimitive.Portal`'a `data-slot` atanmamış. Tutarsızlık. |

---

## 3. components/ui/ — Custom Bileşenler (İş Mantığı İçerenler)

### 3.1 `image-lightbox.tsx`

#### Performans

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🔴 YÜKSEK | **Agresif prefetching — gizli `<img>` ile 40+ görsel önceden yükleniyor** | `state.allCatalogImages?.slice(0, 40)` ile gizli div'de 40 adet img tag'i render ediliyor. Bu, lightbox her açıldığında 40 HTTP isteği başlatır. Büyük kataloglarda bant genişliğini tüketir ve mobil kullanıcılarda veri planını yakar. **Öneri:** `IntersectionObserver` veya `requestIdleCallback` ile lazy prefetch yapın. En fazla next/prev görselleri (2 adet) prefetch edin. |
| 🟡 ORTA | **`useEffect` bağımlılıkları — `closeLightbox`, `nextImage`, `prevImage`** | Bu fonksiyonlar context'ten geliyor. Eğer context her render'da yeni referans veriyorsa, keydown listener her render'da yeniden bağlanır. **Öneri:** Context fonksiyonlarının `useCallback` ile stabilize edildiğinden emin olun. |
| 🟡 ORTA | **`key={currentIndex}` ile tüm image div yeniden mount ediliyor** | Her görsel değişikliğinde animasyon için faydalı ancak DOM node'u tamamen yok edilip yeniden oluşturuluyor. Büyük görsellerde GC (garbage collection) baskısı yaratır. |

#### Güvenlik

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **URL sanitizasyonu yok** | `images` array'indeki URL'ler doğrulama/sanitizasyon olmadan `src` olarak kullanılıyor. Eğer bir kullanıcı zararlı URL enjekte ederse (ör: `javascript:` scheme — img src için geçersiz ama dikkat gerektirir), sorun olabilir. `getCloudinaryResizedUrl` fonksiyonu muhtemelen sadece string manipülasyonu yapıyor. **Öneri:** URL'lerin `https://` ile başladığını doğrulayan bir guard ekleyin. |
| 🟢 DÜŞÜK | **`productName` XSS** | `productName` doğrudan JSX text node'u olarak render ediliyor. React otomatik escape ettiği için güvenli. `alt` attribute'ünde de doğrudan kullanılıyor — bu da güvenli. |

#### Kod Kalitesi

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🔴 YÜKSEK | **SRP ihlali — Tek dosyada çok fazla sorumluluk** | Klavye kontrolü, zoom yönetimi, prefetching, navigasyon, portal rendering hepsi tek bileşende. ~230 satır. **Öneri:** `useLightboxKeyboard`, `useLightboxZoom`, `LightboxPrefetcher` gibi alt modüllere bölün. |
| 🟡 ORTA | **`onLoadingComplete` deprecated** | Next.js'de `onLoadingComplete` deprecated edildi. `onLoad` kullanılmalı. |
| 🟡 ORTA | **Magic number'lar** | `1600`, `1200`, `40`, `0.5`, `3` gibi sayılar açıklanmadan kullanılıyor. **Öneri:** Constant'lara çıkarın: `const MAX_PREFETCH = 40`, `const ZOOM_STEP = 0.5`, `const MAX_ZOOM = 3`. |
| 🟡 ORTA | **Hardcoded Türkçe string'ler** | `"Uzaklaştır"`, `"Yakınlaştır"`, `"Kapat"`, `"Önceki görsel"`, `"Sonraki görsel"`, `"Ürün görseli"` — i18n sistemi kullanılmamış. **Öneri:** `useTranslation` ile çeviri ekleyin. |

#### Mimari

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🔴 YÜKSEK | **UI bileşeni `lib/contexts/lightbox-context`'e sıkı bağımlı** | `useLightbox` hook'u doğrudan import ediliyor. Bu bileşen `components/ui/` altında olmamalı çünkü business logic taşıyor (context bağımlılığı, Cloudinary URL dönüşümü). **Öneri:** `components/catalogs/` veya `components/shared/` altına taşıyın. `ui/` klasörü sadece generic, context-agnostic primitive'ler içermeli. |
| 🟡 ORTA | **Test edilemezlik** | `createPortal(lightboxContent, document.body)` — `document.body` doğrudan kullanılıyor. Test ortamında mock gerektirir. `useLightbox` bağımlılığı nedeniyle unit test yazmak zor. |

---

### 3.2 `product-image-gallery.tsx`

#### Performans

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🔴 YÜKSEK | **Gizli `<img>` ile prefetching** | `allImages.slice(1)` ile kalan tüm görseller gizli div'de render ediliyor. 5 görsellik bir ürün için sorun yok ama template grid'inde 50+ ürün varsa bu 50*4 = 200 gizli img tag'i demek. **Öneri:** Prefetching'i kaldırın veya sadece hover/focus'ta next görseli prefetch edin. `loading="lazy"` kullanılmış ama browser davranışına bağımlı. |
| 🟡 ORTA | **`allImages` memoization bağımlılıkları** | `[product.image_url, product.images]` — eğer parent her render'da yeni `product` nesnesi oluşturuyorsa, `images` array referansı değişir ve memo boşa gider. **Öneri:** Parent'ta `product` nesnesinin stabilize edildiğinden emin olun. |
| 🟢 DÜŞÜK | **`includes()` ile duplicate check** | `images.includes(img)` O(n) karmaşıklık. Küçük diziler için sorun değil (max 5-6 görsel). |

#### Güvenlik

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **URL sanitizasyonu yok** | `image-lightbox.tsx` ile aynı sorun. `product.image_url` ve `product.images[]` URL'leri doğrulanmadan kullanılıyor. |

#### Kod Kalitesi

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **Hardcoded Türkçe string'ler** | `"Önceki görsel"`, `"Sonraki görsel"`, `"Görsel X"` — i18n eksik. |
| 🟡 ORTA | **`eslint-disable` comment** | `/* eslint-disable @next/next/no-img-element */` — ESLint kuralı devre dışı bırakılmış. Prefetching için `<img>` kullanılıyor. Prefetching kaldırılırsa bu da gereksiz kalır. |
| 🟢 DÜŞÜK | **`ProductImage` wrapper** | `Omit<>` ile basitleştirilmiş API, iyi pattern. |

#### Mimari

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🔴 YÜKSEK | **UI klasöründe business logic** | `components/ui/` altında `Product` tipine ve `lightbox-context`'e bağımlı bileşen var. Bu, `ui/` klasörünün semantik amacını bozar. **Öneri:** `components/products/` veya `components/shared/` altına taşıyın. |

---

### 3.3 `network-status-banner.tsx`

#### Performans

| Seviye | Sorun | Detay |
|--------|-------|-------|
| ✅ | **İyi** | Early return pattern kullanılmış. Online + hızlı bağlantıda `null` dönüyor. |

#### Güvenlik

| Seviye | Sorun | Detay |
|--------|-------|-------|
| ✅ | **Risk yok** | Sadece statik text gösteriyor. |

#### Kod Kalitesi

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **Hardcoded Türkçe string'ler** | `"İnternet bağlantısı yok - Çevrimdışı moddasınız"` ve `"Yavaş bağlantı algılandı"` — i18n kullanılmamış. |
| 🟢 DÜŞÜK | **Emoji kullanımı** | `📡` ve `🐢` emoji'leri erişilebilirlik açısından screen reader'lar tarafından okunabilir. `aria-label` eklenmesi düşünülebilir. |
| 🟡 ORTA | **Yazım hatası** | `"Çevrimdışı moddasınız"` → doğrusu `"Çevrimdışı moddAsınız"` değil `"Çevrimdışı modasınız"` (tek 'd'). |

#### Mimari

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **`ui/` klasöründe hook bağımlılığı** | `use-network-status` hook'una bağımlı. Generic UI primitive değil. `components/layout/` altı daha uygun olur. |

---

### 3.4 `pdf-progress-modal.tsx`

#### Performans

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **Her render'da `phaseLabels` ve `phaseIcons` nesneleri yeniden oluşuyor** | Bu objeler bileşen her render edildiğinde yeni referanslar alır. PDF export sırasında progress sık güncellenir (her sayfa için). **Öneri:** `phaseIcons`'ı bileşen dışına çıkarın (sabit). `phaseLabels` dinamik parametreler nedeniyle dışarı çıkarılamaz ama `useMemo` ile sarılabilir. |

#### Güvenlik

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **`errorMessage` sanitizasyonu yok** | `state.errorMessage` doğrudan JSX text olarak render ediliyor. React XSS'e karşı korur ama hata mesajı iç sistem detayları içerebilir (DB bağlantı string'i, file path vb.). **Öneri:** Error message'ları kullanıcı dostu genel mesajlara map'leyin. |

#### Kod Kalitesi

| Seviye | Sorun | Detay |
|--------|-------|-------|
| ✅ | **`tr()` helper fonksiyonu — iyi tasarlanmış** | Fallback string'ler ve parametre interpolasyonu temiz. i18n opsiyonel olması doğru. |
| 🟢 DÜŞÜK | **`onOpenChange={() => {}}` boş callback** | Dialog kontrollü dışarıdan yönetiliyor, boş callback radix için gerekli. Yorum açıklayıcı. |

#### Mimari

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **`ui/` klasöründe domain-specific bileşen** | PDF export'a özgü bir modal, generic UI primitive değil. `components/builder/` veya `components/shared/` altı daha uygun. |

---

### 3.5 `responsive-container.tsx`

#### Performans

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **`ResizeObserver` callback throttle edilmemiş** | `ResizeObserver` her boyut değişikliğinde `updateScale` çağırıyor. Hızlı resize işlemlerinde çok sık state güncellemesi olabilir. **Öneri:** `requestAnimationFrame` veya debounce ile throttle edin. |
| 🟢 DÜŞÜK | **İlk render'da `scale=0.35` hardcoded** | İlk frame'de yanlış ölçekle render olur, ardından `useEffect` ile düzeltilir. Görsel titreme (flicker) yaratabilir. **Öneri:** `scale=0` ile başlayıp ölçüm tamamlandıktan sonra gösterin veya `useLayoutEffect` kullanın. |

#### Güvenlik

| Seviye | Sorun | Detay |
|--------|-------|-------|
| ✅ | **Risk yok** | DOM ölçümleme bileşeni, kullanıcı girdisi işlemiyor. |

#### Kod Kalitesi

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **`aspectRatio` prop'u kullanılmıyor** | Interface'de tanımlı ama destructure edilmemiş ve kullanılmıyor. Dead parameter. **Öneri:** Kaldırın veya implementasyona ekleyin. |
| 🟢 DÜŞÜK | **`useEffect` yerine `useLayoutEffect`** | Scale hesaplaması görsel layout'u etkiler. `useEffect` ile yapıldığında ilk frame'de yanlış ölçek görünür. `useLayoutEffect` daha doğru olur. |

---

### 3.6 `skeleton-variants.tsx`

#### Performans / Güvenlik

| Seviye | Sorun | Detay |
|--------|-------|-------|
| ✅ | **Sorun yok** | Saf presentational bileşenler. State veya side effect yok. |

#### Kod Kalitesi

| Seviye | Sorun | Detay |
|--------|-------|-------|
| ✅ | **İyi tasarlanmış** | Her skeleton bileşeni tek bir layout temsil ediyor. `count`, `columns`, `rows`, `lines`, `size` props ile parametrik. `cn()` doğru kullanılmış. |
| 🟢 DÜŞÜK | **`"use client"` directive gereksiz olabilir** | `Skeleton` import'u zaten client directive'li. Ancak skeleton-variants kendisi state/effect kullanmıyor. Server component olabilir ama `cn` dependency zinciri nedeniyle client kalması sorun değil. |

---

### 3.7 `theme-toggle.tsx`

#### Performans

| Seviye | Sorun | Detay |
|--------|-------|-------|
| ✅ | **İyi** | `mounted` state ile hydration mismatch önlenmiş. Standart next-themes pattern'i. |

#### Güvenlik

| Seviye | Sorun | Detay |
|--------|-------|-------|
| ✅ | **Risk yok** | Sadece tema değiştiriyor. |

#### Kod Kalitesi

| Seviye | Sorun | Detay |
|--------|-------|-------|
| 🟡 ORTA | **Hardcoded Türkçe string'ler** | `"Açık tema"`, `"Koyu tema"`, `"Tema değiştir"` — i18n kullanılmamış. |

---

## 4. Genel Özet & Öncelikli Aksiyon Planı

### Kritik Bulgular Özet Tablosu

| # | Seviye | Kategori | Dosya | Sorun |
|---|--------|----------|-------|-------|
| 1 | 🔴 | Performans | `image-lightbox.tsx` | 40+ görsel agresif prefetching — mobilde bant genişliği israfı |
| 2 | 🔴 | Performans | `product-image-gallery.tsx` | Grid'de N*M gizli img prefetch — ölçeklenmiyor |
| 3 | 🔴 | Kod Kalitesi | `image-lightbox.tsx` | SRP ihlali — zoom, keyboard, navigation, prefetch tek dosyada |
| 4 | 🔴 | Mimari | `image-lightbox.tsx` | Business logic (context, Cloudinary) UI klasöründe |
| 5 | 🔴 | Mimari | `product-image-gallery.tsx` | Product tipine bağımlı bileşen UI klasöründe |
| 6 | 🟡 | Güvenlik | `image-lightbox.tsx` | Görsel URL'leri sanitize edilmiyor |
| 7 | 🟡 | Güvenlik | `pdf-progress-modal.tsx` | Error message iç sistem detayları sızdırabilir |
| 8 | 🟡 | Kod Kalitesi | Birçok dosya | Hardcoded Türkçe string'ler (i18n eksik) |
| 9 | 🟡 | Kod Kalitesi | `popover.tsx`, `radio-group.tsx`, `scroll-area.tsx`, `sheet.tsx`, `slider.tsx` | Eski `forwardRef` pattern — React 19 ile tutarsız |
| 10 | 🟡 | Kod Kalitesi | `switch.tsx` | Hardcoded hex renk (#cf1414) — tema sistemiyle uyumsuz |
| 11 | 🟡 | Kod Kalitesi | `responsive-container.tsx` | Kullanılmayan `aspectRatio` prop (dead parameter) |
| 12 | 🟡 | Performans | `responsive-container.tsx` | ResizeObserver throttle edilmemiş |
| 13 | 🟡 | Performans | `pdf-progress-modal.tsx` | phaseLabels/phaseIcons her render'da yeniden oluşuyor |
| 14 | 🟡 | Kod Kalitesi | `error-boundary.tsx` | Dead Sentry kodu yorum satırında |
| 15 | 🟡 | Mimari | `network-status-banner.tsx` | Hook bağımlılığı ile UI klasöründe |
| 16 | 🟡 | Mimari | `pdf-progress-modal.tsx` | Domain-specific modal UI klasöründe |
| 17 | 🟡 | Kod Kalitesi | `image-lightbox.tsx` | `onLoadingComplete` deprecated (Next.js) |
| 18 | 🟡 | Kod Kalitesi | `network-status-banner.tsx` | Yazım hatası: "moddasınız" → "modasınız" |

### Öncelikli Aksiyon Planı

#### P0 — Acil (Bu Sprint)

1. **Prefetching stratejisini düzeltin** (`image-lightbox.tsx`, `product-image-gallery.tsx`):
   - 40 görsel prefetch'i kaldırın
   - Sadece next/prev görselleri prefetch edin (max 2)
   - `<link rel="preload">` veya `requestIdleCallback` kullanın
   
2. **Klasör yapısını düzeltin**:
   - `image-lightbox.tsx` → `components/shared/` veya `components/catalogs/`
   - `product-image-gallery.tsx` → `components/products/`
   - `pdf-progress-modal.tsx` → `components/builder/`
   - `network-status-banner.tsx` → `components/layout/`

#### P1 — Kısa Vadeli (2 Hafta)

3. **i18n eksikliklerini tamamlayın**:
   - `image-lightbox.tsx`: Tüm aria-label'lar
   - `product-image-gallery.tsx`: Tüm aria-label'lar
   - `network-status-banner.tsx`: Banner metinleri
   - `theme-toggle.tsx`: Tooltip/aria metinleri

4. **`forwardRef` → function component migration**: `popover.tsx`, `radio-group.tsx`, `scroll-area.tsx`, `sheet.tsx`, `slider.tsx` dosyalarını React 19 pattern'ine geçirin.

5. **`switch.tsx` hardcoded rengi** → `bg-primary` veya CSS variable

6. **`responsive-container.tsx`**: `aspectRatio` dead prop'u kaldırın, `useLayoutEffect` kullanın, ResizeObserver'ı throttle edin.

#### P2 — Orta Vadeli (1 Ay)

7. **`image-lightbox.tsx` refactoring**: Hook'lara bölün (`useLightboxKeyboard`, `useLightboxZoom`)
8. **Error boundary**: Sentry entegrasyonunu aktifleştirin veya dead code'u kaldırın
9. **URL sanitizasyonu**: Görsel URL'leri için validation utility oluşturun
10. **`error-boundary.tsx`**: `window.location` bağımlılığını inject edilebilir yapın (test edilebilirlik)

---

> **Genel Değerlendirme:** UI primitive'leri büyük ölçüde shadcn/ui standardına uygun ve temiz. Ana sorunlar, business logic taşıyan bileşenlerin (`image-lightbox`, `product-image-gallery`, `pdf-progress-modal`, `network-status-banner`) yanlış klasörde olması ve agresif prefetching stratejisinin ölçeklenmemesi. Güvenlik açısından kritik bir zafiyet yok ancak URL sanitizasyonu ve error message filtreleme eklenmeli.

---

## 5. Uygulanan Düzeltmeler (Implementation Log)

> **Tarih:** 28 Şubat 2026  
> **Durum:** Tüm kod düzeltmeleri tamamlandı. Dosya taşıma (klasör yapısı) önerisi uygulanmadı (import kırılma riski).

| # | Dosya | Değişiklik | Öncelik | Durum |
|---|-------|-----------|---------|-------|
| 1 | `lib/translations/common.ts` | 12 yeni i18n key eklendi (TR+EN): `previous`, `zoomIn`, `zoomOut`, `previousImage`, `nextImage`, `imageOf`, `productImage`, `lightTheme`, `darkTheme`, `toggleTheme`, `offlineMode`, `slowConnection` | P1 | ✅ |
| 2 | `components/error-boundary.tsx` | Dead Sentry kodu kaldırıldı. `sanitizeErrorMessage()` fonksiyonu eklendi — 500 char truncate + sensitive pattern redaction (password, secret, token, key, dsn, connectionstring) | P0 | ✅ |
| 3 | `components/ui/switch.tsx` | Hardcoded `bg-[#cf1414]` → `bg-primary` (tema uyumluluğu) | P1 | ✅ |
| 4 | `components/ui/network-status-banner.tsx` | "moddasınız" typo düzeltildi. Hardcoded Türkçe stringler → `useTranslation` + fallback. `role="alert"` eklendi (a11y) | P1 | ✅ |
| 5 | `components/ui/theme-toggle.tsx` | Hardcoded Türkçe aria/tooltip → `useTranslation` + fallback. `isDark` değişkeni ile tekrar azaltıldı | P1 | ✅ |
| 6 | `components/ui/image-lightbox.tsx` | **40-image agresif prefetch kaldırıldı** → sadece next/prev (2 görsel). Sabitler extract edildi (`ZOOM_STEP`, `MAX_ZOOM`, `MIN_ZOOM`, `LIGHTBOX_IMAGE_SIZE`, `PREFETCH_IMAGE_SIZE`). Deprecated `onLoadingComplete` → `onLoad`. `isSafeImageUrl()` validator eklendi. 7 hardcoded Türkçe string → i18n. `eslint-disable` korundu (prefetch img'ler için gerekli) | P0 | ✅ |
| 7 | `components/ui/product-image-gallery.tsx` | Gizli `<img>` prefetch bloğu kaldırıldı (N*M ölçeklenme sorunu). 3 hardcoded Türkçe aria-label → i18n. `eslint-disable` kaldırıldı | P0 | ✅ |
| 8 | `components/ui/responsive-container.tsx` | Dead `aspectRatio` prop kaldırıldı. `useEffect` → `useLayoutEffect` (layout shift önleme). ResizeObserver callback'ine `requestAnimationFrame` throttle eklendi. Başlangıç scale 0.35 → 0 (flash önleme) | P1 | ✅ |
| 9 | `components/ui/pdf-progress-modal.tsx` | Statik `phaseIcons` record'u component dışına taşındı (`PHASE_ICONS` module constant) | P1 | ✅ |
| 10 | `components/ui/popover.tsx` | `React.forwardRef` → React 19 function component + `data-slot` | P1 | ✅ |
| 11 | `components/ui/radio-group.tsx` | `React.forwardRef` → React 19 function component + `data-slot` | P1 | ✅ |
| 12 | `components/ui/scroll-area.tsx` | `React.forwardRef` → React 19 function component + `data-slot` | P1 | ✅ |
| 13 | `components/ui/sheet.tsx` | 5 component `React.forwardRef` → React 19 function component + `data-slot`. `SheetContentProps` interface kaldırıldı (inline union type) | P1 | ✅ |
| 14 | `components/ui/slider.tsx` | `React.forwardRef` → React 19 function component + `data-slot`. `defaultValue` fallback düzeltildi (thumb render crash önleme). Thumb CSS sabite çıkarıldı (`THUMB_CLASS`) | P1 | ✅ |

### Uygulanmayan Öneriler

| Öneri | Neden |
|-------|-------|
| Dosya taşıma (klasör yapısı düzeltme) | Import'ları kırar, proje genelinde kapsamlı refactor gerektirir — ayrı bir PR olarak planlanmalı |
| `image-lightbox.tsx` hook'lara bölme (`useLightboxKeyboard`, `useLightboxZoom`) | İşlevsel olarak çalışıyor, karmaşıklık henüz hook extraction gerektirmiyor |
| Sentry entegrasyonunu aktifleştirme | Altyapı kararı — ayrı görev olarak ele alınmalı |
| `error-boundary.tsx` `window.location` DI | Test altyapısı ile birlikte ele alınmalı |
