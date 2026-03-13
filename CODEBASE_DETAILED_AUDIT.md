# Katalog App Detaylı Kod Kalitesi / Güvenlik / Performans Denetim Raporu

> Tarih: 2026-03-13  
> Kapsam: Frontend (`app`, `components`, `lib`), backend (`backend/src`), testler, config, migration ve yardımcı scriptler  
> Not: Bu rapor **aksiyon almadan**, mevcut durumu satır/sınıf/dosya seviyesinde değerlendirmek için hazırlanmıştır.

---

## 1. Yönetici Özeti

Bu repo genel olarak:

- güçlü ürün vizyonuna sahip,
- modüler klasör yapısı kurulmuş,
- test yatırımı yapılmış,
- güvenlik konusunda bilinçli yorumlar eklenmiş,
- ancak uygulama büyüdükçe **karmaşıklık, tekrar, sessiz hata yutma, büyük client component’ler ve dağınık sorumluluklar** üretmeye başlamış.

### Genel Yargı

Kod tabanı **çalışan ama yer yer yoğunlaşmış** bir SaaS kod tabanı görüntüsü veriyor. “Tam spagetti” demek doğru olmaz; çünkü klasörleme ve domain ayrımı var. Fakat bazı kritik ekranlar ve yardımcı katmanlarda:

- çok fazla sorumluluğun tek dosyada toplanması,
- aynı doğrulama/oturum yenileme/upload mantığının farklı bileşenlerde tekrar edilmesi,
- bazı yerlerde `any`, `eslint-disable`, sessiz `catch {}` kullanımı,
- bazı route ve action’larda fazla veri seçimi,
- SSR/client sınırlarında gereğinden fazla veri taşıma

gibi nedenlerle **spagettiye kayma riski** bulunuyor.

---

## 2. En Kritik Bulgular

### Kritik / Yüksek Öncelik

1. **Builder sayfasında çok büyük veri yükü riski**  
   `app/dashboard/builder/page.tsx`
2. **Büyük client component ve çoklu sorumluluk riski**  
   `components/settings/settings-page-client.tsx`
3. **Spreadsheet tablosunda yoğun render karmaşıklığı ve `any` kullanımı**  
   `components/excel/table/spreadsheet-table.tsx`
4. **Backend admin route’larında ek DB roundtrip ve bazı yerlerde gereğinden geniş veri seçimi**  
   `backend/src/routes/admin.ts`
5. **Redis fallback mantığında bakım karmaşıklığı**  
   `backend/src/services/redis.ts`
6. **User context içinde auth + retry + count fetch + Sentry + optimistic state birlikte yürüyor**  
   `lib/contexts/user-context.tsx`
7. **Feedback action’ında encoding bozulmaları ve fazla uzun HTML string üretimi**  
   `lib/actions/feedback.ts`
8. **CORS / trust proxy / rate limit ayarları bilinçli ama hâlâ mimari risk taşıyor**  
   `backend/src/index.ts`

### Orta Öncelik

1. Çok sayıda `console.error` / `console.warn`
2. Sessiz `catch {}` blokları nedeniyle hata gözden kaçma ihtimali
3. Birçok client component içinde auth refresh / upload / preview cleanup tekrarları
4. `select('*')` kullanımının hâlâ bazı dosyalarda sürmesi
5. `any` ve geniş type cast kullanımları
6. `eslint-disable` ile hook dependency uyarılarının bastırıldığı yerler

### Düşük / İyileştirme Önceliği

1. Tutarsız yorum dili ve encoding bozulmaları
2. Bazı dosyalarda fazla uzun inline comment blokları
3. Audit markdown’larının repo içinde dağınık olması
4. `dist`, `bak`, geçici audit çıktıları gibi artefact’ların repo kalabalığı yaratması

---

## 3. Mimari Değerlendirme

## 3.1 Güçlü Yönler

- `app / components / lib / backend` ayrımı mantıklı.
- `components` altında domain-based klasörleme var.
- `lib/actions` ile server action katmanı ayrıştırılmış.
- `backend/src/routes`, `controllers`, `services`, `middlewares` ayrımı doğru yönde.
- test klasörü geniş; yalnızca “yazılmış” değil, ürün akışları düşünülmüş.
- Supabase, storage, auth, analytics, export gibi farklı concern’ler en azından klasör bazında ayrılmış.

