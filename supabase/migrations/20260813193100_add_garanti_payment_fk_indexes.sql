-- Cover foreign keys used by admin payment operations and alert joins.
CREATE INDEX IF NOT EXISTS billing_subscription_grants_user_idx
  ON public.billing_subscription_grants(user_id);
CREATE INDEX IF NOT EXISTS billing_subscription_grants_revoked_operation_idx
  ON public.billing_subscription_grants(revoked_by_operation_id)
  WHERE revoked_by_operation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS billing_payment_operations_requested_by_idx
  ON public.billing_payment_operations(requested_by)
  WHERE requested_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS billing_payment_alerts_order_idx
  ON public.billing_payment_alerts(order_id)
  WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS billing_payment_alerts_attempt_idx
  ON public.billing_payment_alerts(attempt_id)
  WHERE attempt_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS billing_payment_alerts_operation_idx
  ON public.billing_payment_alerts(operation_id)
  WHERE operation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS billing_payment_alerts_acknowledged_by_idx
  ON public.billing_payment_alerts(acknowledged_by)
  WHERE acknowledged_by IS NOT NULL;
