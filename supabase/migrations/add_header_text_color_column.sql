-- Add header_text_color column to catalogs table
ALTER TABLE catalogs
ADD COLUMN IF NOT EXISTS header_text_color TEXT DEFAULT '#ffffff';

-- Add comment
COMMENT ON COLUMN catalogs.header_text_color IS 'Header text color for catalog templates (hex color code)';
