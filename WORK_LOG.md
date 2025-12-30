# Proje Geliştirme Günlüğü

## 26 Aralık 2025
- **Sürükle-Bırak Temizliği:** `product-modal.tsx` dosyasındaki kullanılmayan `draggedImageIndex` state'i kaldırıldı. Tüm sürükle-bırak alanları (`products-table.tsx`, `catalog-editor.tsx`, `bulk-image-upload-modal.tsx`) kontrol edildi ve düzgün çalıştığı doğrulandı.
- **Tablet Responsive Düzeltmesi:** Katalog builder sayfası (1024x960 gibi tablet boyutları) için responsive layout iyileştirildi. Katalog bilgileri kartı artık tablet'te düzgün sığıyor, renk paleti `flex-wrap` ile sarılıyor.
- **Toplu Fotoğraf Yükleme Sorunu Giderildi:** `BulkImageUploadModal` bileşeninde `onSuccess` callback'i düzeltildi. Artık fotoğraflar yüklendikten sonra `getProducts()` çağrılarak ürün listesi anında güncelleniyor.
- **Docker Compose Format Hatası:** `docker-compose.yml` dosyasındaki `ALLOWED_ORIGINS` ve `REDIS_URL` aynı satırda birleşme hatası düzeltildi.
- **Proje İstatistikleri:** Proje şu anda ~30,000 satır kod içeriyor (20,856 TSX + 6,902 TS + 319 CSS).

## 22 Aralık 2025
- **Merkezi Timeout Hook Oluşturuldu:** `lib/hooks/use-async-timeout.ts` dosyasında yeniden kullanılabilir `useAsyncTimeout<T>` hook'u oluşturuldu. Bu hook ilerleme takibi, zaman aşımı kontrolü (toplam + stuck), otomatik toast mesajları, iptal ve yeniden deneme özellikleri sunuyor.
- **Product Modal Entegrasyonu:** Ürün resim yükleme işlemi artık timeout kontrolü ile yapılıyor. 60 saniye toplam / 20 saniye stuck timeout ayarlandı. Her dosya için progress takibi eklendi.
- **Import Modal Entegrasyonu:** CSV/Excel import işlemi timeout kontrolü ile güçlendirildi. 90 saniye toplam / 30 saniye stuck timeout ayarlandı. Progress bar veri işleme (%0-50) ve API çağrısı (%50-100) olarak bölündü.
- **Bulk Image Upload Hook Migrasyonu:** Manuel timeout mekanizması merkezi `useAsyncTimeout` hook'una geçirildi. 120 saniye toplam / 20 saniye stuck timeout ile kod tutarlılığı sağlandı. RefreshCw ikonu ile "Tekrar Dene" butonu güncellendi.
- **Akıllı Ürün-Fotoğraf Eşleştirme:** Toplu fotoğraf yüklemede kelime bazlı skorlama algoritması eklendi. "Kuva Koltuk Takımı" ile "kuva-koltuk-takimi-01.jpg" eşleşirken "kuva-mutfak-masasi.jpg" eşleşmiyor.
- **Import Mapping Düzeltmeleri:** CSV/Excel import'ta kolon başlıkları düzeltildi ve `HEADER_ALIASES`'a 40+ yeni varyasyon eklendi (product_name, urun_adi, birim_fiyat, resim_url vb.).

## 21 Aralık 2025
- **Dashboard İyileştirmesi:** Katalog logosu olmayanlar için ürün görsellerinden oluşan akıllı kolaj sistemi eklendi.
- **Analitik Sayfası:** Kullanıcılar için detaylı istatistik, cihaz dağılımı ve coğrafi verileri içeren yeni `/dashboard/analytics` sayfası oluşturuldu. Yan menüye (Sidebar) link eklendi.
- **Lint Temizliği:** Kritik bileşenlerdeki `console.log` ve `console.error` ifadeleri temizlenerek kod kalitesi artırıldı.
- **Katalog Özelleştirme:** Katalog başlık konumu (Sol/Orta/Sağ) ve logo konumu (Header/Footer Sol/Orta/Sağ) ayarları eklendi. Başlık ve logonun header içinde akıllıca konumlanması sağlandı.
- **Public Katalog Düzeltmesi:** Yayınlanan katalog sayfalarında çift logo görünme sorunu giderildi ve builder önizlemesi ile birebir aynı görünüm sağlandı.


