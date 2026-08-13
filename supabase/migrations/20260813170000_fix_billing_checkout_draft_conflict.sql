-- Fix PostgreSQL ambiguity between the RETURNS TABLE output variable `order_id`
-- and the billing_order_details.order_id conflict target.

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

REVOKE ALL ON FUNCTION public.save_billing_checkout_draft(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_billing_checkout_draft(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text
) TO service_role;

NOTIFY pgrst, 'reload schema';
