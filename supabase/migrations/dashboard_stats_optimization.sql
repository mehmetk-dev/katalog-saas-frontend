-- Dashboard Stats Optimization (v2 - catalog_views tablosunu kullanır)
-- Bu view, dashboard istatistiklerini tek sorguda döndürür
-- Backend'de 5+ ayrı query yerine tek view çağrısı yapılabilir

-- Not: Bu migration smart_view_tracking.sql'den SONRA çalıştırılmalıdır!
-- Eğer view_count sütunu yoksa, catalog_views tablosundan sayar

-- User Dashboard Stats View
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    u.id as user_id,
    u.plan,
    u.full_name,
    u.company,
    -- Katalog istatistikleri
    COALESCE(catalog_stats.total_catalogs, 0) as total_catalogs,
    COALESCE(catalog_stats.published_catalogs, 0) as published_catalogs,
    COALESCE(view_stats.total_views, 0) as total_views,
    -- Ürün sayısı
    COALESCE(product_stats.total_products, 0) as total_products,
    -- En çok görüntülenen kataloglar (JSON array)
    COALESCE(
        (
            SELECT json_agg(row_to_json(top_cat))
            FROM (
                SELECT 
                    c.id, 
                    c.name, 
                    COALESCE((SELECT COUNT(*) FROM catalog_views cv WHERE cv.catalog_id = c.id AND cv.is_owner = false), 0)::integer as views
                FROM catalogs c
                WHERE c.user_id = u.id
                ORDER BY views DESC
                LIMIT 5
            ) top_cat
        ),
        '[]'::json
    ) as top_catalogs
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_catalogs,
        COUNT(*) FILTER (WHERE is_published = true) as published_catalogs
    FROM catalogs
    GROUP BY user_id
) catalog_stats ON catalog_stats.user_id = u.id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_products
    FROM products
    GROUP BY user_id
) product_stats ON product_stats.user_id = u.id
LEFT JOIN (
    SELECT 
        c.user_id,
        COUNT(cv.id) as total_views
    FROM catalogs c
    LEFT JOIN catalog_views cv ON cv.catalog_id = c.id AND cv.is_owner = false
    GROUP BY c.user_id
) view_stats ON view_stats.user_id = u.id;

-- Grant permissions
GRANT SELECT ON user_dashboard_stats TO authenticated;
GRANT SELECT ON user_dashboard_stats TO service_role;

-- RPC function for dashboard stats (alternative to view)
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id uuid)
RETURNS TABLE (
    total_catalogs bigint,
    published_catalogs bigint,
    total_views bigint,
    total_products bigint,
    top_catalogs json
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ds.total_catalogs,
        ds.published_catalogs,
        ds.total_views,
        ds.total_products,
        ds.top_catalogs
    FROM user_dashboard_stats ds
    WHERE ds.user_id = p_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_dashboard_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dashboard_stats(uuid) TO service_role;

-- Comment for documentation
COMMENT ON VIEW user_dashboard_stats IS 'Aggregated dashboard statistics per user. Uses catalog_views table for accurate counts.';
COMMENT ON FUNCTION get_user_dashboard_stats IS 'Returns dashboard stats for a specific user. More performant than multiple queries.';