## 3.2 Spagetti Kod Var mı?

### Kısa cevap

**Tam anlamıyla saf spagetti değil.**  
Ama bazı dosyalar “mini spagetti hotspot” haline gelmiş.

### Spagettiye kayan alanlar

#### A) Büyük ekran bileşenleri
- `components/settings/settings-page-client.tsx`
- `components/products/modals/product-modal.tsx`
- `components/excel/table/spreadsheet-table.tsx`
- `lib/contexts/user-context.tsx`

Bu dosyalarda aynı anda:

- UI state,
- network davranışı,
- retry,
- upload,
- cleanup,
- auth refresh,
- optimistic update,
- validation,
- error reporting

bir arada bulunuyor.

Bu durum bug çıkınca kök neden analizi zorlaştırır.

#### B) Hook dependency bastırmaları
Repo genelinde `eslint-disable react-hooks/exhaustive-deps` örnekleri var. Bunların bir kısmı bilinçli performans tercihi olabilir; ancak orta/uzun vadede stale closure ve beklenmeyen state davranışı üretir.

#### C) Yardımcı fonksiyonların bileşene gömülmesi
Özellikle settings ve ürün modal tarafında upload/doğrulama mantığı bileşen içine gömülü. Bu kod başka ekranda tekrar edilmeye başladıkça yapı hızla ağırlaşır.

---

## 4. Dosya Bazlı Detaylı Bulgular

## 4.1 `app/dashboard/builder/page.tsx`

### Güçlü taraflar
- `Suspense` ile skeleton streaming kullanımı iyi.
- ürünleri sayfalı fetch edip birleştirme mantığı düşünülmüş.
- katalog limiti kontrolü mevcut.

### Sorunlar

#### 1. Aşırı payload riski
Dosya 2000 ürüne kadar SSR tarafında veriyi toplayıp client’a taşıyor.

**Risk:**
- büyük kullanıcı hesaplarında TTFB artar,
- React payload büyür,
- hydration maliyeti artar,
- builder açılışı yavaşlar.

Kod zaten bunu yorumla kabul ediyor:

> `TODO: Implement server-side search + incremental loading in the builder`

Bu TODO doğrudan performans borcu.

#### 2. Aynı route içinde fazla sorumluluk
Bu dosya:
- page shell,
- ürün fetch stratejisi,
- katalog fetch,
- auth/profile plan fetch,
- katalog sayısı limiti,
- redirect mantığı

işlerini tek yerde yapıyor.

**Yorum:** Yapı okunabilir ama büyümeye açık değil.

#### 3. N+1 değil ama “multi-query per request” maliyeti var
Yeni katalog açılırken:
- auth user
- profile plan
- catalog count

ek sorgular atılıyor. Yüksek trafikte pahalı olabilir.

### Sonuç
**Spagetti değil ama yüksek performans borcu taşıyan bir page orchestrator.**

---

## 4.2 `components/excel/table/spreadsheet-table.tsx`

Bu dosya en belirgin kalite hotspot’larından biri.

### Tespitler

#### 1. Çok fazla `any`
`areProductRowsEqual`, `ProductRow`, `areNewProductRowsEqual`, `NewProductRow` içinde `any` kullanımı var.

**Etkisi:**
- type safety düşer,
- refactor güveni azalır,
- yanlış prop geçişleri gizlenir.

#### 2. Render optimizasyonu var ama maliyetli ve karmaşık
`memo` + özel comparator yazılmış. Bu iyi niyetli fakat comparator içinde:

- her sütun için width kontrolü,
- her hücre için value/dirty/error karşılaştırması

yapılıyor.

**Risk:**
- render kazancı sağlarken comparator maliyeti de artar,
- bug çıktığında takip etmesi zordur,
- ürün/sütun sayısı büyüdükçe comparator’ın kendisi pahalı hale gelir.

