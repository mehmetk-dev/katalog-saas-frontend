-- Supabase Security Fixes Migration
-- Fixes: SECURITY DEFINER view, function search_path, RLS policy
-- Safe to run: No behavior changes, only security hardening

-- 1. View: SECURITY INVOKER (fixes ERROR)
ALTER VIEW public.user_dashboard_stats SET (security_invoker = on);

-- 2. Functions: search_path sabitleme (fixes 11 WARNs)
ALTER FUNCTION public.check_product_limit SET search_path = public;
ALTER FUNCTION public.smart_increment_view_count SET search_path = public;
ALTER FUNCTION public.get_catalog_daily_views SET search_path = public;
ALTER FUNCTION public.get_catalog_device_stats SET search_path = public;
ALTER FUNCTION public.get_unique_visitors SET search_path = public;
ALTER FUNCTION public.increment_view_count SET search_path = public;
ALTER FUNCTION public.update_updated_at_column SET search_path = public;
ALTER FUNCTION public.archive_deleted_user SET search_path = public;
ALTER FUNCTION public.get_user_dashboard_stats SET search_path = public;
ALTER FUNCTION public.remove_product_from_catalogs SET search_path = public;
ALTER FUNCTION public.handle_new_user SET search_path = public;

-- 3. RLS: activity_logs policy güçlendirme (fixes 1 WARN)
DROP POLICY IF EXISTS "Authenticated can insert logs" ON public.activity_logs;
CREATE POLICY "Authenticated can insert own logs" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
