-- Garanti BBVA hosted virtual POS payment lifecycle.
-- Depends on 20260804112823_billing_foundation.sql.

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_plan_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'plus', 'pro', 'enterprise'));

CREATE TABLE IF NOT EXISTS public.billing_payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.billing_orders(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  provider text NOT NULL DEFAULT 'garanti_bbva'
    CHECK (provider = 'garanti_bbva'),
  provider_order_id text NOT NULL
    CHECK (provider_order_id ~ '^[A-Za-z0-9_-]{8,36}$'),
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN (
      'created',
      'redirected',
      'callback_received',
      'approved',
      'declined',
      'unknown',
      'reconciled',
      'voided',
      'refunded'
    )),
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency_code text NOT NULL DEFAULT '949' CHECK (currency_code = '949'),
  installment_count integer NOT NULL DEFAULT 1 CHECK (installment_count = 1),
  bank_response_code text CHECK (bank_response_code IS NULL OR char_length(bank_response_code) <= 16),
  bank_reference_number text
    CHECK (bank_reference_number IS NULL OR char_length(bank_reference_number) <= 128),
  authorization_code text
    CHECK (authorization_code IS NULL OR char_length(authorization_code) <= 64),
  callback_hash_verified_at timestamptz,
  callback_received_at timestamptz,
  reconciled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_payment_attempts_provider_order_unique
    UNIQUE (provider, provider_order_id)
);