#### 3. Aynı width çözümleme mantığı tekrar ediyor
`getDefaultWidth()` var ama `ProductRow` ve `NewProductRow` içinde tekrar manuel width çözümleme yapılıyor.

**Bu net bir kod kokusu.**

#### 4. Tab navigation manuel querySelector ile yönetiliyor
`querySelectorAll("input, textarea")` ile focus hareketi veriliyor.

**Risk:**
- erişilebilirlik sorunları,
- yeni input türleri eklenince kırılma,
- DOM yapısına aşırı bağımlılık.

#### 5. Resize logic DOM/document odaklı ve dosya içinde gömülü
Kötü değil ama reusable hook olması gereken logic bileşene gömülü.

### Sonuç
**Bu dosya “performans için optimize edilmiş ama bakım maliyeti hızla artmış” bir örnek.**  
En belirgin spagettiye kayma sinyallerinden biri burada.

---

## 4.3 `components/settings/settings-page-client.tsx`

Bu dosya açık şekilde **çok fazla sorumluluk taşıyor**.

### İçinde neler var?
- profil formu
- avatar upload
- logo upload
- object URL cleanup
- session refresh
- abort controller yönetimi
- retry’lı upload
- optimistic update
- sosyal link validasyonu
- silme işlemi
- plan/subscription UI
- dil tercihi UI

Bu kadar concern tek dosyada olmamalı.

### Somut problemler

#### 1. God component eğilimi
Bu bir “screen component” olmanın ötesine geçmiş.

#### 2. Oturum yenileme mantığı çok dağınık
- mount’ta session check,
- upload click’te refresh,
- file select sonrası tekrar refresh

**Yorum:** Bu davranış uygulamanın auth mimarisinde güven eksikliğine işaret ediyor. Kod kendini üç kez garantiye almaya çalışıyor.

#### 3. Upload retry mantığı component içine gömülü
`uploadFileWithRetry()` reusable hook/service olmalıydı.

#### 4. Hata/başarı state’leri çok fazla ama merkezsiz
Bu dosya hata yönetimini toast’larla dağıtıyor; mantık test edilebilirliği düşüyor.

#### 5. UI + business logic coupling yüksek
Form submit ile storage/upload/auth/session state iç içe.

#### 6. `handleLogoUpload` içinde `handleUploadClick()` tekrar çağrısı
Logo input label click’inde zaten refresh tetikleniyor; change içinde bir kez daha çağrılıyor.

**Bu çift tetikleme gereksiz network çağrısı riski doğurur.**

### Güvenlik açısından
- dosya tipi ve boyutu kontrol ediliyor, bu iyi.
- ama gerçek mime doğrulama / magic byte doğrulama burada yok.
- tamamen client-side ön kontrol ile yetinilmiş.

### Sonuç
**Repo içindeki en güçlü refactor adayı dosyalardan biri.**

---

## 4.4 `lib/contexts/user-context.tsx`

Bu dosya auth ve kullanıcı state yönetiminin merkezi. Kritik.

### Güçlü taraflar
- initial SSR user desteği var.
- `useMemo`, `useCallback`, `ref` kullanımı düşünülmüş.
- Sentry user binding var.

### Problemler

#### 1. Fazla sorumluluk
Bu context:
- auth init,
- auth event subscription,
- profile fetch,
- retry,
- counts fetch,
- logout redirect,
- Sentry enrichment,
- optimistic counters

işlerini bir arada yapıyor.

#### 2. `select("*, is_admin")`
Bu gereğinden fazla veri çekiyor.

**Risk:**
- veri minimizasyonu ihlali,
- gereksiz payload,
- schema değişince istemeden yeni alanlar client’a taşınabilir.

#### 3. Encoding bozulmaları
Dosyada Türkçe yorumların bazıları bozuk (`TÃ¼m`, `ayrÄ±`, `deÄŸiÅŸtiyse`).

**Bu küçük görünür ama önemlidir:**
- editör/encoding disiplini zayıf,
- review kalitesi düşer,
- dokümantasyon güveni azalır.

#### 4. Logout akışında state cleanup yerine redirect’e güveniliyor
“redirect FIRST, then state will be cleaned by page unload” yaklaşımı pratik ama kırılgan.

