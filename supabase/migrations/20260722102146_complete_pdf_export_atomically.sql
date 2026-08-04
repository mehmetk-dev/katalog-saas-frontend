ALTER TABLE public.pdf_export_jobs
  ADD COLUMN IF NOT EXISTS quota_consumed_at timestamptz;

-- Clients may only cancel their own queued/processing jobs. Completion,
-- storage metadata and quota accounting remain service-role-only.
DROP POLICY IF EXISTS "Users can update cancellable own pdf export jobs" ON public.pdf_export_jobs;
REVOKE UPDATE ON public.pdf_export_jobs FROM authenticated;
REVOKE UPDATE ON public.pdf_export_jobs FROM anon;
GRANT UPDATE (status) ON public.pdf_export_jobs TO authenticated;

CREATE POLICY "Users can cancel own active pdf export jobs"
  ON public.pdf_export_jobs
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id AND status IN ('queued', 'processing'))
  WITH CHECK ((SELECT auth.uid()) = user_id AND status = 'cancelled');

CREATE OR REPLACE FUNCTION public.complete_pdf_export_job(
  p_job_id uuid,
  p_user_id uuid,
  p_file_path text,
  p_file_size_bytes bigint,
  p_expires_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_status text;
  v_quota_consumed_at timestamptz;
BEGIN
  SELECT status, quota_consumed_at
    INTO v_status, v_quota_consumed_at
  FROM public.pdf_export_jobs
  WHERE id = p_job_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PDF export job not found';
  END IF;

  IF v_status = 'completed' AND v_quota_consumed_at IS NOT NULL THEN
    RETURN false;
  END IF;

  IF v_status NOT IN ('queued', 'processing', 'completed') THEN
    RAISE EXCEPTION 'PDF export job cannot be completed from status %', v_status;
  END IF;

  IF v_quota_consumed_at IS NULL THEN
    UPDATE public.users
    SET exports_used = COALESCE(exports_used, 0) + 1
    WHERE id = p_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PDF export user not found';
    END IF;
  END IF;

  UPDATE public.pdf_export_jobs
  SET status = 'completed',
      progress = 100,
      file_path = p_file_path,
      file_size_bytes = p_file_size_bytes,
      error_message = NULL,
      completed_at = COALESCE(completed_at, now()),
      expires_at = p_expires_at,
      quota_consumed_at = COALESCE(quota_consumed_at, now())
  WHERE id = p_job_id AND user_id = p_user_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_pdf_export_job(uuid, uuid, text, bigint, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_pdf_export_job(uuid, uuid, text, bigint, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.complete_pdf_export_job(uuid, uuid, text, bigint, timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.complete_pdf_export_job(uuid, uuid, text, bigint, timestamptz) TO service_role;

NOTIFY pgrst, 'reload schema';
