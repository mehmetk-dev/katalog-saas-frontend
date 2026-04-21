-- Bulk update RPCs for products
-- Replaces N individual UPDATE calls with single-query bulk operations

-- Bulk price update: UPDATE products SET price = data.price WHERE id = data.id
CREATE OR REPLACE FUNCTION bulk_update_product_prices(
    p_user_id uuid,
    p_updates jsonb
)
RETURNS void AS $$
BEGIN
    UPDATE products p
    SET price = (u->>'price')::numeric,
        updated_at = CURRENT_TIMESTAMP
    FROM jsonb_array_elements(p_updates) AS u
    WHERE p.id = (u->>'id')::uuid
      AND p.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Bulk reorder: UPDATE products SET display_order = data.order WHERE id = data.id
CREATE OR REPLACE FUNCTION bulk_reorder_products(
    p_user_id uuid,
    p_updates jsonb
)
RETURNS void AS $$
BEGIN
    UPDATE products p
    SET display_order = (u->>'order')::int,
        updated_at = CURRENT_TIMESTAMP
    FROM jsonb_array_elements(p_updates) AS u
    WHERE p.id = (u->>'id')::uuid
      AND p.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
