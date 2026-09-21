-- What a learner earns by passing a certification's mock exam: the
-- certification's badge and a certificate of completion. One row per
-- learner and certification; the timestamps say which has been granted, so
-- a retake never awards twice.
CREATE TABLE IF NOT EXISTS public.learner_certification_awards (
    award_id                BIGSERIAL PRIMARY KEY,
    learner_id              BIGINT      NOT NULL REFERENCES public.learners (learner_id) ON DELETE CASCADE,
    certification_id        BIGINT      NOT NULL REFERENCES public.certifications (certification_id) ON DELETE CASCADE,
    assessment_attempt_id   BIGINT      REFERENCES public.assessment_attempts (assessment_attempt_id) ON DELETE SET NULL,
    score_percentage        NUMERIC(5,2),
    badge_awarded_at        TIMESTAMP,
    certificate_number      VARCHAR(40) UNIQUE,
    certificate_awarded_at  TIMESTAMP,
    created_at              TIMESTAMP   NOT NULL DEFAULT now(),
    CONSTRAINT ux_learner_certification_award UNIQUE (learner_id, certification_id)
);
CREATE INDEX IF NOT EXISTS ix_learner_certification_awards_learner ON public.learner_certification_awards (learner_id);
