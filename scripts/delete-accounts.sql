-- ============================================================================
-- Delete REBYU accounts by email, with everything that depends on them.
--
-- Mirrors CascadeDeleteService:
--   * attribution columns (created_by, invited_by, assigned_by, ...) are
--     CLEARED where the column allows NULL, so other people's work survives;
--   * everything else is deleted deepest-first.
--
-- departments.created_by is NOT NULL, so a department created by one of these
-- users CANNOT be kept -- it is deleted together with its programs, sections,
-- learners and invitations. Read the counts from the dry run before committing.
--
-- Run in the Supabase SQL editor. The public. prefix matters: an unqualified
-- `users` resolves to Supabase's own auth.users, not yours.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------- the targets
-- EDIT THIS LIST. Everything below follows from it.
CREATE TEMP TABLE doomed_users ON COMMIT DROP AS
SELECT user_id FROM public.users
WHERE lower(email) IN (
    'gwapoivan123@gmail.com',
    'bantesting021@gmail.com',
    'bantesting022@gmail.com'
);

CREATE TEMP TABLE doomed_learners ON COMMIT DROP AS
SELECT learner_id FROM public.learners
WHERE user_id IN (SELECT user_id FROM doomed_users);

CREATE TEMP TABLE doomed_departments ON COMMIT DROP AS
SELECT department_id FROM public.departments
WHERE created_by IN (SELECT user_id FROM doomed_users);

CREATE TEMP TABLE doomed_sections ON COMMIT DROP AS
SELECT section_id FROM public.institution_sections
WHERE department_id IN (SELECT department_id FROM doomed_departments);

CREATE TEMP TABLE doomed_programs ON COMMIT DROP AS
SELECT program_id FROM public.department_programs
WHERE department_id IN (SELECT department_id FROM doomed_departments);

-- What is about to go. Check this before you commit.
SELECT 'users'       AS what, count(*) FROM doomed_users
UNION ALL SELECT 'learners',    count(*) FROM doomed_learners
UNION ALL SELECT 'departments', count(*) FROM doomed_departments
UNION ALL SELECT 'sections',    count(*) FROM doomed_sections
UNION ALL SELECT 'programs',    count(*) FROM doomed_programs;

-- ------------------------------------------- 1. clear attribution (kept, not deleted)
UPDATE public.institution_sections    SET created_by           = NULL WHERE created_by           IN (SELECT user_id FROM doomed_users);
UPDATE public.learner_invitations     SET invited_by           = NULL WHERE invited_by           IN (SELECT user_id FROM doomed_users);
UPDATE public.questions               SET created_by           = NULL WHERE created_by           IN (SELECT user_id FROM doomed_users);
UPDATE public.community_post_reports  SET reviewed_by_user_id  = NULL WHERE reviewed_by_user_id  IN (SELECT user_id FROM doomed_users);
UPDATE public.institution_files       SET uploaded_by_user_id  = NULL WHERE uploaded_by_user_id  IN (SELECT user_id FROM doomed_users);
UPDATE public.institution_invoices    SET verified_by_user_id  = NULL WHERE verified_by_user_id  IN (SELECT user_id FROM doomed_users);
UPDATE public.department_announcements SET created_by          = NULL WHERE created_by           IN (SELECT user_id FROM doomed_users);

-- content that merely points at the doomed department keeps existing
UPDATE public.exams            SET owner_department_id = NULL WHERE owner_department_id IN (SELECT department_id FROM doomed_departments);
UPDATE public.major_categories SET owner_department_id = NULL WHERE owner_department_id IN (SELECT department_id FROM doomed_departments);
UPDATE public.questions        SET owner_department_id = NULL WHERE owner_department_id IN (SELECT department_id FROM doomed_departments);

