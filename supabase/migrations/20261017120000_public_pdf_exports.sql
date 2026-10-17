-- Yayınlanmış katalog sayfasından (ziyaretçi) istenen PDF'ler de worker'da üretilir.
-- Bu işler katalog sahibinin user_id'si ile tutulur ama sahibin kotasını tüketmez,
-- sahibin PDF listesinde görünmez ve katalog değişmediyse tekrar kullanılır.
ALTER TABLE public.pdf_export_jobs
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'owner';

ALTER TABLE public.pdf_export_jobs
  DROP CONSTRAINT IF EXISTS pdf_export_jobs_source_check;
ALTER TABLE public.pdf_export_jobs
  ADD CONSTRAINT pdf_export_jobs_source_check CHECK (source IN ('owner', 'public'));

CREATE INDEX IF NOT EXISTS idx_pdf_export_jobs_public_catalog
  ON public.pdf_export_jobs(catalog_id, created_at DESC)
  WHERE source = 'public';

-- Sahip kendi listesinde yalnızca kendi başlattığı işleri görür
DROP POLICY IF EXISTS "Users can read own pdf export jobs" ON public.pdf_export_jobs;
CREATE POLICY "Users can read own pdf export jobs"
  ON public.pdf_export_jobs
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id AND source = 'owner');

NOTIFY pgrst, 'reload schema';
