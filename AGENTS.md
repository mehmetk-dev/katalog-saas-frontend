# FogCatalog - Project Context & Architecture Documentation

> 📌 **Bu Dosyanın Amacı:** AI coding assistant'ların projeyi sıfırdan taramasına gerek kalmadan FogCatalog'u hızlıca anlayabilmesini sağlamak.

---

## 1. Proje Özeti (High-Level Summary)

### 🌫️ FogCatalog Nedir?

**FogCatalog**, işletmelerin ürünlerini profesyonel dijital kataloglar halinde sergilemesini sağlayan modern bir **SaaS (Software as a Service)** platformudur.

| Özellik | Açıklama |
|---------|----------|
| **Ana Fonksiyon** | Ürün kataloğu oluşturma, düzenleme ve paylaşma |
| **Çıktı Formatları** | Dijital görüntüleme, PDF export, QR kod paylaşımı |
| **Hedef Kitle** | KOBİ'ler, e-ticaret satıcıları, B2B firmalar, perakendeciler |
| **Monetizasyon** | Freemium model (Free → Plus → Pro planlar) |

### Temel İşlevler

1. **Gerçek Zamanlı Katalog Editörü:** Sürükle-bırak ile ürün ekleme, renk/logo/layout özelleştirme
2. **15+ Profesyonel Şablon:** Bauhaus, Modern HUD, Archive Editorial gibi tasarım akımlarından ilham
3. **PDF Export:** `jsPDF` + `html-to-image` ile yüksek kaliteli PDF çıktısı
4. **QR Kod & Paylaşım:** Her katalog için özel slug bazlı URL ve QR kod
5. **Dijital Sayfa Çevirme:** `react-pageflip` ile interaktif katalog deneyimi
6. **Analitik Dashboard:** Görüntülenme, cihaz dağılımı, coğrafi konum takibi
7. **Çoklu Dil:** Türkçe ve İngilizce tam destek (i18n)
8. **Excel/CSV Import:** Toplu ürün aktarımı

---

## 2. Teknoloji Yığını (Tech Stack)

### Frontend

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Next.js** | 16.x | App Router, SSR, API Routes |
| **React** | 19.x | UI Library |
| **TypeScript** | 5.x | Strict type safety |
| **Tailwind CSS** | 4.x | Styling (CSS-first config) |
| **Radix UI** | Latest | Accessible UI primitives (Dialog, Dropdown, etc.) |
| **Lucide React** | 0.454 | Icon library |
| **Recharts** | 3.x | Analytics grafikleri |
| **Zod** | 3.25 | Schema validation |
| **jsPDF** | 4.x | PDF generation |
| **html-to-image** | 1.11 | DOM to image conversion |
| **react-pageflip** | 2.x | Sayfa çevirme animasyonu |
| **sonner** | Latest | Toast notifications |

### Backend (Express API)

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Node.js** | 20.x+ | Runtime |
| **Express.js** | 5.x | REST API framework |
| **TypeScript** | 5.x | Type safety |
| **Helmet** | 8.x | Security headers |
| **express-rate-limit** | 8.x | DDoS/brute-force koruması |
| **Morgan** | 1.x | HTTP logging |
| **prom-client** | 15.x | Prometheus metrics |

### Database & Auth

| Teknoloji | Kullanım Amacı |
|-----------|----------------|
| **PostgreSQL** | Ana veritabanı (Supabase üzerinde) |
| **Supabase Auth** | JWT tabanlı authentication |
| **Supabase RLS** | Row Level Security |
| **Supabase Storage** | Görsel depolama (alternatif) |

### Storage & CDN

| Teknoloji | Kullanım Amacı |
|-----------|----------------|
| **Cloudinary** | Primary image storage & CDN |
| Otomatik WebP dönüşümü | `f_auto,q_auto` parametreleri |

### Monitoring & Email

| Teknoloji | Kullanım Amacı |
|-----------|----------------|
| **Sentry** | Error tracking & monitoring |
| **Prometheus** | Metrics collection |
| **Resend** | Transactional emails |

### Opsiyonel

| Teknoloji | Kullanım Amacı |
|-----------|----------------|
| **Redis (IORedis)** | Caching (opsiyonel) |

---

## 3. Proje Mimarisi ve Dosya Yapısı

### 🏗️ Üst Düzey Mimari

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              FogCatalog Monorepo                                 │
│                                                                                  │
│  ┌──────────────────────────────┐          ┌──────────────────────────────┐       │
│  │     🖥️  FRONTEND (Next.js)   │  ◄────►  │     ⚙️  BACKEND (Express)    │       │
│  │     Port: 3000               │  HTTP    │     Port: 4000               │       │
│  │     app/ components/ lib/    │          │     backend/src/             │       │
│  └──────────────┬───────────────┘          └──────────────┬───────────────┘       │
│                 │                                          │                      │
│                 │ Supabase JS Client                       │ Supabase Admin       │
│                 ▼                                          ▼                      │
│  ┌──────────────────────────────────────────────────────────────────────┐         │
│  │                    🗄️  DATABASE & SERVICES                          │         │
│  │   PostgreSQL (Supabase) │ Cloudinary (CDN) │ Redis (Cache)          │         │
│  └──────────────────────────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 🖥️ FRONTEND — Next.js 16 (App Router)

> Port: `3000` · SSR + Client Components · Tailwind CSS 4 · Radix UI

