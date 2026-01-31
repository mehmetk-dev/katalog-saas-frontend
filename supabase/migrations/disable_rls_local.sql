-- =============================================
-- DISABLE RLS FOR LOCAL DEVELOPMENT
-- =============================================
-- ⚠️ SADECE LOCAL DEVELOPMENT İÇİN!
-- Production'da RLS AÇIK OLMALI!
-- =============================================

-- RLS'i tüm tablolarda kapat
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks DISABLE ROW LEVEL SECURITY;

-- Başarı mesajı
SELECT 
  '✅ RLS disabled for local development!' as status,
  '⚠️  Remember to enable RLS in production!' as warning;
