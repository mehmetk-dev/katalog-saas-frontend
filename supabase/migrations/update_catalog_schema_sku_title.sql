-- =====================================================
-- EKSİK KOLONLARI EKLE (show_sku, title_position)
-- Bu dosyayı Supabase SQL Editor'da çalıştırın
-- =====================================================

ALTER TABLE catalogs 
ADD COLUMN IF NOT EXISTS show_sku BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS title_position TEXT DEFAULT 'left';

-- İhtimal dahilinde eksik olabilecek diğer alanları da kontrol edelim
ALTER TABLE catalogs 
ADD COLUMN IF NOT EXISTS background_image_fit TEXT DEFAULT 'cover',
ADD COLUMN IF NOT EXISTS logo_size TEXT DEFAULT 'medium';
