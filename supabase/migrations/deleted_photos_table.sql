-- =====================================================
-- DELETED PHOTOS TABLE
-- Silinen ürün fotoğraflarını takip etmek için
-- =====================================================

-- 1. deleted_photos tablosunu oluştur
CREATE TABLE IF NOT EXISTS deleted_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_path TEXT, -- Cloudinary public_id veya Supabase path
    product_id UUID, -- Silinen ürünün ID'si (opsiyonel, referans için)
    product_name TEXT, -- Silinen ürünün adı (opsiyonel, referans için)
    storage_provider TEXT DEFAULT 'cloudinary', -- 'cloudinary' veya 'supabase'
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_by UUID REFERENCES auth.users(id),
    is_processed BOOLEAN DEFAULT FALSE, -- Kullanıcı tarafından işlendi mi?
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT -- Kullanıcı notları
);

-- 2. Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_deleted_photos_user_id ON deleted_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_photos_deleted_at ON deleted_photos(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deleted_photos_is_processed ON deleted_photos(is_processed);
CREATE INDEX IF NOT EXISTS idx_deleted_photos_storage_provider ON deleted_photos(storage_provider);

-- 3. RLS (Row Level Security) politikaları
ALTER TABLE deleted_photos ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi silinen fotoğraflarını görebilir
DROP POLICY IF EXISTS "Users can view their own deleted photos" ON deleted_photos;
CREATE POLICY "Users can view their own deleted photos"
ON deleted_photos FOR SELECT
USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi silinen fotoğraflarını güncelleyebilir
DROP POLICY IF EXISTS "Users can update their own deleted photos" ON deleted_photos;
CREATE POLICY "Users can update their own deleted photos"
ON deleted_photos FOR UPDATE
USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi silinen fotoğraflarını silebilir
DROP POLICY IF EXISTS "Users can delete their own deleted photos" ON deleted_photos;
CREATE POLICY "Users can delete their own deleted photos"
ON deleted_photos FOR DELETE
USING (auth.uid() = user_id);

-- 4. Yorumlar
COMMENT ON TABLE deleted_photos IS 'Silinen ürün fotoğraflarını takip eder. Kullanıcı manuel olarak kontrol edip silebilir.';
COMMENT ON COLUMN deleted_photos.photo_url IS 'Fotoğrafın tam URL''i (Cloudinary veya Supabase)';
COMMENT ON COLUMN deleted_photos.photo_path IS 'Fotoğrafın path''i (Cloudinary public_id veya Supabase storage path)';
COMMENT ON COLUMN deleted_photos.storage_provider IS 'Hangi storage provider kullanıldı: cloudinary veya supabase';
COMMENT ON COLUMN deleted_photos.is_processed IS 'Kullanıcı bu fotoğrafı kontrol edip işledi mi?';
