-- Single-query product stats aggregate
-- Replaces N+1 batch fetching in getProductStats (backend/src/controllers/products/read.ts)

CREATE OR REPLACE FUNCTION get_product_stats(p_user_id uuid)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'inStock', COUNT(*) FILTER (WHERE stock >= 10),
        'lowStock', COUNT(*) FILTER (WHERE stock > 0 AND stock < 10),
        'outOfStock', COUNT(*) FILTER (WHERE stock = 0),
        'totalValue', COALESCE(SUM(stock * price), 0)
    ) INTO result
    FROM products
    WHERE user_id = p_user_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;
