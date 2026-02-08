-- =============================================
-- FEEDBACKS: Admin SELECT/UPDATE/DELETE RLS
-- =============================================
-- Admin kullanıcılar (users.is_admin = true) tüm feedback'leri
-- okuyabilir, güncelleyebilir ve silebilir.
-- Normal kullanıcılar sadece kendi feedback'lerini görebilir.
-- =============================================

-- SELECT: Kendi kayıtları veya admin tümünü görebilir
DROP POLICY IF EXISTS feedbacks_select_own ON public.feedbacks;
CREATE POLICY feedbacks_select_own ON public.feedbacks
  FOR SELECT USING (
    user_id = auth.uid()
    OR (SELECT is_admin FROM public.users WHERE id = auth.uid() LIMIT 1) = true
  );

-- UPDATE: Sadece admin
DROP POLICY IF EXISTS feedbacks_update_admin ON public.feedbacks;
CREATE POLICY feedbacks_update_admin ON public.feedbacks
  FOR UPDATE USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid() LIMIT 1) = true
  );

-- DELETE: Sadece admin
DROP POLICY IF EXISTS feedbacks_delete_admin ON public.feedbacks;
CREATE POLICY feedbacks_delete_admin ON public.feedbacks
  FOR DELETE USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid() LIMIT 1) = true
  );
