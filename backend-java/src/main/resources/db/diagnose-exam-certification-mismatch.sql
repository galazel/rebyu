-- Diagnostic: Find mock exams and their certification assignments
-- This helps identify cross-certification data leaks where attempts
-- on one certification's mock appear under a different certification's analytics.

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

-- If you see duplicate titles with different certification_ids, that's the problem.
-- Example output (bad):
--   exam_id | title       | certification_id | cert_title  | exam_type_text
--   123     | Mock Exam   | 4                | IT Passport | MOCK_EXAM
--   456     | Mock Exam   | 13               | TOPCIT      | MOCK_EXAM
--
-- This means attempts on exam 123 should appear under cert 4's analytics,
-- but if someone's attempt shows up under cert 13, exam 123's certification_id
-- might be wrong (should be 4, not 13).

-- To find attempts that are leaking across certifications:
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
