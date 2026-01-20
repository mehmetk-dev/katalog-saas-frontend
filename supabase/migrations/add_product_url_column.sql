-- Add product_url column to products table if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_url TEXT;
