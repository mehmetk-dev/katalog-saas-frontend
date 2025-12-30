-- =====================================================
-- KATALOG ÖZELLEŞTİRME ALANLARINI EKLE
-- Bu dosyayı Supabase SQL Editor'da çalıştırın
-- =====================================================

-- Catalogs tablosuna yeni kolonlar ekle
ALTER TABLE catalogs 
ADD COLUMN IF NOT EXISTS show_prices BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_descriptions BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_attributes BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS columns_per_row INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS background_image TEXT,
ADD COLUMN IF NOT EXISTS background_image_fit TEXT DEFAULT 'cover',
ADD COLUMN IF NOT EXISTS background_gradient TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_position TEXT DEFAULT 'header-left',
ADD COLUMN IF NOT EXISTS logo_size TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#7c3aed';

-- Not: is_published zaten var olduğu varsayılıyor (kontrollerde kullanılıyor)
-- Eğer yoksa şu komutu da çalıştırın:
-- ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
