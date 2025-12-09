# Katalog Pro - Dijital Ürün Kataloğu Oluşturucu 🚀

Katalog Pro, işletmelerin ürünlerini kolayca yönetebileceği, profesyonel PDF ve Dijital Kataloglar oluşturabileceği modern bir SaaS platformudur.

![Dashboard Preview](https://via.placeholder.com/800x400?text=Katalog+Pro+Dashboard)

## ✨ Özellikler

- **Ürün Yönetimi**: Sınırsız ürün ekleme, görsel yükleme ve stok takibi.
- **Katalog Oluşturucu (Builder)**: 
  - Drag & Drop (Sürükle Bırak) ile ürün sıralama.
  - Farklı şablon seçenekleri (Minimal, Modern, Liste vb.).
  - A4 boyutunda PDF çıktı veya Dijital Link paylaşımı.
- **Akıllı Araçlar**:
  - **QR Kod**: Her katalog için otomatik QR kod oluşturma.
  - **AI Magic Writer**: Yapay zeka destekli ürün açıklaması oluşturucu.
- **Plan Yönetimi**: Free, Plus ve Pro paketleri ile özellik kısıtlamaları (Katalog limiti vb.).
- **Kategori Sistemi**: Ürünleri kategorilere ayırma ve filtreleme.
- **PWA Desteği**: Mobil cihazlara uygulama gibi kurulabilir.
- **Dark Mode**: Göz yormayan karanlık mod desteği.

## 🛠 Kullanılan Teknolojiler

- **Frontend**: Next.js 14 (App Directory), React, Tailwind CSS
- **UI Kütüphanesi**: Shadcn UI, Lucide Icons
- **Backend & Database**: Supabase (PostgreSQL, Auth, Storage)
- **Performans**: Redis Caching, Next.js Image Optimization
- **Testing**: Playwright (E2E)

## 🚀 Kurulum

Projeyi yerel ortamınızda çalıştırmak için adımları izleyin:

1. **Repoyu klonlayın:**
   ```bash
   git clone https://github.com/username/katalog-app.git
   cd katalog-app
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   # veya
   pnpm install
   ```

3. **Çevre değişkenlerini ayarlayın:**
   `.env.example` dosyasının adını `.env.local` olarak değiştirin ve Supabase bilgilerinizi girin.
   ```bash
   cp .env.example .env.local
   ```

4. **Projeyi başlatın:**
   ```bash
   npm run dev
   ```
   Tarayıcınızda `http://localhost:3000` adresine gidin.

## 📦 Deployment (Canlıya Alma)

Bu proje Vercel üzerine deploy edilmek için optimize edilmiştir.

1. GitHub reponuzu Vercel'e bağlayın.
2. Environment Variables kısmına `.env.local` içeriğinizi ekleyin.
3. Deploy butonuna basın!

## 🧪 Testler

Uygulama testlerini çalıştırmak için:

```bash
# E2E testleri (Playwright)
npx playwright test
```

## 📄 Lisans

MIT License.