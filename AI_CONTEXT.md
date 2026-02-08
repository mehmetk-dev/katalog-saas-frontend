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
├── .agent/                    # AI Agent kuralları ve skills
├── app/                       # Next.js App Router
│   ├── api/                   # API Routes (minimal - çoğu backend'de)
│   ├── auth/                  # Auth sayfaları (login, register, reset)
│   │   ├── callback/          # OAuth callback
│   │   ├── forgot-password/   # Şifre sıfırlama
│   │   ├── reset-password/    # Yeni şifre belirleme
│   │   └── verify/            # Email doğrulama
│   ├── blog/                  # Blog sayfaları (MDX)
│   ├── catalog/               # Public katalog görüntüleme
│   │   └── [slug]/            # Dinamik katalog route
│   ├── dashboard/             # Kullanıcı paneli
│   │   ├── analytics/         # İstatistik sayfası
│   │   ├── builder/           # Katalog editörü
│   │   │   └── [id]/          # Dinamik editör route
│   │   ├── catalogs/          # Katalog listesi
│   │   ├── products/          # Ürün yönetimi
│   │   └── settings/          # Profil ayarları
│   ├── legal/                 # Yasal sayfalar (KVKK, terms)
│   ├── pricing/               # Fiyatlandırma sayfası
│   ├── globals.css            # Tailwind base + custom CSS
│   ├── layout.tsx             # Root layout (providers)
│   └── page.tsx               # Landing page (~33KB!)
│
├── backend/                   # Express.js API Katmanı
│   ├── src/
│   │   ├── controllers/       # İş mantığı
│   │   │   ├── catalogs.ts    # Katalog CRUD (~36KB)
│   │   │   ├── products.ts    # Ürün CRUD (~31KB)
│   │   │   ├── users.ts       # Kullanıcı işlemleri
│   │   │   └── notifications.ts
│   │   ├── routes/            # API endpoint tanımları
│   │   │   ├── products.ts    # /api/v1/products/*
│   │   │   ├── catalogs.ts    # /api/v1/catalogs/*
│   │   │   ├── users.ts       # /api/v1/users/*
│   │   │   ├── admin.ts       # /api/v1/admin/*
│   │   │   ├── auth.ts        # /api/v1/auth/*
│   │   │   └── health.ts      # /health
│   │   ├── middlewares/       # Auth, error handling
│   │   ├── services/          # Redis, Supabase clients
│   │   └── index.ts           # Express app entry
│   ├── package.json           # Backend dependencies
│   └── Dockerfile             # Backend container
│
├── components/                # React Bileşenleri
│   ├── auth/                  # Login, register forms
│   ├── builder/               # Katalog editör bileşenleri
│   │   ├── builder-page-client.tsx  # Ana editör (~45KB)
│   │   ├── catalog-editor.tsx       # Editor core (~76KB)
│   │   ├── catalog-preview.tsx      # Önizleme
│   │   └── upgrade-modal.tsx        # Plan yükseltme
│   ├── catalogs/              # Katalog görüntüleme
│   │   ├── templates/         # 15+ şablon bileşeni
│   │   │   ├── modern-grid.tsx
│   │   │   ├── magazine.tsx
│   │   │   ├── luxury.tsx
│   │   │   └── ... (18 dosya)
│   │   ├── covers/            # Kapak tasarımları
│   │   ├── dividers/          # Kategori ayraç sayfaları
│   │   └── share-modal.tsx    # Sosyal medya paylaşım
│   ├── products/              # Ürün yönetimi
│   │   ├── products-table.tsx       # Ana tablo (~44KB)
│   │   ├── product-modal.tsx        # Ürün ekleme/düzenleme (~60KB)
│   │   ├── import-export-modal.tsx  # Excel/CSV import (~64KB)
│   │   └── bulk-image-upload-modal.tsx
│   ├── dashboard/             # Dashboard bileşenleri
│   └── ui/                    # Shadcn/Radix primitives (31 dosya)
│
├── lib/                       # Core Logic
│   ├── actions/               # Server Actions (Next.js)
│   │   ├── products.ts        # Ürün CRUD actions
│   │   ├── catalogs.ts        # Katalog CRUD actions
│   │   ├── templates.ts       # Şablon yönetimi
│   │   ├── categories.ts      # Kategori işlemleri
│   │   ├── user.ts            # Kullanıcı profili
│   │   ├── feedback.ts        # Geri bildirim
│   │   └── notifications.ts   # Bildirimler
│   ├── supabase/              # Supabase clients
│   │   ├── server.ts          # Server-side client
│   │   ├── client.ts          # Client-side client
│   │   └── proxy.ts           # Session middleware
│   ├── storage/               # Storage abstraction
│   │   ├── types.ts           # StorageProvider interface
│   │   ├── cloudinary.ts      # Cloudinary implementation
│   │   ├── supabase.ts        # Supabase Storage
│   │   └── index.ts           # Factory
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-async-timeout.ts  # Zaman aşımı yönetimi
│   │   └── use-media-query.ts
│   ├── validations/           # Zod schemas
│   │   └── index.ts           # Tüm validation şemaları
│   ├── api.ts                 # apiFetch wrapper
│   ├── constants.ts           # Şablon sabitleri (deprecated)
│   ├── helpers.ts             # Utility fonksiyonlar
│   ├── translations.ts        # i18n çevirileri (~142KB!)
│   ├── seo.ts                 # SEO metadata helpers
│   └── rate-limit.ts          # Client-side rate limiting
│
├── supabase/                  # Database
│   └── migrations/            # SQL migration dosyaları (27 adet)
│
├── tests/                     # Test dosyaları
│   ├── components/            # Component tests
│   └── lib/                   # Utility tests
│
├── public/                    # Static assets
├── content/                   # MDX blog içerikleri
├── types/                     # Global TypeScript types
│
├── middleware.ts              # Next.js middleware (auth session)
├── next.config.mjs            # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
├── vitest.config.ts           # Test configuration
├── docker-compose.yml         # Docker setup
├── Dockerfile                 # Frontend container
└── package.json               # Dependencies
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
