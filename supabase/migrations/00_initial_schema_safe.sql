-- =============================================
-- CLEAN SCHEMA SETUP (Policy-Safe Version)
-- =============================================
-- Bu versiyon mevcut policy'leri silip yeniden oluşturur
-- =============================================

-- =============================================
-- 1. TABLES (IF NOT EXISTS - güvenli)
-- =============================================

-- Catalog Templates
CREATE TABLE IF NOT EXISTS public.catalog_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  layout text DEFAULT 'grid'::text,
  thumbnail_url text,
  is_premium boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT catalog_templates_pkey PRIMARY KEY (id)
);

-- Templates
CREATE TABLE IF NOT EXISTS public.templates (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  is_pro boolean DEFAULT false,
  is_system boolean DEFAULT false,
  items_per_page integer DEFAULT 6,
  component_name text NOT NULL,
  preview_image text,
  layout text DEFAULT 'grid'::text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT templates_pkey PRIMARY KEY (id)
);

-- Users (profile table)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  company text,
  avatar_url text,
  plan text DEFAULT 'free'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  exports_used integer DEFAULT 0,
  logo_url text,
  subscription_end timestamp with time zone,
  subscription_status character varying DEFAULT 'inactive'::character varying,
  subscription_cancelled_at timestamp with time zone,
  is_admin boolean DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Add foreign key if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_id_fkey'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sku text,
  name text NOT NULL,
  description text,
  price numeric DEFAULT 0,
  stock integer DEFAULT 0,
  category text,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  custom_attributes jsonb DEFAULT '[]'::jsonb,
  currency text DEFAULT 'TRY'::text,
  images text[] DEFAULT '{}'::text[],
  product_url text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_user_id_fkey'
  ) THEN
    ALTER TABLE public.products 
    ADD CONSTRAINT products_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Catalogs (WITH STORYTELLING! ✨)
CREATE TABLE IF NOT EXISTS public.catalogs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id uuid,
  name text NOT NULL,
  description text,
  layout text DEFAULT 'grid'::text,
  primary_color text DEFAULT '#7c3aed'::text,
  show_prices boolean DEFAULT true,
  show_descriptions boolean DEFAULT true,
  is_published boolean DEFAULT false,
  share_slug text,
  product_ids uuid[] DEFAULT '{}'::uuid[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  columns_per_row integer DEFAULT 3,
  background_color text DEFAULT '#ffffff'::text,
  background_image text,
  background_gradient text,
  logo_url text,
  logo_position text DEFAULT 'top-left'::text,
  logo_size text DEFAULT 'medium'::text,
  background_image_fit text DEFAULT 'cover'::text,
  show_attributes boolean DEFAULT false,
  show_sku boolean DEFAULT true,
  title_position text DEFAULT 'left'::text,
  show_urls boolean DEFAULT false,
  product_image_fit text DEFAULT 'cover'::text,
  header_text_color text DEFAULT '#ffffff'::text,
  view_count integer DEFAULT 0,
  enable_cover_page boolean DEFAULT false,
  cover_image_url text,
  cover_description text,
  enable_category_dividers boolean DEFAULT false,
  CONSTRAINT catalogs_pkey PRIMARY KEY (id)
);

-- Add constraints if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'catalogs_share_slug_key') THEN
    ALTER TABLE public.catalogs ADD CONSTRAINT catalogs_share_slug_key UNIQUE (share_slug);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'catalogs_user_id_fkey') THEN
    ALTER TABLE public.catalogs ADD CONSTRAINT catalogs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'catalogs_template_id_fkey') THEN
    ALTER TABLE public.catalogs ADD CONSTRAINT catalogs_template_id_fkey 
    FOREIGN KEY (template_id) REFERENCES public.catalog_templates(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'catalogs_product_image_fit_check') THEN
    ALTER TABLE public.catalogs ADD CONSTRAINT catalogs_product_image_fit_check 
    CHECK (product_image_fit = ANY (ARRAY['cover'::text, 'contain'::text, 'fill'::text]));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'catalogs_cover_description_check') THEN
    ALTER TABLE public.catalogs ADD CONSTRAINT catalogs_cover_description_check 
    CHECK (char_length(cover_description) <= 500);
  END IF;
