-- Function to get unique visitors for multiple catalogs
CREATE OR REPLACE FUNCTION get_unique_visitors_multi(p_catalog_ids UUID[], p_days INTEGER DEFAULT 30)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(DISTINCT visitor_hash) INTO v_count
    FROM catalog_views
    WHERE catalog_id = ANY(p_catalog_ids)
    AND view_date >= CURRENT_DATE - p_days
    AND is_owner = FALSE;
    
    RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_unique_visitors_multi(UUID[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unique_visitors_multi(UUID[], INTEGER) TO service_role;
