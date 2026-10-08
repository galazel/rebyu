ALTER TABLE public.assessment_attempt_answers
    ADD COLUMN IF NOT EXISTS execution_result TEXT;
