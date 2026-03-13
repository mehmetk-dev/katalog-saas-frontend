# AI Bulk Engine

Bu katman, Excel AI toplu işlemlerini SOLID prensibine uygun şekilde modüler yönetir.

## Yapı
- `types.ts`: Ortak tipler ve handler sözleşmesi.
- `state.ts`: Staged cell state + değişiklik listesi.
- `generators.ts`: API tabanlı üretim işlemleri (açıklama/kategori).
- `utils.ts`: Saf yardımcı fonksiyonlar.
- `handlers/*`: Her operation tipi için tek sorumluluklu handler.
- `runner.ts`: Handler seçimi ve operasyon yürütme akışı.

## Yeni Özellik Ekleme
1. `handlers/` altında yeni handler dosyası oluştur.
2. `BulkOperationHandler` arayüzünü uygula.
3. `handlers/index.ts` içine handler kaydı ekle.

Bu akışta `excel-page-client.tsx` veya `runner.ts` büyümez.
