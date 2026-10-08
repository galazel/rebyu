ALTER TABLE public.exam_questions
    ADD COLUMN IF NOT EXISTS points NUMERIC(5, 2);
