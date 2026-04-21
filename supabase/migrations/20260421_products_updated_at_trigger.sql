-- Auto-update updated_at on products row change
-- Replaces JS-side `updated_at: new Date().toISOString()` to avoid timezone/sync issues

CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_product_update ON products;

CREATE TRIGGER on_product_update
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_products_updated_at();