```
📁 app/                                    ← Next.js App Router (Sayfa & Route'lar)
│
├── 📂 Genel Sayfalar (Public)
│   ├── page.tsx                           # Landing page (~33KB) — hero, features, CTA
│   ├── layout.tsx                         # Root layout — providers, fonts, meta
│   ├── globals.css                        # Tailwind base + custom CSS
│   ├── loading.tsx                        # Global loading skeleton
│   ├── error.tsx                          # Error boundary
│   ├── global-error.tsx                   # Root error boundary
│   ├── not-found.tsx                      # 404 sayfası
│   ├── robots.ts                          # SEO robots.txt
│   ├── sitemap.ts                         # SEO sitemap.xml
│   └── icon.png                           # Favicon
│
├── 📂 auth/                               ← Authentication (Supabase Auth)
│   ├── page.tsx                           # Login / Register form
│   ├── layout.tsx                         # Auth layout (centered card)
│   ├── callback/route.ts                  # OAuth callback handler
│   ├── forgot-password/page.tsx           # Şifre sıfırlama
│   ├── reset-password/page.tsx            # Yeni şifre belirleme
│   ├── verify/page.tsx                    # Email doğrulama
│   ├── confirmed/page.tsx                 # Email onay başarılı
│   ├── confirm-recovery/page.tsx          # Şifre kurtarma onay
│   └── error/page.tsx                     # Auth hata sayfası
│
├── 📂 dashboard/                          ← Kullanıcı Paneli (Protected)
│   ├── page.tsx                           # Dashboard ana sayfa
│   ├── layout.tsx                         # Sidebar + header layout
│   ├── loading.tsx / error.tsx            # Loading & error states
│   ├── products/page.tsx                  # 📦 Ürün yönetimi
│   ├── catalogs/page.tsx                  # 📖 Katalog listesi
│   ├── builder/page.tsx                   # 🎨 Katalog editörü
│   ├── analytics/page.tsx                 # 📊 İstatistikler
│   ├── categories/page.tsx                # 🏷️ Kategori yönetimi
│   ├── templates/page.tsx                 # 🖼️ Şablon galerisi
│   ├── settings/page.tsx                  # ⚙️ Profil ayarları
│   └── admin/page.tsx                     # 🔐 Admin panel
│
├── 📂 catalog/[slug]/                     ← Public Katalog Görüntüleme
│   ├── page.tsx                           # SSR — SEO, OG meta
│   ├── public-catalog-client.tsx          # Client — interaktif görüntüleme
│   └── loading.tsx                        # Skeleton
│
├── 📂 blog/                               ← Blog (MDX)
│   ├── page.tsx                           # Blog listesi
│   ├── [slug]/page.tsx                    # Dinamik blog post
│   ├── blog-post-layout.tsx               # Post layout
│   └── dijital-katalog-ile-*/page.tsx     # Statik blog sayfaları (3 adet)
│
├── 📂 Bilgi Sayfaları
│   ├── pricing/ (layout + page)           # 💰 Fiyatlandırma
│   ├── features/ (layout + page)          # ✨ Özellikler
│   ├── how-it-works/ (layout + page)      # 🔄 Nasıl Çalışır
│   ├── faq/ (layout + page)               # ❓ SSS
│   ├── contact/ (layout + page)           # 📧 İletişim
│   └── create-demo/page.tsx               # 🎮 Demo oluşturma
│
├── 📂 Yasal Sayfalar
│   ├── legal/kvkk/                        # KVKK
│   ├── legal/cookie-policy/               # Çerez politikası
│   ├── legal/cancellation-policy/         # İptal politikası
│   ├── legal/distance-sales-agreement/    # Mesafeli satış
│   ├── legal/explicit-consent/page.tsx    # Açık rıza
│   ├── privacy/ (layout + page)           # Gizlilik
│   └── terms/ (layout + page)             # Kullanım şartları
│
├── 📂 admin/                              ← Admin Panel
│   ├── page.tsx / layout.tsx / error.tsx
│   └── login/page.tsx
│
└── 📂 api/                                ← Next.js API Routes (minimal)
    ├── health/route.ts                    # Health check
    └── admin/activity-logs/route.ts       # Admin log proxy
```

