ALTER TABLE public.major_categories
    ADD COLUMN IF NOT EXISTS owner_group_id BIGINT NULL
        REFERENCES public.institution_groups(institution_group_id);

CREATE INDEX IF NOT EXISTS idx_major_categories_owner_group
    ON public.major_categories(owner_group_id);
