-- Composite index for public catalog lookups
-- Query: WHERE share_slug = ? AND is_published = true
-- This replaces separate index lookups with a single efficient index scan
CREATE INDEX IF NOT EXISTS idx_catalogs_published_slug 
  ON public.catalogs(share_slug, is_published) 
  WHERE is_published = true AND share_slug IS NOT NULL;

COMMENT ON INDEX idx_catalogs_published_slug IS 
  'Composite partial index for fast public catalog lookups by slug. Only indexes published catalogs with non-null slugs.';
