
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
