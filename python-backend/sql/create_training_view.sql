-- Rebyu BKT training view for PostgreSQL.
-- Applied at API startup by app/db/training_view.py (CREATE OR REPLACE).
--
-- 2026-09-20: rebuilt on the attempt engine's tables. The view used to read
-- learner_exam_details, which the attempt engine replaced and which was
-- dropped with the other dead tables on 2026-09-18 -- after which the view
-- could not be created and every training run failed with
-- `relation "rebyu_bkt_training_data_v" does not exist`.
--
-- One row per answered question of a submitted attempt. The lesson comes from
-- the served question's snapshot first (the adaptive runner records which
-- lesson it was drawing on), then from the source question. Answers still
-- awaiting manual grading have no verdict and are left out; pyBKT needs 0/1.
--
-- Only what still exists trains the model. Deleting a learner, a lesson or a
-- whole certification is a hard delete here, and the attempt rows can outlive
-- it, so each is joined back to its owner: a response whose learner, lesson
-- or certification is gone -- or whose account is no longer active -- drops
-- out of the training set on the next run.
--
-- Output columns are unchanged, so the training pipeline is untouched.

CREATE OR REPLACE VIEW rebyu_bkt_training_data_v AS
SELECT
    ROW_NUMBER() OVER (
        ORDER BY
            ans.answered_at,
            att.learner_id,
            att.exam_id,
            att.attempt_number,
            aq.attempt_question_id
    )::BIGINT AS attempt_order,
    att.learner_id::BIGINT AS learner_id,
    COALESCE(aq.lesson_id, q.lesson_id)::TEXT AS skill_name,
    aq.source_question_id::TEXT AS question_id,
    ans.is_correct::INTEGER AS is_correct,
    UPPER(q.difficulty_level)::TEXT AS difficulty_level,
    UPPER(et.exam_type_text)::TEXT AS assessment_type,
    ans.answered_at,
    e.certification_id::BIGINT AS certification_id,
    COALESCE(aq.lesson_id, q.lesson_id)::BIGINT AS lesson_id,
    att.exam_id::BIGINT AS exam_id,
    att.attempt_number::INTEGER AS attempt_no
FROM assessment_attempt_answers ans
JOIN assessment_attempt_questions aq
    ON aq.attempt_question_id = ans.attempt_question_id
JOIN assessment_attempts att
    ON att.assessment_attempt_id = ans.assessment_attempt_id
JOIN questions q
    ON q.question_id = aq.source_question_id
JOIN exams e
    ON e.exam_id = att.exam_id
JOIN exam_types et
    ON et.exam_type_id = e.exam_type_id
JOIN learners l
    ON l.learner_id = att.learner_id
JOIN users u
    ON u.user_id = l.user_id
JOIN lessons ls
    ON ls.lesson_id = COALESCE(aq.lesson_id, q.lesson_id)
JOIN certifications c
    ON c.certification_id = e.certification_id
WHERE att.status = 'SUBMITTED'
  AND u.account_status = 'active'
  AND ans.is_correct IS NOT NULL
  AND ans.answered_at IS NOT NULL
  AND COALESCE(aq.lesson_id, q.lesson_id) IS NOT NULL;

COMMENT ON VIEW rebyu_bkt_training_data_v IS
'Chronological learner response data consumed by the Rebyu FastAPI BKT service.';
