-- Catalog Views Tracking Table
-- Bu tablo benzersiz görüntülenmeleri takip eder

-- 1. Catalog views tablosu oluştur
CREATE TABLE IF NOT EXISTS catalog_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    catalog_id UUID NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
    visitor_hash TEXT NOT NULL,
    view_date DATE DEFAULT CURRENT_DATE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    country TEXT,
    city TEXT,
    device_type TEXT,
    is_owner BOOLEAN DEFAULT FALSE
);

-- 2. Benzersiz görüntülenme için unique index (günlük)
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_views_unique_daily 
ON catalog_views(catalog_id, visitor_hash, view_date);

-- 3. Diğer index'ler
CREATE INDEX IF NOT EXISTS idx_catalog_views_catalog_id ON catalog_views(catalog_id);
CREATE INDEX IF NOT EXISTS idx_catalog_views_viewed_at ON catalog_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_catalog_views_visitor ON catalog_views(visitor_hash);
CREATE INDEX IF NOT EXISTS idx_catalog_views_device ON catalog_views(device_type);

-- 4. RLS Politikaları
ALTER TABLE catalog_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert views" ON catalog_views;
CREATE POLICY "Anyone can insert views" ON catalog_views
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can view their catalog views" ON catalog_views;
CREATE POLICY "Owners can view their catalog views" ON catalog_views
    FOR SELECT USING (
        catalog_id IN (
            SELECT id FROM catalogs WHERE user_id = auth.uid()
        )
    );

-- 5. Akıllı view count fonksiyonu
CREATE OR REPLACE FUNCTION smart_increment_view_count(
    p_catalog_id UUID,
    p_visitor_hash TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_device_type TEXT DEFAULT NULL,
    p_is_owner BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_inserted BOOLEAN := FALSE;
BEGIN
    -- Sahip görüntülemesi ise sayma
    IF p_is_owner THEN
        RETURN FALSE;
    END IF;
    
    -- Yeni görüntülenme kaydet (conflict olursa atla)
    INSERT INTO catalog_views (
        catalog_id, 
        visitor_hash,
        view_date,
        ip_address, 
        user_agent, 
        device_type,
        is_owner
    ) VALUES (
        p_catalog_id, 
        p_visitor_hash,
        CURRENT_DATE,
        p_ip_address, 
        p_user_agent, 
        p_device_type,
        p_is_owner
    ) 
    ON CONFLICT (catalog_id, visitor_hash, view_date) DO NOTHING
    RETURNING TRUE INTO v_inserted;
    
    -- Eğer yeni kayıt eklendiyse view_count artır
    IF v_inserted THEN
        UPDATE catalogs 
        SET view_count = COALESCE(view_count, 0) + 1 
        WHERE id = p_catalog_id;
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- 6. Günlük görüntülenme sayısı fonksiyonu
CREATE OR REPLACE FUNCTION get_catalog_daily_views(p_catalog_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE(view_date DATE, view_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cv.view_date,
        COUNT(*) as view_count
    FROM catalog_views cv
    WHERE cv.catalog_id = p_catalog_id
    AND cv.view_date >= CURRENT_DATE - p_days
    AND cv.is_owner = FALSE
    GROUP BY cv.view_date
    ORDER BY cv.view_date;
END;
$$;

-- 7. Cihaz dağılımı fonksiyonu
CREATE OR REPLACE FUNCTION get_catalog_device_stats(p_catalog_id UUID)
RETURNS TABLE(device_type TEXT, view_count BIGINT, percentage NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_total 
    FROM catalog_views 
    WHERE catalog_id = p_catalog_id AND is_owner = FALSE;
    
    RETURN QUERY
    SELECT 
        COALESCE(cv.device_type, 'unknown') as device_type,
        COUNT(*) as view_count,
        CASE WHEN v_total > 0 THEN ROUND((COUNT(*)::numeric / v_total) * 100, 1) ELSE 0 END as percentage
    FROM catalog_views cv
    WHERE cv.catalog_id = p_catalog_id AND cv.is_owner = FALSE
    GROUP BY cv.device_type
    ORDER BY view_count DESC;
END;
$$;

-- 8. Benzersiz ziyaretçi sayısı fonksiyonu
CREATE OR REPLACE FUNCTION get_unique_visitors(p_catalog_id UUID, p_days INTEGER DEFAULT 30)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(DISTINCT visitor_hash) INTO v_count
    FROM catalog_views
    WHERE catalog_id = p_catalog_id
    AND view_date >= CURRENT_DATE - p_days
    AND is_owner = FALSE;
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- 9. Eski increment_view_count fonksiyonu (geriye uyumluluk)
CREATE OR REPLACE FUNCTION increment_view_count(catalog_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE catalogs 
    SET view_count = COALESCE(view_count, 0) + 1 
    WHERE id = catalog_id;
END;
$$;
