-- Add unique constraint for catalog share_slug
-- This prevents duplicate slugs which could cause conflicts in public catalog URLs

-- First, handle any existing duplicate slugs by appending a unique suffix
DO $$
DECLARE
  duplicate_record RECORD;
  counter INTEGER;
BEGIN
  -- Find and fix duplicate slugs
  FOR duplicate_record IN
    SELECT share_slug, array_agg(id ORDER BY created_at) as ids
    FROM catalogs
    WHERE share_slug IS NOT NULL
    GROUP BY share_slug
    HAVING COUNT(*) > 1
  LOOP
    counter := 1;
    -- Keep the first one (oldest), update the rest
    FOR i IN 2..array_length(duplicate_record.ids, 1) LOOP
      UPDATE catalogs
      SET share_slug = duplicate_record.share_slug || '-' || counter || '-' || substring(duplicate_record.ids[i]::text, 1, 8)
      WHERE id = duplicate_record.ids[i];
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- Create unique index on share_slug (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalogs_share_slug_unique 
  ON catalogs(share_slug) 
  WHERE share_slug IS NOT NULL;

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_catalogs_share_slug_unique IS 
  'Ensures unique share_slug values for public catalog URLs. NULL values are allowed (unpublished catalogs may not have slugs).';
