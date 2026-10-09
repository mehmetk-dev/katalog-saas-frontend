# FogCatalog — Sayfa Sayfa İşlev ve Tasarım Kontrol Planı

> **Amaç:** Uygulamanın her sayfasını tek tek ele alıp önce **temel işlevlerin gerçekten çalıştığını**, sonra tasarımın ve kullanım deneyiminin tutarlı olduğunu doğrulamak; bulunan sorunları sayfa bazında düzeltmek.
>
> **Hazırlanma:** 8 Ekim 2026 · Branch: `worktree-design-system-layout`

---

## 1. Çalışma şekli

Her sayfa aynı döngüden geçer:

1. **Kod incelemesi** — sayfanın veri akışı, server action'lar, backend endpoint'leri, yetki/sahiplik kontrolleri.
2. **Uçtan uca deneme** — gerçek backend + test hesabıyla her temel işlevi elle/otomatik dene (bkz. Faz 0).
3. **Görsel kontrol** — 1440 / 1024 / 768 / 390 px, açık + koyu tema, TR + EN; ekran görüntüleriyle.
4. **Rapor** — bulunanlar üç başlıkta: *Hata* (yanlış çalışıyor), *Eksik* (olması gereken yok), *Tasarım/UX*.
5. **Onay** — rapor üzerinden neyin yapılacağına birlikte karar verilir.
6. **Düzeltme** — her mantıksal parça ayrı commit, testler + lint + ekran görüntüsüyle doğrulanır.
7. **Kalıcı test** — sayfanın kritik akışı için en az bir otomatik test bırakılır (bir daha bozulmasın).

### Her sayfa için ortak kontrol listesi

| Alan | Kontrol |
|---|---|
| **İşlev** | Ana akışlar çalışıyor mu? Hata durumunda kullanıcıya anlamlı mesaj çıkıyor mu? |
| **Veri doğruluğu** | Sayfalama/filtre varsa işlemler *tüm* veride mi yoksa sadece ekrandaki sayfada mı çalışıyor? (Ürünler sayfasında bu hatanın 3 örneği çıktı.) |
| **Plan/limitler** | Free / Plus / Pro sınırları doğru uygulanıyor mu? Sınırda kullanıcıya ne gösteriliyor? |
| **Yetki** | Başkasının verisine ID ile erişilebiliyor mu? Backend sahiplik kontrolü var mı? |
| **Durumlar** | Yükleniyor, boş, filtre sonucu boş, hata durumları ayrı ve doğru mu? |
| **Tasarım** | Tema token'ları, `PageHeader`, ortak bileşenler; ham renk yok (`npm run lint` yakalar). |
| **Responsive** | 390 px'te taşma, üst üste binme, dokunma hedefleri. |
| **Koyu tema** | Okunabilirlik, kontrast. |
| **i18n** | Sabit Türkçe metin kalmamış mı? EN arayüzde her şey çevrili mi? |
| **Erişilebilirlik** | Klavyeyle kullanılabiliyor mu, ikon butonlarında etiket var mı? |
| **Performans** | Gereksiz/tekrarlı istek (ör. her tuşta arama), büyük listelerde yavaşlık. |
| **Konsol** | Hydration hatası, React uyarısı, 404 kaynak yok. |

---

## 2. Faz 0 — Test ortamı (önce bu)

Bu oturuma kadar yapılan görsel kontroller **örnek verili geçici bir sayfayla** yapıldı; backend'e gerçek istek gitmiyordu. Temel işlevleri gerçekten doğrulamak için:

- [ ] **Ayrı bir test Supabase projesi** (öneri) — canlı veritabanına test kayıtları yazmamak için. Alternatif: canlı DB'de işaretli test hesapları (riskli, önerilmez).
- [ ] Backend'i yerelde çalıştırma (`backend/` → port 4000), `.env` test projesine bağlı.
- [ ] Redis + PDF worker (PDF export testleri için; `backend/Dockerfile.worker`).
- [ ] **Üç test hesabı:** Free, Plus, Pro (`scripts/upgrade-test-user.ts` mevcut).
- [ ] Örnek veri: `scripts/seed-products.mjs` ile 100+ ürün, birkaç kategori, 2–3 katalog.
- [ ] **Kalıcı E2E altyapısı:** Playwright testleri repoya (`e2e/`), giriş yapılmış oturumla. Her sayfanın kritik akışı buraya eklenir.
- [ ] Ödeme testleri için Garanti test ortamı bilgileri (`docs/garanti-bbva-sanal-pos.md`).

> **Karar gerekli:** Test için ayrı Supabase projesi açılsın mı?

---

## 3. Durum özeti

