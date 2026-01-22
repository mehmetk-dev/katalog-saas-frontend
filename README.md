# Katalog SaaS - Ürün Kataloğu Oluşturucu

Modern, hızlı ve kullanıcı dostu ürün kataloğu oluşturma platformu.

## 🚀 Özellikler

- ✅ **Kolay Katalog Oluşturma** - Drag & drop ile ürün ekleme
- ✅ **15+ Profesyonel Şablon** - Farklı sektörler için hazır tasarımlar
- ✅ **PDF Export** - Yüksek kaliteli PDF çıktısı
- ✅ **Paylaşılabilir Linkler** - Katalogları online paylaşma
- ✅ **Responsive Tasarım** - Mobil ve masaüstü uyumlu
- ✅ **Çoklu Dil Desteği** - Türkçe ve İngilizce

## 🛠️ Teknolojiler

### Frontend
- **Next.js 16** - React Framework
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Styling
- **Radix UI** - Accessible components
- **Supabase** - Authentication & Database

### Backend
- **Express.js** - REST API
- **Redis** - Caching (opsiyonel)
- **Supabase** - Database & Auth

## 📦 Kurulum

### Gereksinimler
- Node.js 20+
- npm veya pnpm
- Supabase hesabı

### 1. Repository'yi klonlayın
```bash
git clone https://github.com/your-username/katalog-app.git
cd katalog-app
```

### 2. Bağımlılıkları yükleyin
```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 3. Environment değişkenlerini ayarlayın
```bash
# .env.example dosyasını kopyalayın
cp .env.example .env.local

# Backend için
cp backend/.env.example backend/.env
```

`.env.local` dosyasını düzenleyin:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAIL=admin@example.com
```

### 4. Supabase Migration'ları çalıştırın
Supabase Dashboard > SQL Editor'da şu dosyaları çalıştırın:
- `supabase/migrations/create_templates_table.sql`
- `supabase/migrations/add_catalog_customization.sql`
- `supabase/migrations/fix_templates_rls_policy.sql`

### 5. Uygulamayı başlatın
```bash
# Frontend (Terminal 1)
npm run dev

# Backend (Terminal 2)
cd backend
npm run dev
```

Uygulama şu adreslerde çalışacak:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## 🐳 Docker ile Çalıştırma

```bash
# Tüm servisleri başlat
docker-compose up -d

# Logları görüntüle
docker-compose logs -f

# Servisleri durdur
docker-compose down
```

## 📁 Proje Yapısı

```
katalog-app/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication sayfaları
│   ├── dashboard/         # Kullanıcı paneli
│   ├── catalog/           # Public katalog görüntüleme
│   └── ...
├── components/            # React componentleri
│   ├── ui/               # Temel UI componentleri
│   ├── catalogs/         # Katalog componentleri
│   ├── products/         # Ürün componentleri
│   └── ...
├── lib/                   # Utility fonksiyonlar
│   ├── actions/          # Server actions
│   ├── supabase/         # Supabase client
│   └── ...
├── backend/              # Express.js API
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── middlewares/  # Express middlewares
│   │   ├── routes/       # API routes
│   │   └── services/     # Business logic
│   └── ...
├── public/               # Statik dosyalar
└── supabase/            # Database migrations
```

## 🔒 Güvenlik

- ✅ Row Level Security (RLS) ile veritabanı koruması
- ✅ JWT token doğrulaması
- ✅ Rate limiting
- ✅ CORS konfigürasyonu
- ✅ Helmet.js güvenlik headers
- ✅ Input validation

## 📊 API Endpoints

### Public
- `GET /health` - Health check
- `GET /api/v1/catalogs/public/:slug` - Public katalog

### Protected (Auth gerekli)
- `GET /api/v1/products` - Ürünleri listele
- `POST /api/v1/products` - Ürün ekle
- `GET /api/v1/catalogs` - Katalogları listele
- `POST /api/v1/catalogs` - Katalog oluştur

### Admin (Admin yetkisi gerekli)
- `GET /api/v1/admin/users` - Tüm kullanıcılar
- `GET /api/v1/admin/stats` - İstatistikler

## 🧪 Testing

```bash
# Lint kontrolü
npm run lint

# Type kontrolü
npx tsc --noEmit
```

## 📝 Lisans

MIT License - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📧 İletişim

Sorularınız için: [destek@fogcatalog.app](mailto:destek@fogcatalog.app)