## 17 Aralık 2025
- **Kod Temizliği:** Gereksiz geçici dosyaları (temp_icon_*.png, remove-bg.js, build.log) sildik. Lint kontrolü yapıldı, kritik hata yok.
- **Dil Varsayılanı Düzeltmesi:** Sayfa açılışındaki dil geçişi titremesini düzelttik. Varsayılan dil Türkçe olarak sabitlendi.
- **Dinamik Sayfa Başlığı:** Dil değiştiğinde sayfa başlığının (browser tab) da değişmesini sağladık.
- **Aktivite Logları:** Backend'e kapsamlı aktivite loglama ekledik. Artık şu işlemler loglanıyor: Kayıt, giriş, çıkış, profil güncelleme, hesap silme, PDF indirme, plan yükseltme, ürün CRUD, katalog CRUD, kategori silme, yayınlama/yayından kaldırma, toplu import.

## 16 Aralık 2025
- **Backend & Frontend Çalıştırma:** Geliştirme ortamı için backend ve frontend sunucularını başlattık.
- **UI ve Çeviri Düzeltmeleri:** Arayüzdeki hataları giderdik ve eksik çevirileri tamamladık.
- **İçe Aktarma (Import) Modalı:** Excel ile ürün yüklerken özel nitelik isimlendirmesi için tablo başlığına input alanı ekledik.

## 15 Aralık 2025
- **Dil Desteği Finalizasyonu:** `t` fonksiyonu hatalarını düzelttik ve tüm uygulamanın dil değiştirme testlerini yaptık.
- **Arayüz Çevirileri:** Kod içindeki sabit metinleri temizleyerek tamamen çeviri altyapısına geçirdik.
- **Güvenlik Güncellemeleri:** Next.js ve React sürümlerini güncelledik, `xlsx` kütüphanesini güvenli versiyonuyla değiştirdik.

## 13 Aralık 2025
- **Karanlık Mod Uyumu:** Modal ve kartlardaki renk uyumsuzluklarını gidererek tutarlı bir karanlık mod deneyimi sağladık.

## 12 Aralık 2025
- **Dashboard İyileştirmesi:** KPI kartları, grafikler ve son aktiviteler bölümünü daha modern ve okunaklı hale getirdik.

## 11 Aralık 2025
- **Ürün Görsel Yönetimi:** Ürün başına görsel limitini 5'e çıkardık ve galeri görünümü ekledik.
- **Ürün Listesi Düzenlemesi:** Listeye sayfalama (pagination) özellikleri ve satır sayısı seçimi ekledik.
- **Ürün Modalı Yenilemesi:** Ürün ekleme/düzenleme penceresini modernize ettik.

## 10 Aralık 2025
- **Ürün Linki ve Kategori:** Ürünlere harici link alanı ekledik ve ücretsiz kullanıcılar için kategori kısıtlaması getirdik.
- **Import/Export Geliştirmesi:** Excel ile ürün aktarımlarında görsel linkleri ve özel niteliklerin (renk, beden vb.) desteklenmesini sağladık.

## 9 Aralık 2025
- **API Tip Hatası:** TypeScript tarafındaki `FetchOptions` hatasını düzelttik.
- **Katalog Editör Düzeni:** Editördeki ayar panellerini gruplayarak daha derli toplu bir görünüm elde ettik.
- **Yükseltme ve Fiyatlandırma:** Paket yükseltme akışını ve fiyatları (500TL/1000TL) güncelleyerek yeni bir modal tasarladık.

## 8 Aralık 2025
- **Otomatik Katalog Hatası:** Yeni üyelikte çift katalog oluşma sorununu çözdük.
- **Şablon Özelleştirme:** Katalog şablonları için satır başı ürün sayısı ve arka plan ayarları gibi özelleştirme seçenekleri ekledik.

## 7 Aralık 2025
- **Admin Şablon Oluşturucu:** Adminlerin kod yazmadan yeni şablon taslağı oluşturabileceği bir yapı kurduk.
- **PDF Export İyileştirmesi:** PDF çıktılarında sayfalama sorunlarını çözdük ve ilerleme çubuğu ekledik.
