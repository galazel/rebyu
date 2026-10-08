ALTER TABLE public.exams
    ADD COLUMN IF NOT EXISTS middle_category_id BIGINT
        REFERENCES public.middle_categories(middle_category_id);

ALTER TABLE public.exams
    ADD COLUMN IF NOT EXISTS major_category_id BIGINT
        REFERENCES public.major_categories(major_category_id);

ALTER TABLE public.exams
    ADD COLUMN IF NOT EXISTS target_scope VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_exams_middle_category ON public.exams(middle_category_id);
CREATE INDEX IF NOT EXISTS idx_exams_major_category ON public.exams(major_category_id);
