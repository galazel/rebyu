ALTER TABLE public.exams
    ADD COLUMN IF NOT EXISTS learner_id BIGINT REFERENCES public.learners(learner_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_exams_learner ON public.exams(learner_id);
