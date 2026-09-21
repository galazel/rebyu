-- Institution groups become departments, and the staff accounts that run
-- them become department heads -- in the schema, not just the labels.
--
-- Everything here is a RENAME: rows, foreign keys, indexes and constraints
-- are kept; only names change. Each step is guarded so the migration is safe
-- to re-run and safe on a database that was already partly renamed.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- ---- tables ------------------------------------------------------
    IF to_regclass('public.institution_groups') IS NOT NULL AND to_regclass('public.departments') IS NULL THEN
        ALTER TABLE public.institution_groups RENAME TO departments;
    END IF;
    IF to_regclass('public.institution_group_authorities') IS NOT NULL AND to_regclass('public.department_head_assignments') IS NULL THEN
        ALTER TABLE public.institution_group_authorities RENAME TO department_head_assignments;
    END IF;
    IF to_regclass('public.institution_group_assignees') IS NOT NULL AND to_regclass('public.department_learners') IS NULL THEN
        ALTER TABLE public.institution_group_assignees RENAME TO department_learners;
    END IF;
    IF to_regclass('public.group_announcements') IS NOT NULL AND to_regclass('public.department_announcements') IS NULL THEN
        ALTER TABLE public.group_announcements RENAME TO department_announcements;
    END IF;
    IF to_regclass('public.institution_members') IS NOT NULL AND to_regclass('public.department_heads') IS NULL THEN
        ALTER TABLE public.institution_members RENAME TO department_heads;
    END IF;

    -- ---- primary keys ------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='departments' AND column_name='institution_group_id') THEN
        ALTER TABLE public.departments RENAME COLUMN institution_group_id TO department_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='departments' AND column_name='group_name') THEN
        ALTER TABLE public.departments RENAME COLUMN group_name TO department_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='departments' AND column_name='group_description') THEN
        ALTER TABLE public.departments RENAME COLUMN group_description TO department_description;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='department_head_assignments' AND column_name='institution_group_authority_id') THEN
        ALTER TABLE public.department_head_assignments RENAME COLUMN institution_group_authority_id TO department_head_assignment_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='department_learners' AND column_name='institution_group_assignee_id') THEN
        ALTER TABLE public.department_learners RENAME COLUMN institution_group_assignee_id TO department_learner_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='department_announcements' AND column_name='group_announcement_id') THEN
        ALTER TABLE public.department_announcements RENAME COLUMN group_announcement_id TO department_announcement_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='department_heads' AND column_name='institution_member_id') THEN
        ALTER TABLE public.department_heads RENAME COLUMN institution_member_id TO department_head_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='department_heads' AND column_name='member_role') THEN
        ALTER TABLE public.department_heads RENAME COLUMN member_role TO head_role;
    END IF;

    -- ---- foreign-key columns, wherever they are ----------------------
    FOR r IN
        SELECT table_name FROM information_schema.columns
        WHERE table_schema = 'public' AND column_name = 'institution_group_id'
    LOOP
        EXECUTE format('ALTER TABLE public.%I RENAME COLUMN institution_group_id TO department_id', r.table_name);
    END LOOP;
    FOR r IN
        SELECT table_name FROM information_schema.columns
        WHERE table_schema = 'public' AND column_name = 'owner_group_id'
    LOOP
        EXECUTE format('ALTER TABLE public.%I RENAME COLUMN owner_group_id TO owner_department_id', r.table_name);
    END LOOP;

    -- ---- sequences (so new tables' defaults read naturally) ----------
    IF to_regclass('public.institution_groups_institution_group_id_seq') IS NOT NULL THEN
        ALTER SEQUENCE public.institution_groups_institution_group_id_seq RENAME TO departments_department_id_seq;
    END IF;
    IF to_regclass('public.institution_group_authorities_institution_group_authority_id_seq') IS NOT NULL THEN
        ALTER SEQUENCE public.institution_group_authorities_institution_group_authority_id_seq RENAME TO department_head_assignments_department_head_assignment_id_seq;
    END IF;
    IF to_regclass('public.institution_group_assignees_institution_group_assignee_id_seq') IS NOT NULL THEN
        ALTER SEQUENCE public.institution_group_assignees_institution_group_assignee_id_seq RENAME TO department_learners_department_learner_id_seq;
    END IF;
    IF to_regclass('public.group_announcements_group_announcement_id_seq') IS NOT NULL THEN
        ALTER SEQUENCE public.group_announcements_group_announcement_id_seq RENAME TO department_announcements_department_announcement_id_seq;
    END IF;
    IF to_regclass('public.institution_members_institution_member_id_seq') IS NOT NULL THEN
        ALTER SEQUENCE public.institution_members_institution_member_id_seq RENAME TO department_heads_department_head_id_seq;
    END IF;

    -- ---- indexes / constraints named after the old tables ------------
    FOR r IN
        SELECT indexname FROM pg_indexes
        WHERE schemaname = 'public'
          AND (indexname LIKE '%institution_group%' OR indexname LIKE '%group_announcement%'
               OR indexname LIKE '%institution_member%' OR indexname LIKE '%owner_group%')
    LOOP
        EXECUTE format('ALTER INDEX public.%I RENAME TO %I', r.indexname,
            replace(replace(replace(replace(replace(replace(replace(replace(r.indexname,
                'institution_group_authorities', 'department_head_assignments'),
                'institution_group_authority', 'department_head_assignment'),
                'institution_group_assignees', 'department_learners'),
                'institution_group_assignee', 'department_learner'),
                'institution_group', 'department'),
                'group_announcement', 'department_announcement'),
                'institution_member', 'department_head'),
                'owner_group', 'owner_department'));
    END LOOP;
    FOR r IN
        SELECT c.conname, t.relname FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND (c.conname LIKE '%institution_group%' OR c.conname LIKE '%group_announcement%'
               OR c.conname LIKE '%institution_member%' OR c.conname LIKE '%owner_group%')
    LOOP
        EXECUTE format('ALTER TABLE public.%I RENAME CONSTRAINT %I TO %I', r.relname, r.conname,
            replace(replace(replace(replace(replace(replace(replace(replace(r.conname,
                'institution_group_authorities', 'department_head_assignments'),
                'institution_group_authority', 'department_head_assignment'),
                'institution_group_assignees', 'department_learners'),
                'institution_group_assignee', 'department_learner'),
                'institution_group', 'department'),
                'group_announcement', 'department_announcement'),
                'institution_member', 'department_head'),
                'owner_group', 'owner_department'));
    END LOOP;
END $$;

-- The login role of a non-owner institution account.
UPDATE public.user_types SET user_type_text = 'DEPARTMENT_HEAD' WHERE user_type_text = 'INSTITUTION_MEMBER';
