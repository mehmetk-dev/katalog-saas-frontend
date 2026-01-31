-- Add cover_theme column to catalogs table
ALTER TABLE catalogs 
ADD COLUMN IF NOT EXISTS cover_theme TEXT DEFAULT 'modern';

-- Optional: Update existing records to have a default theme
UPDATE catalogs SET cover_theme = 'modern' WHERE cover_theme IS NULL;
