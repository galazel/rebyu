ALTER TABLE public.questions
    ADD COLUMN IF NOT EXISTS created_by BIGINT NULL REFERENCES public.users(user_id),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_questions_created_by ON public.questions(created_by);
