ALTER TABLE public.institution_invoices
    ADD COLUMN IF NOT EXISTS checkout_session_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS checkout_url        TEXT,
    ADD COLUMN IF NOT EXISTS provider_payment_id VARCHAR(100);
