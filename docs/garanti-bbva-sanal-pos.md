# Garanti BBVA Sanal POS Entegrasyonu

## Kapsam

FogCatalog, kart verisini kendi arayüzünde veya sunucusunda işlemeden Garanti BBVA'nın
ortak ödeme sayfasına yönlendirir. Uygulanan model:

- API sürümü: `512`
- Güvenlik seviyesi: `3D_OOS_PAY`
- İşlem: peşin satış (`sales`)
- Para birimi: TRY (`949`)
- Kart numarası, son kullanma tarihi ve CVC FogCatalog'a gelmez ve kaydedilmez.
- Paket yalnızca imzası doğrulanmış `procreturncode=00` callback'i sonrasında aktif edilir.

`OOS_PAY` 3D doğrulama yapmadığı için, `3D_PAY` ise kart alanlarını işyeri
sayfasına taşıdığı için bu adaptör tarafından reddedilir.

## Akış

1. Kullanıcı checkout formunu ve yasal onayları tamamlar.
2. Backend kullanıcıya ait fatura taslağını oluşturur/günceller.
3. Backend fiyatı tarayıcıdan almak yerine kendi sabit fiyat tablosundan hesaplar.
4. `start_garanti_payment` siparişi kilitler, tutarı dondurur ve ödeme denemesini oluşturur.
5. Frontend, backend'in ürettiği kart alanı içermeyen imzalı formu Garanti'ye POST eder.
6. Garanti sonucu herkese açık olan kesin callback adresine form POST'u ile gönderir.
7. Backend `hashparams` sırası ve ISO-8859-9 kodlamasıyla callback hash'ini doğrular;
   sipariş, tutar, para birimi ve terminal değerlerini beklenen kayıtla karşılaştırır.
8. Onaylanan sipariş, ödeme denemesi ve kullanıcı paketi tek veritabanı işlemi içinde
   güncellenir. Aynı callback tekrar gelirse paket süresi ikinci kez uzatılmaz.
9. Kullanıcı sabit FogCatalog sonuç sayfasına yönlendirilir; sayfa durumu yetkili
   backend endpoint'inden okur.
10. Her deneme için tekil bir mutabakat operasyonu oluşturulur. Callback kaybolursa
    worker 2, 5, 15 ve 60 dakikalık pencerelerde `orderinq` çalıştırır.
11. Banka/yerel sipariş, terminal, işyeri veya tutar eşleşmezse otomatik paket ya da
    para mutasyonu yapılmaz; kayıt `manual_review` olur ve admin alarmı açılır.

## Migration sırası

Canlı Supabase'e aşağıdaki sırayla uygulanmalıdır:

1. `supabase/migrations/20260804112823_billing_foundation.sql`
2. `supabase/migrations/20260813152000_garanti_payment_flow.sql`
3. `supabase/migrations/20260813170000_fix_billing_checkout_draft_conflict.sql`
4. `supabase/migrations/20260813193000_garanti_payment_operations.sql`
5. `supabase/migrations/20260813193100_add_garanti_payment_fk_indexes.sql`
6. `supabase/migrations/20260813193200_retry_manual_garanti_reconciliation.sql`
7. `supabase/migrations/20260813193300_add_garanti_payment_customer_ip.sql`

İkinci migration `billing_payment_attempts`, tekrar çalıştırmaya dayanıklı ödeme
başlatma/sonuçlandırma fonksiyonları ve paket aktivasyonunu ekler. Tablo ve RPC'ler
browser rollerine kapalı, yalnızca backend `service_role` erişimine açıktır.

## Backend ortam değişkenleri

```dotenv
GARANTI_POS_ENABLED=false
GARANTI_POS_MODE=TEST
GARANTI_POS_API_VERSION=512
GARANTI_POS_MERCHANT_ID=
GARANTI_POS_TERMINAL_ID=
GARANTI_POS_TERMINAL_USER_ID=
GARANTI_POS_PROV_USER_ID=PROVOOS
GARANTI_POS_PROVISION_PASSWORD=
GARANTI_POS_STORE_KEY=
GARANTI_POS_SECURITY_LEVEL=3D_OOS_PAY
GARANTI_POS_PAYMENT_URL=https://sanalposprovtest.garantibbva.com.tr/servlet/gt3dengine
GARANTI_POS_CALLBACK_URL=https://api.example.com/api/v1/billing/payments/garanti/callback
GARANTI_POS_RESULT_URL=https://app.example.com/checkout/result
GARANTI_POS_COMPANY_NAME=FogCatalog

# Mutabakat ve iptal/iade worker'i
GARANTI_OPERATIONS_ENABLED=false
GARANTI_POS_VP_URL=https://sanalposprovtest.garantibbva.com.tr/VPServlet
GARANTI_VP_USER_ID=
GARANTI_VP_TIMEOUT_MS=10000
GARANTI_VP_MAX_RESPONSE_BYTES=131072
GARANTI_INQUIRY_PROV_USER_ID=PROVAUT
GARANTI_INQUIRY_PROVISION_PASSWORD=
GARANTI_REFUND_PROV_USER_ID=PROVRFN
GARANTI_REFUND_PROVISION_PASSWORD=
GARANTI_RECONCILIATION_SCAN_INTERVAL_MS=30000
GARANTI_PAYMENT_WORKER_CONCURRENCY=1
```

Kurallar:

