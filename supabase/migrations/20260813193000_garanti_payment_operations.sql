-- Garanti BBVA order reconciliation, void/refund lifecycle and durable alerts.
-- Depends on billing_foundation and garanti_payment_flow.

ALTER TABLE public.billing_orders DROP CONSTRAINT IF EXISTS billing_orders_status_check;
ALTER TABLE public.billing_orders
  ADD CONSTRAINT billing_orders_status_check CHECK (status IN (
    'draft',
    'payment_pending',
    'paid',
    'payment_failed',
    'cancelled',
    'partially_refunded',
    'refunded'
  ));

ALTER TABLE public.billing_orders
  ADD COLUMN IF NOT EXISTS refunded_amount_minor bigint NOT NULL DEFAULT 0
    CHECK (refunded_amount_minor >= 0),
  ADD COLUMN IF NOT EXISTS reversed_at timestamptz;

ALTER TABLE public.billing_payment_attempts DROP CONSTRAINT IF EXISTS billing_payment_attempts_status_check;
ALTER TABLE public.billing_payment_attempts
  ADD COLUMN IF NOT EXISTS customer_ip inet;

ALTER TABLE public.billing_payment_attempts
  ADD CONSTRAINT billing_payment_attempts_status_check CHECK (status IN (
    'created',
    'redirected',
    'callback_received',
    'approved',
    'declined',
    'unknown',
    'reconciled',
    'voided',
    'partially_refunded',
    'refunded',
    'manual_review'
  ));

