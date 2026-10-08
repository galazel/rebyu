
ALTER TABLE public.assessment_attempt_questions
    ADD COLUMN IF NOT EXISTS flagged BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.assessment_attempt_questions
    ADD COLUMN IF NOT EXISTS skipped BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.assessment_attempts
    ADD COLUMN IF NOT EXISTS current_question_id BIGINT;

ALTER TABLE public.assessment_attempt_answers
    ADD COLUMN IF NOT EXISTS last_saved_at TIMESTAMP;
