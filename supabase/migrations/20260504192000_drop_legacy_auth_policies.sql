-- Remove legacy broad policies found in older FogCatalog databases.

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

DROP POLICY IF EXISTS "Authenticated can read all logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Authenticated can insert own logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Service role can insert logs" ON public.activity_logs;
DROP POLICY IF EXISTS activity_logs_insert_authenticated ON public.activity_logs;

REVOKE UPDATE ON TABLE public.users FROM anon, authenticated;
REVOKE INSERT ON TABLE public.activity_logs FROM anon, authenticated;
