-- Lock down auth-sensitive tables after security review.

DROP POLICY IF EXISTS users_update_own ON public.users;
REVOKE UPDATE ON TABLE public.users FROM anon, authenticated;

DROP POLICY IF EXISTS "Service role can insert logs" ON public.activity_logs;
DROP POLICY IF EXISTS activity_logs_insert_authenticated ON public.activity_logs;
REVOKE INSERT ON TABLE public.activity_logs FROM anon, authenticated;

-- Backend service_role keeps writing audit logs and user profile updates.