CREATE TABLE IF NOT EXISTS public.billing_subscription_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.billing_orders(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  plan_id text NOT NULL CHECK (plan_id IN ('plus', 'pro')),
  previous_plan_id text NOT NULL CHECK (previous_plan_id IN ('free', 'plus', 'pro', 'enterprise')),
  previous_subscription_status text,
  previous_subscription_end timestamptz,
  granted_subscription_start timestamptz NOT NULL,
  granted_subscription_end timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  revoked_by_operation_id uuid,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_subscription_grants_order_unique UNIQUE (order_id),
  CONSTRAINT billing_subscription_grants_revocation_check CHECK (
    (status = 'active' AND revoked_by_operation_id IS NULL AND revoked_at IS NULL)
    OR
    (status = 'revoked' AND revoked_by_operation_id IS NOT NULL AND revoked_at IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.billing_payment_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.billing_orders(id) ON DELETE RESTRICT,
  attempt_id uuid NOT NULL REFERENCES public.billing_payment_attempts(id) ON DELETE RESTRICT,
  requested_by uuid REFERENCES public.users(id) ON DELETE RESTRICT,
  operation_type text NOT NULL CHECK (operation_type IN ('reconciliation', 'void', 'refund')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued',
    'processing',
    'verification_pending',
    'retry_scheduled',
    'succeeded',
    'declined',
    'manual_review',
    'failed'
  )),
  requested_amount_minor bigint NOT NULL CHECK (requested_amount_minor > 0),
  currency_code text NOT NULL DEFAULT '949' CHECK (currency_code = '949'),
  idempotency_key text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 8 AND 128),
  reason text CHECK (reason IS NULL OR char_length(reason) BETWEEN 3 AND 500),
  bank_response_code text CHECK (bank_response_code IS NULL OR char_length(bank_response_code) <= 16),
  bank_reason_code text CHECK (bank_reason_code IS NULL OR char_length(bank_reason_code) <= 32),
  bank_reference_number text CHECK (
    bank_reference_number IS NULL OR char_length(bank_reference_number) <= 128
  ),
  authorization_code text CHECK (authorization_code IS NULL OR char_length(authorization_code) <= 64),
  retry_count integer NOT NULL DEFAULT 0 CHECK (retry_count BETWEEN 0 AND 20),
  next_retry_at timestamptz,
  processing_started_at timestamptz,
  completed_at timestamptz,
  last_error_code text CHECK (last_error_code IS NULL OR char_length(last_error_code) <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_payment_operations_idempotency_unique UNIQUE (idempotency_key),
  CONSTRAINT billing_payment_operations_actor_check CHECK (
    (operation_type = 'reconciliation' AND requested_by IS NULL AND reason IS NULL)
    OR
    (operation_type IN ('void', 'refund') AND requested_by IS NOT NULL AND reason IS NOT NULL)
  )
);

ALTER TABLE public.billing_subscription_grants
  DROP CONSTRAINT IF EXISTS billing_subscription_grants_revoked_by_operation_id_fkey;
ALTER TABLE public.billing_subscription_grants
  ADD CONSTRAINT billing_subscription_grants_revoked_by_operation_id_fkey
  FOREIGN KEY (revoked_by_operation_id)
  REFERENCES public.billing_payment_operations(id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.billing_payment_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.billing_orders(id) ON DELETE RESTRICT,
  attempt_id uuid REFERENCES public.billing_payment_attempts(id) ON DELETE RESTRICT,
  operation_id uuid REFERENCES public.billing_payment_operations(id) ON DELETE RESTRICT,
  severity text NOT NULL CHECK (severity IN ('warning', 'critical')),
  code text NOT NULL CHECK (code ~ '^[A-Z0-9_]{3,100}$'),
  dedupe_key text NOT NULL UNIQUE CHECK (char_length(dedupe_key) BETWEEN 8 AND 200),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  message text NOT NULL CHECK (char_length(message) BETWEEN 3 AND 1000),
  safe_details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(safe_details) = 'object'),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  occurrence_count integer NOT NULL DEFAULT 1 CHECK (occurrence_count > 0),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_payment_operations_one_reconciliation_idx
  ON public.billing_payment_operations(attempt_id)
  WHERE operation_type = 'reconciliation';

CREATE INDEX IF NOT EXISTS billing_payment_operations_due_idx
  ON public.billing_payment_operations(status, next_retry_at, created_at)
  WHERE status IN ('queued', 'retry_scheduled', 'verification_pending', 'processing');

CREATE INDEX IF NOT EXISTS billing_payment_operations_order_idx
  ON public.billing_payment_operations(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS billing_payment_alerts_status_idx
  ON public.billing_payment_alerts(status, severity, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS billing_subscription_grants_user_idx
  ON public.billing_subscription_grants(user_id);
CREATE INDEX IF NOT EXISTS billing_subscription_grants_revoked_operation_idx
  ON public.billing_subscription_grants(revoked_by_operation_id)
  WHERE revoked_by_operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS billing_payment_operations_requested_by_idx
  ON public.billing_payment_operations(requested_by)
  WHERE requested_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS billing_payment_alerts_order_idx
  ON public.billing_payment_alerts(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS billing_payment_alerts_attempt_idx
  ON public.billing_payment_alerts(attempt_id) WHERE attempt_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS billing_payment_alerts_operation_idx
  ON public.billing_payment_alerts(operation_id) WHERE operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS billing_payment_alerts_acknowledged_by_idx
  ON public.billing_payment_alerts(acknowledged_by) WHERE acknowledged_by IS NOT NULL;

DROP TRIGGER IF EXISTS billing_subscription_grants_updated_at ON public.billing_subscription_grants;
CREATE TRIGGER billing_subscription_grants_updated_at
  BEFORE UPDATE ON public.billing_subscription_grants
  FOR EACH ROW EXECUTE FUNCTION public.set_billing_updated_at();

DROP TRIGGER IF EXISTS billing_payment_operations_updated_at ON public.billing_payment_operations;
CREATE TRIGGER billing_payment_operations_updated_at
  BEFORE UPDATE ON public.billing_payment_operations
  FOR EACH ROW EXECUTE FUNCTION public.set_billing_updated_at();

DROP TRIGGER IF EXISTS billing_payment_alerts_updated_at ON public.billing_payment_alerts;
CREATE TRIGGER billing_payment_alerts_updated_at
  BEFORE UPDATE ON public.billing_payment_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_billing_updated_at();

ALTER TABLE public.billing_subscription_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payment_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payment_alerts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.billing_subscription_grants FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.billing_payment_operations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.billing_payment_alerts FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON public.billing_subscription_grants TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.billing_payment_operations TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.billing_payment_alerts TO service_role;

-- Replace payment finalization so every entitlement mutation has a reversible,
-- immutable grant boundary. Replaying an approved callback stays idempotent.
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

  SELECT attempts.* INTO v_attempt
  FROM public.billing_payment_attempts AS attempts
  WHERE attempts.id = p_attempt_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment attempt not found'; END IF;

  SELECT orders.* INTO v_order
  FROM public.billing_orders AS orders
  WHERE orders.id = v_attempt.order_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Billing order not found'; END IF;

  SELECT users.* INTO v_user
  FROM public.users AS users
  WHERE users.id = v_attempt.user_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Billing user not found'; END IF;

  IF v_attempt.status IN ('approved', 'reconciled') AND v_order.status = 'paid' THEN
    RETURN QUERY SELECT v_order.id, v_order.user_id, v_order.status, v_order.plan_id,
      v_user.subscription_end, true;
    RETURN;
  END IF;

  IF p_result_status = 'declined' THEN
    IF v_order.status <> 'paid' THEN
      UPDATE public.billing_payment_attempts
      SET status = 'declined',
          bank_response_code = nullif(btrim(p_bank_response_code), ''),
          callback_hash_verified_at = coalesce(callback_hash_verified_at, now()),
          callback_received_at = coalesce(callback_received_at, now())
      WHERE id = v_attempt.id;
      UPDATE public.billing_orders SET status = 'payment_failed' WHERE id = v_order.id;
    END IF;
    RETURN QUERY SELECT v_order.id, v_order.user_id,
      CASE WHEN v_order.status = 'paid' THEN 'paid' ELSE 'payment_failed' END,
      v_order.plan_id, v_user.subscription_end, v_order.status = 'paid';
    RETURN;
  END IF;

  IF v_order.status = 'paid' THEN
    RAISE EXCEPTION 'Different payment attempt already finalized this order';
  END IF;

  v_subscription_base := greatest(now(), coalesce(v_user.subscription_end, now()));
  v_subscription_end := CASE v_order.billing_cycle
    WHEN 'monthly' THEN v_subscription_base + interval '1 month'
    WHEN 'yearly' THEN v_subscription_base + interval '1 year'
    ELSE NULL
  END;
  IF v_subscription_end IS NULL THEN RAISE EXCEPTION 'Unsupported billing cycle'; END IF;

  UPDATE public.billing_payment_attempts
  SET status = 'approved',
      bank_response_code = nullif(btrim(p_bank_response_code), ''),
      bank_reference_number = nullif(btrim(p_bank_reference_number), ''),
      authorization_code = nullif(btrim(p_authorization_code), ''),
      callback_hash_verified_at = coalesce(callback_hash_verified_at, now()),
      callback_received_at = coalesce(callback_received_at, now())
  WHERE id = v_attempt.id;

  UPDATE public.billing_orders
  SET status = 'paid', payment_provider = 'garanti_bbva',
      provider_payment_id = coalesce(nullif(btrim(p_bank_reference_number), ''), v_attempt.provider_order_id),
      payment_method_type = 'card', installment_count = 1, paid_at = coalesce(paid_at, now())
  WHERE id = v_order.id;

  INSERT INTO public.billing_subscription_grants (
    order_id, user_id, plan_id, previous_plan_id, previous_subscription_status,
    previous_subscription_end, granted_subscription_start, granted_subscription_end
  ) VALUES (
    v_order.id, v_order.user_id, v_order.plan_id, v_user.plan,
    v_user.subscription_status, v_user.subscription_end, v_subscription_base, v_subscription_end
  ) ON CONFLICT ON CONSTRAINT billing_subscription_grants_order_unique DO NOTHING;

  UPDATE public.users
  SET plan = v_order.plan_id, subscription_status = 'active', subscription_end = v_subscription_end,
      subscription_cancelled_at = NULL, updated_at = now()
  WHERE id = v_order.user_id;

  INSERT INTO public.notifications (user_id, type, title, message, action_url, metadata)
  VALUES (
    v_order.user_id, 'subscription_started', 'Paketiniz Aktif',
    CASE WHEN v_order.plan_id = 'pro' THEN 'Pro paketiniz başarıyla aktif edildi.'
         ELSE 'Plus paketiniz başarıyla aktif edildi.' END,
    '/dashboard', jsonb_build_object('orderId', v_order.id, 'planId', v_order.plan_id)
  );

  RETURN QUERY SELECT v_order.id, v_order.user_id, 'paid'::text, v_order.plan_id,
    v_subscription_end, false;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_garanti_reconciliation(
  p_attempt_id uuid,
  p_delay_seconds integer DEFAULT 120
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_attempt public.billing_payment_attempts%ROWTYPE;
  v_operation_id uuid;
BEGIN
  IF p_delay_seconds < 0 OR p_delay_seconds > 3600 THEN
    RAISE EXCEPTION 'Invalid reconciliation delay';
  END IF;
  SELECT attempts.* INTO v_attempt
  FROM public.billing_payment_attempts AS attempts
  WHERE attempts.id = p_attempt_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment attempt not found'; END IF;

  INSERT INTO public.billing_payment_operations (
    order_id, attempt_id, operation_type, requested_amount_minor,
    idempotency_key, status, next_retry_at
  ) VALUES (
    v_attempt.order_id, v_attempt.id, 'reconciliation', v_attempt.amount_minor,
    'reconcile:' || v_attempt.id::text, 'queued', now() + make_interval(secs => p_delay_seconds)
  )
  ON CONFLICT (idempotency_key) DO UPDATE
    SET status = CASE
          WHEN public.billing_payment_operations.status IN ('manual_review', 'failed', 'declined')
          THEN 'queued'
          ELSE public.billing_payment_operations.status
        END,
        retry_count = CASE
          WHEN public.billing_payment_operations.status IN ('manual_review', 'failed', 'declined')
          THEN 0 ELSE public.billing_payment_operations.retry_count
        END,
        next_retry_at = CASE
          WHEN public.billing_payment_operations.status = 'succeeded'
          THEN public.billing_payment_operations.next_retry_at
          ELSE least(
            coalesce(public.billing_payment_operations.next_retry_at, EXCLUDED.next_retry_at),
            EXCLUDED.next_retry_at
          )
        END,
        completed_at = CASE
          WHEN public.billing_payment_operations.status IN ('manual_review', 'failed', 'declined')
          THEN NULL ELSE public.billing_payment_operations.completed_at
        END,
        last_error_code = CASE
          WHEN public.billing_payment_operations.status IN ('manual_review', 'failed', 'declined')
          THEN NULL ELSE public.billing_payment_operations.last_error_code
        END
  RETURNING id INTO v_operation_id;
  RETURN v_operation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_garanti_reversal_operation(
  p_order_id uuid,
  p_requested_by uuid,
  p_amount_minor bigint,
  p_reason text,
  p_idempotency_key text
)
RETURNS TABLE(operation_id uuid, operation_type text, operation_status text, reused boolean)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_order public.billing_orders%ROWTYPE;
  v_attempt public.billing_payment_attempts%ROWTYPE;
  v_existing public.billing_payment_operations%ROWTYPE;
  v_type text;
  v_remaining bigint;
  v_operation_id uuid;
BEGIN
  IF char_length(btrim(p_reason)) < 3 OR char_length(btrim(p_reason)) > 500
    OR char_length(btrim(p_idempotency_key)) < 8 OR char_length(btrim(p_idempotency_key)) > 128
    OR p_amount_minor <= 0
  THEN RAISE EXCEPTION 'Invalid reversal request'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users AS users
    WHERE users.id = p_requested_by AND users.is_admin = true
  ) THEN RAISE EXCEPTION 'Admin authorization required'; END IF;

  SELECT operations.* INTO v_existing
  FROM public.billing_payment_operations AS operations
  WHERE operations.idempotency_key = btrim(p_idempotency_key);
  IF FOUND THEN
    IF v_existing.order_id <> p_order_id OR v_existing.requested_amount_minor <> p_amount_minor THEN
      RAISE EXCEPTION 'Idempotency key payload mismatch';
    END IF;
    RETURN QUERY SELECT v_existing.id, v_existing.operation_type, v_existing.status, true;
    RETURN;
  END IF;

  SELECT orders.* INTO v_order
  FROM public.billing_orders AS orders
  WHERE orders.id = p_order_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Billing order not found'; END IF;
  IF v_order.status NOT IN ('paid', 'partially_refunded') OR v_order.total_amount IS NULL THEN
    RAISE EXCEPTION 'Billing order is not reversible';
  END IF;

  SELECT attempts.* INTO v_attempt
  FROM public.billing_payment_attempts AS attempts
  WHERE attempts.order_id = v_order.id
    AND attempts.status IN ('approved', 'reconciled', 'partially_refunded')
  ORDER BY attempts.created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Approved payment attempt not found'; END IF;

  v_remaining := v_attempt.amount_minor - v_order.refunded_amount_minor;
  IF p_amount_minor > v_remaining THEN RAISE EXCEPTION 'Reversal amount exceeds remaining amount'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.billing_payment_operations AS operations
    WHERE operations.order_id = v_order.id
      AND operations.operation_type IN ('void', 'refund')
      AND operations.status IN ('queued', 'processing', 'verification_pending', 'retry_scheduled')
  ) THEN RAISE EXCEPTION 'A reversal is already pending'; END IF;

  v_type := CASE
    WHEN v_order.refunded_amount_minor = 0
      AND p_amount_minor = v_attempt.amount_minor
      AND p_amount_minor = v_remaining
      AND (v_order.paid_at AT TIME ZONE 'Europe/Istanbul')::date =
          (now() AT TIME ZONE 'Europe/Istanbul')::date
    THEN 'void'
    ELSE 'refund'
  END;

  INSERT INTO public.billing_payment_operations (
    order_id, attempt_id, requested_by, operation_type, status,
    requested_amount_minor, idempotency_key, reason, next_retry_at
  ) VALUES (
    v_order.id, v_attempt.id, p_requested_by, v_type, 'queued',
    p_amount_minor, btrim(p_idempotency_key), btrim(p_reason), now()
  ) RETURNING id INTO v_operation_id;

  RETURN QUERY SELECT v_operation_id, v_type, 'queued'::text, false;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_garanti_reconciliation(
  p_operation_id uuid,
  p_result_status text,
  p_bank_response_code text,
  p_bank_reference_number text,
  p_authorization_code text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_operation public.billing_payment_operations%ROWTYPE;
BEGIN
  IF p_result_status NOT IN ('approved', 'declined') THEN RAISE EXCEPTION 'Invalid result'; END IF;
  SELECT operations.* INTO v_operation
  FROM public.billing_payment_operations AS operations
  WHERE operations.id = p_operation_id AND operations.operation_type = 'reconciliation'
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reconciliation operation not found'; END IF;
  IF v_operation.status = 'succeeded' THEN RETURN; END IF;

  PERFORM public.finalize_garanti_payment(
    v_operation.attempt_id, p_result_status, p_bank_response_code,
    p_bank_reference_number, p_authorization_code
  );
  UPDATE public.billing_payment_operations
  SET status = 'succeeded', bank_response_code = nullif(btrim(p_bank_response_code), ''),
      bank_reference_number = nullif(btrim(p_bank_reference_number), ''),
      authorization_code = nullif(btrim(p_authorization_code), ''), completed_at = now(),
      next_retry_at = NULL, last_error_code = NULL
  WHERE id = v_operation.id;
  UPDATE public.billing_payment_attempts
  SET status = CASE WHEN p_result_status = 'approved' THEN 'reconciled' ELSE 'declined' END,
      reconciled_at = now()
  WHERE id = v_operation.attempt_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_garanti_reversal(
  p_operation_id uuid,
  p_bank_response_code text,
  p_bank_reference_number text,
  p_authorization_code text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_operation public.billing_payment_operations%ROWTYPE;
  v_order public.billing_orders%ROWTYPE;
  v_grant public.billing_subscription_grants%ROWTYPE;
  v_refunded bigint;
  v_full boolean;
BEGIN
  SELECT operations.* INTO v_operation
  FROM public.billing_payment_operations AS operations
  WHERE operations.id = p_operation_id AND operations.operation_type IN ('void', 'refund')
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reversal operation not found'; END IF;
  IF v_operation.status = 'succeeded' THEN RETURN; END IF;

  SELECT orders.* INTO v_order FROM public.billing_orders AS orders
  WHERE orders.id = v_operation.order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Billing order not found'; END IF;

  v_refunded := v_order.refunded_amount_minor + v_operation.requested_amount_minor;
  IF v_refunded > round(v_order.total_amount * 100)::bigint THEN
    RAISE EXCEPTION 'Reversal total exceeds paid amount';
  END IF;
  v_full := v_refunded = round(v_order.total_amount * 100)::bigint;

  UPDATE public.billing_payment_operations
  SET status = 'succeeded', bank_response_code = nullif(btrim(p_bank_response_code), ''),
      bank_reference_number = nullif(btrim(p_bank_reference_number), ''),
      authorization_code = nullif(btrim(p_authorization_code), ''), completed_at = now(),
      next_retry_at = NULL, last_error_code = NULL
  WHERE id = v_operation.id;

  UPDATE public.billing_orders
  SET refunded_amount_minor = v_refunded,
      status = CASE WHEN v_full AND v_operation.operation_type = 'void' THEN 'cancelled'
                    WHEN v_full THEN 'refunded' ELSE 'partially_refunded' END,
      reversed_at = CASE WHEN v_full THEN now() ELSE reversed_at END,
      invoice_status = CASE WHEN v_full AND invoice_status = 'pending' THEN 'cancelled' ELSE invoice_status END
  WHERE id = v_order.id;

  UPDATE public.billing_payment_attempts
  SET status = CASE WHEN v_full AND v_operation.operation_type = 'void' THEN 'voided'
                    WHEN v_full THEN 'refunded' ELSE 'partially_refunded' END
  WHERE id = v_operation.attempt_id;

  IF v_full THEN
    SELECT grants.* INTO v_grant
    FROM public.billing_subscription_grants AS grants
    WHERE grants.order_id = v_order.id FOR UPDATE;
    IF FOUND AND v_grant.status = 'active' THEN
      UPDATE public.billing_subscription_grants
      SET status = 'revoked', revoked_by_operation_id = v_operation.id, revoked_at = now()
      WHERE id = v_grant.id;

      -- Never let an old refund clobber a newer purchase. Revert only when the
      -- user's current entitlement still exactly matches this grant.
      UPDATE public.users
      SET plan = v_grant.previous_plan_id,
          subscription_status = coalesce(v_grant.previous_subscription_status, 'inactive'),
          subscription_end = v_grant.previous_subscription_end,
          updated_at = now()
      WHERE id = v_grant.user_id
        AND plan = v_grant.plan_id
        AND subscription_end = v_grant.granted_subscription_end
        AND NOT EXISTS (
          SELECT 1 FROM public.billing_subscription_grants AS newer
          WHERE newer.user_id = v_grant.user_id AND newer.status = 'active'
            AND newer.created_at > v_grant.created_at
        );
    END IF;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, action_url, metadata)
  VALUES (
    v_order.user_id, 'billing_reversal_completed',
    CASE WHEN v_full THEN 'Ödeme İadesi Tamamlandı' ELSE 'Kısmi İade Tamamlandı' END,
    CASE WHEN v_full THEN 'Ödemeniz için iptal/iade işlemi tamamlandı.'
         ELSE 'Ödemeniz için kısmi iade işlemi tamamlandı.' END,
    '/dashboard/settings',
    jsonb_build_object('orderId', v_order.id, 'operationId', v_operation.id,
      'amountMinor', v_operation.requested_amount_minor)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.acknowledge_billing_payment_alert(
  p_alert_id uuid,
  p_admin_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users AS users
    WHERE users.id = p_admin_user_id AND users.is_admin = true
  ) THEN RAISE EXCEPTION 'Admin authorization required'; END IF;
  UPDATE public.billing_payment_alerts
  SET status = 'acknowledged', acknowledged_by = p_admin_user_id,
      acknowledged_at = now(), resolved_at = NULL
  WHERE id = p_alert_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment alert not found'; END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.finalize_garanti_payment(uuid, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_garanti_reconciliation(uuid, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_garanti_reversal_operation(uuid, uuid, bigint, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_garanti_reconciliation(uuid, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_garanti_reversal(uuid, text, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.acknowledge_billing_payment_alert(uuid, uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.finalize_garanti_payment(uuid, text, text, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_garanti_reconciliation(uuid, integer)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.create_garanti_reversal_operation(uuid, uuid, bigint, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_garanti_reconciliation(uuid, text, text, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_garanti_reversal(uuid, text, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.acknowledge_billing_payment_alert(uuid, uuid)
  TO service_role;
