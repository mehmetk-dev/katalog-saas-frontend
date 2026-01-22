-- Add show_urls column to catalogs table
ALTER TABLE catalogs
ADD COLUMN IF NOT EXISTS show_urls BOOLEAN DEFAULT FALSE;
