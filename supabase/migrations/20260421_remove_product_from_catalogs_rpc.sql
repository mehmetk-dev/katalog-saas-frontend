-- Callable RPC version of remove_product_from_catalogs
-- The existing product_catalog_cleanup.sql defines a TRIGGER function (no params, RETURNS TRIGGER)
-- but backend code calls it as supabase.rpc('remove_product_from_catalogs', { p_product_id, p_user_id })
-- This migration adds the callable version alongside the trigger.

-- 1. Rename the trigger function to avoid name collision
CREATE OR REPLACE FUNCTION remove_product_from_catalogs_trigger()
RETURNS TRIGGER AS $$
BEGIN
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

-- 2. Recreate the trigger with renamed function
DROP TRIGGER IF EXISTS on_product_deleted ON products;
CREATE TRIGGER on_product_deleted
    BEFORE DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION remove_product_from_catalogs_trigger();

-- 3. Create the callable RPC version that backend expects (single product)
CREATE OR REPLACE FUNCTION remove_product_from_catalogs(
    p_product_id uuid,
    p_user_id uuid
)
RETURNS void AS $$
BEGIN
    UPDATE catalogs
    SET 
        product_ids = (
            SELECT COALESCE(
                array_agg(pid),
                '{}'::uuid[]
            )
            FROM unnest(product_ids) AS pid
            WHERE pid != p_product_id
        ),
        updated_at = NOW()
    WHERE p_product_id = ANY(product_ids)
      AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Batch version for bulk delete (accepts uuid array instead of single id)
CREATE OR REPLACE FUNCTION remove_products_from_catalogs(
    p_product_ids uuid[],
    p_user_id uuid
)
RETURNS void AS $$
BEGIN
    UPDATE catalogs
    SET 
        product_ids = (
            SELECT COALESCE(
                array_agg(pid),
                '{}'::uuid[]
            )
            FROM unnest(product_ids) AS pid
            WHERE NOT (pid = ANY(p_product_ids))
        ),
        updated_at = NOW()
    WHERE product_ids && p_product_ids
      AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