END $$;

-- Catalog Views
CREATE TABLE IF NOT EXISTS public.catalog_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  catalog_id uuid NOT NULL,
  visitor_hash text NOT NULL,
  view_date date DEFAULT CURRENT_DATE,
  viewed_at timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text,
  country text,
  city text,
  device_type text,
  is_owner boolean DEFAULT false,
  CONSTRAINT catalog_views_pkey PRIMARY KEY (id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'catalog_views_catalog_id_fkey') THEN
    ALTER TABLE public.catalog_views ADD CONSTRAINT catalog_views_catalog_id_fkey 
    FOREIGN KEY (catalog_id) REFERENCES public.catalogs(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Category Metadata
CREATE TABLE IF NOT EXISTS public.category_metadata (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_name text NOT NULL,
  color text,
  cover_image text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT category_metadata_pkey PRIMARY KEY (id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'category_metadata_user_id_fkey') THEN
    ALTER TABLE public.category_metadata ADD CONSTRAINT category_metadata_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  user_name text,
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_user_id_fkey') THEN
    ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type character varying NOT NULL,
  title character varying NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  action_url character varying,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Deleted Photos
CREATE TABLE IF NOT EXISTS public.deleted_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  photo_url text NOT NULL,
  photo_path text,
  product_id uuid,
  product_name text,
  storage_provider text DEFAULT 'cloudinary'::text,
  deleted_at timestamp with time zone DEFAULT now(),
  deleted_by uuid,
  is_processed boolean DEFAULT false,
  processed_at timestamp with time zone,
  notes text,
  CONSTRAINT deleted_photos_pkey PRIMARY KEY (id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deleted_photos_user_id_fkey') THEN
    ALTER TABLE public.deleted_photos ADD CONSTRAINT deleted_photos_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deleted_photos_deleted_by_fkey') THEN
    ALTER TABLE public.deleted_photos ADD CONSTRAINT deleted_photos_deleted_by_fkey 
    FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Deleted Users
CREATE TABLE IF NOT EXISTS public.deleted_users (
  id uuid NOT NULL,
  email text,
  full_name text,
  company text,
  avatar_url text,
  plan text DEFAULT 'free'::text,
  exports_used integer DEFAULT 0,
  original_created_at timestamp with time zone,
  deleted_at timestamp with time zone DEFAULT now(),
  deleted_by text,
  deletion_reason text,
  CONSTRAINT deleted_users_pkey PRIMARY KEY (id)
);

-- Feedbacks
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  user_name text NOT NULL,
  user_email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  page_url text,
  attachments text[] DEFAULT '{}'::text[],
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT feedbacks_pkey PRIMARY KEY (id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedbacks_user_id_fkey') THEN
    ALTER TABLE public.feedbacks ADD CONSTRAINT feedbacks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================
-- 2. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_catalogs_user_id ON public.catalogs(user_id);
CREATE INDEX IF NOT EXISTS idx_catalogs_share_slug ON public.catalogs(share_slug) WHERE share_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalogs_published ON public.catalogs(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_catalogs_cover_enabled ON public.catalogs(enable_cover_page) WHERE enable_cover_page = true;

CREATE INDEX IF NOT EXISTS idx_catalog_views_catalog_id ON public.catalog_views(catalog_id);
CREATE INDEX IF NOT EXISTS idx_catalog_views_date ON public.catalog_views(view_date DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_views_visitor_hash ON public.catalog_views(visitor_hash);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- =============================================
-- 3. RLS (Enable)
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SUCCESS
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Schema setup completed!';
  RAISE NOTICE '✨ Storytelling catalog ready!';
  RAISE NOTICE 'ℹ️  RLS is enabled, but policies may already exist (this is OK!)';
END $$;