```
📁 components/                             ← React Bileşenleri (Feature-Based)
│
├── 📂 builder/                            ← 🎨 Katalog Editörü (En Kompleks Modül)
│   ├── builder-page-client.tsx            # Ana container — state orchestration
│   ├── builder-utils.ts                   # Yardımcı fonksiyonlar
│   ├── editor/
│   │   ├── catalog-editor.tsx             # ⚠️ Editor core (~refactored)
│   │   ├── editor-content-tab.tsx         # İçerik sekmesi
│   │   ├── editor-design-tab.tsx          # Tasarım sekmesi
│   │   ├── editor-product-cards.tsx       # Ürün kartları
│   │   └── design-sections/              # Tasarım alt bölümleri (9 dosya)
│   │       ├── appearance-section.tsx     #   Görünüm
│   │       ├── background-section.tsx     #   Arkaplan
│   │       ├── branding-section.tsx       #   Logo & marka
│   │       ├── storytelling-section.tsx   #   Kapak & hikaye
│   │       ├── template-section.tsx       #   Şablon seçimi
│   │       ├── structure-preview.tsx      #   Yapı önizleme
│   │       ├── section-wrapper.tsx        #   Ortak wrapper
│   │       ├── index.ts / types.ts
│   ├── modals/
│   │   ├── exit-dialog.tsx                # Çıkış onayı
│   │   └── upgrade-modal.tsx              # Plan yükseltme
│   ├── preview/
│   │   ├── catalog-preview.tsx            # PDF export önizleme
│   │   └── template-preview-card.tsx      # Şablon kartı
│   └── toolbar/
│       ├── builder-toolbar.tsx            # Üst araç çubuğu
│       └── preview-floating-header.tsx    # Floating header
│
├── 📂 products/                           ← 📦 Ürün Yönetimi
│   ├── products-page-client.tsx           # Ana container & CSV export
│   ├── modals/
│   │   ├── product-modal.tsx              # ⚠️ Ürün CRUD modal (~60KB)
│   │   ├── import-export-modal.tsx        # ⚠️ Excel/CSV import (~64KB)
│   │   └── import-export/                 # Import alt modülleri
│   │       ├── constants.ts               #   Header aliases & system fields
│   │       ├── file-utils.ts              #   Dosya parse (CSV, Excel)
│   │       ├── import-products.ts         #   CSV→Product dönüştürücü
│   │       ├── mapping-step.tsx           #   Kolon eşleme UI
│   │       ├── default-tabs.tsx           #   Tab seçimi
│   │       └── types.ts
│   ├── table/                             # Tablo bileşenleri
│   │   ├── products-table.tsx             # Ana tablo render
│   │   ├── pagination.tsx                 # Sayfalama
│   │   ├── index.ts / types.ts
│   │   ├── components/                    # Alt bileşenler
│   │   │   ├── delete-alert-dialog.tsx
│   │   │   └── product-preview-dialog.tsx
│   │   ├── hooks/use-products-table.ts
│   │   ├── utils/product-helpers.ts
│   │   └── views/
│   │       ├── product-list-view.tsx      # Liste görünümü
│   │       └── product-grid-view.tsx      # Grid görünümü
│   ├── tabs/                              # Modal sekmeleri
│   │   ├── product-basic-tab.tsx
│   │   ├── product-images-tab.tsx
│   │   └── product-attributes-tab.tsx
│   ├── bulk/                              # Toplu işlemler
│   │   ├── bulk-actions-modal.tsx
│   │   ├── bulk-price-modal.tsx
│   │   ├── bulk-image-upload-modal.tsx
│   │   └── bulk-image-upload/             # Toplu görsel yükleme
│   │       ├── image-card.tsx / matcher.ts / product-selector.tsx
│   │       ├── upload-service.ts / types.ts
│   ├── filters/filter-sheet.tsx
│   └── toolbar/
│       ├── toolbar.tsx / stats-cards.tsx / bulk-actions-bar.tsx
│
├── 📂 catalogs/                           ← 📖 Katalog Görüntüleme & Şablonlar
│   ├── catalogs-page-client.tsx           # Katalog listesi
│   ├── catalog-preview.tsx                # Önizleme
│   ├── catalog-thumbnail.tsx              # Küçük önizleme
│   ├── cover-page.tsx                     # Kapak sayfası
│   ├── category-divider.tsx               # Kategori ayracı
│   ├── share-modal.tsx                    # Paylaşım modal
│   ├── covers/                            # 🎨 Kapak temaları (11 dosya)
│   │   └── artistic | bold | corporate | fashion | industrial
│   │       luxury | magazine | minimal | modern | tech | index
│   ├── dividers/                          # 📄 Kategori ayraç temaları (11 dosya)
│   │   └── (covers/ ile aynı tema seti)
│   └── templates/                         # 🖼️ Katalog şablonları (18 dosya)
│       ├── bold | catalog-pro | classic-catalog | clean-white
│       │   compact-list | elegant-cards | fashion-lookbook
│       │   industrial | luxury | magazine | minimalist
│       │   modern-grid | product-tiles | registry | retail
│       │   showcase | tech-modern
│       ├── types.ts                       # Şablon tipi tanımları
│       └── (registry.tsx — şablon kaydı)
│
├── 📂 auth/                               ← 🔐 Authentication UI
│   ├── auth-page-client.tsx               # Ana auth sayfası
│   ├── auth-form.tsx / auth-form-new.tsx   # Form bileşenleri
│   ├── auth-form/                         # Form alt bileşenleri (9 dosya)
│   │   └── auth-tabs | error-alert | google-auth-button
│   │       legal-notice | loading-status | redirect-overlay
│   │       status-banner | types | use-auth-form-controller
│   ├── auth-sections/                     # Auth bölümleri (6 dosya)
│   │   └── auth-form | hero-panel | redirect-overlay
│   │       types | use-auth | index
│   ├── onboarding-modal.tsx               # Onboarding sihirbazı
│   └── session-watcher.tsx                # Oturum takipçisi
│
├── 📂 dashboard/                          ← 📊 Dashboard UI
│   ├── dashboard-client.tsx               # Ana dashboard
│   ├── sidebar.tsx / header.tsx           # Layout
│   ├── feedback-modal.tsx                 # Geri bildirim
│   ├── onboarding-checklist.tsx           # Başlangıç checklist
│   ├── notification-dropdown.tsx          # Bildirim dropdown
│   └── notifications-popover.tsx          # Bildirim popover
│
├── 📂 admin/                              ← 🔐 Admin Panel
│   ├── admin-dashboard.tsx                # Admin ana panel
│   ├── activity-logs-client.tsx
│   └── admin-dashboard/                   # Alt bileşenler (8 dosya)
│       └── overview-tab | users-tab | feedbacks-tab
│           deleted-users-tab | activity-logs-tab
│           admin-header | types | use-admin-dashboard
│
├── 📂 ui/                                 ← 🧩 Shadcn/Radix Primitives (31 dosya)
│   └── alert | alert-dialog | avatar | badge | button | card
│       checkbox | dialog | dropdown-menu | image-lightbox | input
│       label | network-status-banner | pdf-progress-modal
│       popover | product-image-gallery | progress | radio-group
│       responsive-container | scroll-area | select | separator
│       sheet | skeleton | skeleton-variants | slider | switch
│       table | tabs | textarea | theme-toggle | tooltip
│
├── 📂 Diğer Bileşenler
│   ├── layout/public-footer.tsx, public-header.tsx
│   ├── categories/categories-page-client.tsx
│   ├── settings/settings-page-client.tsx
│   ├── templates/templates-page-client.tsx, preview-data.ts
│   ├── analytics/analytics-client.tsx
│   ├── demo/demo-builder.tsx
│   ├── error-boundary.tsx
│   ├── home-page-title-updater.tsx
│   └── theme-provider.tsx
```

