-- =============================================
-- MINIMAL TABLE CREATION (NO POLICIES)
-- =============================================
-- Bu script SADECE tabloları oluşturur
-- Policy, RLS, vs. YOKTUR
-- =============================================

-- 1. Users (Profile Table)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  company text,
  avatar_url text,
  plan text DEFAULT 'free',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  exports_used integer DEFAULT 0,
  logo_url text,
  subscription_end timestamptz,
  subscription_status varchar DEFAULT 'inactive',
  subscription_cancelled_at timestamptz,
  is_admin boolean DEFAULT false
);

-- 2. Products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sku text,
  name text NOT NULL,
  description text,
  price numeric DEFAULT 0,
  stock integer DEFAULT 0,
  category text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  custom_attributes jsonb DEFAULT '[]',
  currency text DEFAULT 'TRY',
  images text[] DEFAULT '{}',
  product_url text
);

-- 3. Catalogs (WITH STORYTELLING FIELDS! ✨)
CREATE TABLE IF NOT EXISTS public.catalogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id uuid,
  name text NOT NULL,
  description text,
  layout text DEFAULT 'grid',
  primary_color text DEFAULT '#7c3aed',
  show_prices boolean DEFAULT true,
  show_descriptions boolean DEFAULT true,
  is_published boolean DEFAULT false,
  share_slug text UNIQUE,
  product_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  columns_per_row integer DEFAULT 3,
  background_color text DEFAULT '#ffffff',
  background_image text,
  background_gradient text,
  logo_url text,
  logo_position text DEFAULT 'top-left',
  logo_size text DEFAULT 'medium',
  background_image_fit text DEFAULT 'cover',
  show_attributes boolean DEFAULT false,
  show_sku boolean DEFAULT true,
  title_position text DEFAULT 'left',
  show_urls boolean DEFAULT false,
  product_image_fit text DEFAULT 'cover',
  header_text_color text DEFAULT '#ffffff',
  view_count integer DEFAULT 0,
  -- STORYTELLING FIELDS ✨
  enable_cover_page boolean DEFAULT false,
  cover_image_url text,
  cover_description text,
  enable_category_dividers boolean DEFAULT false
);

-- 4. Catalog Views (Analytics)
CREATE TABLE IF NOT EXISTS public.catalog_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id uuid NOT NULL,
  visitor_hash text NOT NULL,
  view_date date DEFAULT CURRENT_DATE,
  viewed_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  country text,
  city text,
  device_type text,
  is_owner boolean DEFAULT false
);

-- 5. Category Metadata
CREATE TABLE IF NOT EXISTS public.category_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_name text NOT NULL,
  color text,
  cover_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, category_name)
);

-- 6. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  user_name text,
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- 7. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type varchar NOT NULL,
  title varchar NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  action_url varchar,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- 8. Deleted Photos
CREATE TABLE IF NOT EXISTS public.deleted_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  photo_url text NOT NULL,
  photo_path text,
  product_id uuid,
  product_name text,
  storage_provider text DEFAULT 'cloudinary',
  deleted_at timestamptz DEFAULT now(),
  deleted_by uuid,
  is_processed boolean DEFAULT false,
  processed_at timestamptz,
  notes text
);

-- 9. Feedbacks
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_name text NOT NULL,
  user_email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  page_url text,
  attachments text[] DEFAULT '{}',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- 10. Templates
CREATE TABLE IF NOT EXISTS public.templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_pro boolean DEFAULT false,
  is_system boolean DEFAULT false,
  items_per_page integer DEFAULT 6,
  component_name text NOT NULL,
  preview_image text,
  layout text DEFAULT 'grid',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 11. Catalog Templates
CREATE TABLE IF NOT EXISTS public.catalog_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  layout text DEFAULT 'grid',
  thumbnail_url text,
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 12. Deleted Users (Audit)
CREATE TABLE IF NOT EXISTS public.deleted_users (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  company text,
  avatar_url text,
  plan text DEFAULT 'free',
  exports_used integer DEFAULT 0,
  original_created_at timestamptz,
  deleted_at timestamptz DEFAULT now(),
  deleted_by text,
  deletion_reason text
);

-- SUCCESS
SELECT 
  '✅ 12 tables created successfully!' as status,
  '✨ Storytelling catalog fields included!' as feature,
  'ℹ️  Check Table Editor now' as next_step;
