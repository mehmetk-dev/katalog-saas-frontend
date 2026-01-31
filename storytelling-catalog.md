# 📖 Storytelling Catalog: Akıllı Akış Sistemi

**Tarih:** 2026-01-31  
**Proje Tipi:** WEB (Next.js + React)  
**Özellik:** Kataloglara Kapak Sayfası ve Kategori Ara Sayfaları Ekleme  

---

## 🎯 Genel Bakış

Mevcut katalog sistemimiz ürünleri düz liste (flat list) olarak gösteriyor. Bu özellikle, kataloğa **profesyonel dergi deneyimi** kazandıracak:

1. **Kapak Sayfası** (Cover Page): Katalog açıldığında ilk gösterilen sayfa
2. **Kategori Ara Sayfaları** (Category Dividers): Her kategori değişiminde tam ekran geçiş sayfaları
3. **PDF Uyumluluğu**: Bu sayfalar PDF çıktısında da ayrı sayfalar olarak yer alacak

---

## ✅ Başarı Kriterleri

- [ ] Kullanıcı katalog oluşturucuda "Kapak Sayfası Ekle" toggle'ını aktif edebilir
- [ ] Kullanıcı opsiyonel olarak kapak için özel görsel yükleyebilir
- [ ] Kullanıcı "Kategori Geçiş Sayfaları" toggle'ını aktif edebilir
- [ ] Public kataloğu görüntülerken kapak sayfası en üstte görünür
- [ ] Her kategori değişiminde otomatik ara sayfa eklenir
- [ ] Ara sayfalar o kategorinin ilk ürün görselini arka plan olarak kullanır
- [ ] PDF indirme işlemi kapak ve ara sayfaları dahil eder
- [ ] Mobil cihazlarda zoom/scroll performansı korunur
- [ ] Mevcut kataloglar için backward compatibility sağlanır (eski kataloglar bu özellik olmadan çalışmaya devam eder)

---

## 🛠️ Teknoloji Yığını

| Kategori | Teknoloji | Sebep |
|----------|-----------|-------|
| **Frontend** | Next.js 15 + React 19 | Mevcut altyapı |
| **Styling** | Tailwind CSS | Konsistent tasarım |
| **PDF** | jsPDF + html-to-image | Mevcut PDF generator |
| **Backend** | Node.js + Express | Mevcut API |
| **Veritabanı** | Supabase (PostgreSQL) | Mevcut DB |
| **Görsel Yönetimi** | Cloudinary | Mevcut storage |

---

## 📁 Dosya Yapısı

```
app/
├── catalog/[slug]/
│   └── public-catalog-client.tsx          // [GÜNCELLEME] Kapak/ara sayfa render
lib/
├── actions/
│   └── catalogs.ts                        // [GÜNCELLEME] Catalog interface
components/
├── catalogs/
│   ├── cover-page.tsx                     // [YENİ] Kapak sayfası bileşeni
│   ├── category-divider.tsx               // [YENİ] Ara sayfa bileşeni
│   └── templates/
│       └── [existing templates]           // [DEĞİŞMEYECEK]
├── builder/
│   └── catalog-editor.tsx                 // [GÜNCELLEME] Toggle kontrolü ekle
backend/
├── src/
│   ├── controllers/
│   │   └── catalogs.ts                    // [GÜNCELLEME] Yeni alanlar için validation
│   └── database/
│       └── migrations/
│           └── 011_add_cover_divider.sql  // [YENİ] DB migration
```

---

## 📊 Veritabanı Değişiklikleri

### Catalog Tablosu - Yeni Alanlar

```sql
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS enable_cover_page BOOLEAN DEFAULT false;
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS cover_description TEXT;
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS enable_category_dividers BOOLEAN DEFAULT false;
```

| Alan | Tip | Varsayılan | Açıklama |
|------|-----|------------|----------|
| `enable_cover_page` | boolean | `false` | Kapak sayfası aktif mi? |
| `cover_image_url` | text | `null` | Kullanıcının yüklediği kapak görseli (opsiyonel) |
| `cover_description` | text | `null` | Kapak sayfasında gösterilecek açıklama |
| `enable_category_dividers` | boolean | `false` | Kategori ara sayfaları aktif mi? |

---

## 📝 Task Breakdown (Görev Dağılımı)

### **Phase P0: Veritabanı (Database Architect)**

#### Task 1.1: Migration Oluştur
- **Agent:** `database-architect`
- **Skill:** `database-design`
- **Dosya:** `backend/src/database/migrations/011_add_cover_divider.sql`
- **INPUT:** Mevcut `catalogs` tablosu şeması
- **OUTPUT:** Yeni alanları ekleyen migration dosyası
- **VERIFY:** `npm run migrate` hatasız çalışır, `catalogs` tablosunda yeni sütunlar görünür

---

### **Phase P1: Backend Güncellemeleri (Backend Specialist)**

