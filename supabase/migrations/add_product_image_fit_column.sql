-- Add product_image_fit column to catalogs table
ALTER TABLE catalogs
ADD COLUMN IF NOT EXISTS product_image_fit TEXT DEFAULT 'cover' CHECK (product_image_fit IN ('cover', 'contain', 'fill'));
