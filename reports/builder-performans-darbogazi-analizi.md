# Builder Performans Sorunları ve Çözüm Yolları

## 1) Genel Performans Sorunları

| Sorun | Etki | Çözüm Yolu |
|---|---|---|
| `BuilderContext` tek ve büyük state taşıyor | Küçük değişiklikte geniş re-render | Context’i domain bazında böl (`ui`, `editor`, `preview`, `async`) + selector hook kullan |
| Provider `value` referansı her render’da değişiyor | Tüketiciler gereksiz render oluyor | Provider `value` için `useMemo` + state/handler referanslarını stabilize et |
| `BuilderContent` çok fazla prop dağıtıyor | Parent render maliyeti yüksek | Preview için tek `previewModel` nesnesi oluştur, alt bileşenlere minimal prop geçir |
| `CatalogPreview` içinde ağır hesaplar tek yerde | Input sırasında commit süreleri yükseliyor | Sayfa üretimini ayrı “derived model” katmanına taşı, sadece ilgili alan değişince yeniden hesapla |
| Callback bağımlılıkları geniş (`[props]` gibi) | Memo etkisi düşüyor | Callback bağımlılıklarını primitive alanlara indir |
| No-op update guard yok | Aynı değere tekrar set edilince boşuna render | Reducer/setter katmanında “değer değişmediyse return prev” kontrolü ekle |
| Aynı ekranda çok sayıda listener/observer | Ana thread dalgalanması | Resize/scroll sinyallerini merkezileştir, tek kaynak + throttle/rAF uygula |
| Autosave + `router.refresh()` agresif davranıyor | UI akışı kesiliyor | Dirty-field tabanlı autosave, daha uzun debounce, tam sayfa refresh yerine lokal cache güncelle |
| Template kartlarında canlı preview maliyetli | İlk yükte CPU/DOM baskısı | Statik thumbnail veya önbellekli snapshot kullan; canlı preview sadece seçili kartta çalışsın |

## 2) Çok Ürün (1000+) Senaryosunda Kritik Sorunlar

| Sorun (Büyük Veri) | Etki | Çözüm Yolu |
|---|---|---|
| `loadedProductsById` ve istek Set’leri sürekli büyüyor | Heap artışı, GC baskısı | Cache sınırı koy (LRU/TTL), seçili olmayan eski kayıtları temizle |
| `selectedProductIds` üzerinde sık `filter/spread` | O(n) maliyet birikiyor | Üyelik için `Set`, sıra için ayrı dizi kullan; toplu güncellemeyi batch yap |
| Ürün grid’i tam render | DOM node patlaması | Ürün kart grid’ine de virtualizasyon uygula (eşik: 200+) |
| Sort list scroll state her event’te güncelleniyor | Scroll jank | Scroll update’i rAF ile throttle et |
| Preview sayfa hesaplama ürün/kategori ile büyüyor | Split modda gecikme | Pagination hesaplarını memo/cache ile ayır; gerekirse worker’a taşı |
| Kategori sıralama `indexOf` ile yapılıyor | O(n²) eğilimi | `category -> orderIndex` map oluşturup O(1) lookup kullan |
| Çok ürün + kategori divider ile sayfa sayısı artıyor | Render/paint maliyeti artıyor | Split modda adaptif örnekleme (sampling) eşiğini dinamik yap |
| PDF export tüm sayfaları clone ediyor | Bellek sıçraması ve uzun bloklar | Daha küçük chunk, ara GC boşluğu, sayfa akışını stream benzeri sırala |
| Çok sayıda görsel fetch/base64 dönüşümü | Export süresinde spike | Görsel cache’e üst sınır + çözünürlük adaptasyonu + timeout politikası |
| `productMap`/kategori türetmeleri sık tekrarlanıyor | CPU tüketimi | Fingerprint tabanlı derived cache kullan, sadece veri değişince hesapla |

## 3) Eşik Tabanlı Çalışma Kuralları (Öneri)

| Koşul | Otomatik Kural |
|---|---|
| Seçili ürün > 500 | Split preview’de sampling aktif |
| Seçili ürün > 1000 | Preview’de sayfa hesaplama low-priority transition |
| Toplam ürün > 200 | Ürün grid virtualizasyon zorunlu |
| Toplam ürün > 1000 | Arama/sıralama server-side öncelikli |
| Cache boyutu > 2000 ürün | Eski kayıt tahliyesi başlat |
| Tahmini sayfa > 120 | Multi preview’de virtualizasyon zorunlu |

## 4) Öncelikli Uygulama Sırası

1. Context bölme + selector + provider memoizasyonu  
2. Ürün grid ve sıralama alanında tam virtualizasyon standardı  
3. Büyük veri cache politikası (LRU/TTL + temizlik)  
4. Preview hesaplama hattını ayrıştırma ve bağımlılık daraltma  
5. PDF export bellek stratejisi (chunk/quality/cache limit)  
