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

### Klasör Ağacı (Tree Structure)

```
fogcatalog/
├── app/                       # Next.js App Router
│   ├── admin/
│   │   ├── error.tsx
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── page.tsx
│   ├── api/
│   │   ├── admin/activity-logs/route.ts
│   │   └── health/route.ts
│   ├── auth/                  # Auth sayfaları (login, register, reset)
│   │   ├── callback/route.ts  # OAuth callback
│   │   ├── confirmed/page.tsx
│   │   ├── confirm-recovery/page.tsx
│   │   ├── error/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── verify/page.tsx    # Email doğrulama
│   ├── blog/                  # Blog sayfaları (MDX)
│   │   ├── [slug]/page.tsx
│   │   ├── blog-post-layout.tsx
│   │   ├── dijital-katalog-ile-satis-artirma/page.tsx
│   │   ├── neden-dijital-katalog-kullanmalisiniz/page.tsx
│   │   ├── page.tsx
│   │   └── why-digital-catalog/page.tsx
│   ├── catalog/               # Public katalog görüntüleme
│   │   └── [slug]/
│   │       ├── loading.tsx
│   │       ├── page.tsx
│   │       └── public-catalog-client.tsx
│   ├── contact/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── create-demo/page.tsx
│   ├── dashboard/             # Kullanıcı paneli
│   │   ├── admin/page.tsx
│   │   ├── analytics/page.tsx # İstatistik sayfası
│   │   ├── builder/page.tsx   # Katalog editörü
│   │   ├── catalogs/page.tsx  # Katalog listesi
│   │   ├── categories/page.tsx
│   │   ├── error.tsx
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── page.tsx
│   │   ├── products/          # Ürün yönetimi
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── settings/page.tsx  # Profil ayarları
│   │   └── templates/page.tsx
│   ├── faq/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── features/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── how-it-works/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── legal/                 # Yasal sayfalar (KVKK, terms)
│   │   ├── cancellation-policy/
│   │   ├── cancellation-refund-policy/page.tsx
│   │   ├── cookie-policy/
│   │   ├── distance-sales-agreement/
│   │   ├── explicit-consent/page.tsx
│   │   └── kvkk/
│   ├── pricing/               # Fiyatlandırma sayfası
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── privacy/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── terms/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── error.tsx
│   ├── global-error.tsx
│   ├── globals.css            # Tailwind base + custom CSS
│   ├── icon.png
│   ├── layout.tsx             # Root layout (providers)
│   ├── loading.tsx
│   ├── not-found.tsx
│   ├── page.tsx               # Landing page (~33KB!)
│   ├── robots.ts
│   └── sitemap.ts
│
├── backend/                   # Express.js API Katmanı
│   ├── dist/                  # Compiled JS (build output)
│   │   ├── controllers/
│   │   │   ├── catalogs.js
│   │   │   ├── catalogs/
│   │   │   │   ├── helpers.js
│   │   │   │   ├── public.js
│   │   │   │   ├── publish.js
│   │   │   │   ├── read.js
│   │   │   │   ├── stats.js
│   │   │   │   ├── types.js
│   │   │   │   └── write.js
│   │   │   ├── notifications.js
│   │   │   ├── products.js
│   │   │   ├── products/
│   │   │   │   ├── bulk.js
│   │   │   │   ├── helpers.js
│   │   │   │   ├── media.js
│   │   │   │   ├── read.js
│   │   │   │   ├── schemas.js
│   │   │   │   └── write.js
│   │   │   └── users.js
│   │   ├── middlewares/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── admin.js
│   │   │   ├── auth.js
│   │   │   ├── catalogs.js
│   │   │   ├── health.js
│   │   │   ├── notifications.js
│   │   │   ├── products.js
│   │   │   └── users.js
│   │   ├── services/
│   │   │   ├── activity-logger.js
│   │   │   ├── cloudinary.js
│   │   │   ├── redis.js
│   │   │   └── supabase.js
│   │   ├── types/auth.js
│   │   ├── utils/env-validation.js
│   │   └── index.js
│   ├── src/                   # TypeScript source
│   │   ├── controllers/       # İş mantığı
│   │   │   ├── catalogs.ts    # Katalog CRUD (~36KB)
│   │   │   ├── catalogs/      # Modüler yapı
│   │   │   │   ├── helpers.ts
│   │   │   │   ├── public.ts
│   │   │   │   ├── publish.ts
│   │   │   │   ├── read.ts
│   │   │   │   ├── stats.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── write.ts
│   │   │   ├── notifications.ts
│   │   │   ├── products.ts    # Ürün CRUD (~31KB)
│   │   │   ├── products/      # Modüler yapı
│   │   │   │   ├── bulk.ts
│   │   │   │   ├── helpers.ts
│   │   │   │   ├── media.ts
│   │   │   │   ├── read.ts
│   │   │   │   ├── schemas.ts
│   │   │   │   └── write.ts
│   │   │   └── users.ts       # Kullanıcı işlemleri
│   │   ├── middlewares/       # Auth, error handling
│   │   │   ├── auth.ts
│   │   │   └── errorHandler.ts
│   │   ├── routes/            # API endpoint tanımları
│   │   │   ├── admin.ts       # /api/v1/admin/*
│   │   │   ├── auth.ts        # /api/v1/auth/*
│   │   │   ├── catalogs.ts    # /api/v1/catalogs/*
│   │   │   ├── health.ts      # /health
│   │   │   ├── notifications.ts
│   │   │   ├── products.ts    # /api/v1/products/*
│   │   │   └── users.ts       # /api/v1/users/*
│   │   ├── services/          # Redis, Supabase clients
│   │   │   ├── activity-logger.ts
│   │   │   ├── cloudinary.ts
│   │   │   ├── redis.ts
│   │   │   └── supabase.ts
│   │   ├── types/
│   │   │   └── auth.ts
│   │   ├── utils/
│   │   │   └── env-validation.ts
│   │   └── index.ts           # Express app entry
│   ├── .env                   # Backend env vars
│   ├── .env.example
│   ├── backend_ts_errors.log
│   ├── Dockerfile             # Backend container
│   ├── package.json           # Backend dependencies
│   ├── package-lock.json
│   ├── tsc_errors.txt
│   └── tsconfig.json
│
├── components/                # React Bileşenleri
│   ├── admin/                 # Admin panel bileşenleri
│   │   ├── admin-dashboard.tsx
│   │   ├── admin-dashboard/
│   │   │   ├── activity-logs-tab.tsx
│   │   │   ├── admin-header.tsx
│   │   │   ├── deleted-users-tab.tsx
│   │   │   ├── feedbacks-tab.tsx
│   │   │   ├── overview-tab.tsx
│   │   │   ├── types.ts
│   │   │   ├── use-admin-dashboard.tsx
│   │   │   └── users-tab.tsx
│   │   └── activity-logs-client.tsx
│   ├── analytics/
│   │   └── analytics-client.tsx
│   ├── auth/                  # Login, register forms
│   │   ├── auth-form.tsx
│   │   ├── auth-form/
│   │   │   ├── auth-tabs.tsx
│   │   │   ├── error-alert.tsx
│   │   │   ├── google-auth-button.tsx
│   │   │   ├── legal-notice.tsx
│   │   │   ├── loading-status.tsx
│   │   │   ├── redirect-overlay.tsx
│   │   │   ├── status-banner.tsx
│   │   │   ├── types.ts
│   │   │   └── use-auth-form-controller.tsx
│   │   ├── auth-form-new.tsx
│   │   ├── auth-page-client.tsx
│   │   ├── auth-sections/
│   │   │   ├── auth-form.tsx
│   │   │   ├── hero-panel.tsx
│   │   │   ├── index.ts
│   │   │   ├── redirect-overlay.tsx
│   │   │   ├── types.ts
│   │   │   └── use-auth.ts
│   │   ├── onboarding-modal.tsx
│   │   └── session-watcher.tsx
│   ├── builder/               # Katalog editör bileşenleri
│   │   ├── builder-page-client.tsx  # Ana editör container
│   │   ├── builder-utils.ts
│   │   ├── editor/
│   │   │   ├── catalog-editor.tsx   # Editor core logic (~refactored)
│   │   │   ├── design-sections/
│   │   │   │   ├── appearance-section.tsx
│   │   │   │   ├── background-section.tsx
│   │   │   │   ├── branding-section.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── section-wrapper.tsx
│   │   │   │   ├── storytelling-section.tsx
│   │   │   │   ├── structure-preview.tsx
│   │   │   │   ├── template-section.tsx
│   │   │   │   └── types.ts
│   │   │   ├── editor-content-tab.tsx
│   │   │   ├── editor-design-tab.tsx
│   │   │   └── editor-product-cards.tsx
│   │   ├── modals/
│   │   │   ├── exit-dialog.tsx
│   │   │   └── upgrade-modal.tsx    # Plan yükseltme
│   │   ├── preview/
│   │   │   ├── catalog-preview.tsx  # PDF export önizleme
│   │   │   └── template-preview-card.tsx
│   │   └── toolbar/
│   │       ├── builder-toolbar.tsx
│   │       └── preview-floating-header.tsx
│   ├── catalogs/              # Katalog görüntüleme
│   │   ├── catalog-preview.tsx
│   │   ├── catalogs-page-client.tsx
│   │   ├── catalog-thumbnail.tsx
│   │   ├── category-divider.tsx
│   │   ├── cover-page.tsx
│   │   ├── covers/            # Kapak tasarımları (10 tema)
│   │   │   ├── artistic.tsx
│   │   │   ├── bold.tsx
│   │   │   ├── corporate.tsx
│   │   │   ├── fashion.tsx
│   │   │   ├── index.tsx
│   │   │   ├── industrial.tsx
│   │   │   ├── luxury.tsx
│   │   │   ├── magazine.tsx
│   │   │   ├── minimal.tsx
│   │   │   ├── modern.tsx
│   │   │   └── tech.tsx
│   │   ├── dividers/          # Kategori ayraç sayfaları (10 tema)
│   │   │   ├── artistic.tsx
│   │   │   ├── bold.tsx
│   │   │   ├── corporate.tsx
│   │   │   ├── fashion.tsx
│   │   │   ├── index.tsx
│   │   │   ├── industrial.tsx
│   │   │   ├── luxury.tsx
│   │   │   ├── magazine.tsx
│   │   │   ├── minimal.tsx
│   │   │   ├── modern.tsx
│   │   │   └── tech.tsx
│   │   ├── share-modal.tsx    # Sosyal medya paylaşım
│   │   └── templates/         # 17 şablon bileşeni
│   │       ├── bold.tsx
│   │       ├── catalog-pro.tsx
│   │       ├── classic-catalog.tsx
│   │       ├── clean-white.tsx
│   │       ├── compact-list.tsx
│   │       ├── elegant-cards.tsx
│   │       ├── fashion-lookbook.tsx
│   │       ├── industrial.tsx
│   │       ├── luxury.tsx
│   │       ├── magazine.tsx
│   │       ├── minimalist.tsx
│   │       ├── modern-grid.tsx
│   │       ├── product-tiles.tsx
│   │       ├── registry.tsx
│   │       ├── retail.tsx
│   │       ├── showcase.tsx
│   │       ├── tech-modern.tsx
│   │       └── types.ts
│   ├── categories/
│   │   └── categories-page-client.tsx
│   ├── dashboard/             # Dashboard bileşenleri
│   │   ├── dashboard-client.tsx
│   │   ├── feedback-modal.tsx
│   │   ├── header.tsx
│   │   ├── notification-dropdown.tsx
│   │   ├── notifications-popover.tsx
│   │   ├── onboarding-checklist.tsx
│   │   └── sidebar.tsx
│   ├── demo/
│   │   └── demo-builder.tsx
│   ├── layout/
│   │   ├── public-footer.tsx
│   │   └── public-header.tsx
│   ├── products/              # Ürün yönetimi
│   │   ├── bulk/
│   │   │   ├── bulk-actions-modal.tsx
│   │   │   ├── bulk-image-upload/
│   │   │   │   ├── image-card.tsx
│   │   │   │   ├── matcher.ts
│   │   │   │   ├── product-selector.tsx
│   │   │   │   ├── types.ts
│   │   │   │   └── upload-service.ts
│   │   │   ├── bulk-image-upload-modal.tsx
│   │   │   └── bulk-price-modal.tsx
│   │   ├── filters/
│   │   │   └── filter-sheet.tsx
│   │   ├── modals/
│   │   │   ├── import-export/
│   │   │   │   ├── constants.ts          # Header aliases & system fields
│   │   │   │   ├── default-tabs.tsx
│   │   │   │   ├── file-utils.ts
│   │   │   │   ├── import-products.ts    # CSV→Product parser
│   │   │   │   ├── mapping-step.tsx
│   │   │   │   └── types.ts
│   │   │   ├── import-export-modal.tsx   # Excel/CSV import (~64KB)
│   │   │   ├── product-modal.tsx         # Ürün ekleme/düzenleme (~60KB)
│   │   │   └── product-modal.tsx.bak
│   │   ├── products-page-client.tsx      # Ana tablo container & export logic
│   │   ├── table/
│   │   │   ├── components/
│   │   │   │   ├── delete-alert-dialog.tsx
│   │   │   │   └── product-preview-dialog.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-products-table.ts
│   │   │   ├── index.ts
│   │   │   ├── pagination.tsx
│   │   │   ├── products-table.tsx        # Tablo render logic
│   │   │   ├── types.ts
│   │   │   ├── utils/
│   │   │   │   └── product-helpers.ts
│   │   │   └── views/
│   │   │       ├── product-grid-view.tsx
│   │   │       └── product-list-view.tsx
│   │   ├── tabs/
│   │   │   ├── product-attributes-tab.tsx
│   │   │   ├── product-basic-tab.tsx
│   │   │   └── product-images-tab.tsx
│   │   └── toolbar/
│   │       ├── bulk-actions-bar.tsx
│   │       ├── stats-cards.tsx
│   │       └── toolbar.tsx
│   ├── settings/
│   │   └── settings-page-client.tsx
│   ├── templates/
│   │   ├── preview-data.ts
│   │   └── templates-page-client.tsx
│   ├── ui/                    # Shadcn/Radix primitives (36 dosya)
│   │   ├── alert.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── image-lightbox.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── network-status-banner.tsx
│   │   ├── pdf-progress-modal.tsx
│   │   ├── popover.tsx
│   │   ├── product-image-gallery.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── responsive-container.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── skeleton-variants.tsx
│   │   ├── slider.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── theme-toggle.tsx
│   │   └── tooltip.tsx
│   ├── error-boundary.tsx
│   ├── home-page-title-updater.tsx
│   └── theme-provider.tsx
│
├── content/                   # MDX blog içerikleri
│   └── blog/
│       ├── b2b-dijital-katalog-rehberi-2026.mdx
│       ├── dijital-katalog-ile-satis-artirma.mdx
│       ├── neden-dijital-katalog-kullanmalisiniz.mdx
│       └── why-digital-catalog.mdx
│
├── lib/                       # Core Logic
│   ├── __tests__/
│   │   ├── api.test.ts
│   │   └── errorHandler.test.ts
│   ├── actions/               # Server Actions (Next.js)
│   │   ├── admin.ts
│   │   ├── auth.ts
│   │   ├── catalogs.ts        # Katalog CRUD actions
│   │   ├── categories.ts      # Kategori işlemleri
│   │   ├── feedback.ts        # Geri bildirim
│   │   ├── notifications.ts   # Bildirimler
│   │   ├── products.ts        # Ürün CRUD actions
│   │   ├── templates.ts       # Şablon yönetimi
│   │   └── user.ts            # Kullanıcı profili
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-async-timeout.ts      # Zaman aşımı yönetimi
│   │   ├── use-builder-handlers.ts
│   │   ├── use-builder-state.ts
│   │   ├── use-catalog-actions.ts
│   │   ├── use-catalogs.ts
│   │   ├── use-debounce.ts
│   │   ├── use-editor-upload.ts
│   │   ├── use-network-status.ts
│   │   ├── use-notifications.ts
│   │   ├── use-pdf-export.ts
│   │   ├── use-product-images.ts
│   │   └── use-products.ts
│   ├── services/
│   │   └── email.ts
│   ├── storage/               # Storage abstraction
│   │   ├── cloudinary.ts      # Cloudinary implementation
│   │   ├── index.ts           # Factory
│   │   ├── supabase.ts        # Supabase Storage
│   │   └── types.ts           # StorageProvider interface
│   ├── supabase/              # Supabase clients
│   │   ├── client.ts          # Client-side client
│   │   ├── proxy.ts           # Session middleware
│   │   └── server.ts          # Server-side client
│   ├── translations/          # i18n çevirileri (modüler)
│   │   ├── admin.ts
│   │   ├── auth.ts
│   │   ├── billing.ts
│   │   ├── catalog.ts
│   │   ├── common.ts
│   │   ├── dashboard.ts
│   │   ├── index.ts           # Export hub
│   │   ├── layout.ts
│   │   ├── legal.ts
│   │   ├── products.ts        # Ürün & import/export çevirileri
│   │   ├── public-pages.ts
│   │   └── settings.ts
│   ├── utils/
│   │   ├── fuzzy-search.ts
│   │   └── retry.ts
│   ├── validations/           # Zod schemas
│   │   └── index.ts           # Tüm validation şemaları
│   ├── activity-logger.ts
│   ├── api.ts                 # apiFetch wrapper
│   ├── blog.ts
│   ├── constants.ts           # Şablon sabitleri (deprecated?)
│   ├── demo-data.ts
│   ├── env-validation.ts
│   ├── helpers.ts             # Utility fonksiyonlar
│   ├── i18n-provider.tsx
│   ├── image-utils.ts
│   ├── lightbox-context.tsx
│   ├── query-provider.tsx
│   ├── rate-limit.ts          # Client-side rate limiting
│   ├── seo.ts                 # SEO metadata helpers
│   ├── sidebar-context.tsx
│   ├── user-context.tsx
│   └── utils.ts
│
├── public/                    # Static assets
│   ├── blog/
│   │   ├── hero1.png
│   │   └── hero2.png
│   ├── icons/
│   │   └── social/
│   │       ├── facebook.png
│   │       ├── gmail.png
│   │       ├── linkedin.png
│   │       ├── telegram.png
│   │       ├── twitter.png
│   │       └── whatsapp.png
│   ├── apple-icon.png
│   ├── hero-catalog.png
│   ├── hero-dashboard.webp
│   ├── icon-dark-32x32.png
│   ├── icon-light-32x32.png
│   ├── logo-preview.svg
│   ├── manifest.json
│   ├── og-image.png
│   ├── placeholder.jpg
│   ├── placeholder.svg
│   ├── placeholder.webp
│   ├── placeholder-logo.png
│   ├── placeholder-user.jpg
│   ├── placeholder-user.webp
│   ├── sw.js
│   └── urun-import-sablonu.csv
│
├── scripts/                   # Utility scripts
│   ├── 001-create-users-table.sql
│   ├── check-storage.js
│   ├── check-storage.mjs
│   ├── check-test-user.ts
│   ├── check-test-user-short.ts
│   ├── convert-to-webp.mjs
│   ├── seed-products.mjs
│   └── upgrade-test-user.ts
│
├── supabase/                  # Database
│   ├── .temp/
│   │   └── cli-latest
│   └── migrations/            # SQL migration dosyaları (38 adet)
│       ├── 00_initial_schema.sql
│       ├── 00_initial_schema_safe.sql
│       ├── 20260207_feedbacks_rls_admin.sql
│       ├── 20260212190000_add_show_in_search.sql
│       ├── 20260212230000_enforce_product_limits.sql
│       ├── activity_logs.sql
│       ├── add_catalog_customization_fields.sql
│       ├── add_catalog_slug_unique_constraint.sql
│       ├── add_cover_and_divider_pages.sql
│       ├── add_cover_theme.sql
│       ├── add_header_text_color_column.sql
│       ├── add_product_image_fit_column.sql
│       ├── add_product_url_column.sql
│       ├── add_products_display_order.sql
│       ├── add_published_slug_index.sql
│       ├── add_show_urls_column.sql
│       ├── add_storytelling_columns_only.sql
│       ├── auth_activity_trigger.sql
│       ├── batch_update_functions.sql
│       ├── category_metadata_table.sql
│       ├── create_tables_only.sql
│       ├── dashboard_stats_optimization.sql
│       ├── deleted_photos_table.sql
│       ├── disable_rls_local.sql
│       ├── fix_security_warnings.sql
│       ├── fix_template_layouts.sql
│       ├── notifications_and_logs.sql
│       ├── product_catalog_cleanup.sql
│       ├── smart_view_tracking.sql
│       ├── storage_buckets_setup.sql
│       ├── unique_visitors_multi.sql
│       └── update_catalog_schema_sku_title.sql
│
├── types/                     # Global TypeScript types
│   └── react-pageflip.d.ts
│
├── .claude-full-file-list.txt # AI context file list (504 files)
├── .dockerignore
├── .editorconfig
├── .env.example
├── .env.local
├── .env.production.example
├── .env.sentry-build-plugin
├── .gitignore
├── .prettierignore
├── .prettierrc
├── AI_CONTEXT.md
├── BUILDER_PERFORMANCE_EXECUTION_PLAN.md
├── CACHE_ARCHITECTURE_EXPLANATION.md
├── CLAUDE.md                  # Bu dosya (proje dokümantasyonu)
├── components.json            # Shadcn config
├── docker-compose.yml         # Docker setup
├── Dockerfile                 # Frontend container
├── ENVIRONMENT_SETUP.md
├── eslint.config.mjs
├── instrumentation.ts
├── instrumentation-client.ts.bak
├── LOCAL_DB_QUICKSTART.md
├── middleware.ts              # Next.js middleware (auth session)
├── next.config.mjs            # Next.js configuration
├── next-env.d.ts
├── package.json               # Frontend dependencies
├── package-lock.json
├── PERFORMANCE_OPTIMIZATIONS.md
├── pnpm-lock.yaml
├── postcss.config.mjs
├── PROJECT_AUDIT_AND_ROADMAP.md
├── README.md
├── sentry.client.config.ts
├── sentry.edge.config.ts
├── sentry.server.config.ts
├── spaghetti-report.md
├── storytelling-catalog.md
├── SUPABASE_EMAIL_SETUP.md
├── TROUBLESHOOTING_CLOUDINARY.md
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── vitest.config.ts           # Test configuration
├── vitest.setup.ts
└── WORK_LOG.md
```

### Kritik Dosya Açıklamaları

| Dosya/Klasör | Boyut | Açıklama |
|--------------|-------|----------|
| `lib/translations.ts` | 142KB | Tüm çeviriler (TR/EN) - çok büyük, parçalanabilir |
| `components/builder/catalog-editor.tsx` | 76KB | Katalog editörünün kalbi - parçalanması önerilir |
| `components/products/import-export-modal.tsx` | 64KB | Excel/CSV import logic - kompleks |
| `app/page.tsx` | 33KB | Landing page - animasyonlar ve SEO |

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