```
📁 lib/                                    ← Core Logic & Shared Utilities
│
├── 📂 actions/                            ← Server Actions (Backend'e köprü)
│   ├── products.ts                        # Ürün CRUD → /api/v1/products/*
│   ├── catalogs.ts                        # Katalog CRUD → /api/v1/catalogs/*
│   ├── categories.ts                      # Kategori işlemleri
│   ├── templates.ts                       # Şablon yönetimi
│   ├── user.ts                            # Kullanıcı profili
│   ├── auth.ts                            # Auth işlemleri
│   ├── admin.ts                           # Admin işlemleri
│   ├── feedback.ts                        # Geri bildirim
│   └── notifications.ts                   # Bildirimler
│
├── 📂 hooks/                              ← Custom React Hooks (12 dosya)
│   ├── use-products.ts                    # Ürün state & CRUD
│   ├── use-catalogs.ts                    # Katalog state
│   ├── use-catalog-actions.ts             # Katalog işlemleri
│   ├── use-builder-state.ts               # Builder state yönetimi
│   ├── use-builder-handlers.ts            # Builder olay yönetimi
│   ├── use-editor-upload.ts               # Editör görsel yükleme
│   ├── use-pdf-export.ts                  # PDF export hook
│   ├── use-product-images.ts              # Ürün görselleri
│   ├── use-notifications.ts               # Bildirimler
│   ├── use-network-status.ts              # Ağ durumu takibi
│   ├── use-debounce.ts                    # Debounce utility
│   └── use-async-timeout.ts               # Zaman aşımı yönetimi
│
├── 📂 supabase/                           ← Supabase Client'lar
│   ├── client.ts                          # Browser-side client
│   ├── server.ts                          # Server-side client (SSR)
│   └── proxy.ts                           # Session middleware
│
├── 📂 storage/                            ← Storage Abstraction Layer
│   ├── types.ts                           # StorageProvider interface
│   ├── cloudinary.ts                      # Cloudinary implementasyonu
│   ├── supabase.ts                        # Supabase Storage (alternatif)
│   └── index.ts                           # Factory pattern
│
├── 📂 translations/                       ← i18n Çevirileri (TR/EN) — modüler
│   ├── index.ts                           # Export hub — tüm modülleri birleştirir
│   ├── common.ts                          # Ortak çeviriler
│   ├── products.ts                        # Ürün & import/export çevirileri
│   ├── catalog.ts                         # Katalog çevirileri
│   ├── auth.ts / billing.ts / dashboard.ts
│   ├── layout.ts / settings.ts / legal.ts
│   ├── admin.ts / public-pages.ts
│
├── 📂 validations/                        ← Zod Schemas
│   └── index.ts                           # Tüm validation şemaları
│
├── 📂 utils/                              ← Utility Functions
│   ├── fuzzy-search.ts                    # Bulanık arama
│   └── retry.ts                           # Retry pattern
│
├── 📂 services/
│   └── email.ts                           # Resend email service
│
├── 📂 __tests__/                          ← Frontend Unit Tests
│   ├── api.test.ts
│   └── errorHandler.test.ts
│
├── api.ts                                 # apiFetch wrapper — backend iletişimi
├── helpers.ts                             # formatCurrency, slugify, truncate...
├── i18n-provider.tsx                      # i18n context provider
├── user-context.tsx                       # Auth state context
├── sidebar-context.tsx                    # Sidebar state
├── lightbox-context.tsx                   # Image lightbox context
├── query-provider.tsx                     # React Query provider
├── image-utils.ts                         # Görsel yardımcıları
├── seo.ts                                 # SEO metadata helpers
├── rate-limit.ts                          # Client-side rate limiting
├── activity-logger.ts                     # Client activity logging
├── env-validation.ts                      # Environment variable check
├── constants.ts                           # Sabitleme (template IDs vb.)
├── blog.ts                                # Blog MDX utilities
├── demo-data.ts                           # Demo veri seti
└── utils.ts                               # cn() — Tailwind class merge
```

---

### ⚙️ BACKEND — Express.js 5 (REST API)

> Port: `4000` · TypeScript · Supabase Admin · Cloudinary · Redis Cache

```
📁 backend/src/                            ← Express.js API Kaynak Kodu
│
├── index.ts                               # 🚀 App entry — Express setup, CORS, Helmet
│
├── 📂 routes/                             ← API Endpoint Tanımları
│   ├── products.ts                        # /api/v1/products/*
│   ├── catalogs.ts                        # /api/v1/catalogs/*
│   ├── users.ts                           # /api/v1/users/*
│   ├── auth.ts                            # /api/v1/auth/*
│   ├── admin.ts                           # /api/v1/admin/*
│   ├── notifications.ts                   # /api/v1/notifications/*
│   └── health.ts                          # /health (liveness probe)
│
├── 📂 controllers/                        ← İş Mantığı (Business Logic)
│   │
│   ├── products.ts                        # ⚠️ Ürün ana controller (~31KB)
│   ├── products/                          # Modülerleştirilmiş alt modüller
│   │   ├── read.ts                        #   GET — listeleme, filtreleme, stats
│   │   ├── write.ts                       #   POST/PUT — oluşturma, güncelleme
│   │   ├── bulk.ts                        #   Toplu import/delete/reorder/price
│   │   ├── media.ts                       #   Görsel yükleme & silme (Cloudinary)
│   │   ├── helpers.ts                     #   getUserId, yardımcılar
│   │   └── schemas.ts                     #   Zod validasyon şemaları
│   │
│   ├── catalogs.ts                        # ⚠️ Katalog ana controller (~36KB)
│   ├── catalogs/                          # Modülerleştirilmiş alt modüller
│   │   ├── read.ts                        #   GET — listeleme, tekil okuma
│   │   ├── write.ts                       #   POST/PUT/DELETE — CRUD
│   │   ├── publish.ts                     #   Yayınlama & slug yönetimi
│   │   ├── public.ts                      #   Public katalog görüntüleme
│   │   ├── stats.ts                       #   Görüntülenme istatistikleri
│   │   ├── helpers.ts                     #   Yardımcı fonksiyonlar
│   │   └── types.ts                       #   TypeScript tipleri
│   │
│   ├── users.ts                           # Kullanıcı profil & plan yönetimi
│   └── notifications.ts                   # Bildirim CRUD
│
├── 📂 middlewares/                        ← Ara Katmanlar
│   ├── auth.ts                            # JWT doğrulama (Supabase verify)
│   └── errorHandler.ts                    # Global error handler
│
├── 📂 services/                           ← Dış Servis Entegrasyonları
│   ├── supabase.ts                        # Supabase Admin client
│   ├── cloudinary.ts                      # Cloudinary upload/delete
│   ├── redis.ts                           # Redis cache (opsiyonel)
│   └── activity-logger.ts                 # Activity log servisi
│
├── 📂 types/
│   └── auth.ts                            # Auth type tanımları
│
└── 📂 utils/
    └── env-validation.ts                  # Environment doğrulama
```

```
📁 backend/                                ← Backend Kök Dosyaları
├── package.json                           # Dependencies (express, helmet, cors...)
├── tsconfig.json                          # TypeScript config
├── Dockerfile                             # Backend container
├── .env / .env.example                    # Environment variables
└── dist/                                  # ⛔ Build output (git-ignored)
```

---

### 🗄️ DATABASE & SHARED

