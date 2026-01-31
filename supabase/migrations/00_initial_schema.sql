-- =============================================
-- INITIAL SCHEMA MIGRATION (PRODUCTION EXPORT)
-- =============================================
-- Bu schema production Supabase'den export edilmiştir
-- Tüm tablolar, constraints ve storytelling fields dahildir
-- =============================================

-- ============================================= 
-- 1. CATALOG TEMPLATES TABLE
-- =============================================
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

-- =============================================
-- 2. TEMPLATES TABLE
-- =============================================
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

-- =============================================
-- 3. USERS TABLE
-- =============================================
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
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =============================================
-- 4. PRODUCTS TABLE
-- =============================================
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
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =============================================
-- 5. CATALOGS TABLE (WITH STORYTELLING FIELDS! ✨)
-- =============================================
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
  share_slug text UNIQUE,
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
  product_image_fit text DEFAULT 'cover'::text CHECK (product_image_fit = ANY (ARRAY['cover'::text, 'contain'::text, 'fill'::text])),
  header_text_color text DEFAULT '#ffffff'::text,
  view_count integer DEFAULT 0,
  -- STORYTELLING CATALOG FIELDS ✨
  enable_cover_page boolean DEFAULT false,
  cover_image_url text,
  cover_description text CHECK (char_length(cover_description) <= 500),
  enable_category_dividers boolean DEFAULT false,
  CONSTRAINT catalogs_pkey PRIMARY KEY (id),
  CONSTRAINT catalogs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT catalogs_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.catalog_templates(id)
);

-- =============================================
-- 6. CATALOG VIEWS (ANALYTICS)
-- =============================================
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
  CONSTRAINT catalog_views_pkey PRIMARY KEY (id),
  CONSTRAINT catalog_views_catalog_id_fkey FOREIGN KEY (catalog_id) REFERENCES public.catalogs(id) ON DELETE CASCADE
);

-- =============================================
-- 7. CATEGORY METADATA
-- =============================================
CREATE TABLE IF NOT EXISTS public.category_metadata (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_name text NOT NULL,
  color text,
  cover_image text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT category_metadata_pkey PRIMARY KEY (id),
  CONSTRAINT category_metadata_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =============================================
-- 8. ACTIVITY LOGS
-- =============================================
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
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =============================================
-- 9. NOTIFICATIONS
-- =============================================
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
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- =============================================
-- 10. DELETED PHOTOS (CLEANUP TRACKING)
-- =============================================
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
  CONSTRAINT deleted_photos_pkey PRIMARY KEY (id),
  CONSTRAINT deleted_photos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT deleted_photos_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =============================================
-- 11. DELETED USERS (AUDIT TRAIL)
-- =============================================
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

-- =============================================
-- 12. FEEDBACKS
-- =============================================
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
  CONSTRAINT feedbacks_pkey PRIMARY KEY (id),
  CONSTRAINT feedbacks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =============================================
-- INDEXES (PERFORMANCE OPTIMIZATION)
-- =============================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Catalogs indexes  
CREATE INDEX IF NOT EXISTS idx_catalogs_user_id ON public.catalogs(user_id);
CREATE INDEX IF NOT EXISTS idx_catalogs_share_slug ON public.catalogs(share_slug) WHERE share_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalogs_published ON public.catalogs(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_catalogs_cover_enabled ON public.catalogs(enable_cover_page) WHERE enable_cover_page = true;

-- Catalog views indexes
CREATE INDEX IF NOT EXISTS idx_catalog_views_catalog_id ON public.catalog_views(catalog_id);
CREATE INDEX IF NOT EXISTS idx_catalog_views_date ON public.catalog_views(view_date DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_views_visitor_hash ON public.catalog_views(visitor_hash);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
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
-- RLS POLICIES
-- =============================================

-- USERS POLICIES
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- PRODUCTS POLICIES
DROP POLICY IF EXISTS products_select_own ON public.products;
CREATE POLICY products_select_own ON public.products
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS products_insert_own ON public.products;
CREATE POLICY products_insert_own ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS products_update_own ON public.products;
CREATE POLICY products_update_own ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS products_delete_own ON public.products;
CREATE POLICY products_delete_own ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- CATALOGS POLICIES
DROP POLICY IF EXISTS catalogs_select_own_or_published ON public.catalogs;
CREATE POLICY catalogs_select_own_or_published ON public.catalogs
  FOR SELECT USING (auth.uid() = user_id OR is_published = true);

DROP POLICY IF EXISTS catalogs_insert_own ON public.catalogs;
CREATE POLICY catalogs_insert_own ON public.catalogs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS catalogs_update_own ON public.catalogs;
CREATE POLICY catalogs_update_own ON public.catalogs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS catalogs_delete_own ON public.catalogs;
CREATE POLICY catalogs_delete_own ON public.catalogs
  FOR DELETE USING (auth.uid() = user_id);

-- CATALOG VIEWS POLICIES (Public read for analytics)
DROP POLICY IF EXISTS catalog_views_insert_public ON public.catalog_views;
CREATE POLICY catalog_views_insert_public ON public.catalog_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS catalog_views_select_own ON public.catalog_views;
CREATE POLICY catalog_views_select_own ON public.catalog_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.catalogs
      WHERE catalogs.id = catalog_views.catalog_id
      AND catalogs.user_id = auth.uid()
    )
  );

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ACTIVITY LOGS POLICIES
DROP POLICY IF EXISTS activity_logs_select_own ON public.activity_logs;
CREATE POLICY activity_logs_select_own ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);

