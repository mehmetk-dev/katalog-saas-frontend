-- Migration: Add social media links to users table
-- Date: 2026-03-07
-- Description: Adds instagram_url, youtube_url, website_url columns to public.users

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url   TEXT,
  ADD COLUMN IF NOT EXISTS website_url   TEXT;

COMMENT ON COLUMN public.users.instagram_url IS 'Instagram profile URL (e.g. https://instagram.com/username)';
COMMENT ON COLUMN public.users.youtube_url   IS 'YouTube channel URL (e.g. https://youtube.com/@channel)';
COMMENT ON COLUMN public.users.website_url   IS 'Business or personal website URL';
