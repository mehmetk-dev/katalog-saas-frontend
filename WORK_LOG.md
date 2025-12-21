# Proje Geliştirme Günlüğü

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
