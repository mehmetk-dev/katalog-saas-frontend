# 📊 Excel Sayfası — Geliştirme İlerleme Takibi

> **Başlangıç:** 2026-03-13
> **Durum:** 🟡 Kod yazıldı, test edilecek
> **Plan Dosyası:** Antigravity brain `excel-page-plan.md` (v4)

---

## 🎯 Özellik Özeti

`/dashboard/excel` → Sadece Pro kullanıcılar. Excel benzeri inline-editable spreadsheet ile ürünleri toplu düzenleme, ekleme, silme. AI entegrasyonuna hazır mimari (Faz 2).

**Mimari kurallar:**
- Her dosya max 300 satır
- Tek sorumluluk ilkesi
- Hücre validasyonu (kırmızı/sarı)
- Backend chunk'lı batch işleme (50'şer)

---

## Faz 1: Backend ✅

### Adım 1.1 — Schema
- [x] `backend/src/controllers/products/schemas.ts` → `bulkUpdateFieldsSchema` ekle

### Adım 1.2 — Controller
- [x] `backend/src/controllers/products/bulk.ts` → `bulkUpdateFields` fonksiyonu ekle

### Adım 1.3 — Export + Route
- [x] `backend/src/controllers/products.ts` → `bulkUpdateFields` export ekle
- [x] `backend/src/routes/products.ts` → `router.post('/bulk-update-fields', ...)` ekle

### Adım 1.4 — Activity Logger
- [x] `backend/src/services/activity-logger.ts` → `products_bulk_fields_updated` tipi + description ekle

---

## Faz 2: Translations + Types + Server Action ✅

### Adım 2.1 — Translations
- [x] `lib/translations/excel.ts` → TR/EN çeviriler oluştur

### Adım 2.2 — Translations Index
- [x] `lib/translations/index.ts` → excel import + spread (tr/en)

### Adım 2.3 — Types
- [x] `components/excel/types.ts` → Tip tanımları oluştur

### Adım 2.4 — Frontend Server Action
- [x] `lib/actions/products.ts` → `BulkFieldUpdate` interface + `bulkUpdateFields()` fonksiyonu ekle

---

## Faz 3: Hooks ✅

### Adım 3.1 — useSpreadsheet Hook
- [x] `components/excel/hooks/use-spreadsheet.ts` oluştur

### Adım 3.2 — useExcelCrud Hook
- [x] `components/excel/hooks/use-excel-crud.ts` oluştur

---

## Faz 4: Table Bileşenleri ✅

### Adım 4.1 — SpreadsheetCell
- [x] `components/excel/table/spreadsheet-cell.tsx` oluştur

### Adım 4.2 — SpreadsheetTable
- [x] `components/excel/table/spreadsheet-table.tsx` oluştur

---

## Faz 5: Toolbar Bileşenleri ✅

### Adım 5.1 — ExcelToolbar
- [x] `components/excel/toolbar/excel-toolbar.tsx` oluştur

### Adım 5.2 — SaveBar
- [x] `components/excel/toolbar/save-bar.tsx` oluştur

### Adım 5.3 — UnsavedDialog
- [x] `components/excel/toolbar/unsaved-dialog.tsx` oluştur

---

## Faz 6: Sayfa + Pro Gate ✅

### Adım 6.1 — ProGate
- [x] `components/excel/pro-gate.tsx` oluştur

### Adım 6.2 — Page Route
- [x] `app/dashboard/excel/page.tsx` oluştur

---

## Faz 7: Orchestrator ✅

### Adım 7.1 — ExcelPageClient
- [x] `components/excel/excel-page-client.tsx` oluştur

---

## Faz 8: Sidebar + AI Placeholder ✅

### Adım 8.1 — Sidebar
- [x] `components/dashboard/sidebar.tsx` → navItems'a Excel ekle (Table2 ikon, proOnly: true)

### Adım 8.2 — AI Placeholder
- [x] `components/excel/ai/README.md` oluştur

---

## Faz 9: Test & Doğrulama ⬜

### Adım 9.1 — Manuel Test
- [ ] Pro kullanıcı → spreadsheet açılır
- [ ] Free/Plus kullanıcı → ProGate görünür
- [ ] Hücre düzenleme + sarı highlight
- [ ] Fiyata "abc" yazmak → kırmızı + hata mesajı
- [ ] Hata varken Kaydet disabled
- [ ] "+ Ürün Ekle" → yeni satır
- [ ] Seç + Sil → üstü çizili
- [ ] Kaydet → backend'e gider, toast
- [ ] Vazgeç → tüm editler temizlenir
- [ ] F5 → beforeunload uyarısı
- [ ] Custom attributes → dinamik sütunlar
- [ ] Tab ile hücreler arası geçiş
- [ ] Sidebar'da Excel + Pro badge

### Adım 9.2 — Mimari Kontrol
- [ ] Hiçbir dosya 300 satırı geçmez
- [ ] `applyBulkChanges()` API hazır (AI-ready)
- [ ] Backend 500 update → 50'şerli batch çalışır

---

## 📝 Notlar

- Bu dosya her session'da güncellenmeli
- Tamamlanan adımları `[x]` ile işaretle
- Bir adımda sorun çıkarsa altına not ekle
- Plan detayları: Antigravity brain `excel-page-plan.md` (v4)
