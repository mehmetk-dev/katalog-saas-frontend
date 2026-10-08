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
| 1 | Giriş / kayıt / şifre işlemleri | 🔴 Yüksek | ⏳ Bekliyor |
| 2 | Dashboard ana sayfa | 🟡 Orta | ⏳ |
| 3 | Ürünler | 🔴 Yüksek | 🟢 Büyük ölçüde yapıldı (gerçek backend ile doğrulama kaldı) |
| 4 | Ürün ekle/düzenle modalı | 🔴 Yüksek | ⏳ |
| 5 | İçe / dışa aktarma (Excel/CSV) | 🔴 Yüksek | ⏳ |
| 6 | Kategoriler | 🟡 Orta | ⏳ |
| 7 | Excel düzenleyici (+ AI) | 🟡 Orta | ⏳ |
| 8 | Kataloglar listesi | 🔴 Yüksek | ⏳ |
| 9 | Katalog editörü (builder) | 🔴 Yüksek | 🟢 Büyük ölçüde yapıldı (gerçek backend ile doğrulama kaldı) |
| 10 | Yayındaki katalog sayfası (`/catalog/[slug]`) | 🔴 Yüksek | ⏳ |
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
