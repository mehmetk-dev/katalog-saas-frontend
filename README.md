# 🌫️ FogCatalog - Profesyonel Dijital Ürün Kataloğu Platformu

**FogCatalog**, işletmelerin ürünlerini en şık ve profesyonel şekilde sergilemesini sağlayan modern, hızlı ve ölçeklenebilir bir **SaaS (Software as a Service)** platformudur. Dakikalar içinde etkileyici kataloglar oluşturabilir, PDF olarak indirebilir veya dijital ortamda QR kod ile paylaşabilirsiniz.

---

## ✨ Temel Özellikler

- 🎨 **Gerçek Zamanlı Editör:** Renk, logo, sayfa yapısı ve ürün yerleşimini anlık olarak özelleştirin.
- 📐 **15+ Tasarım Şablonu:** "Bauhaus Vanguard", "Modern HUD", "Archive Editorial" gibi dünyaca ünlü tasarım akımlarından ilham alan profesyonel şablonlar.
- 📄 **Yüksek Kaliteli Export:** `html-to-image` ve `jsPDF` teknolojileriyle vektörel kalitede PDF çıktısı.
- 🔗 **Akıllı Paylaşım Sistemi:** Her katalog için özel `slug` bazlı URL'ler ve otomatik QR kod oluşturma.
- 📖 **Dijital Sayfa Çevirme:** `react-pageflip` ile gerçek bir katalog deneyimi sunan etkileşimli dijital görünümler.
- 📊 **Detaylı Analiz Paneli:** Katalog görüntülenmeleri, cihaz türleri ve performans metriklerini takip edin.
- 🌍 **Çoklu Dil Desteği:** i18next tabanlı yapı ile Türkçe ve İngilizce tam uyumluluk.
- 📱 **Responsive Tasarım:** Telefonda, tablette veya masaüstünde kusursuz görünüm.

---

## 🛠️ Teknoloji Yığını

FogCatalog, en güncel ve performanslı teknolojiler üzerine inşa edilmiştir.

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router Architecture)
- **Dil:** [TypeScript](https://www.typescriptlang.org/) (Strict Type Safety)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) & [Tailwind CSS Animate](https://github.com/jamiebuilds/tailwind-css-animate)
- **UI Bileşenleri:** [Radix UI](https://www.radix-ui.com/) (Accessible Primitives)
- **Grafikler:** [Recharts](https://recharts.org/) (Data Visualization)
- **Dosya Yönetimi:** Client-side PDF generation (`jsPDF`) & Image Processing

### Backend & Altyapı
- **Runtime:** [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Veritabanı:** [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/))
- **Oturum Yönetimi:** [Supabase Auth](https://supabase.com/auth) (JWT & RBAC)
- **Storage:** [Supabase Storage](https://supabase.com/storage) (Ürün ve Katalog görselleri)
- **Caching:** [Redis](https://redis.io/) (via [IORedis](https://github.com/luin/ioredis))
- **İzleme (Monitoring):** [Prometheus](https://prometheus.io/) & [Sentry](https://sentry.io/)

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- **Node.js:** v20.x veya üzeri
- **Paket Yöneticisi:** npm (veya pnpm/yarn)
- **Database:** Aktif bir Supabase projesi

### 1. Kurulum

```bash
# Projeyi klonlayın
git clone https://github.com/kullaniciadi/fogcatalog.git
cd fogcatalog

# Frontend bağımlılıklarını yükleyin
npm install

# Backend bağımlılıklarını yükleyin
cd backend
npm install
cd ..
```

### 2. Environment (Ortam) Değişkenleri

Uygulamanın tam fonksiyonel çalışması için çevresel değişkenlerin doğru set edilmesi kritik önem taşır. Hem kök dizindeki hem de backend dizindeki `.env.example` dosyalarını kopyalayıp güncelleyin:

**Frontend (Kök Dizin - `.env.local`):**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Uygulama URL'leri
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Cloudinary (Görsel Yükleme)
NEXT_PUBLIC_STORAGE_PROVIDER=cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset

# Email (Resend)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=your@email.com

# Monitoring (Sentry)
SENTRY_AUTH_TOKEN=your_sentry_token
```

**Backend (`/backend/.env`):**
```env
# Server
PORT=4000

# Supabase Admin
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Cloudinary Admin (Görsel Silme/Yönetim)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_DELETED_FOLDER=deletedproducts
```

### 3. Çalıştırma

```bash
# Frontend'i başlatın (Terminal 1)
npm run dev

# Backend'i başlatın (Terminal 2)
cd backend
npm run dev
```

---

## 📁 Proje Yapısı

```bash
fogcatalog/
├── app/                    # Next.js App Router (Sayfalar ve Layoutlar)
│   ├── (auth)/             # Giriş, Kayıt ve Şifre işlemleri
│   ├── dashboard/          # Kullanıcı Yönetim Paneli
│   └── catalog/            # Public paylaşılan katalog görünümleri
├── components/             # Reusable React Bileşenleri
│   ├── builder/            # Katalog editör bileşenleri
│   ├── catalogs/           # Şablon sistemi ve önizleme
│   └── ui/                 # Shadcn/ui tabanlı temel bileşenler
├── lib/                    # Core Logic
│   ├── actions/            # Server Actions (Veri mutasyonları)
│   ├── supabase/           # Veritabanı istemcileri
│   └── translations/       # Çoklu dil dosyaları
├── backend/                # Express.js API Katmanı
│   ├── src/controllers/    # İş mantığı (Business Logic)
│   ├── src/routes/         # API uç noktaları
│   └── src/middlewares/    # Güvenlik ve Doğrulama
└── supabase/               # SQL Migration dosyaları
```

---

## 🔒 Güvenlik Yaklaşımı

- **RLS (Row Level Security):** Supabase üzerinde her kullanıcının sadece kendi verisine erişebilmesi sağlanmıştır.
- **JWT Authentication:** Tüm API istekleri güvenli tokenlar ile doğrulanır.
- **Rate Limiting:** Backend tarafında ddos ve brute-force saldırılarına karşı önlem alınmıştır.
- **Input Validation:** Zod şemaları ile hem frontend hem backend tarafında veri doğrulaması yapılır.

---

## 🤝 Katkıda Bulunma

1. Projeyi fork'layın.
2. Yeni bir feature branch açın (`git checkout -b feature/harika-ozellik`).
3. Değişikliklerinizi commit'leyin (`git commit -m 'Yeni özellik eklendi'`).
4. Branch'inizi push'layın (`git push origin feature/harika-ozellik`).
5. Bir Pull Request açın.

---

## 📄 Lisans

Bu proje **MIT** lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakabilirsiniz.

---

**FogCatalog** - *Ürünlerinizi dünyayla profesyonelce paylaşın.*
[Web Sitemiz](https://fogcatalog.com) | [Destek](mailto:destek@fogcatalog.com)