**Risk:** SPA geçişi ya da beklenmeyen navigation davranışı değişirse state sızıntısı görülebilir.

#### 5. Retry mantığı context içine gömülü
Bu, veri erişim katmanının context’e taşındığını gösteriyor.

### Sonuç
**Bu dosya teknik olarak çalışır, fakat mimari olarak fazla şişmiş.**

---

## 4.5 `lib/api.ts`

### Güçlü taraflar
- timeout mantığı var
- retry mantığı var
- rate limit / 5xx / AbortError düşünülmüş
- header forwarding düşünülmüş

### Problemler

#### 1. Server-only davranış client fetch helper gibi görünebilir
`next/headers` ve server supabase client kullanıyor. Bu dosya ismi (`api.ts`) genel amaçlı helper gibi, fakat pratikte server-context bağımlı.

**Risk:** yanlış yerde kullanılırsa karışıklık oluşturur.

#### 2. `Content-Type: application/json` varsayılanı çok agresif
Her request’e gömülüyor. `FormData` gibi durumlarda dikkat ister.

Şu an usage pattern ağırlıkla JSON gibi görünüyor ama helper tasarımı genel amaçlı değil.

#### 3. Hem `getUser()` hem `getSession()` çağrısı her istekte maliyetli
Yorumla gerekçelendirilmiş, mantıklı; ama çok sık internal API çağrısında maliyet yaratır.

#### 4. Retry sırasında idempotency ayrımı yok
POST/PUT/PATCH/DELETE isteklerde otomatik retry bazı durumlarda iki kez işleme yol açabilir.

**Bu önemli.**

Şu an kod 5xx/429/network durumlarında method ayrımı yapmadan retry uygulayabiliyor.

### Sonuç
**Olgun bir helper, fakat idempotency farkındalığı eksik.**

---

## 4.6 `backend/src/index.ts`

### Güçlü taraflar
- env validation
- helmet
- compression
- metrics protection
- auth limiter ayrımı
- mutative no-origin guard

### Kritik/Yüksek Riskler

#### 1. `trust proxy = 1`
Reverse proxy topolojisi garanti değilse spoof riski var.

#### 2. `!origin` kabulü
Server-to-server/SSR için mantıklı ama GET endpoint’ler için saldırı yüzeyi genişletir.

#### 3. In-memory rate limiter
Çok instance deployment’da efektif koruma düşer.

#### 4. Production API rate limit yüksek olabilir
1000 / 15 dk bazı endpoint’lerde fazla cömert.

#### 5. `xXssProtection`
Eski/legacy header; modern güvenlikte etkisi sınırlı.

#### 6. CORS origin listesi exact string matching
Pratik ama çevresel yapı büyüdükçe yönetimi zorlaşır.

### Sonuç
**Bilinçli yazılmış bir entrypoint; ancak dağıtım topolojisi yanlış kurulursa güvenlik varsayımları bozulabilir.**

---

## 4.7 `backend/src/routes/admin.ts`

### Problemler

#### 1. Her admin request’te ekstra DB sorgusu
`requireAuth` sonrası tekrar `is_admin` sorgusu atılıyor.

**Etkisi:**
- latency artar,
- admin endpoint’lerde gereksiz ek yük oluşur.

#### 2. `/deleted-users` için `select('*')`
Bu doğrudan veri minimizasyonu problemi.

**Kural:** Admin bile olsa “ihtiyaç kadar alan” seçilmeli.

#### 3. Plan update endpoint’te body validation minimal
`plan` whitelist var, güzel; ama `id` format doğrulama yok.

### Sonuç
**Fonksiyonel ama veri seçimi ve auth claim tasarımında iyileşme gerekiyor.**

---

## 4.8 `backend/src/services/supabase.ts`

### Problemler

#### 1. Env yoksa yalnızca `console.error`
Servis gene de `createClient('', '')` ile ayağa kalkıyor.

**Bu kötü bir pattern.**

Eksik env varsa servis fail-fast olmalı.

#### 2. Modül import anında singleton client oluşuyor
Genelde normaldir; ama env invalid ise sessiz broken state oluşur.

