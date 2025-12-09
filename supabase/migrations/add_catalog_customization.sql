-- KATALOG KİŞİSELLEŞTİRME ALANLARI
-- Mevcut catalogs tablosuna yeni alanlar ekle
-- Supabase Dashboard > SQL Editor'da bu sorguyu çalıştırın

-- Yeni sütunlar ekle
ALTER TABLE catalogs
ADD COLUMN IF NOT EXISTS columns_per_row INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS background_image TEXT,
ADD COLUMN IF NOT EXISTS background_gradient TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_position TEXT DEFAULT 'top-left',
ADD COLUMN IF NOT EXISTS logo_size TEXT DEFAULT 'medium';

-- Mevcut kataloglar için varsayılan değerler
UPDATE catalogs 
SET 
  columns_per_row = COALESCE(columns_per_row, 3),
  background_color = COALESCE(background_color, '#ffffff'),
  logo_position = COALESCE(logo_position, 'top-left'),
  logo_size = COALESCE(logo_size, 'medium')
WHERE columns_per_row IS NULL OR background_color IS NULL;

-- Açıklama:
-- columns_per_row: Satır başına ürün sayısı (2, 3, 4)
-- background_color: Arka plan rengi (hex)
-- background_image: Arka plan resmi URL
-- background_gradient: CSS gradient (örn: "linear-gradient(to bottom, #000, #333)")
-- logo_url: Logo resmi URL
-- logo_position: Logo pozisyonu (top-left, top-center, top-right, bottom-left, bottom-center, bottom-right)
-- logo_size: Logo boyutu (small, medium, large)
