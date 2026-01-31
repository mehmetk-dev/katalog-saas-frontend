# 🔐 ENVIRONMENT SETUP GUİDE

## ⚠️ KRİTİK UYARI

**ASL LOCAL VE PRODUCTION AYNI VERİTABANINI KULLANMAYIN!**

Local geliştirme için ayrı bir Supabase project oluşturmalısınız.

---

## 📁 Environment Dosyaları

```bash
.env.local       # Local development (GİT'E EKLİ, kullan)
.env.production  # Production (GİT'E EKLİ DEĞİL, deploy platformunda set et)
.env.example     # Template (tüm possible değerler)
```

---

## 🚀 Local Development Setup

### 1️⃣ Yeni Supabase Project Oluştur

```bash
1. https://app.supabase.com adresine git
2. "New Project" tıkla
3. Ayarlar:
   - Name: katalog-app-local (veya katalog-dev)
   - Region: Europe West (Frankfurt) 
   - Database Password: [güçlü şifre - kaydet!]
   - Plan: Free

4. Project oluşana kadar bekle (~2 dakika)
```

### 2️⃣ API Credentials Al

```bash
1. Sol menüden "Settings" → "API"
2. Kopyala:
   ✅ Project URL
   ✅ anon public (API key)
   ✅ service_role (secret key)
```

### 3️⃣ .env.local Dosyasını Güncelle

```bash
# Şu satırları değiştir:
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_LOCAL_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_LOCAL_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_LOCAL_SERVICE_ROLE_KEY_HERE

# Yeni project'ten aldığın değerlerle değiştir
```

### 4️⃣ Migration'ları Çalıştır

```bash
# Local database'e migration'ları uygula
# Supabase Dashboard → SQL Editor

# Dosyaları sırayla çalıştır:
1. supabase/migrations/*.sql (tüm dosyalar sırasıyla)
```

### 5️⃣ Sunucuları Başlat

```bash
# Backend
npm run dev --prefix backend

# Frontend (yeni terminal)
npm run dev
```

---

## 🌍 Production Deployment

### Vercel/Netlify Deployment

```bash
# Environment variables'ları UI'dan ekle:
# .env.production dosyasındaki TÜM değerleri kopyala yapıştır

# ÖNEMLİ: Platform'da şunları set et:
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=<production-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
```

---

## ✅ Doğrulama Checklist

### Local Development Başlamadan Önce:

- [ ] Yeni LOCAL Supabase project oluşturdun mu?
- [ ] `.env.local` dosyasını LOCAL credentials ile güncelledin mi?
- [ ] LOCAL database'e migration'ları uyguladın mı?
- [ ] `npm run dev` çalıştırdığında PRODUCTION verileri görmüyor musun?

### Production Deploy Etmeden Önce:

- [ ] `.env.production` dosyası PRODUCTION credentials içeriyor mu?
- [ ] Deploy platform'unda environment variables set edildi mi?
- [ ] PRODUCTION database'de migration'lar uygulanmış mı?
- [ ] Test kullanıcısı ile production'da test yaptın mı?

---

## 🆘 Sorun Yaşarsan

### "Bağlantı hatası" / "Unauthorized"

```bash
# .env.local dosyasını kontrol et
# Credentials doğru mu?
# Project ID'ler eşleşiyor mu?
```

### "Production verilerimi gördüm local'de!"

```bash
# HEMEN DURDUR!
# .env.local'i kontrol et
# LOCAL project ID kullanıyor musun?
```

### "Migration çalışmıyor"

```bash
# Supabase Dashboard → SQL Editor
# Migration dosyalarını manuel çalıştır
# Hata mesajlarını oku
```

---

## 📊 Environment Priority

```bash
Next.js environment dosya önceliği:
1. .env.local (en yüksek - local development)
2. .env.development (development mode)
3. .env.production (production mode)  
4. .env (en düşük - fallback)
```

---

## 🔒 Güvenlik Notları

- ❌ `.env.local` dosyasını GİT'E PUSH ETME
- ❌ Production credentials'ları local'de KULLANMA
- ❌ API keys'leri frontend kodunda HARD-CODE ETME
- ✅ `NEXT_PUBLIC_` prefix'i sadece public bilgiler için
- ✅ `service_role` key'i SADECE backend'de kullan
- ✅ Production secrets'ları deploy platform'unda tut

---

## 📞 Yardım

Sorun yaşıyorsan:
1. Bu README'yi tekrar oku
2. `.env.example` dosyasını kontrol et
3. Supabase Dashboard logs'unu kontrol et