### Sonuç
**Küçük dosya ama güvenilir başlatma açısından zayıf.**

---

## 4.9 `backend/src/services/redis.ts`

### Güçlü taraflar
- Redis yoksa fallback var
- GC düşünülmüş
- OOM önlemek için upper bound düşünülmüş
- corrupted cache handling var

### Problemler

#### 1. Çok fazla davranış tek dosyada toplanmış
- init
- tls parse
- memory fallback
- GC
- invalidation window
- pattern delete
- key factory
- TTL config

Bu dosya mini cache framework’e dönüşmüş.

#### 2. `Promise<any>[]`
Type safety zayıf.

#### 3. `setInterval` tabanlı cleanup
Çalışır ama süreç büyüdükçe gözden kaçan yan etkiler üretir.

#### 4. Redis yoksa production’da ürün cache disable, diğerlerinde memory fallback
Mantıklı ama davranış matrisi karmaşık. Debug etmesi zor.

#### 5. Regex ile wildcard delete
Kontrollü ama key pattern büyüdükçe riskli hale gelir.

### Sonuç
**Akıllıca düşünülmüş ama fazla kompleksleşmiş. Bakım maliyeti yüksek.**

---

## 4.10 `lib/actions/feedback.ts`

### Problemler

#### 1. Encoding bozulmaları çok belirgin
Dosyada birden fazla yerde Türkçe karakterler bozulmuş:
- `Ã‡ok fazla deneme`
- `Oturum aÃ§manÄ±z gerekiyor`
- `gÃ¶nderme`
- vb.

Bu yalnızca kozmetik değil.

**Etkisi:**
- kullanıcıya bozuk hata metni gidebilir,
- email çıktıları bozulabilir,
- repo encoding disiplini zayıf görünür.

#### 2. Çok büyük inline HTML template
Action içine gömülü büyük email template bakım açısından kötü.

#### 3. Fazla logging
`console.error("=".repeat(50))` gibi gürültülü log’lar var.

#### 4. ADMIN_EMAIL’e bağımlılık
Kod comment’lerinde admin erişiminde `ADMIN_EMAIL artık kullanılmıyor` yaklaşımı varken feedback/email tarafında env bağımlılığı sürüyor. Tasarım dili tam birleşmemiş.

### Güvenlik notu
- HTML escape yapılması olumlu.
- attachment URL protocol doğrulaması olumlu.
- storage path extraction logic fena değil.

### Sonuç
**Bu dosyada güvenlik niyeti iyi, fakat kalite ve bakım seviyesi zayıf.**

---

## 4.11 `components/products/modals/product-modal.tsx`

### Problemler

#### 1. `eslint-disable react-hooks/exhaustive-deps`
`useEffect([open])` ile form init yapılıyor ama `product` ve `images` bağımlılıkları bastırılmış.

**Risk:** modal state’i bazı edge case’lerde stale kalabilir.

#### 2. Form state + upload flow + data transform aynı yerde
Bu modal:
- form state yönetiyor,
- image upload orchestration yapıyor,
- category merge ediyor,
- payload transform ediyor,
- optimistic saved object üretiyor.

#### 3. `await new Promise((r) => setTimeout(r, 500))`
Bu açık bir kod kokusu.

**Neden kötü:**
- eventual consistency problemi “uyutarak” çözülmeye çalışılıyor,
- testlerde flaky davranış üretir,
- gerçek sebebi maskeleyebilir.

### Sonuç
**Çalışır ama birkaç net hacky nokta içeriyor.**

---

## 5. Repo Genelinde Kod Kokuları

## 5.1 `any` Kullanımı

Aramada birçok `any` izi var. Özellikle:
- spreadsheet tablosu
- excel sayfası
- backend redis/service audit notları
- test mock’ları

Testlerde `any` kabul edilebilir; üretim kodunda azaltılmalı.

---

## 5.2 `eslint-disable` Kullanımı

Görülen başlıca alanlar:
- hook dependency bastırma
- `no-img-element`
- explicit any
- no-console

**Yorum:** Bunların hepsi yanlış değil. Ama biriktiğinde “lint’i eğitmek yerine susturma” davranışına dönüşür.

