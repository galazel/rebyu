
CREATE TABLE IF NOT EXISTS public.institution_sections (
    section_id            BIGSERIAL PRIMARY KEY,
    institution_group_id  BIGINT       NOT NULL REFERENCES public.institution_groups (institution_group_id) ON DELETE CASCADE,
    section_name          VARCHAR(150) NOT NULL,
    description           TEXT,
    created_by            BIGINT       REFERENCES public.users (user_id),
    created_at            TIMESTAMP    NOT NULL DEFAULT now(),
    status                VARCHAR(20)  NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS ix_institution_sections_group
    ON public.institution_sections (institution_group_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_institution_sections_group_name_active
    ON public.institution_sections (institution_group_id, lower(section_name))
    WHERE status = 'active';

ALTER TABLE public.learner_invitations
    ADD COLUMN IF NOT EXISTS section_id BIGINT REFERENCES public.institution_sections (section_id) ON DELETE SET NULL;

ALTER TABLE public.institution_group_assignees
    ADD COLUMN IF NOT EXISTS section_id BIGINT REFERENCES public.institution_sections (section_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_group_assignees_section
    ON public.institution_group_assignees (section_id);
