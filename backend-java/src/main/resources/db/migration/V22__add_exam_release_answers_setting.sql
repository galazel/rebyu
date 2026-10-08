ALTER TABLE public.exams
    ADD COLUMN IF NOT EXISTS release_answers_after_submit BOOLEAN;
