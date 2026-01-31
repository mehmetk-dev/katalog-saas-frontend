# 🚀 LOCAL DATABASE QUICK START

## ÇOK HIZLI BAŞLATMA (5 Dakika)

### 1. Yeni LOCAL Supabase Project Oluştur

```bash
https://app.supabase.com → New Project

Name: katalog-app-local
Region: Europe West
Password: [güçlü şifre]
```

### 2. Credentials'ları .env.local'e Ekle

```bash
Settings → API

.env.local dosyasına yapıştır:
- Project URL
- anon public key
- service_role key
```

### 3. Migration'ları Çalıştır

```bash
LOCAL Supabase Dashboard → SQL Editor

ÖNEMLİ: Sırayla çalıştır!

1. 00_initial_schema.sql           ← ÖNCE BU (tables oluşturur)
2. Diğer tüm migration dosyaları    ← SONRA BUNLAR
```

### 4. Doğrula

```bash
Table Editor'ı kontrol et:

✅ users table var mı?
✅ products table var mı?
✅ catalogs table var mı?
✅ catalogs tablosunda "enable_cover_page" column var mı?
```

### 5. Sunucuları Yeniden Başlat

```bash
# Backend ve frontend'i kapat (Ctrl+C)
# Yeniden başlat

npm run dev --prefix backend
npm run dev
```

---

## ⚡ SÜPER HIZLI: Sadece Temel Şema

Eğer acele ediyorsan:

```bash
1. LOCAL Supabase SQL Editor aç
2. 00_initial_schema.sql dosyasını aç
3. Tamamını kopyala → SQL Editor'a yapıştır
4. "Run" tıkla
5. Bitti! ✅
```

Bu şunları oluşturur:
- ✅ users, products, catalogs tables
- ✅ Storytelling fields (enable_cover_page, cover_image_url, etc)
- ✅ RLS policies (security)
- ✅ Indexes (performance)

---

## 📊 Hangi Migration'ları Çalıştırmalısın?

### ZORUNLU (Sırayla):
```bash
01. 00_initial_schema.sql                    ← TABLES
02. add_cover_and_divider_pages.sql          ← STORYTELLING ✨
03. add_catalog_customization_fields.sql
04. add_product_image_fit_column.sql
05. add_header_text_color_column.sql
```

### OPSIYONEL (İstersen):
```bash
- storage_buckets_setup.sql                  (dosya upload)
- catalog_analytics.sql                      (analytics)
- activity_logs.sql                          (user tracking)
- notifications_and_logs.sql                 (bildirimler)
```

---

## ❓ Sorun mu Yaşıyorsun?

### "Table already exists" hatası:
```sql
# Normal! Migration zaten uygulanmış
# Atla, sonrakine geç
```

### "Column already exists":
```sql
# Normal! O feature zaten eklenmiş
# Atla, sonrakine geç
```

### "Foreign key violation":
```sql
# Sırayı yanlış yaptın!
# 00_initial_schema.sql önce çalışmalı
# DROP TABLE users CASCADE;
# Tekrar baştan başla
```

---

## ✅ Başarı Kriterleri

Local development hazır mı?

- [ ] LOCAL Supabase projesi oluşturuldu
- [ ] .env.local güncellendi
- [ ] 00_initial_schema.sql çalıştırıldı
- [ ] catalogs tablosunda "enable_cover_page" var
- [ ] npm run dev çalışıyor
- [ ] http://localhost:3000 açılıyor
- [ ] Login olabiliyorum
- [ ] Yeni katalog oluşturabiliyorum
- [ ] Storytelling toggle'ları görüyorum

HEPSI ✅ ISE HAZIRSIN! 🎉
