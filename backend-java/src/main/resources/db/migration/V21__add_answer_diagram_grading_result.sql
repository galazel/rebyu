ALTER TABLE public.assessment_attempt_answers
    ADD COLUMN IF NOT EXISTS diagram_grading_result TEXT;