```
📁 supabase/                               ← Veritabanı Yönetimi
└── migrations/                            # SQL Migration Dosyaları (38 adet)
    ├── 00_initial_schema.sql              # Ana şema — users, products, catalogs
    ├── activity_logs.sql                  # Activity log tablosu
    ├── notifications_and_logs.sql         # Bildirim sistemi
    ├── category_metadata_table.sql        # Kategori metadata
    ├── smart_view_tracking.sql            # Akıllı görüntüleme takibi
    ├── dashboard_stats_optimization.sql   # İstatistik optimizasyonu
    ├── batch_update_functions.sql         # Toplu güncelleme fonksiyonları
    ├── add_storytelling_columns_only.sql  # Kapak sayfası & hikaye
    ├── add_cover_and_divider_pages.sql    # Kapak & ayraç sayfaları
    ├── add_catalog_customization_fields.sql
    ├── add_product_image_fit_column.sql
    ├── add_product_url_column.sql
    ├── fix_security_warnings.sql          # Güvenlik düzeltmeleri
    └── ... (toplam 38 migration)

📁 content/blog/                           ← MDX Blog İçerikleri
├── b2b-dijital-katalog-rehberi-2026.mdx
├── dijital-katalog-ile-satis-artirma.mdx
├── neden-dijital-katalog-kullanmalisiniz.mdx
└── why-digital-catalog.mdx

📁 public/                                 ← Statik Dosyalar
├── blog/hero1.png, hero2.png              # Blog hero görselleri
├── icons/social/                          # Sosyal medya ikonları (6 adet)
├── placeholder*.{jpg,svg,webp,png}        # Placeholder görseller (6 adet)
├── hero-catalog.png, hero-dashboard.webp  # Landing page görselleri
├── icon-dark-32x32.png, icon-light-32x32.png
├── apple-icon.png, og-image.png, logo-preview.svg
├── manifest.json, sw.js                   # PWA
└── urun-import-sablonu.csv                # Import şablonu

📁 scripts/                                ← Utility & Migration Scripts
├── 001-create-users-table.sql
├── seed-products.mjs                      # Test verisi
├── check-storage.{js,mjs}                 # Storage kontrolü
├── check-test-user.ts                     # Test kullanıcı
├── upgrade-test-user.ts                   # Plan yükseltme
└── convert-to-webp.mjs                    # Görsel optimizasyonu

📁 types/                                  ← Global TypeScript Tanımları
└── react-pageflip.d.ts
```

---

### 📄 Kök Yapılandırma Dosyaları

```
📁 / (Monorepo Root)
│
├── 🔧 Build & Runtime
│   ├── next.config.mjs                    # Next.js config — images, Sentry, Turbopack
│   ├── middleware.ts                       # Auth session yenileme (her request)
│   ├── tsconfig.json                      # TypeScript config
│   ├── postcss.config.mjs                 # PostCSS + Tailwind
│   ├── eslint.config.mjs                  # ESLint flat config
│   ├── vitest.config.ts / vitest.setup.ts # Test altyapısı
│   ├── components.json                    # Shadcn/ui yapılandırma
│   └── instrumentation.ts                 # Sentry server instrumentation
│
├── 🐳 DevOps & Deploy
│   ├── Dockerfile                         # Frontend container
│   ├── docker-compose.yml                 # Full stack orchestration
│   └── .dockerignore
│
├── 🔐 Environment
│   ├── .env.example                       # Şablon
│   ├── .env.local                         # Local geliştirme
│   └── .env.production.example            # Production şablon
│
├── 📊 Monitoring
│   ├── sentry.client.config.ts            # Browser error tracking
│   ├── sentry.server.config.ts            # Server error tracking
│   ├── sentry.edge.config.ts              # Edge error tracking
│   └── .env.sentry-build-plugin
│
├── 📦 Package Management
│   ├── package.json                       # Frontend dependencies
│   ├── package-lock.json / pnpm-lock.yaml
│
├── 🎨 Code Style
│   ├── .prettierrc / .prettierignore
│   ├── .editorconfig
│   └── .gitignore
│
└── 📚 Dokümantasyon
    ├── AGENTS.md                          # ⭐ Bu dosya — kapsamlı proje referansı
    ├── README.md                          # Proje tanıtım
    ├── AI_CONTEXT.md                      # AI context özet
    ├── ENVIRONMENT_SETUP.md               # Ortam kurulum rehberi
    ├── LOCAL_DB_QUICKSTART.md             # Veritabanı hızlı başlangıç
    ├── SUPABASE_EMAIL_SETUP.md            # Email ayarları
    ├── TROUBLESHOOTING_CLOUDINARY.md      # Cloudinary sorun giderme
    ├── PERFORMANCE_OPTIMIZATIONS.md       # Performans notları
    ├── BUILDER_PERFORMANCE_EXECUTION_PLAN.md
    ├── CACHE_ARCHITECTURE_EXPLANATION.md
    ├── PROJECT_AUDIT_AND_ROADMAP.md       # Audit & yol haritası
    ├── WORK_LOG.md                        # Geliştirme günlüğü
    └── spaghetti-report.md / storytelling-catalog.md
```

---

### 📊 Kritik Dosya Analizi

| Dosya | Boyut | Karmaşıklık | Durum | Açıklama |
|-------|-------|-------------|-------|----------|
| `components/products/modals/import-export-modal.tsx` | ~64KB | 🔴 Yüksek | ⚠️ Refactor önerilir | Excel/CSV import — parsing, mapping, validation hepsi içinde |
| `components/products/modals/product-modal.tsx` | ~60KB | 🔴 Yüksek | ⚠️ Refactor önerilir | Ürün CRUD — tabs, görseller, özellikler tek dosyada |
| `backend/src/controllers/catalogs.ts` | ~36KB | 🟡 Orta | ✅ Modülerleştirildi | Monolith + modüler `catalogs/` alt klasörü mevcut |
| `backend/src/controllers/products.ts` | ~31KB | 🟡 Orta | ✅ Modülerleştirildi | Monolith + modüler `products/` alt klasörü mevcut |
| `app/page.tsx` | ~33KB | 🟡 Orta | ℹ️ Normal | Landing page — animasyonlar, SEO, hero bölümleri |
| `lib/translations/` | ~12 modül | 🟢 Düşük | ✅ Modüler yapıda | Eski monolith `translations.ts` başarıyla parçalandı |
| `components/builder/editor/catalog-editor.tsx` | Refactored | 🟢 Düşük | ✅ İyileştirildi | Eski 76KB monolith → design-sections/ ile parçalandı |