-- CATEGORY METADATA POLICIES
DROP POLICY IF EXISTS category_metadata_select_own ON public.category_metadata;
CREATE POLICY category_metadata_select_own ON public.category_metadata
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS category_metadata_insert_own ON public.category_metadata;
CREATE POLICY category_metadata_insert_own ON public.category_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS category_metadata_update_own ON public.category_metadata;
CREATE POLICY category_metadata_update_own ON public.category_metadata
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS category_metadata_delete_own ON public.category_metadata;
CREATE POLICY category_metadata_delete_own ON public.category_metadata
  FOR DELETE USING (auth.uid() = user_id);

-- DELETED PHOTOS POLICIES
DROP POLICY IF EXISTS deleted_photos_select_own ON public.deleted_photos;
CREATE POLICY deleted_photos_select_own ON public.deleted_photos
  FOR SELECT USING (auth.uid() = user_id);

-- FEEDBACKS POLICIES (users can see their own)
DROP POLICY IF EXISTS feedbacks_select_own ON public.feedbacks;
CREATE POLICY feedbacks_select_own ON public.feedbacks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS feedbacks_insert_authenticated ON public.feedbacks;
CREATE POLICY feedbacks_insert_authenticated ON public.feedbacks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Initial schema migration completed successfully!';
  RAISE NOTICE '✨ Storytelling catalog fields are included (enable_cover_page, cover_image_url, cover_description, enable_category_dividers)';
  RAISE NOTICE '📊 All tables, indexes, and RLS policies created';
  RAISE NOTICE 'ℹ️  Next: Run other migration files in order';
END $$;
-- Bu dosya PRODUCTION database'den export edilmiştir
-- Yeni LOCAL database için kullanılmalıdır
-- =============================================

-- NASIL KULLANILIR:
-- 1. Production Supabase Dashboard'a git
-- 2. Database → Schema Visualizer
-- 3. "..." → Export Schema → SQL
-- 4. SQL'i kopyala ve bu dosyaya yapıştır
-- 5. LOCAL Supabase'de SQL Editor → Paste & Run

-- =============================================
-- TODO: PRODUCTION ŞEMASINI BURAYA YAPIŞTIR
-- =============================================

-- Alternatif yöntem:
-- Production Supabase → Database → Backups
-- → Schema-only backup al (.sql dosyası) 

-- NOT: Sadece schema istiyoruz, data değil!
-- Schema = Tables, Columns, Constraints, Indexes

-- =============================================
-- MANUEL OLARAK SCHEMA ALMAK İÇİN:
-- =============================================

/*
1. Production Supabase Dashboard aç
2. Table Editor'a git
3. Her tablo için CREATE TABLE statement'ı al:

Tablolar:
✅ users
✅ products  
✅ catalogs
✅ categories
✅ catalog_analytics
✅ user_activity_logs
✅ notifications
✅ deleted_images
✅ custom_attributes
✅ storage.buckets (zaten var)
✅ storage.objects (zaten var)

4. Constraints ve Indexes:
   - Foreign keys (user_id references, etc)
   - Unique constraints (email, share_slug, etc)
   - Check constraints
   - Indexes (performance için)

5. Functions ve Triggers:
   - increment_view_count()
   - track_user_activity()
   - cleanup_expired_sessions()

6. RLS Policies:
   - Her tablo için enable RLS
   - Policy'leri kopyala
*/

