-- An institution pays its invoice through PayMongo Hosted Checkout, the same
-- way a learner pays for Pro. The session is remembered so a refresh of the
-- success page can verify it and a second click reuses the open session.
ALTER TABLE public.institution_invoices
    ADD COLUMN IF NOT EXISTS checkout_session_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS checkout_url        TEXT,
    ADD COLUMN IF NOT EXISTS provider_payment_id VARCHAR(100);
