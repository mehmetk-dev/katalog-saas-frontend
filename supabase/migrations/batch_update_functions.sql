-- Batch update functions for products to fix N+1 query problems

-- 1. Batch update product display orders
CREATE OR REPLACE FUNCTION batch_update_product_orders(
  p_user_id UUID,
  p_orders JSONB
)
RETURNS TABLE(id UUID, display_order INTEGER) AS $$
BEGIN
  RETURN QUERY
  UPDATE products p
  SET display_order = (elem->>'order')::INTEGER,
      updated_at = NOW()
  FROM jsonb_array_elements(p_orders) AS elem
  WHERE p.id = (elem->>'id')::UUID
    AND p.user_id = p_user_id
  RETURNING p.id, p.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Batch update product prices
CREATE OR REPLACE FUNCTION batch_update_product_prices(
  p_user_id UUID,
  p_updates JSONB
)
RETURNS TABLE(id UUID, price NUMERIC) AS $$
BEGIN
  RETURN QUERY
  UPDATE products p
  SET price = (elem->>'price')::NUMERIC,
      updated_at = NOW()
  FROM jsonb_array_elements(p_updates) AS elem
  WHERE p.id = (elem->>'id')::UUID
    AND p.user_id = p_user_id
  RETURNING p.id, p.price;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Batch rename category in products
CREATE OR REPLACE FUNCTION batch_rename_category(
  p_user_id UUID,
  p_old_name TEXT,
  p_new_name TEXT
)
RETURNS TABLE(id UUID, category TEXT) AS $$
BEGIN
  RETURN QUERY
  UPDATE products
  SET category = (
      SELECT string_agg(
        CASE 
          WHEN TRIM(cat) = p_old_name THEN p_new_name
          ELSE TRIM(cat)
        END,
        ', '
      )
      FROM unnest(string_to_array(category, ',')) AS cat
    ),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND category ILIKE '%' || p_old_name || '%'
  RETURNING id, category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION batch_update_product_orders(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION batch_update_product_prices(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION batch_rename_category(UUID, TEXT, TEXT) TO authenticated;
