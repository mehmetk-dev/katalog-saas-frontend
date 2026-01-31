-- =============================================
-- ADD STORYTELLING CATALOG COLUMNS ONLY
-- =============================================
-- Bu script SADECE eksik kolonları ekler
-- Policy, tablo vb. oluşturmaz
-- =============================================

-- Kataloglar tablosuna storytelling kolonlarını ekle
DO $$
BEGIN
  -- enable_cover_page
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'catalogs' AND column_name = 'enable_cover_page'
  ) THEN
    ALTER TABLE public.catalogs 
    ADD COLUMN enable_cover_page boolean DEFAULT false;
    RAISE NOTICE '✅ enable_cover_page kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️  enable_cover_page zaten var';
  END IF;

  -- cover_image_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'catalogs' AND column_name = 'cover_image_url'
  ) THEN
    ALTER TABLE public.catalogs 
    ADD COLUMN cover_image_url text;
    RAISE NOTICE '✅ cover_image_url kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️  cover_image_url zaten var';
  END IF;

  -- cover_description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'catalogs' AND column_name = 'cover_description'
  ) THEN
    ALTER TABLE public.catalogs 
    ADD COLUMN cover_description text CHECK (char_length(cover_description) <= 500);
    RAISE NOTICE '✅ cover_description kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️  cover_description zaten var';
  END IF;

  -- enable_category_dividers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'catalogs' AND column_name = 'enable_category_dividers'
  ) THEN
    ALTER TABLE public.catalogs 
    ADD COLUMN enable_category_dividers boolean DEFAULT false;
    RAISE NOTICE '✅ enable_category_dividers kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️  enable_category_dividers zaten var';
  END IF;
END $$;

-- Index ekle (performance için)
CREATE INDEX IF NOT EXISTS idx_catalogs_cover_enabled 
ON public.catalogs(enable_cover_page) 
WHERE enable_cover_page = true;

-- Başarı mesajı
DO $$
BEGIN
  RAISE NOTICE '🎉 Storytelling Catalog kurulumu tamamlandı!';
  RAISE NOTICE '✨ enable_cover_page, cover_image_url, cover_description, enable_category_dividers hazır';
END $$;