---

## 4. Veri Modeli ve Şemalar

### Entity Relationship Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
│ ─────────────────────────────────────────────────────────────── │
│ id (PK, UUID) ──► auth.users.id (FK)                            │
│ email, full_name, company, avatar_url                           │
│ plan ('free'|'plus'|'pro')                                      │
│ exports_used, logo_url                                          │
│ subscription_status, subscription_end                           │
│ is_admin                                                        │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTS                                  │
│ ─────────────────────────────────────────────────────────────── │
│ id (PK, UUID)                                                   │
│ user_id (FK) ──► users.id                                       │
│ sku, name, description                                          │
│ price (NUMERIC), stock (INT)                                    │
│ category, image_url, images[]                                   │
│ product_url, custom_attributes (JSONB)                          │
│ currency ('TRY'|'USD'|'EUR'), order                             │
└─────────────────────────────────────────────────────────────────┘

         │
         │ N:M (product_ids array)
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CATALOGS                                  │
│ ─────────────────────────────────────────────────────────────── │
│ id (PK, UUID)                                                   │
│ user_id (FK) ──► users.id                                       │
│ template_id, name, description                                  │
│ layout, primary_color, columns_per_row                          │
│ show_prices, show_descriptions, show_attributes, show_sku       │
│ is_published, share_slug (UNIQUE)                               │
│ product_ids[] (UUID array - N:M relation)                       │
│ background_color, background_image, background_gradient         │
│ logo_url, logo_position, logo_size                              │
│ title_position, product_image_fit, header_text_color            │
│ view_count                                                      │
│ ─── STORYTELLING FIELDS ───                                     │
│ enable_cover_page, cover_image_url, cover_description           │
│ enable_category_dividers, cover_theme                           │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CATALOG_VIEWS                                │
│ ─────────────────────────────────────────────────────────────── │
│ id (PK), catalog_id (FK), visitor_hash                          │
│ view_date, viewed_at, ip_address, user_agent                    │
│ country, city, device_type, is_owner                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       TEMPLATES                                  │
│ ─────────────────────────────────────────────────────────────── │
│ id (PK, TEXT - e.g. 'modern-grid')                              │
│ name, description, component_name                               │
│ is_pro, is_system, items_per_page                               │
│ layout, preview_image, sort_order                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ACTIVITY_LOGS                                 │
│ ─────────────────────────────────────────────────────────────── │
│ id, user_id, user_email, user_name                              │
│ activity_type, description, metadata (JSONB)                    │
│ ip_address, user_agent, created_at                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATIONS                                 │
│ ─────────────────────────────────────────────────────────────── │
│ id, user_id (FK), type, title, message                          │
│ is_read, action_url, metadata, read_at                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     FEEDBACKS                                    │
│ ─────────────────────────────────────────────────────────────── │
│ id, user_id, user_name, user_email                              │
│ subject, message, page_url, attachments[]                       │
│ status ('pending'|'reviewed'|'resolved')                        │
└─────────────────────────────────────────────────────────────────┘
```

### Product Interface (TypeScript)

```typescript
interface Product {
  id: string                    // UUID
  user_id: string               // Owner FK
  sku: string | null            // Stok Kodu
  name: string                  // Ürün adı (zorunlu)
  description: string | null    // Açıklama
  price: number                 // Fiyat (TRY default)
  stock: number                 // Stok adedi
  category: string | null       // Kategori
  image_url: string | null      // Ana görsel
  images: string[]              // Ek görseller (max 5)
  product_url: string | null    // Satış/detay linki
  custom_attributes: CustomAttribute[]  // Özel özellikler
  order: number                 // Sıralama
  created_at: string
  updated_at: string
}

interface CustomAttribute {
  name: string    // e.g., "Renk"
  value: string   // e.g., "Mavi"
  unit?: string   // e.g., "cm", "kg"
}
```

### Catalog Interface (TypeScript)

```typescript
interface Catalog {
  id: string
  user_id: string
  template_id: string | null
  name: string
  description: string | null
  
  // Display Settings
  layout: string
  primary_color: string
  columns_per_row: number   // 2, 3, 4
  show_prices: boolean
  show_descriptions: boolean
  show_attributes: boolean
  show_sku: boolean
  show_urls: boolean
  
  // Background & Branding
  background_color: string
  background_image: string | null
  background_image_fit: 'cover' | 'contain' | 'fill'
  background_gradient: string | null
  logo_url: string | null
  logo_position: 'header-left' | 'header-center' | ... | 'none'
  logo_size: 'small' | 'medium' | 'large'
  title_position: 'left' | 'center' | 'right'
  header_text_color: string
  product_image_fit: 'cover' | 'contain' | 'fill'
  
  // Publishing
  is_published: boolean
  share_slug: string | null   // UNIQUE - URL slug
  product_ids: string[]       // Seçili ürün UUID'leri
  view_count: number
  
  // Storytelling Features
  enable_cover_page: boolean
  cover_image_url: string | null
  cover_description: string | null  // max 500 chars
  enable_category_dividers: boolean
  cover_theme: string
  
  created_at: string
  updated_at: string
}
```

---

## 5. Önemli İş Akışları (Key Workflows)

### 5.1 Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  /auth      │ ──► │ Supabase     │ ──► │ users table     │
│  (page)     │     │ Auth         │     │ (auto-created)  │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ JWT Token   │
                    │ (cookie)    │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ middleware.ts│ ◄── Session refresh
                    └──────────────┘
```

**Dosyalar:**
- `app/auth/page.tsx` - Login/Register formları
- `lib/supabase/server.ts` - Server-side Supabase client
- `lib/supabase/proxy.ts` - Session update middleware
- `components/auth/login-form.tsx`, `register-form.tsx`

**Auth Types:**
- Email/Password (Supabase native)
- Password Reset (email link)
- Email Verification (after signup)

### 5.2 Katalog Oluşturma Süreci

