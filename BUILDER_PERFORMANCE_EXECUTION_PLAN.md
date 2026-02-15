# Builder Performans İyileştirme Uygulama Planı

## 1) Amaç

Bu doküman, Builder ekranının **5000+ ürün** senaryolarında akıcı kalması için yapılacak teknik çalışmaları adım adım tanımlar.  
Hedef: büyük veri setlerinde donma/jank yaşamadan düzenleme, önizleme ve sıralama yapılabilmesi.

---

## 2) Mevcut Durum (Özet)

Halihazırda uygulanmış korumalar:

- Sunucu tarafında builder ürünleri sayfalı çekiliyor ve üst sınır uygulanıyor.
- Split görünümde preview için örnekleme (sampling) devrede.
- Multi preview görünümünde kademeli yükleme mevcut.

Eksik kalan ana noktalar:

1. **Sıralama listesi** (selected products) büyük seçimlerde hâlâ ağırlaşabiliyor.
2. Bazı etkileşimlerde (arama/seçim değişikliği) render önceliği kullanıcı hissini düşürebiliyor.
3. Multi-view tarafında çok sayfa senaryosunda render baskısı artabiliyor.

---

## 3) Kapsam

### Dahil

- React scheduling iyileştirmeleri (`useDeferredValue`, `startTransition`)
- Sorting alanında gerçek virtualization
- Multi-view render maliyetini düşürecek virtualization / windowing yaklaşımı
- Ölçüm ve kabul kriterleri

### Hariç

- Template görsel redesign
- Yeni ürün özellikleri (AI açıklama vb.)
- Backend mimari değişiklikleri (bu fazda)

---

## 4) Teknik Strateji

## Faz 1 — React Scheduling (En Hızlı Kazanç)

### Hedef
Kullanıcı etkileşimlerini akıcı hale getirmek; preview güncellemelerini düşük öncelikte işlemek.

### Uygulama

- `builder-page-client.tsx` içinde preview’ya giden veri akışında `useDeferredValue`
- Ağır seçim güncellemelerinde `startTransition`
- Gerekirse kullanıcıya “önizleme güncelleniyor” gibi hafif durum göstergesi

### Etkilenecek Dosyalar

- `components/builder/builder-page-client.tsx`

### Kabul Kriteri

- Hızlı ardışık etkileşimlerde input gecikmesi azalmalı
- “Tıklıyorum ama geç tepki veriyor” hissi belirgin şekilde düşmeli

---

## Faz 2 — Sorting List Virtualization (POC + Güvenli Geçiş)

### Hedef
`EditorContentTab` içindeki seçili ürün sıralama listesinin DOM maliyetini düşürmek.

### Uygulama

- İlk adımda bağımlılık eklemeden POC windowing (sabit satır yüksekliği) uygulanır
- Sanallaştırılacak alan: `validProductIds.map(...)` ile üretilen sortable item listesi
- Aynı anda render edilen item sayısı ~20-40 bandında tutulacak
- Drag&drop davranışı korunacak (global index korunur)
- Gerekirse ikinci adımda `@tanstack/react-virtual` + dnd-kit kombinasyonuna geçilir

### Etkilenecek Dosyalar

- `components/builder/editor-content-tab.tsx`
- (Gerekirse) `components/builder/editor-product-cards.tsx`

### Kabul Kriteri

- 3000+ seçili üründe listede scroll sırasında belirgin takılma olmamalı
- Bellek kullanımı ve node sayısı anlamlı şekilde düşmeli
- Drag&drop sıralama doğruluğu bozulmamalı

---

## Faz 3 — Multi-view Render Optimizasyonu

### Hedef
Çok sayfalı önizlemede (multi) aynı anda render edilen sayfa maliyetini düşürmek.

### Uygulama

- `visibleMultiPages` yaklaşımı gözden geçirilir
- Sayfa listesi için virtualization/windowing uygulanır
- Sayfa kartları için memo sınırları güçlendirilir
- Scroll sırasında jank üreten alt bileşenler azaltılır

### Etkilenecek Dosyalar

- `components/builder/catalog-preview.tsx`

### Kabul Kriteri

- Çok sayfalı önizlemede scroll akıcılığı belirgin iyileşmeli
- DOM node sayısı düşmeli, commit süreleri kısalmalı

---

## Faz 4 (Koşullu) — Worker Değerlendirmesi

### Hedef
Sadece profiling metrikleri doğrularsa hesaplama işini worker’a taşımak.

### Uygulama

- Faz 1-3 sonrası profiling alınır
- Eğer sayfa hesaplama süreleri sürekli yüksekse (`>16ms` bloklar) worker planı devreye alınır
- Aksi durumda worker uygulanmaz (gereksiz karmaşıklık önlenir)

### Kabul Kriteri

- Worker kararı metrik tabanlı verilmiş olmalı
- Gereksiz mimari karmaşıklık eklenmemeli

---

## 5) Ölçüm Planı (Zorunlu)

Her faz sonrası şu metrikler raporlanacak:

- İlk render süresi (builder açılışı)
- Seçili ürün sayısı arttıkça etkileşim gecikmesi
- Scroll akıcılığı (sorting list + preview)
- React commit süreleri (profiling)
- Gözlemsel notlar (jank/freezes)

Test veri setleri:

- 500 ürün
- 1500 ürün
- 5000 ürün

---

## 6) Riskler ve Önlemler

### Risk 1: Virtualization + Drag/Drop karmaşıklığı
- **Önlem:** Faz 1’de sadece sorting alanını hedefleyip kapsamı dar tutmak

### Risk 2: Worker/serialization maliyeti
- **Önlem:** Worker’ı koşullu faza taşıyıp yalnız profiling ile tetiklemek

### Risk 3: Yan etki / regressions
- **Önlem:** her fazda lint + manuel smoke test + gerektiğinde rollback commit

---

## 7) Rollback Planı

Her faz bağımsız commitlenecek:

1. Faz 1 commit
2. Faz 2 commit
3. Faz 3 commit
4. (Opsiyonel) Faz 4 commit

Sorun halinde yalnız ilgili faz geri alınır; diğer kazanımlar korunur.

---

## 8) Uygulama Sırası (Önerilen)

1. Faz 1 (scheduling)
2. Faz 1 doğrulama + kısa rapor
3. Faz 2 (sorting virtualization)
4. Faz 2 doğrulama + kısa rapor
5. Faz 3 (multi-view optimizasyon)
6. Final benchmark + sonuç raporu
7. Faz 4 (yalnız profiling tetiklerse)

---

## 9) Onay Noktası

Bu plan onaylandıktan sonra şu sırayla ilerleyeceğim:

- Önce **Faz 1’i (scheduling)** implemente edeceğim (en hızlı ve düşük riskli kazanç)
- Sonra sonucu paylaşacağım
- Onayla Faz 2’ye geçeceğim

---

## 10) Beklenen Çıktı

- Büyük kataloglarda daha stabil builder
- Daha düşük render maliyeti ve daha iyi kullanıcı hissi
- Faz bazlı, ölçülebilir performans artışı
