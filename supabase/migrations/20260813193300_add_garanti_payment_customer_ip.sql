-- Garanti requires the original transaction customer IP in later VP requests.
-- It remains backend-only with the rest of the payment attempt context.
ALTER TABLE public.billing_payment_attempts
  ADD COLUMN IF NOT EXISTS customer_ip inet;
