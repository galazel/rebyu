ALTER TABLE public.programming_test_cases
    ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.assessment_attempt_executions (
    execution_id           BIGSERIAL   PRIMARY KEY,
    assessment_attempt_id  BIGINT      NOT NULL REFERENCES public.assessment_attempts(assessment_attempt_id),
    attempt_question_id    BIGINT      NOT NULL REFERENCES public.assessment_attempt_questions(attempt_question_id),
    mode                   VARCHAR(10) NOT NULL,
    language               VARCHAR(30),
    submitted_code         TEXT,
    status                 VARCHAR(30) NOT NULL,
    passed_tests           INTEGER,
    total_tests            INTEGER,
    output                 TEXT,
    created_at             TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attempt_executions_question
    ON public.assessment_attempt_executions(attempt_question_id, created_at DESC);