-- ------------------------------------------------ 2. the department subtree
-- order matters: sections before programs (institution_sections.program_id),
-- program certifications before programs.
DELETE FROM public.learner_invitations            WHERE section_id    IN (SELECT section_id    FROM doomed_sections);
DELETE FROM public.department_learners            WHERE section_id    IN (SELECT section_id    FROM doomed_sections);
DELETE FROM public.learner_invitations            WHERE department_id IN (SELECT department_id FROM doomed_departments);
DELETE FROM public.department_learners            WHERE department_id IN (SELECT department_id FROM doomed_departments);
DELETE FROM public.department_head_assignments    WHERE department_id IN (SELECT department_id FROM doomed_departments);
DELETE FROM public.department_head_invitations    WHERE department_id IN (SELECT department_id FROM doomed_departments);
DELETE FROM public.department_announcements       WHERE department_id IN (SELECT department_id FROM doomed_departments);
DELETE FROM public.department_certifications      WHERE department_id IN (SELECT department_id FROM doomed_departments);
DELETE FROM public.institution_sections           WHERE department_id IN (SELECT department_id FROM doomed_departments);
DELETE FROM public.department_program_certifications WHERE program_id IN (SELECT program_id    FROM doomed_programs);
DELETE FROM public.department_programs            WHERE department_id IN (SELECT department_id FROM doomed_departments);
DELETE FROM public.departments                    WHERE department_id IN (SELECT department_id FROM doomed_departments);

-- ------------------------------------------------------- 3. the users' own rows
DELETE FROM public.department_head_assignments WHERE user_id     IN (SELECT user_id FROM doomed_users);
DELETE FROM public.department_head_assignments WHERE assigned_by IN (SELECT user_id FROM doomed_users);
DELETE FROM public.department_head_invitations WHERE invited_by  IN (SELECT user_id FROM doomed_users);
DELETE FROM public.department_learners         WHERE assigned_by IN (SELECT user_id FROM doomed_users);
DELETE FROM public.department_heads            WHERE user_id     IN (SELECT user_id FROM doomed_users);
DELETE FROM public.notifications               WHERE user_id     IN (SELECT user_id FROM doomed_users);
DELETE FROM public.user_activity_days          WHERE user_id     IN (SELECT user_id FROM doomed_users);
DELETE FROM public.user_dashboard_layouts      WHERE user_id     IN (SELECT user_id FROM doomed_users);

-- ----------------------------------------------------- 4. the learner's own rows
DELETE FROM public.learner_reward_balances     WHERE learner_id IN (SELECT learner_id FROM doomed_learners);
DELETE FROM public.learner_dashboard_layouts   WHERE learner_id IN (SELECT learner_id FROM doomed_learners);
DELETE FROM public.notification_preference     WHERE learner_id IN (SELECT learner_id FROM doomed_learners);
DELETE FROM public.streak                      WHERE learner_id IN (SELECT learner_id FROM doomed_learners);

-- A learner who has actually used the system has rows in ~29 more tables
-- (assessment_attempts, learner_certifications, community_posts, ...). Those are
-- NOT listed here on purpose: if the delete below fails with a foreign key
-- violation, the error names the table, and that learner's data is worth a
-- second look before you remove it.
DELETE FROM public.learners                    WHERE learner_id IN (SELECT learner_id FROM doomed_learners);
DELETE FROM public.users                       WHERE user_id    IN (SELECT user_id    FROM doomed_users);

-- ------------------------------------------------- 5. Supabase's own auth table
-- Separate from public.users. Skipping this leaves the sign-in alive.
DELETE FROM auth.users WHERE lower(email) IN (
    'gwapoivan123@gmail.com',
    'bantesting021@gmail.com',
    'bantesting022@gmail.com'
);

-- Change to COMMIT once the counts above look right.
ROLLBACK;

-- ============================================================================
-- NOT COVERED: AWS Cognito.
--
-- The account also exists in the Cognito user pool, which is outside this
-- database. Deleting the rows above does not remove it -- the next sign-in with
-- a valid Cognito token recreates the public.users row from the JWT. Delete the
-- user in the AWS Cognito console as well, or it comes back.
-- ============================================================================
