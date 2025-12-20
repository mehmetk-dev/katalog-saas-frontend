-- =====================================================
-- ÜRÜN SİLİNDİĞİNDE KATALOGLARDAN KALDIR
-- Bu dosyayı Supabase SQL Editor'da çalıştırın
-- =====================================================

-- 1. Ürün silindiğinde tüm kataloglardan o ürünü kaldıran trigger fonksiyonu
CREATE OR REPLACE FUNCTION remove_product_from_catalogs()
RETURNS TRIGGER AS $$
BEGIN
    -- Silinen ürün ID'sini tüm katalogların product_ids array'lerinden kaldır
    UPDATE catalogs
    SET 
        product_ids = (
            SELECT COALESCE(
                array_agg(pid),
                '{}'::uuid[]
            )
            FROM unnest(product_ids) AS pid
            WHERE pid != OLD.id
        ),
        updated_at = NOW()
    WHERE OLD.id = ANY(product_ids);
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger'ı oluştur
DROP TRIGGER IF EXISTS on_product_deleted ON products;
CREATE TRIGGER on_product_deleted
    BEFORE DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION remove_product_from_catalogs();

-- 3. Toplu silmede de çalışır - her satır için tetiklenir

-- =====================================================
-- MEVCUT KATALOGLARI TEMİZLE (Hayalet ürün referansları)
-- =====================================================

-- 4. Var olmayan ürün ID'lerini kataloglardan kaldır
UPDATE catalogs c
SET 
    product_ids = (
        SELECT COALESCE(
            array_agg(pid),
            '{}'::uuid[]
        )
        FROM unnest(c.product_ids) AS pid
        WHERE EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = pid AND p.user_id = c.user_id
        )
    ),
    updated_at = NOW()
WHERE array_length(product_ids, 1) > 0;

-- 5. Sonucu kontrol et
SELECT 
    id,
    name,
    array_length(product_ids, 1) as product_count
FROM catalogs
ORDER BY updated_at DESC
LIMIT 10;
