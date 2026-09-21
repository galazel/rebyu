-- B2B invoices: one per approved partnership request, priced per learner
-- slot. The line items snapshot the certification title, slots, unit price
-- and the access window so the invoice reads the same years later even if
-- the certification is renamed or the price changes.

CREATE TABLE IF NOT EXISTS public.institution_invoices (
    institution_invoice_id  BIGSERIAL PRIMARY KEY,
    institution_id          BIGINT        NOT NULL REFERENCES public.institutions (institution_id),
    invoice_number          VARCHAR(50)   NOT NULL UNIQUE,
    invoice_type            VARCHAR(30)   NOT NULL DEFAULT 'initial_access',
    partnership_request_id  BIGINT        REFERENCES public.partnership_requests (request_id),
    bill_to_name            VARCHAR(150)  NOT NULL,
    bill_to_email           VARCHAR(254)  NOT NULL,
    currency                VARCHAR(3)    NOT NULL DEFAULT 'PHP',
    subtotal                NUMERIC(12,2) NOT NULL,
    discount_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_rate                NUMERIC(5,2)  NOT NULL DEFAULT 0,
    tax_amount              NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount            NUMERIC(12,2) NOT NULL,
    issued_at               TIMESTAMP     NOT NULL DEFAULT now(),
    due_at                  TIMESTAMP,
    payment_reference       VARCHAR(100),
    payment_proof_key       VARCHAR(500),
    verified_by_user_id     BIGINT        REFERENCES public.users (user_id),
    paid_at                 TIMESTAMP,
    status                  VARCHAR(30)   NOT NULL DEFAULT 'issued'
);

CREATE INDEX IF NOT EXISTS ix_institution_invoices_institution
    ON public.institution_invoices (institution_id);
CREATE INDEX IF NOT EXISTS ix_institution_invoices_request
    ON public.institution_invoices (partnership_request_id);

CREATE TABLE IF NOT EXISTS public.institution_invoice_items (
    institution_invoice_item_id BIGSERIAL PRIMARY KEY,
    institution_invoice_id      BIGINT        NOT NULL REFERENCES public.institution_invoices (institution_invoice_id) ON DELETE CASCADE,
    certification_id            BIGINT        NOT NULL REFERENCES public.certifications (certification_id),
    certification_title         VARCHAR(150)  NOT NULL,
    learner_slots               INT           NOT NULL,
    unit_price                  NUMERIC(12,2) NOT NULL,
    line_total                  NUMERIC(12,2) NOT NULL,
    access_start_date           DATE,
    access_end_date             DATE
);

CREATE INDEX IF NOT EXISTS ix_institution_invoice_items_invoice
    ON public.institution_invoice_items (institution_invoice_id);