---

## 5.3 Sessiz Hata Yutma

Birçok yerde `catch {}` kullanılmış.

Örnek riskler:
- session refresh hatası sessiz kalıyor
- upload sync non-critical diye yutuluyor
- bazı fallback’ler kullanıcıdan gizleniyor

**Sorun:** hata bilinçli mi bastırıldı, yoksa bug mı var ayrımı zorlaşıyor.

---

## 5.4 Aşırı Client Component Kullanımı

`use client` kullanımı çok yaygın. Bu normal olabilir; fakat:

- form-heavy ekranlar,
- data-heavy dashboard alanları,
- builder/excel gibi büyük ekranlar

çok büyüdükçe hydration maliyeti yükselir.

---

## 5.5 Tekrar Eden Session Refresh Mantığı

Birçok bileşende `createClient()` + `auth.refreshSession()` tekrar ediyor:

- settings
- feedback modal
- categories page
- bulk upload
- editor upload
- product image hook
- session watcher

Bu, auth katmanının tekrar eden “tamir” kodlarıyla yaşadığını düşündürüyor.

**Kök sorun olası:** session lifecycle merkezi ve güvenilir şekilde çözülememiş.

---

## 5.6 Fazla `select('*')`

Tüm repo çapında tamamen kontrolsüz değil, ama hâlâ bazı dosyalarda var.

**Riskler:**
- gereksiz veri taşıma,
- schema değişince istemeden yeni alanların açığa çıkması,
- client’a gereksiz internal alanların inmesi.

---

## 6. Güvenlik Değerlendirmesi

## 6.1 İyi Uygulamalar

- metrics endpoint header token ile korunuyor
- raw metrics error sızdırma engellenmiş
- helmet kullanılıyor
- no-origin mutative request defense var
- rate limit var
- feedback email HTML escape var
- blog slug sanitization notu mevcut
- image/url protocol kontrolleri çeşitli yerlerde var
- env validation var

## 6.2 Riskler

### Yüksek Risk
1. `trust proxy` yanlış deployment’ta spoof riski
2. admin ve user profile akışlarında gereğinden fazla veri çekme
3. idempotent olmayan request’lerde retry mantığı

### Orta Risk
1. no-origin GET davranışları
2. in-memory limiter store
3. env eksikken fail-fast olmayan servisler
4. client-side file validation’a fazla güvenme

### Düşük Risk
1. JSON-LD için `dangerouslySetInnerHTML` kullanımı mevcut ama burada `JSON.stringify` ile kontrollü olduğu için makul
2. bazı log’lar production’da fazla bilgi verebilir

---

## 7. Performans Değerlendirmesi

## 7.1 Ana Riskler

### 1. Builder payload büyüklüğü
`app/dashboard/builder/page.tsx`

### 2. Büyük client state ekranları
- settings
- products modal
- excel sheet
- user context

### 3. Ağır comparator / memo mantıkları
`components/excel/table/spreadsheet-table.tsx`

### 4. Fazla auth/session refresh çağrısı
Gereksiz network roundtrip üretir.

### 5. Admin middleware + route seviyesinde ekstra query
Özellikle admin akışında roundtrip sayısı artıyor.

---

## 8. Kod Kalitesi Değerlendirmesi

## 8.1 İyi taraflar
- isimlendirme çoğunlukla okunabilir
- intent belirten comment çok
- domain ayrımı var
- test yazılmış

## 8.2 Zayıf taraflar
- bazı dosyalar çok uzun
- inline comment çokluğu bazen kodu okunur yapmak yerine gürültü oluşturuyor
- encoding bozuklukları kalite hissini ciddi düşürüyor
- `.bak`, `dist`, audit md’leri repo temizliğini zayıflatıyor
- aynı problem farklı yerlerde farklı şekilde çözülmüş

---

## 9. Dosya / Alan Bazlı Hızlı Karar Tablosu