```
1. DASHBOARD                    2. CATALOGS PAGE               3. BUILDER
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│ "Yeni Katalog"  │ ──────────►│ CatalogsPage    │ ──────────►│ BuilderPage     │
│ button          │  onClick   │ Client.tsx      │  navigate  │ Client.tsx      │
└─────────────────┘            │                 │            │                 │
                               │ createCatalog() │            │ CatalogEditor   │
                               │ API call        │            │ - Template seç  │
                               └─────────────────┘            │ - Ürün ekle     │
                                      │                       │ - Renk/logo     │
                                      ▼                       │ - Önizleme      │
                               ┌─────────────────┐            └─────────────────┘
                               │ POST            │                   │
                               │ /api/v1/catalogs│                   │ save
                               └─────────────────┘                   ▼
                                      │                       ┌─────────────────┐
                                      ▼                       │ PUT             │
                               ┌─────────────────┐            │ /api/v1/catalogs│
                               │ Supabase        │◄───────────│ /:id            │
                               │ catalogs table  │            └─────────────────┘
                               └─────────────────┘
```

**Kritik Dosyalar:**
- `components/catalogs/catalogs-page-client.tsx` - Katalog listesi
- `components/builder/builder-page-client.tsx` - Editör container
- `components/builder/catalog-editor.tsx` - Editör core logic
- `lib/actions/catalogs.ts` - Server actions

### 5.3 PDF Export Süreci

```
┌──────────────┐    ┌───────────────┐    ┌──────────────┐    ┌──────────────┐
│ "PDF İndir"  │ ──►│ html-to-image │ ──►│ jsPDF        │ ──►│ .pdf dosya   │
│ button       │    │ (DOM capture) │    │ (PDF create) │    │ download     │
└──────────────┘    └───────────────┘    └──────────────┘    └──────────────┘
                           │
                           ▼
                    [Her sayfa için]
                    - Canvas render
                    - Image convert
                    - PDF'e ekle
```

**Dosyalar:**
- `components/builder/catalog-preview.tsx`
- PDF logic inline (refactor edilebilir)

### 5.4 Image Upload Flow

```
┌──────────────┐    ┌───────────────┐    ┌──────────────┐    ┌──────────────┐
│ File Input   │ ──►│ CloudinaryPr. │ ──►│ Cloudinary   │ ──►│ URL returned │
│ (component)  │    │ upload()      │    │ API          │    │ (f_auto)     │
└──────────────┘    └───────────────┘    └──────────────┘    └──────────────┘
                           │
                           │ Unsigned Upload Preset
                           ▼
                    ┌───────────────┐
                    │ Auto-optimized│
                    │ WebP/AVIF     │
                    └───────────────┘
```

**Dosyalar:**
- `lib/storage/cloudinary.ts` - Upload implementation
- `lib/storage/types.ts` - StorageProvider interface
- `components/products/product-modal.tsx` - Image picker UI

### 5.5 Abonelik/Plan Sistemi

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│ Free Plan   │    │ Plus Plan    │    │ Pro Plan     │
│ - 3 katalog │    │ - 10 katalog │    │ - Unlimited  │
│ - 50 ürün   │    │ - 500 ürün   │    │ - All templ. │
│ - 3 şablon  │    │ - All templ. │    │ - Analytics  │
└─────────────┘    └──────────────┘    └──────────────┘
                          │
                          ▼ (Upgrade Modal)
                   ┌──────────────┐
                   │ Manual       │ ◄── Henüz otomatik ödeme yok
                   │ Payment      │     (İyzico/Stripe entegre edilebilir)
                   └──────────────┘
```

---

## 6. Kodlama Standartları ve Kurallar

### 6.1 Naming Conventions

| Tip | Kural | Örnek |
|-----|-------|-------|
| **Files** | kebab-case | `catalog-editor.tsx`, `use-async-timeout.ts` |
| **Components** | PascalCase | `CatalogEditor`, `ProductModal` |
| **Functions** | camelCase | `getCatalogs`, `handleSubmit` |
| **Constants** | SCREAMING_SNAKE | `TEMPLATES`, `MAX_PRODUCTS` |
| **Types/Interfaces** | PascalCase | `Product`, `CatalogTemplate` |
| **CSS Classes** | kebab-case | `.catalog-card`, `.product-grid` |

### 6.2 Utility Functions (`lib/helpers.ts`)

```typescript
// Currency formatting (Turkish)
formatCurrency(1234.56) // "₺1.234,56"

// Number formatting
formatNumber(1234567) // "1.234.567"

// Date formatting (Turkish locale)
formatDate(new Date()) // "08 Şubat 2026"
formatDateTime(new Date()) // "08 Şub 2026, 11:06"
formatRelativeTime(pastDate) // "2 gün önce"

// String utilities
truncate("Long text...", 20) // "Long text..."
slugify("Türkçe Başlık") // "turkce-baslik"

// Debounce
debounce(fn, 300)

// ID generation
generateId(8) // "a1b2c3d4"

// Environment check
isClient() // true/false

// Safe JSON parse
safeJsonParse<T>(json, fallback)

// Clipboard
await copyToClipboard(text)
```

### 6.3 API Fetch Wrapper (`lib/api.ts`)

```typescript
// Temel kullanım
const products = await apiFetch<Product[]>("/products")

// POST ile
const newProduct = await apiFetch<Product>("/products", {
  method: "POST",
  body: JSON.stringify(data)
})

// Özel options
await apiFetch("/products/bulk-import", {
  retries: 3,           // Retry sayısı
  retryDelay: 2000,     // Retry arası bekleme
  timeout: 120000       // Timeout (otomatik belirlenir)
})
```

**Auto-timeout logic:**
- `/bulk-*`, `/import`, `/export` → 120s
- `/upload`, `/image` → 60s
- Diğerleri → 30s

### 6.4 Validation Patterns (`lib/validations/index.ts`)

```typescript
import { z } from 'zod'
import { productCreateSchema, validate, safeValidate } from '@/lib/validations'

// Strict validation (throws on error)
const validated = validate(productCreateSchema, formData)

// Safe validation (returns result object)
const result = safeValidate(productCreateSchema, formData)
if (!result.success) {
  console.log(result.errors) // ["name: Ürün adı zorunludur"]
}
```

### 6.5 Error Handling Patterns

**Frontend (Toast notifications):**
```typescript
import { toast } from 'sonner'

