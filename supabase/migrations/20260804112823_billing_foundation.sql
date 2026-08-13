CREATE TABLE IF NOT EXISTS public.billing_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  invoice_type text NOT NULL CHECK (invoice_type IN ('individual', 'corporate')),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 20),
  identity_number text,
  tax_number text,
  company_name text,
  tax_office text,
  billing_address text NOT NULL CHECK (char_length(billing_address) BETWEEN 5 AND 500),
  city text NOT NULL CHECK (char_length(city) BETWEEN 2 AND 100),
  district text NOT NULL CHECK (char_length(district) BETWEEN 2 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_profiles_invoice_fields_check CHECK (
    (
      invoice_type = 'individual'
      AND identity_number IS NOT NULL
      AND identity_number ~ '^[0-9]{11}$'
      AND tax_number IS NULL
      AND company_name IS NULL
      AND tax_office IS NULL
    )
    OR
    (
      invoice_type = 'corporate'
      AND identity_number IS NULL
      AND tax_number IS NOT NULL
      AND tax_number ~ '^[0-9]{10}$'
      AND company_name IS NOT NULL
      AND char_length(company_name) BETWEEN 2 AND 200
      AND tax_office IS NOT NULL
      AND char_length(tax_office) BETWEEN 2 AND 120
    )
  )
);

