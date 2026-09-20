-- REBYU: IRT proficiency overhaul (2026-09-21)
-- Run in the Supabase SQL editor BEFORE starting the backend built from this commit.
--
-- What changes:
--   * Static per-question points are gone. Every item is one observation.
--     Only an institution member's own paper may weight its questions, and
--     that weight lives on exam_questions.points (kept) and is snapshotted
--     onto assessment_attempt_questions.points (kept). questions.total_points
--     (NOT NULL, no default -- it would block every insert) is dropped.
--   * assessment_attempt_answers.earned_points becomes credit (0..1 share of
--     the item), which is what the AI/diagram/code graders already produce.
--   * assessment_attempts gains item_count / answered_count / correct_count.
--     total_points / earned_points stay, but are now null unless the paper
--     was weighted.
--   * question_item_parameters is gone: item difficulty comes from the
--     authored level alone (EASY -1.5, AVERAGE 0, HARD +1.5).
--
-- Hibernate (ddl-auto=update) adds the new columns on boot; this script
-- handles what it cannot: drops, the rename, and the backfill.

begin;

-- 1. Question points: the column blocks inserts, so it goes first.
alter table public.questions drop column if exists total_points;

-- 2. Answer credit: rename and rescale the partial credit that already exists.
--    Old rows held points earned out of the item's points; divide to get the
--    share. Items with no snapshot weight were worth one point.
alter table public.assessment_attempt_answers
    add column if not exists credit numeric(5, 4);

update public.assessment_attempt_answers ans
set credit = case
        when ans.earned_points is null then null
        when coalesce(q.points, 1) <= 0 then null
        else least(1, greatest(0, ans.earned_points / coalesce(q.points, 1)))
    end
from public.assessment_attempt_questions q
where q.attempt_question_id = ans.attempt_question_id
  and ans.credit is null;

alter table public.assessment_attempt_answers drop column if exists earned_points;

-- 3. Attempt counts, backfilled from the answers that exist.
alter table public.assessment_attempts
    add column if not exists item_count integer,
    add column if not exists answered_count integer,
    add column if not exists correct_count integer;

with tally as (
    select q.assessment_attempt_id,
           count(*)                                                      as items,
           count(ans.attempt_answer_id) filter (where
                 ans.selected_choice_id is not null
              or nullif(ans.learner_answer, '') is not null
              or nullif(ans.submitted_code, '') is not null
              or nullif(ans.diagram_submission_data, '') is not null)   as answered,
           count(*) filter (where ans.is_correct = true
                               or (ans.is_correct is distinct from true
                                   and ans.credit >= 0.60))            as correct
    from public.assessment_attempt_questions q
    left join public.assessment_attempt_answers ans
           on ans.attempt_question_id = q.attempt_question_id
    group by q.assessment_attempt_id
)
update public.assessment_attempts a
set item_count     = t.items,
    answered_count = t.answered,
    correct_count  = t.correct
from tally t
where t.assessment_attempt_id = a.assessment_attempt_id
  and a.item_count is null;

-- 4. Official attempts were never weighted: clear their totals so the result
--    screen shows a count, not a points line. An institution paper keeps them.
update public.assessment_attempts a
set total_points = null, earned_points = null
where not exists (
    select 1 from public.assessment_attempt_questions q
    where q.assessment_attempt_id = a.assessment_attempt_id and q.points is not null
);

-- 5. Item calibration table: difficulty is the authored level now.
drop table if exists public.question_item_parameters;

commit;
