
SELECT
    e.exam_id,
    e.title,
    e.certification_id,
    c.title as cert_title,
    et.exam_type_text
FROM exams e
JOIN certifications c ON c.certification_id = e.certification_id
JOIN exam_types et ON et.exam_type_id = e.exam_type_id
WHERE et.exam_type_text = 'MOCK_EXAM'
ORDER BY e.title, e.certification_id;


SELECT
    aa.assessment_attempt_id,
    aa.learner_id,
    aa.exam_id,
    e.title as exam_title,
    e.certification_id,
    c.title as cert_title,
    aa.percentage,
    aa.passed,
    aa.submitted_at
FROM assessment_attempts aa
JOIN exams e ON e.exam_id = aa.exam_id
JOIN certifications c ON c.certification_id = e.certification_id
WHERE e.title LIKE '%Mock%'
ORDER BY aa.learner_id, aa.submitted_at DESC;
