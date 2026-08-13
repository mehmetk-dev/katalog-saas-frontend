# Garanti Ödeme Operasyonları

## Hedef

Belirsiz Garanti callback'lerini banka sorgusuyla kesinleştiren, aynı gün iptal ve tam/kısmî iadeyi idempotent yürüten, abonelik hakkını doğru hesaplayan ve operasyon ekibini hatalarda uyaran production akışını kurmak.

## Görevler

- [x] Resmi banka sözleşmesini sabitle: `orderinq`, `orderhistoryinq`, `void`, `refund` ve v512 hash test vektörleri. Garanti TEST hesabında gerçek çağrı doğrulaması canlıya çıkış kapısı olarak ayrıca duruyor.
- [x] Backend-only operasyon, abonelik grant'i, alarm ve atomik finalize tabloları/RPC'leri; RLS açık, `anon/authenticated` kapalı, `service_role` erişimli.
- [x] Allowlist'li `VPServlet` istemcisi, ISO-8859-9 XML, timeout/cevap sınırı, güvenli parser ve TEST/PROD host koruması.
- [x] BullMQ mutabakat/iptal/iade kuyruğu ve ayrı payment worker; finansal mutasyonda otomatik retry yok.
- [x] 2, 5, 15 ve 60 dakika `orderinq`; eşleşmeme durumunda `manual_review` ve alarm.
- [x] Admin-only listeleme, mutabakat, iptal/iade ve alarm onay API'leri; idempotency ve rate-limit.
- [x] Tam/kısmi iade entitlement kuralları ve daha yeni satın almayı koruyan grant defteri.
- [x] Kalıcı DB alarmı, admin uygulama içi bildirimi ve Prometheus metrikleri; hassas ayrıntı filtresi.
- [ ] TEST ortamında uçtan uca kabul setini çalıştır ve ayrı Coolify payment worker servisini deploy et. → Doğrulama: başarı/red/timeout/duplicate callback, aynı gün iptal, ertesi gün tam iade, kısmî iade ve alarm senaryoları; backend build/typecheck/test; Supabase migration ve advisor kontrolü.

## Tamamlanma Koşulları

- [x] Callback kaybı veya timeout banka sorgusuyla kesinleştiriliyor ya da manuel incelemeye alınıyor.
- [x] İptal/iade yalnızca yetkili admin ve tekilleştirilmiş operasyon kaydı üzerinden yapılıyor.
- [x] Banka/yerel kayıt farkında otomatik mutasyon yapılmıyor ve operasyon ekibi uyarılıyor.
