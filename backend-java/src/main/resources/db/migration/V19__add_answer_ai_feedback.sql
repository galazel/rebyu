ALTER TABLE public.assessment_attempt_answers
    ADD COLUMN IF NOT EXISTS feedback TEXT;

ALTER TABLE public.assessment_attempt_answers
    ADD COLUMN IF NOT EXISTS sub_answer_scores TEXT;
