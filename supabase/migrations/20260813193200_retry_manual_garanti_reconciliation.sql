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

REVOKE EXECUTE ON FUNCTION public.ensure_garanti_reconciliation(uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_garanti_reconciliation(uuid, integer)
  TO service_role;
