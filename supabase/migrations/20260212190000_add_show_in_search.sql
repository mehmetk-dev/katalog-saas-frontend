-- Add show_in_search column to catalogs table
-- This column allows users to toggle sitemap visibility for catalogs
-- Default is true (visible)

ALTER TABLE "public"."catalogs" 
ADD COLUMN IF NOT EXISTS "show_in_search" boolean DEFAULT true;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