| # | Sayfa / akış | Öncelik | Durum |
|---|---|---|---|
| 1 | Giriş / kayıt / şifre işlemleri | 🔴 Yüksek | 🟢 Kod + birim testleri yapıldı; süresi dolmuş oturum hatası düzeltildi (gerçek e-posta/Google uçtan uca kaldı) |
| 2 | Dashboard ana sayfa | 🟡 Orta | 🟢 Yapıldı |
| 3 | Ürünler | 🔴 Yüksek | 🟢 Büyük ölçüde yapıldı (gerçek backend ile doğrulama kaldı) |
| 4 | Ürün ekle/düzenle modalı | 🔴 Yüksek | 🟢 Kod + testler yapıldı (gerçek Cloudinary yüklemesi ve AI ucu canlıda denenmedi) |
| 5 | İçe / dışa aktarma (Excel/CSV) | 🔴 Yüksek | 🟢 Hata/yarıda kalma akışı düzeltildi (gerçek büyük dosya ile canlı deneme kalmadı) |
| 6 | Kategoriler | 🟡 Orta | 🟢 Yapıldı |
| 7 | Excel düzenleyici (+ AI) | 🟡 Orta | 🟢 Kayıt akışı + AI kotası yapıldı |
| 8 | Kataloglar listesi | 🔴 Yüksek | 🟢 Kod + testler yapıldı (gerçek backend ile doğrulama kaldı) |
| 9 | Katalog editörü (builder) | 🔴 Yüksek | 🟢 Büyük ölçüde yapıldı (gerçek backend ile doğrulama kaldı) |
| 10 | Yayındaki katalog sayfası (`/catalog/[slug]`) | 🔴 Yüksek | 🟢 Kod + testler yapıldı (gerçek verili uçtan uca kaldı) |
| 11 | PDF export | 🔴 Yüksek | 🟢 Kod + testler yapıldı (Redis/worker/R2 ile uçtan uca kaldı) |
| 12 | Şablonlar sayfası | 🟢 Düşük | 🟢 Yapıldı |
| 13 | Analitik | 🟡 Orta | 🟢 Yapıldı |
| 14 | Ayarlar | 🟡 Orta | 🟢 Yapıldı (şifre değiştirme yalnızca "şifremi unuttum" akışıyla) |
| 15 | Bildirimler | 🟢 Düşük | 🟢 İncelendi, sorun bulunmadı |
| 16 | Fiyatlandırma → ödeme → sonuç → makbuz | 🔴 Yüksek | 🟡 Kod incelendi, güvenlik açığı kapatıldı (test POS ile uçtan uca kaldı) |
| 17 | Admin paneli | 🟡 Orta | 🟢 Plan değiştirme düzeltildi |
| 18 | Public site (landing, özellikler, SSS, iletişim, blog, yasal) | 🟡 Orta | 🟢 Tek tip tasarım + içerik doğrulaması yapıldı (iletişim formu gerçek e-postayla denenmedi) |
| 19 | Demo oluşturucu (`/create-demo`) | 🟢 Düşük | 🟢 Builder ile birleştirildi (ortak tasarım bölümleri ve önizleme) |
| 20 | Hata / 404 sayfaları | 🟢 Düşük | 🟢 Yapıldı |

**Önerilen sıra:** Faz 0 → 1 → 3–5 (doğrulama) → 8 → 9 → 10 → 11 → 16 → 2 → 6 → 7 → 14 → 13 → 17 → 18 → kalanlar.
Mantık: önce kullanıcının para ve veri kaybedebileceği akışlar (giriş, ürün, katalog, yayın, PDF, ödeme), sonra yardımcı sayfalar.

---

## 4. Sayfa sayfa kontrol listeleri

### 1. Giriş / kayıt / şifre işlemleri
`app/auth/*`, `components/auth/*`, `middleware.ts`, `lib/supabase/proxy.ts`

- [ ] E-posta + şifre ile kayıt → doğrulama e-postası → `auth/verify` → `auth/confirmed`
- [ ] Giriş; yanlış şifre / doğrulanmamış hesap / olmayan hesap mesajları
- [ ] Google ile giriş (`auth/callback`)
- [ ] Şifremi unuttum → e-posta → `confirm-recovery` → `reset-password` → yeni şifreyle giriş
- [ ] Oturum süresi dolunca davranış (`session-watcher`), giriş sonrası doğru sayfaya dönüş (`redirect` parametresi)
- [ ] Giriş yapmamış kullanıcının `/dashboard/*` erişimi → `/auth`
- [ ] İlk girişte onboarding modalı
- [ ] Kayıtta `users` tablosuna profil oluşuyor mu, plan = free
- [ ] Rate limit (`middleware-auth-rate-limit` testi mevcut)