-- =============================================
-- HIZLI BAŞLATMAK İÇİN:
-- =============================================

-- 1. users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    company TEXT,
    logo_url TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    exports_used INTEGER DEFAULT 0,
    max_exports INTEGER DEFAULT 5,
    catalog_count INTEGER DEFAULT 0,
    max_catalogs INTEGER DEFAULT 3,
    product_count INTEGER DEFAULT 0,
    max_products INTEGER DEFAULT 50,
    is_disabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2),
    category TEXT,
    image_url TEXT,
    images TEXT[],
    sku TEXT,
    stock INTEGER DEFAULT 0,
    product_url TEXT,
    custom_attributes JSONB DEFAULT '[]'::jsonb,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. catalogs table (ÖNEMLİ: Storytelling fields dahil!)
CREATE TABLE IF NOT EXISTS public.catalogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    template_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    layout TEXT DEFAULT 'grid',
    primary_color TEXT DEFAULT 'rgba(124, 58, 237, 1)',
    show_prices BOOLEAN DEFAULT true,
    show_descriptions BOOLEAN DEFAULT true,
    show_attributes BOOLEAN DEFAULT false,
    show_sku BOOLEAN DEFAULT true,
    show_urls BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    share_slug TEXT UNIQUE,
    product_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    columns_per_row INTEGER DEFAULT 3,
    background_color TEXT DEFAULT '#ffffff',
    background_image TEXT,
    background_image_fit TEXT DEFAULT 'cover',
    background_gradient TEXT,
    logo_url TEXT,
    logo_position TEXT,
    logo_size TEXT DEFAULT 'medium',
    is_disabled BOOLEAN DEFAULT false,
    title_position TEXT DEFAULT 'left',
    product_image_fit TEXT DEFAULT 'cover',
    header_text_color TEXT DEFAULT '#ffffff',
    view_count INTEGER DEFAULT 0,
    -- STORYTELLING FIELDS
    enable_cover_page BOOLEAN DEFAULT false,
    cover_image_url TEXT,
    cover_description TEXT CHECK (char_length(cover_description) <= 500),
    enable_category_dividers BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexes (Performance)
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_catalogs_user_id ON public.catalogs(user_id);
CREATE INDEX IF NOT EXISTS idx_catalogs_share_slug ON public.catalogs(share_slug);
CREATE INDEX IF NOT EXISTS idx_catalogs_cover_enabled ON public.catalogs(enable_cover_page) WHERE enable_cover_page = true;

-- 5. RLS Enable
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (Basit versiyon)
-- Users: Sadece kendi bilgilerini görebilir
CREATE POLICY users_select_own ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Products: Sadece kendi ürünlerini görebilir
CREATE POLICY products_select_own ON public.products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY products_insert_own ON public.products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY products_update_own ON public.products
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY products_delete_own ON public.products
    FOR DELETE USING (auth.uid() = user_id);

-- Catalogs: Kendi kataloglarını görebilir, published olanlar public
CREATE POLICY catalogs_select_own ON public.catalogs
    FOR SELECT USING (auth.uid() = user_id OR is_published = true);

CREATE POLICY catalogs_insert_own ON public.catalogs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY catalogs_update_own ON public.catalogs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY catalogs_delete_own ON public.catalogs
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- DİĞER TABLOLAR (Opsiyonel)
-- =============================================

-- Bu tabloları production'dan export edebilirsin:
-- - custom_attributes
-- - categories
-- - catalog_analytics
-- - user_activity_logs
-- - notifications
-- - deleted_images

-- =============================================
-- PRODUCTION'DAN TAM ŞEMA ALMAK İÇİN:
-- =============================================

/*
# PostgreSQL pg_dump komutu (eğer erişimin varsa):
pg_dump -h db.YOUR_PROJECT_ID.supabase.co \
        -U postgres \
        -d postgres \
        --schema-only \
        --no-owner \
        --no-acl \
        > production_schema.sql

# Veya Supabase CLI:
supabase db dump --schema-only > schema.sql
*/

-- =============================================
-- SUPABASE DASHBOARD YÖNTEMI (KOLAY):
-- =============================================

/*
1. Production Supabase Dashboard
2. Database → Migrations
3. "Create a new migration"
4. Toggle "Schema only"
5. Download SQL
6. Bu dosyaya yapıştır
*/