#### Task 2.1: Catalog Controller Validation
- **Agent:** `backend-specialist`
- **Skill:** `api-patterns`
- **Dosya:** `backend/src/controllers/catalogs.ts`
- **INPUT:** Mevcut catalog CRUD işlemleri
- **OUTPUT:** Yeni alanlar için validation eklendi (cover_image_url URL formatı, cover_description max 500 karakter)
- **VERIFY:** Postman/curl ile test, invalid data gönderildiğinde 400 döner
- **Dependencies:** Task 1.1 tamamlanmış olmalı

#### Task 2.2: TypeScript Interface Güncelle
- **Agent:** `backend-specialist`
- **Skill:** `clean-code`
- **Dosya:** `lib/actions/catalogs.ts`
- **INPUT:** Mevcut `Catalog` interface
- **OUTPUT:** Yeni alanlar eklenmiş interface
- **VERIFY:** TypeScript `npx tsc --noEmit` hatasız geçer
- **Dependencies:** Yok (paralel çalışabilir)

---

### **Phase P2: UI Bileşenleri (Frontend Specialist)**

#### Task 3.1: Kapak Sayfası Bileşeni
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Dosya:** `components/catalogs/cover-page.tsx`
- **INPUT:** Catalog bilgileri (name, logo_url, cover_image_url, cover_description)
- **OUTPUT:** Full-screen kapak sayfası bileşeni (A4 boyutlarında 794x1123px)
- **Tasarım Prensipleri:**
  - Büyük, göz alıcı tipografi
  - Gradient overlay kullanımı (arka plan görseli varsa)
  - Logo üst kısımda, başlık ortada, açıklama alt kısımda
  - PDF-ready (data-pdf-page="true" attribute)
- **VERIFY:** Storybook/isolasyon modunda render olur, responsive
- **Dependencies:** Task 2.2 tamamlanmış olmalı

#### Task 3.2: Kategori Ara Sayfası Bileşeni
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Dosya:** `components/catalogs/category-divider.tsx`
- **INPUT:** Kategori adı, o kategorinin ilk ürün görseli
- **OUTPUT:** Full-screen ara sayfa bileşeni (A4 boyutlarında)
- **Tasarım Prensipleri:**
  - Kategori adı ekranın ortasında büyük ve kalın
  - İlk ürün görseli blur + opacity ile arka plan
  - Minimalist, dikkat çekici
  - PDF-ready
- **VERIFY:** Storybook/isolasyon modunda render olur
- **Dependencies:** Yok (paralel çalışabilir)

---

### **Phase P3: Katalog Görüntüleyici (Frontend Specialist)**

#### Task 4.1: Public Catalog Client Güncelle
- **Agent:** `frontend-specialist`
- **Skill:** `nextjs-react-expert`
- **Dosya:** `app/catalog/[slug]/public-catalog-client.tsx`
- **INPUT:** Mevcut sayfalama mantığı
- **OUTPUT:** Kapak ve ara sayfaları render eden geliştirilmiş algoritma
- **Mantık:**
  ```
  1. Eğer enable_cover_page === true → İlk eleman olarak CoverPage ekle
  2. Ürünleri kategoriye göre grupla
  3. Her kategori grubu için:
     a. Eğer enable_category_dividers === true → CategoryDivider ekle
     b. O kategorinin ürünlerini sayfalara böl (mevcut mantık)
  4. PDF export sırasında tüm elemanları dahil et
  ```
- **VERIFY:** 
  - Kapak sayfası en üstte görünür
  - Kategori geçişlerinde ara sayfa gelir
  - PDF indirme çalışır (jsPDF tüm sayfaları alır)
- **Dependencies:** Task 3.1, 3.2 tamamlanmış olmalı

---

### **Phase P4: Builder Kontrolü (Frontend Specialist)**

#### Task 5.1: Catalog Editor Toggle Ekle
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Dosya:** `components/builder/catalog-editor.tsx`
- **INPUT:** Mevcut ayar paneli
- **OUTPUT:** Yeni toggle bölümü
- **UI Elemanları:**
  - "Kapak Sayfası Ekle" toggle
  - Kapak görseli upload input (Cloudinary entegrasyonu)
  - Kapak açıklaması textarea (max 500 karakter)
  - "Kategori Geçiş Sayfaları" toggle
- **VERIFY:** 
  - Toggle değişiklikleri `updateCatalog` API'sine gönderilir
  - Preview panelinde değişiklikler anında yansır
- **Dependencies:** Task 2.1, 2.2 tamamlanmış olmalı

---

### **Phase X: Doğrulama ve Test**

#### Task 6.1: E2E Test
- **Agent:** `test-engineer`
- **Skill:** `webapp-testing`
- **INPUT:** Tamamlanmış özellik
- **TEST SENARYOLARI:**
  1. Yeni katalog oluştur, kapak sayfasını aktif et → Görüntüle
  2. Kapak görseli yükle → Preview'da görünür mü?
  3. Kategori geçişlerini aktif et → Ara sayfalar render oluyor mu?
  4. PDF indir → Kapak ve ara sayfalar PDF'de mi?
  5. Mevcut katalog aç (enable_cover_page=false) → Hala normal çalışıyor mu?
