
begin;

alter table public.questions drop column if exists total_points;

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

update public.assessment_attempts a
set total_points = null, earned_points = null
where not exists (
    select 1 from public.assessment_attempt_questions q
    where q.assessment_attempt_id = a.assessment_attempt_id and q.points is not null
);

drop table if exists public.question_item_parameters;

commit;