CREATE TABLE IF NOT EXISTS public.billing_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL CHECK (plan_id IN ('plus', 'pro')),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'payment_pending', 'paid', 'payment_failed', 'cancelled', 'refunded')),
  currency text NOT NULL DEFAULT 'TRY'
    CHECK (currency ~ '^[A-Z]{3}$'),
  subtotal_amount numeric(12, 2) CHECK (subtotal_amount IS NULL OR subtotal_amount >= 0),
  vat_rate numeric(6, 5) CHECK (vat_rate IS NULL OR (vat_rate >= 0 AND vat_rate <= 1)),
  vat_amount numeric(12, 2) CHECK (vat_amount IS NULL OR vat_amount >= 0),
  total_amount numeric(12, 2) CHECK (total_amount IS NULL OR total_amount >= 0),
  payment_provider text,
  provider_payment_id text,
  payment_method_type text
    CHECK (payment_method_type IS NULL OR payment_method_type IN ('card', 'bank_transfer', 'wallet')),
  -- PAN, expiry date, CVC and card fragments are deliberately never persisted.
  installment_count integer CHECK (installment_count IS NULL OR installment_count >= 1),
  payment_attempted_at timestamptz,
  paid_at timestamptz,
  invoice_status text NOT NULL DEFAULT 'not_requested'
    CHECK (invoice_status IN ('not_requested', 'pending', 'issued', 'failed', 'cancelled')),
  invoice_number text,
  invoice_issued_at timestamptz,
  distance_sales_accepted_at timestamptz NOT NULL,
  cancellation_policy_accepted_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_orders_amounts_complete_check CHECK (
    (subtotal_amount IS NULL AND vat_rate IS NULL AND vat_amount IS NULL AND total_amount IS NULL)
    OR
    (subtotal_amount IS NOT NULL AND vat_rate IS NOT NULL AND vat_amount IS NOT NULL AND total_amount IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.billing_order_details (
  order_id uuid PRIMARY KEY REFERENCES public.billing_orders(id) ON DELETE CASCADE,
  invoice_type text NOT NULL CHECK (invoice_type IN ('individual', 'corporate')),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 20),
  identity_number text,
  tax_number text,
  company_name text,
  tax_office text,
  billing_address text NOT NULL CHECK (char_length(billing_address) BETWEEN 5 AND 500),
  city text NOT NULL CHECK (char_length(city) BETWEEN 2 AND 100),
  district text NOT NULL CHECK (char_length(district) BETWEEN 2 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_order_details_invoice_fields_check CHECK (
    (
      invoice_type = 'individual'
      AND identity_number IS NOT NULL
      AND identity_number ~ '^[0-9]{11}$'
      AND tax_number IS NULL
      AND company_name IS NULL
      AND tax_office IS NULL
    )
    OR
    (
      invoice_type = 'corporate'
      AND identity_number IS NULL
      AND tax_number IS NOT NULL
      AND tax_number ~ '^[0-9]{10}$'
      AND company_name IS NOT NULL
      AND char_length(company_name) BETWEEN 2 AND 200
      AND tax_office IS NOT NULL
      AND char_length(tax_office) BETWEEN 2 AND 120
    )
  )
);

CREATE TABLE IF NOT EXISTS public.billing_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.billing_orders(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  document_type text NOT NULL DEFAULT 'payment_receipt'
    CHECK (document_type IN ('payment_receipt')),
  document_number text NOT NULL UNIQUE
    CHECK (char_length(document_number) BETWEEN 12 AND 64),
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  document_payload jsonb NOT NULL
    CHECK (
      jsonb_typeof(document_payload) = 'object'
      AND document_payload->>'schemaVersion' = '1'
      AND document_payload->>'documentType' = document_type
    ),
  file_path text,
  file_size_bytes bigint CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
  file_sha256 text CHECK (file_sha256 IS NULL OR file_sha256 ~ '^[a-f0-9]{64}$'),
  error_message text CHECK (error_message IS NULL OR char_length(error_message) <= 1000),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_documents_one_type_per_order UNIQUE (order_id, document_type),
  CONSTRAINT billing_documents_completed_file_check CHECK (
    status <> 'completed'
    OR (
      file_path IS NOT NULL
      AND file_size_bytes IS NOT NULL
      AND file_sha256 IS NOT NULL
      AND completed_at IS NOT NULL
    )
  )
);

CREATE INDEX IF NOT EXISTS billing_orders_user_created_idx
  ON public.billing_orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS billing_orders_status_created_idx
  ON public.billing_orders(status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS billing_orders_one_draft_per_user_idx
  ON public.billing_orders(user_id)
  WHERE status = 'draft';

CREATE UNIQUE INDEX IF NOT EXISTS billing_orders_provider_payment_idx
  ON public.billing_orders(payment_provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS billing_documents_user_created_idx
  ON public.billing_documents(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS billing_documents_status_created_idx
  ON public.billing_documents(status, created_at ASC);

CREATE OR REPLACE FUNCTION public.set_billing_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS billing_profiles_updated_at ON public.billing_profiles;
CREATE TRIGGER billing_profiles_updated_at
  BEFORE UPDATE ON public.billing_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_billing_updated_at();

DROP TRIGGER IF EXISTS billing_orders_updated_at ON public.billing_orders;
CREATE TRIGGER billing_orders_updated_at
  BEFORE UPDATE ON public.billing_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_billing_updated_at();

DROP TRIGGER IF EXISTS billing_order_details_updated_at ON public.billing_order_details;
CREATE TRIGGER billing_order_details_updated_at
  BEFORE UPDATE ON public.billing_order_details
  FOR EACH ROW
  EXECUTE FUNCTION public.set_billing_updated_at();

DROP TRIGGER IF EXISTS billing_documents_updated_at ON public.billing_documents;
CREATE TRIGGER billing_documents_updated_at
  BEFORE UPDATE ON public.billing_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_billing_updated_at();

CREATE OR REPLACE FUNCTION public.protect_billing_document_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF OLD.order_id IS DISTINCT FROM NEW.order_id
    OR OLD.user_id IS DISTINCT FROM NEW.user_id
    OR OLD.document_type IS DISTINCT FROM NEW.document_type
    OR OLD.document_number IS DISTINCT FROM NEW.document_number
    OR OLD.document_payload IS DISTINCT FROM NEW.document_payload
  THEN
    RAISE EXCEPTION 'Billing document snapshot fields are immutable';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS billing_documents_protect_snapshot ON public.billing_documents;
CREATE TRIGGER billing_documents_protect_snapshot
  BEFORE UPDATE ON public.billing_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_billing_document_snapshot();

ALTER TABLE public.billing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_order_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_documents ENABLE ROW LEVEL SECURITY;

-- Billing data contains tax and identity information. It is backend-only until
-- dedicated account and invoice APIs are introduced.
REVOKE ALL ON public.billing_profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.billing_orders FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.billing_order_details FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.billing_documents FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON public.billing_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.billing_orders TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.billing_order_details TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.billing_documents TO service_role;

CREATE OR REPLACE FUNCTION public.save_billing_checkout_draft(
  p_user_id uuid,
  p_plan_id text,
  p_billing_cycle text,
  p_invoice_type text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_identity_number text,
  p_tax_number text,
  p_company_name text,
  p_tax_office text,
  p_billing_address text,
  p_city text,
  p_district text
)
RETURNS TABLE(order_id uuid, order_status text, order_created_at timestamptz, order_updated_at timestamptz)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  INSERT INTO public.billing_profiles (
    user_id,
    invoice_type,
    full_name,
    email,
    phone,
    identity_number,
    tax_number,
    company_name,
    tax_office,
    billing_address,
    city,
    district
  ) VALUES (
    p_user_id,
    p_invoice_type,
    btrim(p_full_name),
    lower(btrim(p_email)),
    btrim(p_phone),
    CASE WHEN p_invoice_type = 'individual' THEN nullif(btrim(p_identity_number), '') ELSE NULL END,
    CASE WHEN p_invoice_type = 'corporate' THEN nullif(btrim(p_tax_number), '') ELSE NULL END,
    CASE WHEN p_invoice_type = 'corporate' THEN nullif(btrim(p_company_name), '') ELSE NULL END,
    CASE WHEN p_invoice_type = 'corporate' THEN nullif(btrim(p_tax_office), '') ELSE NULL END,
    btrim(p_billing_address),
    btrim(p_city),
    btrim(p_district)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    invoice_type = EXCLUDED.invoice_type,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    identity_number = EXCLUDED.identity_number,
    tax_number = EXCLUDED.tax_number,
    company_name = EXCLUDED.company_name,
    tax_office = EXCLUDED.tax_office,
    billing_address = EXCLUDED.billing_address,
    city = EXCLUDED.city,
    district = EXCLUDED.district;

  INSERT INTO public.billing_orders (
    user_id,
    plan_id,
    billing_cycle,
    status,
    distance_sales_accepted_at,
    cancellation_policy_accepted_at
  ) VALUES (
    p_user_id,
    p_plan_id,
    p_billing_cycle,
    'draft',
    now(),
    now()
  )
  ON CONFLICT (user_id) WHERE status = 'draft'
  DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    billing_cycle = EXCLUDED.billing_cycle,
    distance_sales_accepted_at = EXCLUDED.distance_sales_accepted_at,
    cancellation_policy_accepted_at = EXCLUDED.cancellation_policy_accepted_at
  RETURNING id INTO v_order_id;

  INSERT INTO public.billing_order_details (
    order_id,
    invoice_type,
    full_name,
    email,
    phone,
    identity_number,
    tax_number,
    company_name,
    tax_office,
    billing_address,
    city,
    district
  ) VALUES (
    v_order_id,
    p_invoice_type,
    btrim(p_full_name),
    lower(btrim(p_email)),
    btrim(p_phone),
    CASE WHEN p_invoice_type = 'individual' THEN nullif(btrim(p_identity_number), '') ELSE NULL END,
    CASE WHEN p_invoice_type = 'corporate' THEN nullif(btrim(p_tax_number), '') ELSE NULL END,
    CASE WHEN p_invoice_type = 'corporate' THEN nullif(btrim(p_company_name), '') ELSE NULL END,
    CASE WHEN p_invoice_type = 'corporate' THEN nullif(btrim(p_tax_office), '') ELSE NULL END,
    btrim(p_billing_address),
    btrim(p_city),
    btrim(p_district)
  )
  ON CONFLICT ON CONSTRAINT billing_order_details_pkey DO UPDATE SET
    invoice_type = EXCLUDED.invoice_type,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    identity_number = EXCLUDED.identity_number,
    tax_number = EXCLUDED.tax_number,
    company_name = EXCLUDED.company_name,
    tax_office = EXCLUDED.tax_office,
    billing_address = EXCLUDED.billing_address,
    city = EXCLUDED.city,
    district = EXCLUDED.district;

  RETURN QUERY
  SELECT orders.id, orders.status, orders.created_at, orders.updated_at
  FROM public.billing_orders AS orders
  WHERE orders.id = v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_payment_receipt_document(
  p_user_id uuid,
  p_order_id uuid,
  p_merchant jsonb
)
RETURNS TABLE(
  document_id uuid,
  document_status text,
  receipt_number text,
  document_created_at timestamptz,
  reused boolean
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_order public.billing_orders%ROWTYPE;
  v_details public.billing_order_details%ROWTYPE;
  v_existing public.billing_documents%ROWTYPE;
  v_document_id uuid := gen_random_uuid();
  v_document_number text;
  v_payload jsonb;
BEGIN
  IF jsonb_typeof(p_merchant) <> 'object'
    OR nullif(btrim(p_merchant->>'legalName'), '') IS NULL
    OR nullif(btrim(p_merchant->>'taxNumber'), '') IS NULL
    OR nullif(btrim(p_merchant->>'taxOffice'), '') IS NULL
    OR nullif(btrim(p_merchant->>'address'), '') IS NULL
    OR nullif(btrim(p_merchant->>'phone'), '') IS NULL
  THEN
    RAISE EXCEPTION 'Merchant billing configuration is incomplete';
  END IF;

  SELECT orders.*
    INTO v_order
  FROM public.billing_orders AS orders
  WHERE orders.id = p_order_id AND orders.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Billing order not found';
  END IF;

  IF v_order.status <> 'paid'
    OR v_order.total_amount IS NULL
    OR v_order.subtotal_amount IS NULL
    OR v_order.vat_rate IS NULL
    OR v_order.vat_amount IS NULL
    OR v_order.paid_at IS NULL
    OR nullif(btrim(v_order.payment_provider), '') IS NULL
    OR nullif(btrim(v_order.provider_payment_id), '') IS NULL
  THEN
    RAISE EXCEPTION 'A verified paid order with complete amounts is required';
  END IF;

  SELECT details.*
    INTO v_details
  FROM public.billing_order_details AS details
  WHERE details.order_id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Billing order details not found';
  END IF;

  SELECT documents.*
    INTO v_existing
  FROM public.billing_documents AS documents
  WHERE documents.order_id = p_order_id
    AND documents.document_type = 'payment_receipt';

  IF FOUND THEN
    RETURN QUERY
    SELECT
      v_existing.id,
      v_existing.status,
      v_existing.document_number,
      v_existing.created_at,
      true;
    RETURN;
  END IF;

  v_document_number := concat(
    'FC-DK-',
    to_char(v_order.paid_at AT TIME ZONE 'Europe/Istanbul', 'YYYYMMDD'),
    '-',
    upper(substr(replace(v_document_id::text, '-', ''), 1, 10))
  );

  v_payload := jsonb_strip_nulls(jsonb_build_object(
    'schemaVersion', 1,
    'documentType', 'payment_receipt',
    'documentNumber', v_document_number,
    'orderId', v_order.id,
    'planId', v_order.plan_id,
    'billingCycle', v_order.billing_cycle,
    'currency', v_order.currency,
    'subtotalAmount', v_order.subtotal_amount,
    'vatRate', v_order.vat_rate,
    'vatAmount', v_order.vat_amount,
    'totalAmount', v_order.total_amount,
    'paidAt', v_order.paid_at,
    'payment', jsonb_strip_nulls(jsonb_build_object(
      'provider', v_order.payment_provider,
      'reference', v_order.provider_payment_id,
      'methodType', v_order.payment_method_type,
      'installmentCount', v_order.installment_count
    )),
    'customer', jsonb_strip_nulls(jsonb_build_object(
      'invoiceType', v_details.invoice_type,
      'displayName', CASE
        WHEN v_details.invoice_type = 'corporate' THEN v_details.company_name
        ELSE v_details.full_name
      END,
      'email', v_details.email,
      'phone', v_details.phone,
      'city', v_details.city,
      'district', v_details.district
    )),
    'merchant', p_merchant
  ));

  INSERT INTO public.billing_documents (
    id,
    order_id,
    user_id,
    document_type,
    document_number,
    status,
    document_payload
  ) VALUES (
    v_document_id,
    p_order_id,
    p_user_id,
    'payment_receipt',
    v_document_number,
    'queued',
    v_payload
  );

  RETURN QUERY
  SELECT
    v_document_id,
    'queued'::text,
    v_document_number,
    now(),
    false;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_billing_document(
  p_document_id uuid,
  p_file_path text,
  p_file_size_bytes bigint,
  p_file_sha256 text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_status text;
BEGIN
  IF nullif(btrim(p_file_path), '') IS NULL
    OR p_file_size_bytes <= 0
    OR p_file_sha256 !~ '^[a-f0-9]{64}$'
  THEN
    RAISE EXCEPTION 'Invalid billing document file metadata';
  END IF;

  SELECT documents.status
    INTO v_status
  FROM public.billing_documents AS documents
  WHERE documents.id = p_document_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Billing document not found';
  END IF;

  IF v_status = 'completed' THEN
    RETURN false;
  END IF;

  IF v_status NOT IN ('queued', 'processing') THEN
    RAISE EXCEPTION 'Billing document cannot be completed from status %', v_status;
  END IF;

  UPDATE public.billing_documents
  SET status = 'completed',
      file_path = p_file_path,
      file_size_bytes = p_file_size_bytes,
      file_sha256 = p_file_sha256,
      error_message = NULL,
      completed_at = now()
  WHERE id = p_document_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.set_billing_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_billing_updated_at() TO service_role;

REVOKE ALL ON FUNCTION public.protect_billing_document_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.protect_billing_document_snapshot() TO service_role;

REVOKE ALL ON FUNCTION public.save_billing_checkout_draft(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_billing_checkout_draft(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text
) TO service_role;

REVOKE ALL ON FUNCTION public.create_payment_receipt_document(uuid, uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_payment_receipt_document(uuid, uuid, jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.complete_billing_document(uuid, text, bigint, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_billing_document(uuid, text, bigint, text)
  TO service_role;

NOTIFY pgrst, 'reload schema';
