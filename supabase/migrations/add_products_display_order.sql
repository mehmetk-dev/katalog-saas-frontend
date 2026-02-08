-- Ürün listesi sıralaması için display_order kolonu (reorder / sürükle-bırak için)
-- Bazı şemalarda "order" var, backend display_order kullanıyor; bu migration ikisini uyumlu hale getirir.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Eski "order" kolonundan değer varsa display_order'a kopyala (tek seferlik)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'order'
  ) THEN
    UPDATE public.products p
    SET display_order = COALESCE((p."order")::integer, 0)
    WHERE p.display_order IS NULL OR p.display_order = 0;
  END IF;
END $$;

COMMENT ON COLUMN public.products.display_order IS 'Manuel sıralama (sürükle-bırak). Küçük değer önce gelir.';