**Yapılanlar (8 Ekim 2026):**
- Hatalı girişte form tamamen kayboluyordu (kullanıcı sayfayı yenilemeden tekrar deneyemiyordu) → hata artık alanların üstünde gösteriliyor.
- `/auth?tab=signup` (landing'de 8 CTA) okunmuyordu, kayıt yerine giriş formu açılıyordu → düzeltildi; `tab=forgot-password` de destekleniyor.
- Giriş sonrası hep `/dashboard`'a gidiliyordu → middleware `next` parametresi ekliyor; e-posta girişi, açık oturum ve Google/kayıt (çerez `auth_next` ile) bu hedefe dönüyor. `lib/auth/next-path.ts` dış/kontrol karakterli hedefleri reddediyor.
- 12 saatlik hareketsizlik süresi dolunca **herkese açık sayfalar** (yayındaki katalog linki, landing, blog) da `/auth`'a atıyordu; geçersiz refresh token'da da aynısı → artık yalnızca `/dashboard` ve `/admin` yönlendiriliyor, diğerlerinde sadece çerez temizleniyor.
- Şifremi unuttum, backend'e ulaşamayınca (kapalı/429) "kullanıcı bulunamadı" deyip e-postayı hiç göndermiyordu; backend zaten her zaman nötr yanıt döndüğü için bu kontrol ve ölü "Google hesabı" dalı kaldırıldı.
- Eksik çeviri anahtarları ekranda ham anahtar olarak görünüyordu (`auth.passwordRequired`, `auth.tooManyAttempts` vb.) → TR/EN eklendi; "Failed to fetch" çevrilmiş bağlantı hatasına eşlendi; callback'teki `rate_limited` kodu eşlendi.
- Şifre kuralı tutarsızdı (kayıt 6, sıfırlama 8 + büyük harf + rakam) → yeni şifreler için tek kural: en az 8 karakter (`lib/auth/password-policy.ts`). Girişte uzunluk kontrolü yok, eski kısa şifreler çalışmaya devam ediyor.
- `/auth/forgot-password` birleşik forma yönlendiriyor; `verify`, `confirmed`, `error`, `confirm-recovery`, `reset-password` ortak `AuthShell` ile yeniden yazıldı, tamamen i18n. Mor dalga dekoru tema token'larıyla değiştirildi.
- Form erişilebilirliği: etiketler input'lara bağlandı, pozitif `tabIndex`'ler kaldırıldı, şifre göster/gizle butonuna etiket, `autocomplete` değerleri.
- Kullanılmayan eski giriş formu (`components/auth/auth-form.tsx` + `auth-form/`, ~800 satır) silindi.
- Testler: `auth.test.tsx` (+5), `forgot-password.test.tsx` (birleşik forma göre yeniden), `auth-next-path.test.ts`, `supabase-proxy-session.test.ts`.

**Yapılanlar (9 Ekim 2026) — oturum hatası:**
- Uzun süre sonra gelen kullanıcı panele giriyor, katalog açınca "Invalid or expired token" hata sayfası alıyordu. Middleware yalnızca `refresh_token_not_found`'u ölü oturum sayıyordu; `refresh_token_already_used`, `session_not_found`, `session_expired` vb. artık çerezleri temizleyip `/auth?session=expired`'a yönlendiriyor.
- 12 saatlik hareketsizlik kontrolü zamanlayıcı çerezi (1 hafta) silinince hiç çalışmıyordu → çerez yoksa `last_sign_in_at` esas alınıyor; admin etkinliği de zamanlayıcıyı yeniliyor.
- Backend token'ı reddederse (`apiFetch` 401) sayfa çökmek yerine girişe yönleniyor; giriş sayfası tarayıcıdaki oturumu kapatıp "oturum süresi doldu" gösteriyor. Supabase Auth'a ulaşılamaması 401 değil 503.
- Testler: `supabase-proxy-session.test.ts` (+6), `api-session-expired.test.ts`.

**Kalan (gerçek hesap/e-posta gerektiriyor):** kayıt e-postası, Google OAuth, sıfırlama e-postası uçtan uca; onboarding; `users` profil satırı.
**Supabase ayarı kontrolü:** Auth → Password minimum length 8 yapılırsa sunucu tarafı da aynı kuralı uygular.

### 2. Dashboard ana sayfa
`app/dashboard/page.tsx`, `components/dashboard/dashboard-client.tsx`

- [ ] İstatistikler gerçek verilerle tutarlı mı (ürün, katalog, görüntülenme)
- [ ] Onboarding checklist adımları doğru işaretleniyor mu
- [ ] Kısayollar doğru sayfalara gidiyor mu; boş hesap görünümü
- [ ] Sidebar plan kartı (katalog/ürün kullanım çubukları) doğru sayıları gösteriyor mu
  *(harness'ta "0/1, 0/50" sabit göründü — gerçek veriyle kontrol edilecek)*

### 3. Ürünler — ✅ büyük ölçüde yapıldı
Yapılanlar: toplu işlemler tüm ürünlerle çalışıyor, arama debounce, filtre/fiyat düzeltmeleri, görünüm tercihi, yeni tasarım (commit `ff004f0` → `e905437`).

Kalan:
- [ ] Gerçek backend ile: sürükle-bırak sıralama sayfalar arasında doğru mu (`reorderOffset`)
- [ ] Ürün sil → kataloglarda kullanılıyorsa uyarı (`check-catalogs`)
- [ ] Kopyala, toplu sil, plan limitine takılma (free 50)
- [ ] Toplu görsel yükleme penceresi i18n (hâlâ sabit Türkçe)
- [ ] Önizleme diyaloğu tasarımı

### 4. Ürün ekle / düzenle modalı
`components/products/modals/product-modal.tsx`, `tabs/*`

- [ ] Zorunlu alan doğrulaması, hata mesajları
- [ ] Görsel yükleme (Cloudinary), en fazla 5 görsel, sıralama, silme
- [ ] Özel özellikler (birim, ekle/sil)
- [ ] SKU üretme, "AI ile açıklama oluştur"
- [ ] Para birimi (TRY/USD/EUR) — tabloda ve katalogda doğru görünüyor mu
- [ ] Kaydedilmemiş değişiklikle kapatma uyarısı
- [ ] Mobilde kullanım

**Yapılanlar (9 Ekim 2026):**
- **Fiyat yanlış kaydediliyordu:** "199,90" → 199, "1.250,50" → 1,25 (`parseFloat`). `lib/utils/number-input.ts` TR/EN biçimlerini ayrıştırıyor; düzenlemede fiyat kullanıcının biçiminde gösteriliyor.
- **Görsel kaybı:** pencere 5 görselle sınırlıydı, 5'ten fazla görseli olan ürün kaydedilince fazlası siliniyordu → `MAX_PRODUCT_IMAGES` (20). 5 MB ham dosya sınırı telefon fotoğraflarını reddediyordu → 20 MB (yüklemeden önce WebP'ye sıkıştırılıyor).
- Alan doğrulaması (ad ≥ 2, fiyat, stok, link) alanların altında; protokolsüz linke otomatik `https://`. Ürün limiti görsel yüklemeden önce kontrol ediliyor.
- Kaydedilmemiş değişiklikle kapatmada onay; "AI ile Oluştur" artık gerçek yapay zeka (önceden 7 hazır metinden rastgele).
- Testler: `product-modal-form.test.tsx`, `number-input.test.ts`.

### 5. İçe / dışa aktarma — yapılanlar (9 Ekim 2026)
- Başarısız aktarımda pencere "yükleniyor"da takılı kalıyordu (`useAsyncTimeout.execute` hatayı yutuyordu).
- 500'lük partilerden biri başarısız olunca önceki partiler eklenmiş kalıyor, tekrar deneme onları ikinci kez ekliyordu → kaç ürünün eklendiği söyleniyor, tekrar denemede eklenenler atlanıyor.
- Aktarım sürerken pencere kapatılamıyor. İçe aktarmanın Plus/Pro özelliği olduğu plan listesinde yazıyor.
- Test: `import-resume.test.tsx`.

### 5. İçe / dışa aktarma
`import-export-modal.tsx`, `modals/import-export/*`, backend `bulk-import`

- [ ] CSV ve Excel (.xlsx) içe aktarma, kolon eşleme adımı, Türkçe karakterler
- [ ] Hatalı satırlar raporu; plan limitini aşan içe aktarma
- [ ] Büyük dosya (1000+ satır) — zaman aşımı, ilerleme
- [ ] Şablon indirme (`public/urun-import-sablonu.csv`)
- [ ] Dışa aktarma tüm ürünleri içeriyor mu; CSV formül enjeksiyonu koruması (`sanitizeCsvCell`)

### 6. Kategoriler
`components/categories/*`, backend `rename-category`, `delete-category`

- [ ] Kategori ekle / yeniden adlandır / sil — ürünlere yansıyor mu
- [ ] Free planda kilit davranışı
- [ ] Silinen kategorideki ürünler ne oluyor; kataloglardaki `category_order` güncelleniyor mu

### 7. Excel düzenleyici (+ AI)
`components/excel/*`, `app/api/excel-ai/*` (Groq)

- [ ] Hücre düzenleme, satır ekleme/silme, kaydetme, kaydetmeden çıkma uyarısı
- [ ] Sayfalama, sıralama, doğrulama hataları
- [ ] AI: isim düzeltme, açıklama zenginleştirme, kategori üretme — hata/zaman aşımı, maliyet/limit kontrolü, yetkisiz erişim
- [ ] Çok sayıda üründe performans

### 8. Kataloglar listesi
`components/catalogs/catalogs-page-client.tsx`

- [ ] Yeni katalog (plan limiti; limitteyken yönlendirme)
- [ ] Sil (onay), yayın durumu göstergesi, paylaş modalı (link, QR, WhatsApp vb.)
- [ ] Küçük önizlemeler (thumbnail) doğru şablonla mı
- [ ] Arama; boş durum
- [ ] Eksik olabilecekler: katalog kopyalama, yeniden adlandırma listeden

**Yapılanlar (8 Ekim 2026):**
- Plan düşürülünce limit dışında kalan kataloglar ("kilitli") listede görünmüyordu: sayfa veriyi doğrudan Supabase'den okuyup backend'in hesapladığı `is_disabled`'ı hiç almıyordu, kullanıcı tıklayınca builder 403 veriyordu. Artık aynı sıra (`updated_at desc`) ve limitle hesaplanıyor; kilitli kart, "Ziyaretçilere kapalı" rozeti ve açıklayıcı uyarı bandı var.
- Silme hatası yakalanmıyordu (toast yok, dialog takılı kalıyordu) → yükleniyor durumu + hata mesajı; yayındaki katalog silinince public sayfa önbelleği de temizleniyor (`deleteCatalog(id, slug)`).
- Limit modalında bozuk karakter ("âˆ") ve sabit yazılmış plan sayıları/"Business" vardı → ara modal kaldırıldı, doğrudan plan yükseltme modalı açılıyor; limit metni `{max}` ile plan sabitlerinden geliyor; sayaç Plus için de gösteriliyor.
- Arama sonucu boşken "Henüz katalog yok + oluştur" gösteriliyordu → ayrı "eşleşen katalog yok" durumu + filtreleri temizle.
- Yeni: durum filtresi (Tümü/Yayında/Taslak), listeden **yeniden adlandırma**, **kopyalama** (yeni backend ucu `POST /catalogs/:id/duplicate`: tasarım + ürünler kopyalanır, yayın durumu/slug/istatistik kopyalanmaz, plan limiti uygulanır), son güncelleme zamanı, görüntülenme sayısı.
- Paylaş modalında iki kapatma butonu vardı, PDF butonu bu sayfada hiçbir şey yapmıyordu, `NEXT_PUBLIC_APP_URL` yoksa link/QR boş kalıyordu → düzeltildi (`lib/catalog-url.ts`, builder da aynı yardımcıyı kullanıyor); pano hatası yakalanıyor.
- Performans: tüm kataloglardaki tüm ürünler yerine yalnızca kart önizlemesi için ilk 6 ürün çekiliyor (paralel); ürün eşleme `Map` ile; kart bileşeni `memo`'lu ve ayrı dosyada (`catalog-card.tsx`).
- Kart önizlemesi builder ile aynı ayarları kullanıyor (başlık rengi, SKU, başlık konumu; yanlış `theme` alanı düzeltildi); önizleme kırpıldı, mobilde liste ~%40 kısaldı; hover-only "Düzenle" yerine önizlemenin kendisi klavyeyle erişilebilir link.
- Yeni oluşturmada tam sayfa yenileme yerine `router.push`, tarih kullanıcının dilinde, limit hatasında plan modalı.
- Kullanılmayan `catalog-thumbnail.tsx` silindi.
- Testler: `catalogs-page-client.test.tsx` (2 → 10), `catalog-duplicate.test.ts` (backend ucu).

**Not:** Plan düşünce hangi katalogların açık kalacağı "en son güncellenen" sırasına bağlı; ürün silmek de ilgili katalogların `updated_at`'ini değiştiriyor, yani açık kalan katalog kendiliğinden değişebilir. Ürün kararı gerekiyor (ör. kullanıcının seçtiği katalog açık kalsın).

### 9. Katalog editörü — ✅ büyük ölçüde yapıldı
Yapılanlar: tam ekran düzen, otomatik kayıt + durum, geri al/yinele, kısayollar, yeni sekmeler, şablon/kapak düzeltmeleri.

Kalan:
- [ ] Gerçek backend ile kaydet / otomatik kayıt / yayınla / yayından kaldır / slug güncelle
- [ ] Logo, arka plan, kapak görseli yükleme
- [ ] 1000+ ürünlü katalogda performans
- [x] Teknik borç: tasarım sekmesine ~70 prop aktarımı kaldırıldı; demo builder'ın parçalarını kullanıyor

### 10. Yayındaki katalog sayfası (`/catalog/[slug]`) — müşterinin gördüğü yüz
`app/catalog/[slug]/*`

- [ ] Tüm şablonlarla doğru görünüm (builder önizlemesiyle aynı mı)
- [ ] Sayfa çevirme (flipbook), yakınlaştırma, mobil kaydırma
- [ ] Ürün linkleri, fiyat/açıklama gösterme ayarlarına uyum
- [ ] Yayından kaldırılan / olmayan slug → 404
- [ ] SEO: başlık, açıklama, OG görseli; `show_in_search` = false ise noindex
- [ ] Görüntülenme sayacı (sahibin kendi ziyareti sayılmamalı), analitiğe yansıma
- [ ] Yükleme hızı (görseller, ilk sayfa)

**Yapılanlar (8 Ekim 2026):**
- **Builder ile yayındaki görünüm farklıydı:** yayındaki sayfa ayrı bir sayfalama ve ayar mantığı kullanıyordu. Eski şablon adları (`list`, `bold-grid`, `classic-list`, `elegant-showcase`, `minimal-gallery`) yayında hep "Modern Grid" olarak çiziliyordu; "özellikleri göster" varsayılanı farklıydı (builder kapalı, yayın açık); sütun sayısı normalleştirilmiyordu; sayfa numaraları farklı sayılıyordu; `.catalog-light` sarmalayıcısı yoktu. Artık yayındaki sayfa builder'ın `buildInitialCatalogState` + `createCatalogPagesModel` fonksiyonlarını kullanıyor; şablon adları `lib/catalog-layouts.ts` ile tek yerden normalleştiriliyor (sayfa başına ürün sayısı dahil — `elegant-showcase` 9 yerine doğru 4 ürün).
- **Sitedeki hiçbir sticky başlık yapışmıyordu:** `globals.css`'teki `body { overflow-x: hidden }` body'yi kaydırma kabı yapıyordu → `overflow-x: clip` (eski tarayıcılar için `hidden` yedek). Bu düzeltme tüm siteyi etkiler.
- **Tam ekran Esc ile kapatılınca** sayfa siyah arka planda başlıksız kalıyordu → `fullscreenchange` dinleniyor; desteklemeyen tarayıcıda (iOS) buton gizli, hata yutuluyor.
- **Masaüstü yakınlaştırma** transform + yüzde negatif margin ile yapılıyordu (alt boşluk/üst üste binme) → CSS `zoom`; PDF alırken 1.
- **Mobilde arama sonucu boşken** hiçbir şey görünmüyordu (boş durum sadece masaüstündeydi) → her iki görünümde "sonuç yok + filtreleri temizle", ürünsüz katalog için ayrı mesaj. Mobil görüntüleyici sabit `100vh - 80px` yerine kalan alanı dolduruyor.
- **Backend önbelleği:** katalog silinince public önbellek temizlenmiyordu (silinen katalog 10 dk açık kalıyordu); güncellemede meta önbelleği (başlık, açıklama, `show_in_search`) temizlenmiyordu → ikisi de düzeltildi.
- **Görüntülenme sayacı:** WhatsApp/Facebook/Telegram link önizleme botları görüntülenme sayılıyordu → bot listesine eklendi.
- **SEO/paylaşım:** OG görseli yoktu (alt sayfa openGraph'ı ezdiği için site varsayılanı da kayboluyordu) → kapak > logo > site görseli; canonical URL ve Twitter kartı; bulunamayan katalog `noindex`.
- Başlık: sabit Türkçe başlıklar çeviriye taşındı, ikon butonlara etiket, arama temizleme, PDF hazırlanırken buton kilitli, mobilde ad + işlemler tek satır. Paylaşım linki `getCatalogShareUrl` ile (önceden `window.location.href`, sorgu parametreleriyle).
- Kullanılmayan mor `DEFAULT_PRIMARY_COLOR` kaldırıldı.
- Testler: `public-catalog-client.test.tsx` (şablon takma adları, varsayılanlar, sayfa numarası, açık tema, boş durum).

**Kalan:** gerçek katalogla tüm şablonların builder ile yan yana karşılaştırması; görüntülenme sayısının analitiğe yansıması (gerçek ziyaret gerekir); `x-forwarded-for` sahteciliğiyle görüntülenme şişirme (backend `trust proxy` ayarı ile çözülmeli — deploy topolojisine bağlı, karar gerekiyor).

### 11. PDF export
`lib/hooks/use-pdf-export.ts`, backend `pdf-exports`, `workers/pdf-export-worker.ts`

- [ ] İş oluşturma → kuyruk → worker → R2 → indirme linki
- [ ] İlerleme penceresi, arka plana alma, iptal
- [ ] Bildirimden indirme, link süresi dolması, temizleme işi
- [ ] Plan kotası (export sayısı), kota dolunca yükseltme penceresi
- [ ] PDF içeriği builder önizlemesiyle birebir mi (CSS düzeltmesi sonrası tekrar kontrol)
- [ ] Redis yokken anlamlı hata

**Yapılanlar (8 Ekim 2026):**
- **PDF builder'dan farklı görünüyordu:** render belgesinde global CSS tüm `.overflow-hidden` öğelerini `visible`, tüm `.h-full` öğelerini `height:auto` yapıyordu → görseller ürün adlarının üstüne taşıyor, alt bilgiler (“Sayfa 1/2”) kayboluyor ya da ayrı bir PDF sayfasına düşüyordu (modern-grid, luxury, magazine'de PDF katalogdan 1 sayfa fazlaydı). Ayrıca varsayılanlar farklıydı: ana renk eski mor (#7c3aed), başlık rengi beyaz, "özellikler" açık, başlık ortada, sütun normalizasyonu ve kullanıcı logosu yedeği yok, eski şablon adları yanlış sayfalanıyordu. Artık render belgesi builder'ın `buildInitialCatalogState` + `normalizeLayout` kullanıyor; override CSS kaldırıldı. Playwright ile 16 şablonun hepsinde gerçek PDF üretildi: sayfa sayısı = katalog sayfa sayısı, görünüm ekranla aynı.
- **İptal edilen iş işlenmeye devam ediyordu:** worker iptali hiç kontrol etmiyordu; tamamlama aşamasında hata alıp işi "başarısız" yapıyor, BullMQ işi yeniden deneyip PDF'i bir kez daha üretiyor, yüklenen dosya R2'de sahipsiz kalıyordu. Artık her ara adım yalnızca aktif işi günceller (iptal edilmişse sessizce durur, yeniden denenmez), tamamlanamayan işin dosyası silinir.
- **İlk denemede hata, kullanıcıya "başarısız" görünüyordu** ama BullMQ 60 sn sonra tekrar deniyordu (kullanıcı yeni iş başlatıp çift PDF üretebiliyordu) → ara denemelerde iş "sırada"ya döner, yalnızca son denemede "başarısız".
- **Takılan iş kullanıcıyı kalıcı kilitliyordu:** worker çökerse/yeniden başlarsa iş DB'de "processing" kalıyor, yeni her istek 409 "devam eden iş var" alıyordu → 40 dk güncellenmeyen aktif iş takılmış sayılıp kapatılır; takılan (stalled) işler worker'ın `failed` olayında da kapatılır.
- **Redis'e ulaşılamazsa istek sonsuza dek asılı kalıyordu** (`maxRetriesPerRequest: null`) → kuyruk işlemlerine 10 sn sınır; Redis yok/erişilemez ise anlamlı 503 mesajı.
- **Kullanıcıya teknik hata metni gösteriliyordu** (“waiting-render-ready: Timeout 300000ms exceeded”) → worker hata kodu yazar (`render_timeout`, `asset_timeout`, `storage_failed`…), frontend çevirir; eski serbest metinler genel mesaja düşer.
- **İstemci:** tek bir ağ kesintisinde PDF süreci hata veriyordu → art arda 6 hataya kadar bekler; worker 10 dk içinde işi almazsa iş iptal edilip "servis yanıt vermiyor" denir; kota dolu (403) ise plan yükseltme penceresi açılır.
- İlerleme penceresinde sabit metinler ("Linki Kopyala", "PDF İndir", toast) ve eksik `pdf.continueInBackground` çevirisi; yayındaki sayfanın PDF hata metinleri çevrildi, dosya adında Türkçe harfler korunuyor.
- Testler: `pdf-export-lifecycle.test.ts`, `use-pdf-export.test.tsx` (ağ kesintisi, kota, takılı kuyruk, hata kodları), `pdf-export-preview-parity.test.ts` güncellendi.

**Kalan:** gerçek Redis + worker + R2 ile uçtan uca deneme (yerelden Coolify'daki Redis'e erişilemiyor); bildirimden indirme ve link süresi dolması akışının canlıda kontrolü.

### 12. Şablonlar sayfası
`components/templates/templates-page-client.tsx`

- [ ] "Bu şablonu kullan" → yeni katalog → builder'da şablon seçili
- [ ] Pro şablonlarda free kullanıcıya yükseltme penceresi
- [ ] Önizlemeler builder'daki şablon kartlarıyla tutarlı mı

### 13. Analitik
`components/analytics/analytics-client.tsx`

- [ ] 7/30/90 gün aralıkları, grafikler gerçek veriyle
- [ ] Cihaz / konum dağılımı; veri yokken boş durum
- [ ] Plan kısıtı (Pro özelliği mi?)

### 14. Ayarlar
`components/settings/tabs/{profile,preferences,subscription}-tab.tsx`

- [ ] Profil (ad, şirket, logo) kaydetme
- [ ] Sosyal linkler doğrulaması
- [ ] Dil ve tema tercihleri kalıcı mı
- [ ] Abonelik sekmesi: mevcut plan, yenileme tarihi, iptal (`cancel-subscription`)
- [ ] Şifre değiştirme, hesap silme (onay, verilerin silinmesi)

### 15. Bildirimler
`components/dashboard/notification-dropdown.tsx`

- [ ] Okundu / tümünü okundu / sil / tümünü sil
- [ ] PDF hazır bildirimi ve indirme

### 16. Fiyatlandırma → ödeme → sonuç → makbuz
`app/pricing`, `app/checkout/*`, `components/billing/*`, backend `billing`

- [ ] Plan seçimi → checkout formu (fatura bilgileri doğrulaması, taslak kaydetme)
- [ ] Garanti 3D akışı (test kartlarıyla), başarılı / başarısız / iptal dönüşleri
- [ ] Ödeme sonrası plan ve limitlerin anında güncellenmesi
- [ ] Makbuz / fatura belgesi oluşturma ve indirme
- [ ] Callback güvenliği (imza doğrulama, tekrar oynatma)
- [x] Not: `POST /users/me/upgrade` her zaman 403 dönüyor — kullanılmayan kalıntı → kaldırıldı

**Yapılanlar (8 Ekim 2026) — gerçek bankaya istek atılmadı, yalnızca kod incelemesi + birim testleri:**
- **🔴 Güvenlik açığı — sahte "onay" callback'i:** Garanti callback imzası, callback'in kendi `hashparams` listesindeki alanların değerleri **ayraçsız** birleştirilerek doğrulanıyordu ve sonuç alanlarının imzalı olması şart değildi. Kendi siparişine ait gerçek bir *ret* callback'inde alan sınırlarını kaydırarak (`authcode`=“51”, `procreturncode` listeden çıkarılıp “00” yapılır) imza geçerli kalıyor, sipariş “ödendi” sayılıp plan veriliyordu (`tests/garanti-payment.test.ts` saldırıyı birebir yeniden üretir). Düzeltme: (1) `oid` ve `procreturncode` imzalı alanlar arasında değilse callback geçersiz; (2) **onay callback'i planı tek başına vermez** — banka VP sipariş sorgusuyla (`orderinq`) sunucudan teyit edilir; teyit yoksa sipariş beklemede kalır ve mevcut mutabakat worker'ı kesin sonucu bankadan alıp tamamlar; banka onaylamıyorsa kritik alarm.
- **Ödeme sonrası plan 10 dk gecikmeli uygulanıyordu:** backend'in kullanıcı/katalog önbelleği (plan) ödeme, mutabakat ve iade sonrası temizlenmiyordu → ödeyen kullanıcı hâlâ ücretsiz limitlere (katalog limiti, kilitli kataloglar) takılıyordu. `services/plan-cache.ts` ile üç noktada temizleniyor.
- **Giriş yapmamış kullanıcı** tüm fatura formunu doldurup gönderince “giriş yapın” uyarısı alıyor, girişten sonra panele düşüp plan seçimini/formu kaybediyordu → ödeme sayfası önce girişe yönlendirir (`/auth?next=/checkout?plan=…&billing=…`), girişten sonra aynı sayfaya döner.
- Bankaya yönlendirilirken buton tekrar aktif oluyordu (çift tıklama) → yönlendirme sırasında kilitli kalır.
- Sonuç sayfası “beklemede”yken elle yenilemek gerekiyordu → 3 dk boyunca 4 sn'de bir otomatik yenilenir.
- Ölü `upgradeToPro` ucu kaldırıldı; tanıtım bölümündeki `/auth?plan=free` linki kayıt formuna (`?tab=signup`) çevrildi.
- Testler: `garanti-callback-confirmation.test.ts` (banka teyidi olmadan plan verilmez), `garanti-payment.test.ts` (sahte callback senaryosu).

**Kalan:** Garanti **TEST** ortamıyla uçtan uca deneme (test kartları, başarılı/başarısız/iptal dönüşleri, makbuz) — `.env`'de şu an PROD bilgileri var, test POS bilgileri gerekiyor. Fiyatlandırma sayfasındaki plan özellik metinleri sabit Türkçe (sayfa 18'de ele alınacak).

### 17. Admin paneli
`app/admin/*`, `components/admin/admin-dashboard/*`

- [ ] Admin girişi; admin olmayanın erişememesi (backend `requireAdmin` var)
- [ ] Kullanıcılar: plan değiştirme; silinen kullanıcılar
- [ ] Geri bildirimler, aktivite kayıtları
- [ ] Ödeme işlemleri: mutabakat, iade, uyarılar

### 18. Public site
`app/(main)`, `features`, `how-it-works`, `faq`, `contact`, `blog`, `legal/*`, `privacy`, `terms`

- [ ] İletişim formu gerçekten gönderiyor mu (Resend), spam koruması
- [ ] Tüm linkler, CTA'lar doğru sayfaya gidiyor mu
- [ ] Blog listesi ve yazılar, SEO meta, sitemap / robots
- [ ] Yasal metinler güncel mi (KVKK, mesafeli satış, iptal/iade)
- [ ] Mobil menü, dil değiştirici

**Yapılanlar (9 Ekim 2026):**
- Tüm public sayfalar ortak `components/marketing` yapı taşlarına geçti (PageHero, Section, FeatureCard, StepCard, CtaBanner, LegalDocument…): sans başlık, brand dönüşüm butonu + outline ikincil buton, dashboard ile aynı kartlar. Ana sayfa yeniden yazıldı (gerçek şablonlarla önizleme).
- **SSS sayfasının tamamı canlıda bozuk karakterle görünüyordu** (çift kodlanmış UTF-8; Cloudinary hata mesajları ve magazine şablonu da) → düzeltildi, `npm run lint` artık `scripts/check-encoding.mjs` ile yakalıyor.
- Plan özellikleri tek kaynakta (`lib/billing/plan-features.ts`): fiyatlandırma, plan yükseltme penceresi ve Ayarlar > Abonelik aynı listeyi gösteriyor. Uygulamada olmayan özellikler (4K PDF, SEO ayarları, 7/24 WhatsApp destek, WhatsApp sipariş/sepet) ve gerçek olmayan sayılar ("binlerce/5.000+/10.000+ işletme") kaldırıldı. SSS ve Google FAQ şeması gerçek davranışa göre (ödemeler otomatik yenilenmez, fiyatlar KDV dahil).
- Giriş ekranı, yasal sayfalar, blog, iletişim ve demo aynı stile getirildi; 390 px'te taşma yok.

**Kararlar (9 Ekim 2026, kullanıcı onayladı) — uygulandı:**
- PDF hakkı artık **aylık** yenileniyor (bu ay tamamlanan PDF işleri sayılıyor, migration yok).
- Yetkili mahkeme her yerde **İstanbul**; ödeme kuruluşu Garanti BBVA.
- Blog yazılarındaki olmayan WhatsApp sipariş butonu, ürün satış linki olarak düzeltildi.
- Ayarlar > Abonelik'e **iptal** seçeneği eklendi (dönem sonuna kadar sürer, iade yok).

### 19. Demo oluşturucu
`app/create-demo`, `components/demo/demo-builder.tsx`

- [ ] Girişsiz kullanılabiliyor mu, kayda yönlendirme
- [ ] Gerçek builder'dan ayrı kopya — birleştirilmeli mi kararı

### 20. Hata / 404 sayfaları
- [ ] `not-found`, `error`, `global-error`, `dashboard/error` — doğru metin, geri dönüş yolu

---

## 5. Şimdiye kadar yapılanlar (bu branch)

- **Tasarım sistemi:** tek tema, semantik token'lar, ham renk yasağı (`npm run lint`)
- **Builder:** önbellek hatası, güvenilir otomatik kayıt, geri al/yinele, tam ekran yeni tasarım, mobil hydration hatası
- **Şablonlar:** katalog önizlemesi/PDF'te renkleri ezen CSS hatası, okunabilirlik, başlık kesilmesi, koyu temalar
- **Ürünler:** toplu işlemler, arama/filtre, yeni tasarım
- **Genel:** mobilde onay kutusu boyutu, gizli kalan PDF çevirileri, görsel bileşeninde hydration hatası

## 6. Bilinen açık noktalar

- ~~Supabase `catalogs.primary_color` varsayılanı mor~~ → backend oluşturmada `#18181b` yazıyor (DB varsayılanı değişmedi)
- ~~Toplu görsel yükleme penceresi sabit Türkçe~~ → çevrildi; 20 görsel / 20 MB
- ~~Builder tasarım sekmesinde ~70 prop aktarımı~~ → bölümler state'i context'ten okuyor (design-context.tsx)
- ~~Demo builder gerçek builder'ın ayrı kopyası~~ → builder parçalarını kullanıyor
- Branch'teki son commit'ler push edilmedi, main'e birleştirilmedi

## 7. Karar bekleyen sorular

1. Test için ayrı Supabase projesi açılsın mı? (Faz 0'ın ön koşulu)
2. Öncelik sırası (bölüm 3) uygun mu, değiştirmek istediğin bir şey var mı?
3. Her sayfa için önce rapor → onay → düzeltme mi, yoksa açık hataları doğrudan düzeltip sadece tasarım kararlarını mı soralım?

## 8. 9 Ekim 2026 — ikinci tur özeti (2, 6, 7, 12, 13, 14, 15, 17, 20)

| Sayfa | Bulunan / düzeltilen |
|---|---|
| Dashboard | İstatistik etiketleri açık temada görünmüyordu; küçük grafikler uydurmaydı; "Ürün ekle" içe aktarmayı açıyordu; onboarding "Paylaş" yanlış tamamlanıyordu; sidebar plan kartında limitler elle yazılmıştı, aylık PDF görünmüyordu |
| Kategoriler | Yeniden adlandırma alt metin eşleştirip "Masa Lambası"na dokunuyordu, birleşmede "A, A" oluşuyordu; noktalama içeren kategori silinemiyordu; renk/kapak ve katalog ayraç sırası güncellenmiyordu; yeni kategori yenilemede kayboluyordu; Türkçe harflerde kart kimlikleri çakışıyordu |
| Excel + AI | Toplu AI uçlarında kota yoktu (maliyet) → günlük plan kotası; yarıda kalan kayıt tekrar denemede yeni satırları ikiler ekliyordu; adı eksik satır "Kaydet"i sessizce kilitliyordu |
| Analitik | 1000+ görüntülenmede veriler ilk 1000 satırla sınırlıydı; dönem seçimi ana sayıyı değiştirmiyordu |
| Ayarlar | Ödeme geçmişi olan kullanıcı hesabını silemiyordu (RESTRICT FK) → içerik + kişisel veri silinir, ödeme kayıtları saklanır, giriş kapanır; boşaltılan profil alanları ekranda geri geliyordu |
| Admin | Elle verilen ücretli plan, geçmişteki bitiş tarihi yüzünden hemen ücretsize düşüyordu; plan değişikliği onaysızdı |
| Şablonlar | Premium şablon backend'de kontrol edilmiyordu; sabit metinler, dokunmatikte görünmeyen buton |
| Hata sayfaları | "api" geçen her hata "sunucuya ulaşılamıyor" sayılıyordu; tek tip ve çevirili |

**Kalanlar:** Faz 0 (test Supabase + gerçek uçtan uca denemeler), admin kullanıcı listesinde 1000 satır sınırı (şimdilik kullanıcı az), bulut görsellerinin (Cloudinary) hesap silmede temizlenmemesi, Excel AI kotasının sunucu belleğinde tutulması (tek frontend süreciyle yeterli).

### Üçüncü tur (9 Ekim 2026)
- Demo: "Ücretsiz hesap oluştur" 404 veren /auth/register'a gidiyordu; arka plan rengi etkisizdi; PDF küçültülmüş önizlemeden alınıyordu; tamamen çevrildi.
- Admin: kullanıcı/silinen kullanıcı listeleri 1000 satırla sınırlıydı; silinen kullanıcılar sorgusu olmayan `created_at` sütununu istiyordu.
- Hesap silmede ürün/katalog/kategori/profil görselleri Cloudinary'de "silinenler" klasörüne taşınıyor.
- Toplu görsel yükleme çevrildi, sınırlar 20 görsel / 20 MB; ürün ızgarasındaki ~200 satırlık önizleme kopyası kaldırıldı.
- Yeni kataloglar DB varsayılanı yüzünden mor vurgu rengiyle açılıyordu.

### Dördüncü tur (9 Ekim 2026)
- Builder: tasarım bölümleri ~70 prop yerine ortak bir kaynaktan (DesignSource) besleniyor.
- Demo builder'ın tasarım bölümlerini ve önizlemesini kullanıyor (16 şablon, kapak, arka plan); görseller sunucuya gitmiyor; PDF çok sayfalı.
- Logo yüklenince konum "gösterme"de kaldığı için logo görünmüyordu (builder + demo).

**Hâlâ açık:** Faz 0 (test ortamı + uçtan uca), branch'in main'e birleştirilmesi, admin ödeme işlemleri sekmesi yalnızca Türkçe (dahili araç), AI kotasının sunucu belleğinde tutulması.