| Alan | Durum | Yorum |
|---|---|---|
| `app/` | Orta-İyi | route yapısı iyi, bazı sayfalarda payload riski var |
| `components/` | Orta | domain ayrımı iyi, bazı büyük bileşenler parçalanmalı |
| `lib/actions` | Orta | işlevsel, ama tekrar ve logging fazla |
| `lib/contexts` | Orta-Zayıf | `user-context` fazla sorumluluk taşıyor |
| `lib/hooks` | Orta | faydalı ama auth/session tekrarları var |
| `backend/index.ts` | İyi-Orta | bilinçli güvenlik var, deployment varsayımları kritik |
| `backend/routes` | Orta | auth/admin kontrolü işliyor ama optimize değil |
| `backend/services/redis.ts` | Orta | güçlü ama gereğinden kompleks |
| `tests/` | İyi | yatırım var, fakat bazı yerlerde mock yoğunluğu fazla |
| `scripts/` | Orta-Zayıf | yardımcı ama env/key kullanım disiplinine dikkat gerek |

---

## 10. “Bir Satırlık Kod Bile Olsa” Düzeltilmesi Gereken Tarzda Noktalar

Bu bölüm özellikle kullanıcı isteği doğrultusunda en küçük ayrıntıları da işaretlemek için yazıldı.

1. `setTimeout(..., 500)` ile consistency beklemek kötü pratik.
2. `select('*')` görülen her üretim endpoint’i potansiyel veri fazlalığıdır.
3. `Promise<any>[]` küçük görünse de type safety kaybıdır.
4. `console.error` çokluğu observability ile log gürültüsünü karıştırıyor.
5. bozuk UTF-8 metinler küçük değil, doğrudan kalite problemidir.
6. `eslint-disable` ile dependency bastırmak küçük değil, gelecekte bug üretir.
7. aynı width hesabının iki farklı yerde kopyalanması küçük ama net smell’dir.
8. input label click + onChange içinde iki kez refresh tetiklemek gereksiz network davranışıdır.
9. auth/session garanti etmek için aynı ekran içinde 2-3 katmanlı refresh yazmak altyapı zafiyetini maskeler.
10. env yokken yalnızca `console.error` ile devam etmek fail-fast ilkesine aykırıdır.

---

## 11. Son Hüküm

### Bu projede güvenlik açığı var mı?
**Kritik, kolay sömürülebilir çıplak bir açık doğrudan kanıtlanmış değil**, ama birkaç mimari risk var:

- deployment yanlışsa `trust proxy`
- in-memory rate limiter
- bazı fazla veri seçimleri
- idempotent olmayan retry olasılığı

### Bu projede performans açığı var mı?
**Evet, özellikle ölçek büyüdüğünde belirginleşecek performans borçları var.**

- builder payload
- büyük client bileşenler
- spreadsheet render karmaşıklığı
- gereksiz session refresh’ler

### Bu projede spagetti kod var mı?
**Repo genelinde değil, ama bazı dosyalarda belirgin hotspot şeklinde var.**

En güçlü adaylar:
- `components/settings/settings-page-client.tsx`
- `components/excel/table/spreadsheet-table.tsx`
- `lib/contexts/user-context.tsx`
- `lib/actions/feedback.ts`

### Genel skor (kişisel teknik değerlendirme)

| Başlık | Skor / 10 |
|---|---:|
| Klasör mimarisi | 8 |
| Kod okunabilirliği | 6 |
| Tip güvenliği | 6 |
| Güvenlik farkındalığı | 7 |
| Güvenlik uygulama disiplini | 6 |
| Performans ölçeklenebilirliği | 5 |
| Bakım kolaylığı | 5 |
| Test niyeti / kapsamı | 7 |

---

## 12. Önerilen Sonraki Adım (Aksiyon Almadan)

Bu rapordan sonra en mantıklı sırayla yapılacak analiz/iyileştirme listesi şudur:

1. `settings-page-client.tsx` parçalama planı
2. `user-context.tsx` sadeleştirme planı
3. builder incremental loading tasarımı
4. spreadsheet table type + render stratejisi refactor planı
5. backend admin auth/query minimization planı
6. encoding / repo hygiene temizliği

---

İstenirse bir sonraki adımda bu raporu temel alıp **“önceliklendirilmiş refactor yol haritası”** veya **“dosya dosya teknik borç listesi”** de çıkarılabilir.