CREATE INDEX IF NOT EXISTS billing_payment_attempts_order_created_idx
  ON public.billing_payment_attempts(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS billing_payment_attempts_user_created_idx
  ON public.billing_payment_attempts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS billing_payment_attempts_status_created_idx
  ON public.billing_payment_attempts(status, created_at ASC);

DROP TRIGGER IF EXISTS billing_payment_attempts_updated_at ON public.billing_payment_attempts;
CREATE TRIGGER billing_payment_attempts_updated_at
  BEFORE UPDATE ON public.billing_payment_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_billing_updated_at();

ALTER TABLE public.billing_payment_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_payment_attempts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.billing_payment_attempts TO service_role;

CREATE OR REPLACE FUNCTION public.start_garanti_payment(
  p_user_id uuid,
  p_order_id uuid,
  p_provider_order_id text,
  p_subtotal_amount numeric,
  p_vat_rate numeric,
  p_vat_amount numeric,
  p_total_amount numeric,
  p_amount_minor bigint
)
RETURNS TABLE(
  attempt_id uuid,
  order_id uuid,
  provider_order_id text,
  amount_minor bigint,
  reused boolean
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_order public.billing_orders%ROWTYPE;
  v_attempt public.billing_payment_attempts%ROWTYPE;
BEGIN
  IF p_amount_minor <= 0
    OR p_total_amount <= 0
    OR round(p_total_amount * 100)::bigint <> p_amount_minor
    OR p_subtotal_amount < 0
    OR p_vat_amount < 0
    OR p_vat_rate < 0
    OR p_vat_rate > 1
  THEN
    RAISE EXCEPTION 'Invalid billing amount';
  END IF;

  SELECT orders.*
    INTO v_order
  FROM public.billing_orders AS orders
  WHERE orders.id = p_order_id
    AND orders.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Billing order not found';
  END IF;

  IF v_order.status = 'paid' THEN
    RAISE EXCEPTION 'Billing order is already paid';
  END IF;

  IF v_order.status = 'payment_pending' THEN
    SELECT attempts.*
      INTO v_attempt
    FROM public.billing_payment_attempts AS attempts
    WHERE attempts.order_id = v_order.id
      AND attempts.status IN ('created', 'redirected', 'callback_received', 'unknown')
    ORDER BY attempts.created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
      IF v_attempt.amount_minor <> p_amount_minor THEN
        RAISE EXCEPTION 'Pending payment amount mismatch';
      END IF;

      RETURN QUERY SELECT
        v_attempt.id,
        v_attempt.order_id,
        v_attempt.provider_order_id,
        v_attempt.amount_minor,
        true;
      RETURN;
    END IF;
  END IF;

  IF v_order.status NOT IN ('draft', 'payment_failed', 'payment_pending') THEN
    RAISE EXCEPTION 'Billing order cannot start payment';
  END IF;

  UPDATE public.billing_orders
  SET
    status = 'payment_pending',
    currency = 'TRY',
    subtotal_amount = p_subtotal_amount,
    vat_rate = p_vat_rate,
    vat_amount = p_vat_amount,
    total_amount = p_total_amount,
    payment_provider = 'garanti_bbva',
    provider_payment_id = NULL,
    payment_method_type = 'card',
    installment_count = 1,
    payment_attempted_at = now()
  WHERE id = v_order.id;

  INSERT INTO public.billing_payment_attempts (
    order_id,
    user_id,
    provider_order_id,
    status,
    amount_minor,
    currency_code,
    installment_count
  ) VALUES (
    v_order.id,
    p_user_id,
    p_provider_order_id,
    'created',
    p_amount_minor,
    '949',
    1
  )
  RETURNING * INTO v_attempt;

  RETURN QUERY SELECT
    v_attempt.id,
    v_attempt.order_id,
    v_attempt.provider_order_id,
    v_attempt.amount_minor,
    false;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_garanti_payment(
  p_attempt_id uuid,
  p_result_status text,
  p_bank_response_code text,
  p_bank_reference_number text,
  p_authorization_code text
)
RETURNS TABLE(
  order_id uuid,
  user_id uuid,
  order_status text,
  plan_id text,
  subscription_end timestamptz,
  reused boolean
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_attempt public.billing_payment_attempts%ROWTYPE;
  v_order public.billing_orders%ROWTYPE;
  v_user public.users%ROWTYPE;
  v_subscription_base timestamptz;
  v_subscription_end timestamptz;
BEGIN
  IF p_result_status NOT IN ('approved', 'declined') THEN
    RAISE EXCEPTION 'Invalid payment result';
  END IF;

  SELECT attempts.*
    INTO v_attempt
  FROM public.billing_payment_attempts AS attempts
  WHERE attempts.id = p_attempt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment attempt not found';
  END IF;

  SELECT orders.*
    INTO v_order
  FROM public.billing_orders AS orders
  WHERE orders.id = v_attempt.order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Billing order not found';
  END IF;

  SELECT users.*
    INTO v_user
  FROM public.users AS users
  WHERE users.id = v_attempt.user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Billing user not found';
  END IF;

  IF v_attempt.status = 'approved' AND v_order.status = 'paid' THEN
    RETURN QUERY SELECT
      v_order.id,
      v_order.user_id,
      v_order.status,
      v_order.plan_id,
      v_user.subscription_end,
      true;
    RETURN;
  END IF;

  IF p_result_status = 'declined' THEN
    IF v_order.status <> 'paid' THEN
      UPDATE public.billing_payment_attempts
      SET
        status = 'declined',
        bank_response_code = nullif(btrim(p_bank_response_code), ''),
        callback_hash_verified_at = now(),
        callback_received_at = now()
      WHERE id = v_attempt.id;

      UPDATE public.billing_orders
      SET status = 'payment_failed'
      WHERE id = v_order.id;
    END IF;

    RETURN QUERY SELECT
      v_order.id,
      v_order.user_id,
      CASE WHEN v_order.status = 'paid' THEN 'paid' ELSE 'payment_failed' END,
      v_order.plan_id,
      v_user.subscription_end,
      v_order.status = 'paid';
    RETURN;
  END IF;

  IF v_order.status = 'paid' THEN
    RAISE EXCEPTION 'Different payment attempt already finalized this order';
  END IF;

  UPDATE public.billing_payment_attempts
  SET
    status = 'approved',
    bank_response_code = nullif(btrim(p_bank_response_code), ''),
    bank_reference_number = nullif(btrim(p_bank_reference_number), ''),
    authorization_code = nullif(btrim(p_authorization_code), ''),
    callback_hash_verified_at = now(),
    callback_received_at = now()
  WHERE id = v_attempt.id;

  UPDATE public.billing_orders
  SET
    status = 'paid',
    payment_provider = 'garanti_bbva',
    provider_payment_id = coalesce(
      nullif(btrim(p_bank_reference_number), ''),
      v_attempt.provider_order_id
    ),
    payment_method_type = 'card',
    installment_count = 1,
    paid_at = now()
  WHERE id = v_order.id;

  v_subscription_base := greatest(now(), coalesce(v_user.subscription_end, now()));
  v_subscription_end := CASE v_order.billing_cycle
    WHEN 'monthly' THEN v_subscription_base + interval '1 month'
    WHEN 'yearly' THEN v_subscription_base + interval '1 year'
    ELSE NULL
  END;

  IF v_subscription_end IS NULL THEN
    RAISE EXCEPTION 'Unsupported billing cycle';
  END IF;

  UPDATE public.users
  SET
    plan = v_order.plan_id,
    subscription_status = 'active',
    subscription_end = v_subscription_end,
    subscription_cancelled_at = NULL,
    updated_at = now()
  WHERE id = v_order.user_id;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    metadata
  ) VALUES (
    v_order.user_id,
    'subscription_started',
    'Paketiniz Aktif',
    CASE
      WHEN v_order.plan_id = 'pro' THEN 'Pro paketiniz başarıyla aktif edildi.'
      ELSE 'Plus paketiniz başarıyla aktif edildi.'
    END,
    '/dashboard',
    jsonb_build_object('orderId', v_order.id, 'planId', v_order.plan_id)
  );

  RETURN QUERY SELECT
    v_order.id,
    v_order.user_id,
    'paid'::text,
    v_order.plan_id,
    v_subscription_end,
    false;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.start_garanti_payment(
  uuid, uuid, text, numeric, numeric, numeric, numeric, bigint
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_garanti_payment(
  uuid, uuid, text, numeric, numeric, numeric, numeric, bigint
) TO service_role;

REVOKE EXECUTE ON FUNCTION public.finalize_garanti_payment(
  uuid, text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_garanti_payment(
  uuid, text, text, text, text
) TO service_role;
