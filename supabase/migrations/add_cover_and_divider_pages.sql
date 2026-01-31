-- Migration: Add Cover Page and Category Divider Support
-- Description: Adds fields to catalogs table for storytelling catalog feature
-- Author: Antigravity (Database Architect)
-- Date: 2026-01-31

-- Add cover page configuration fields
ALTER TABLE catalogs 
ADD COLUMN IF NOT EXISTS enable_cover_page BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_description TEXT;

-- Add category divider configuration field
ALTER TABLE catalogs 
ADD COLUMN IF NOT EXISTS enable_category_dividers BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN catalogs.enable_cover_page IS 'Enable cover page for catalog (default: false)';
COMMENT ON COLUMN catalogs.cover_image_url IS 'Optional custom cover image URL uploaded by user';
COMMENT ON COLUMN catalogs.cover_description IS 'Optional description text displayed on cover page (max 500 chars)';
COMMENT ON COLUMN catalogs.enable_category_dividers IS 'Enable category transition pages between product groups (default: false)';

-- Add constraints
ALTER TABLE catalogs 
ADD CONSTRAINT cover_description_length_check 
CHECK (char_length(cover_description) <= 500);

-- Create index for performance (catalogs with cover pages enabled)
CREATE INDEX IF NOT EXISTS idx_catalogs_cover_enabled 
ON catalogs(enable_cover_page) 
WHERE enable_cover_page = true;

-- Update existing catalogs to have the new fields (backward compatibility)
-- All existing catalogs will have cover and divider pages disabled by default
UPDATE catalogs 
SET 
    enable_cover_page = COALESCE(enable_cover_page, false),
    enable_category_dividers = COALESCE(enable_category_dividers, false)
WHERE enable_cover_page IS NULL OR enable_category_dividers IS NULL;
