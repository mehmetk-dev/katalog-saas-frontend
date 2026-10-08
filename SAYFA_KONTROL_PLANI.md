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
| 1 | Giriş / kayıt / şifre işlemleri | 🔴 Yüksek | 🟢 Kod + birim testleri yapıldı (gerçek e-posta/Google uçtan uca kaldı) |
| 2 | Dashboard ana sayfa | 🟡 Orta | ⏳ |
| 3 | Ürünler | 🔴 Yüksek | 🟢 Büyük ölçüde yapıldı (gerçek backend ile doğrulama kaldı) |
| 4 | Ürün ekle/düzenle modalı | 🔴 Yüksek | ⏳ |
| 5 | İçe / dışa aktarma (Excel/CSV) | 🔴 Yüksek | ⏳ |
| 6 | Kategoriler | 🟡 Orta | ⏳ |
| 7 | Excel düzenleyici (+ AI) | 🟡 Orta | ⏳ |
| 8 | Kataloglar listesi | 🔴 Yüksek | 🟢 Kod + testler yapıldı (gerçek backend ile doğrulama kaldı) |
| 9 | Katalog editörü (builder) | 🔴 Yüksek | 🟢 Büyük ölçüde yapıldı (gerçek backend ile doğrulama kaldı) |
| 10 | Yayındaki katalog sayfası (`/catalog/[slug]`) | 🔴 Yüksek | 🟢 Kod + testler yapıldı (gerçek verili uçtan uca kaldı) |
| 11 | PDF export | 🔴 Yüksek | ⏳ |
| 12 | Şablonlar sayfası | 🟢 Düşük | ⏳ |
| 13 | Analitik | 🟡 Orta | ⏳ |
| 14 | Ayarlar | 🟡 Orta | ⏳ |
| 15 | Bildirimler | 🟢 Düşük | ⏳ |
| 16 | Fiyatlandırma → ödeme → sonuç → makbuz | 🔴 Yüksek | ⏳ |
| 17 | Admin paneli | 🟡 Orta | ⏳ |
| 18 | Public site (landing, özellikler, SSS, iletişim, blog, yasal) | 🟡 Orta | ⏳ |
| 19 | Demo oluşturucu (`/create-demo`) | 🟢 Düşük | ⏳ |
| 20 | Hata / 404 sayfaları | 🟢 Düşük | ⏳ |

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
- [ ] Teknik borç: tasarım sekmesine ~70 prop aktarımı, demo builder'ın ayrı kopya olması

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
- [ ] Not: `POST /users/me/upgrade` her zaman 403 dönüyor — kullanılmayan kalıntı, kaldırılabilir

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

- Supabase `catalogs.primary_color` varsayılanı hâlâ mor (`#7c3aed`) — migration kararı bekliyor
- Toplu görsel yükleme penceresi sabit Türkçe
- Builder tasarım sekmesinde ~70 prop aktarımı (teknik borç)
- Demo builder gerçek builder'ın ayrı kopyası
- Branch'teki son commit'ler push edilmedi, main'e birleştirilmedi

## 7. Karar bekleyen sorular

1. Test için ayrı Supabase projesi açılsın mı? (Faz 0'ın ön koşulu)
2. Öncelik sırası (bölüm 3) uygun mu, değiştirmek istediğin bir şey var mı?
3. Her sayfa için önce rapor → onay → düzeltme mi, yoksa açık hataları doğrudan düzeltip sadece tasarım kararlarını mı soralım?