- **VERIFY:** Playwright testleri geçer
- **Dependencies:** Tüm Phase P1-P4 tamamlanmış olmalı

#### Task 6.2: Performans Testi
- **Agent:** `performance-optimizer`
- **Skill:** `performance-profiling`
- **METRIKLER:**
  - PDF oluşturma süresi (hedef: <5s for 20-page catalog)
  - Render time (FCP <1.5s)
  - Bundle size artışı (<50KB)
- **VERIFY:** Lighthouse Core Web Vitals geçer
- **Dependencies:** Task 6.1 tamamlanmış olmalı

#### Task 6.3: Güvenlik Tarama
- **Agent:** `security-auditor`
- **Skill:** `vulnerability-scanner`
- **KONTROLLER:**
  - File upload validation (cover_image_url)
  - XSS prevention (cover_description rendering)
  - SQL injection prevention (migration)
- **VERIFY:** `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .` clean
- **Dependencies:** Yok (paralel çalışabilir)

---

## 🎨 Tasarım Kararları

### Kapak Sayfası Tasarım Özellikleri
- **Boyut:** 794x1123px (A4 @ 96 DPI)
- **Tipografi:** Katalog adı için `font-montserrat text-6xl font-black`
- **Renk:** Primary color kullanılır (catalog.primary_color)
- **Layout:** 
  - Logo: Top 10% (eğer varsa)
  - Başlık: Vertical center
  - Açıklama: Bottom 20%
  - Arka plan görsel: Full bleed + gradient overlay

### Ara Sayfa Tasarım Özellikleri
- **Boyut:** 794x1123px
- **Tipografi:** Kategori adı için `font-bold text-5xl uppercase tracking-wider`
- **Arka Plan:** İlk ürün görseli + `brightness-50 blur-sm`
- **Overlay:** `bg-gradient-to-b from-black/60 to-black/40`

---

## 🚨 Risk Analizi

| Risk | Olasılık | Etki | Çözüm |
|------|----------|------|-------|
| **PDF boyutu artışı** | Orta | Orta | Ara sayfalar basit gradient kullanır (görsel yerine CSS) |
| **Geriye uyumluluk bozulması** | Düşük | Yüksek | Varsayılan değerler `false` olacak, migration güvenli |
| **Mobil performans düşüşü** | Orta | Orta | React.memo + useMemo ile render optimize edilecek |
| **Kullanıcı karmaşası** | Düşük | Düşük | Builder'da açıklayıcı metinler ve preview eklenecek |

---

## 📅 Tahmini Süre

| Phase | Süre | Not |
|-------|------|-----|
| P0: Database | 30 dakika | Basit migration |
| P1: Backend | 1 saat | Validation + interface |
| P2: UI Components | 2 saat | İki yeni bileşen |
| P3: Catalog Viewer | 2 saat | Algoritma değişikliği |
| P4: Builder | 1.5 saat | Toggle + preview |
| PX: Testing | 1 saat | E2E + performans |
| **TOPLAM** | **~8 saat** | Bir iş günü |

---

## ✅ Phase X: Final Verification Checklist

### Fonksiyonel Testler
- [ ] Kapak sayfası aktif/pasif toggle çalışıyor
- [ ] Kapak görseli yükleme çalışıyor (Cloudinary)
- [ ] Kategori ara sayfaları aktif/pasif toggle çalışıyor
- [ ] Public catalog doğru sırada render ediyor (Kapak → Kategori1 → Ürünler → Kategori2...)
- [ ] PDF export tüm sayfaları içeriyor
- [ ] Mevcut kataloglar hala çalışıyor (backward compatibility)

### Teknik Testler
```bash
# Lint & Type Check
npm run lint && npx tsc --noEmit

# Backend Migration
cd backend && npm run migrate && npm run seed

# Security Scan
python .agent/skills/vulnerability-scanner/scripts/security_scan.py .

# E2E Tests
python .agent/skills/webapp-testing/scripts/playwright_runner.py http://localhost:3000 --screenshot

# Performance
python .agent/skills/performance-profiling/scripts/lighthouse_audit.py http://localhost:3000/catalog/demo
```

### Tasarım Kontrolleri
- [ ] Kapak sayfası tasarımı premium görünüyor
- [ ] Ara sayfalar dikkat çekici ama dikkat dağıtmıyor
- [ ] Mobil cihazlarda zoom/scroll sorunsuz
- [ ] PDF çıktısı profesyonel kalite

### Dokümantasyon
- [ ] README.md güncellendi (yeni özellik açıklaması)
- [ ] Builder kullanıcı rehberi oluşturuldu (nasıl kullanılır)

---

## 🎓 Öğrenilen Dersler (Proje Bitiminde Eklenecek)

*Bu bölüm implementasyon tamamlandıktan sonra doldurulacak.*

---

**Hazırlayan:** Antigravity (Project Planner + Frontend Specialist + Database Architect)  
**Onay:** ⏳ Kullanıcı onayı bekleniyor
