CREATE TABLE IF NOT EXISTS public.pdf_export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  catalog_id uuid NOT NULL REFERENCES public.catalogs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled', 'expired')),
  quality text NOT NULL DEFAULT 'standard'
    CHECK (quality IN ('standard', 'high')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  page_count integer,
  file_path text,
  file_size_bytes bigint,
  error_message text,
  attempts integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pdf_export_jobs_user_created
  ON public.pdf_export_jobs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pdf_export_jobs_status_created
  ON public.pdf_export_jobs(status, created_at ASC);

CREATE OR REPLACE FUNCTION public.set_pdf_export_jobs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pdf_export_jobs_updated_at ON public.pdf_export_jobs;
CREATE TRIGGER trg_pdf_export_jobs_updated_at
  BEFORE UPDATE ON public.pdf_export_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_pdf_export_jobs_updated_at();

ALTER TABLE public.pdf_export_jobs ENABLE ROW LEVEL SECURITY;

-- NOTE: INSERT and DELETE are intentionally restricted to the service role.
-- The Express backend uses the service-role key and bypasses RLS, so client-side
-- direct inserts/deletes through PostgREST are not possible.

CREATE POLICY "Users can read own pdf export jobs"
  ON public.pdf_export_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update cancellable own pdf export jobs"
  ON public.pdf_export_jobs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