- Provision parolası ve store key yalnızca backend servisinde bulunur.
- Callback ve sonuç adresleri herkese açık HTTPS adresleri olmalıdır.
- `TEST` modu test hostu, `PROD` modu test kelimesi içermeyen banka hostu gerektirir.
- Bankanın verdiği provision kullanıcısı kullanılır; isim kod içinde varsayılmaz.
- Değişkenler tamamlanmadan `GARANTI_POS_ENABLED=true` yapılmamalıdır. Production
  backend eksik veya güvensiz bir ayarla başlamayı reddeder.
- `GARANTI_OPERATIONS_ENABLED=true` için Redis, `VPServlet`, PROVAUT/PROVRFN
  kullanıcıları ve bu kullanıcılara ait provision parolaları gerekir.
- Garanti'nin fraud kontrolü için istediği müşteri IP'si ödeme başlatma isteğinden
  doğrulanarak backend-only `billing_payment_attempts.customer_ip` alanına yazılır;
  frontend env'ine veya alarm ayrıntılarına konmaz.
- PROD sipariş servisi: `https://sanalposprov.garanti.com.tr/VPServlet`.

## Coolify servisleri

- Garanti değişkenleri Express backend servisine eklenir; frontend'e eklenmez.
- Backend callback URL'si internetten ulaşılabilir olmalıdır.
- Result URL Next.js frontend servisine gitmelidir.
- Backend ve frontend deploylarından önce iki migration uygulanmış olmalıdır.
- İlk banka testi boyunca `GARANTI_POS_MODE=TEST` ve test endpoint'i kullanılır.
- `payment-worker`, backend kaynaklarından ayrı bir Coolify servisi olarak çalışır;
  Redis ve Supabase'e erişir. Para mutasyonlarında BullMQ otomatik retry kapalıdır.

## Mutabakat ve iptal/iade

- `orderinq` yalnız okuma işlemidir. Onay ancak sipariş, terminal, işyeri, TRY/949
  tutarı ve banka referansı eşleşirse atomik olarak yazılır.
- Aynı gün, hiç kısmi iade görmemiş tam tutar işlemi `void`; diğer tam veya kısmi
  tutarlar `refund` olur.
- İptal/iade oluşturmak için admin JWT'si, gerekçe ve en az 8 karakterlik
  `Idempotency-Key` header'ı zorunludur.
- Bankaya iptal/iade gönderildikten sonra timeout olursa aynı mutasyon tekrar
  gönderilmez. Worker yalnız `orderhistoryinq` ile sonucu doğrular.
- Tam iptal/iade ilgili `billing_subscription_grants` kaydını geri alır. Daha yeni
  aktif satın alma varsa kullanıcının güncel paketine dokunmaz. Kısmi iade paketi
  otomatik düşürmez.

Admin API'leri:

- `GET /api/v1/admin/billing/orders`
- `GET /api/v1/admin/billing/operations`
- `GET /api/v1/admin/billing/alerts`
- `POST /api/v1/admin/billing/attempts/:attemptId/reconcile`
- `POST /api/v1/admin/billing/orders/:orderId/reversal`
- `POST /api/v1/admin/billing/alerts/:alertId/acknowledge`

## Alarm kanalları

Alarmlar `billing_payment_alerts` tablosunda kalıcı ve tekilleştirilmiş olarak tutulur,
admin kullanıcılarına uygulama içi bildirim gönderilir ve `/metrics` altında şu
Prometheus serileri yayınlanır:

- `fogcatalog_payment_alerts_total{severity,code}`
- `fogcatalog_payment_alerts_open{severity}`

Alarm ayrıntılarından parola, store key, hash, kart/PAN/CVC, e-posta, telefon, ham XML
ve callback payload alanları filtrelenir.

## Kabul testleri

- Başarılı kart: sipariş `paid`, deneme `approved`, paket `active` olur.
- Banka reddi: sipariş `payment_failed` olur; paket değişmez.
- Hash/tutar/sipariş değiştirme: veritabanında başarılı durum yazılmaz.
- Çift tıklama: aynı bekleyen deneme yeniden kullanılır.
- Aynı onay callback'inin tekrarı: paket süresi ikinci kez uzamaz.
- Başka kullanıcının sipariş kimliği: başlatma ve durum sorgusu reddedilir.
- TEST/PROD URL karışıklığı: backend yapılandırmayı reddeder.
- Sonuç sayfası yalnızca backend `paid` döndürdüğünde başarı gösterir.
- Kısmi iade sonrası kalan tutar `refund` olur; `void` olmaz.
- Aynı iade tekrar tamamlandığında toplam iade ikinci kez artmaz.
- Eski siparişin tam iadesi daha yeni Pro satın alımını kapatmaz.
- Timeout sonrası aynı `void/refund` gönderilmez; yalnız sipariş geçmişi sorgulanır.

## Canlıya çıkış kapıları

Kod tarafında mutabakat, iptal/iade ve alarm çekirdeği hazırdır. Production tahsilatı
açılmadan önce dış sistem doğrulamaları tamamlanmalıdır:

- Garanti test işyeri bilgileriyle başarılı/red/tekrar callback senaryolarının uçtan uca testi
- Garanti TEST hesabında `orderinq`, `orderhistoryinq`, `void` ve `refund` için
  maskelenmiş gerçek cevaplarla uçtan uca worker testi
- Coolify'da `payment-worker` servisi ve Prometheus alarm kuralları
- Bankanın production işyeri onayı, production URL'leri ve anahtar rotasyonu

Mutabakat kesin sonuç veremezse işlem `manual_review` durumuna ve kalıcı alarma geçer;
sistem tahmini başarı göstermez ve paketi aktif etmez.