try {
  await createProduct(data)
  toast.success("Ürün oluşturuldu!")
} catch (error) {
  toast.error(error instanceof Error ? error.message : "Bir hata oluştu")
}
```

**Backend (Express error handler):**
```typescript
// middlewares/errorHandler.ts
app.use(errorHandler) // Global error middleware

// Controller'larda:
throw new Error("User not found") // → 500
res.status(404).json({ error: "Not found" }) // → 404
```

### 6.6 Server Actions Pattern

```typescript
// lib/actions/products.ts
"use server"

import { revalidatePath } from "next/cache"
import { apiFetch } from "@/lib/api"

export async function createProduct(formData: FormData) {
  const data = { /* parse formData */ }
  
  const result = await apiFetch<Product>("/products", {
    method: "POST",
    body: JSON.stringify(data)
  })
  
  revalidatePath("/dashboard/products")  // Cache invalidation
  return result
}
```

---

## 7. Mevcut Durum ve Geliştirme Notları

### 7.1 Proje Durumu

| Metrik | Değer |
|--------|-------|
| **Kod Satırı** | ~30,000+ (TSX: 20K, TS: 7K, CSS: 300) |
| **Test Coverage** | Düşük (öncelikli TODO) |
| **Production Ready** | Hayır (Beta aşamasında) |

### 7.2 Bilinen Teknik Borçlar

| Öncelik | Borç | Açıklama |
|---------|------|----------|
| 🔴 HIGH | **Büyük Component'lar** | `catalog-editor.tsx` (76KB) parçalanmalı |
| 🔴 HIGH | **translations.ts** | 142KB tek dosya - modüle bölünmeli |
| 🟡 MED | **Test Eksikliği** | Unit/Integration testler yetersiz |
| 🟡 MED | **Ödeme Entegrasyonu** | Stripe/İyzico entegre edilmeli |
| 🟡 MED | **Server Actions Güvenlik** | Tüm action'lara auth middleware |
| 🟢 LOW | **Code Splitting** | Büyük bundle'lar optimize edilmeli |

### 7.3 Önerilen Refactoring

```
components/builder/catalog-editor.tsx (76KB)
├── LayoutSidebar.tsx        # Sol panel - şablon seçimi
├── ProductGridPreview.tsx   # Merkez - ürün önizleme
├── StyleControls.tsx        # Sağ panel - renk/font
├── CoverPageEditor.tsx      # Kapak sayfası editörü
└── ExportActions.tsx        # PDF/QR kod butonları
```

### 7.4 Aktif TODO'lar

```typescript
// Kod içinde bulunan TODO'lar:
// TODO: Implement automatic payment integration (Iyzico/Stripe)
// TODO: Add multi-language PDF generation
// TODO: Implement workspace/team features
// TODO: Add catalog password protection
// TODO: Implement real-time collaboration (web sockets)
```

### 7.5 Gelişim Yol Haritası

1. **Kısa Vadeli (1-2 ay)**
   - Test coverage artırma (Vitest)
   - Büyük component'ların parçalanması
   - Bundle size optimizasyonu

2. **Orta Vadeli (3-6 ay)**
   - Ödeme entegrasyonu (Stripe/İyzico)
   - Workspace/Team özelliği
   - AI açıklama oluşturucu

3. **Uzun Vadeli (6-12 ay)**
   - Custom domain desteği
   - Real-time collaboration
   - Mobile app (React Native)

---

## 8. Ortam Değişkenleri Referansı

### Frontend (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...     # SECRET - server only

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Cloudinary
NEXT_PUBLIC_STORAGE_PROVIDER=cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset

# Email (Resend)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Monitoring
SENTRY_AUTH_TOKEN=sntrys_xxx

# Admin
ADMIN_EMAIL=admin@example.com
```

### Backend (`backend/.env`)

```env
PORT=4000

# Supabase Admin
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cloudinary Admin (for deletion)
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
CLOUDINARY_DELETED_FOLDER=deleted-images

# Redis (optional)
REDIS_URL=redis://default:xxx@host:port

# Security
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
NODE_ENV=development
```

---

## 9. Hızlı Başlangıç Komutları

```bash
# Frontend development
cd katalog-saas-frontend
npm install
npm run dev              # localhost:3000

# Backend development
cd backend
npm install
npm run dev              # localhost:4000

# Full stack (Docker)
docker-compose up -d

# Tests
npm run test             # Vitest
npm run test:coverage    # Coverage report

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check
```

---

## 10. AI Assistant İçin Önemli Notlar

### 🚨 Dikkat Edilmesi Gerekenler

1. **RLS Aktif:** Supabase'de Row Level Security etkin. Tüm sorgular user_id bazında filtrelenir.

2. **Dual Architecture:** Frontend (Next.js) + Backend (Express) ayrı çalışır. Server actions backend'e API call yapar.

3. **Cloudinary Unsigned:** Upload'lar unsigned preset ile yapılır. Delete işlemleri backend'de (signed).

4. **Büyük Dosyalar:** `catalog-editor.tsx`, `import-export-modal.tsx`, `translations.ts` çok büyük.

5. **i18n:** Çeviriler `lib/translations.ts`'de. Yeni string eklerken her iki dili de ekle.

6. **Template System:** Şablonlar DB'de (`templates` tablosu) + React components (`components/catalogs/templates/`).

### 📋 Sık Kullanılan Komut Patternleri

```bash
# Yeni ürün server action'ı çağırma
const result = await createProduct(formData)

# Katalog güncelleme
await updateCatalog(catalogId, { name: "Yeni İsim" })

# Ürün silme (tek)
await deleteProduct(productId)

# Toplu silme
await deleteProducts([id1, id2, id3])

# Dashboard istatistikleri
const stats = await getDashboardStats("30d")
```

### 🔧 Debug İpuçları

1. **API Hataları:** `lib/api.ts`'deki `apiFetch` fonksiyonu tüm hataları loglar.

2. **Auth Sorunları:** `middleware.ts` session'ı yönetir. Cookie'leri kontrol et.

3. **Cloudinary Hataları:** Preset adı ve unsigned mode kontrol et.

4. **RLS Hataları:** Supabase Dashboard → Logs → Database Logs.

---

> 📅 **Son Güncelleme:** 8 Şubat 2026  
> 👤 **Hazırlayan:** Antigravity (Senior Full-Stack Architect)  
> 📊 **Versiyon:** 1.0
