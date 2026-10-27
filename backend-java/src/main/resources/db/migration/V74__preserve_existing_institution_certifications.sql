-- Bring existing active institution-assigned learners into the same lasting
-- certification enrollment model used for newly accepted invitations.
INSERT INTO learner_certifications (
    learner_id,
    certification_id,
    order_detail_id,
    enrolled_at,
    status
)
SELECT
    assignment.learner_id,
    allocation.certification_id,
    NULL,
    assignment.assigned_at,
    'active'
FROM institution_certification_learners assignment
JOIN institution_certificates allocation
    ON allocation.institution_cert_id = assignment.institution_cert_id
LEFT JOIN learner_certifications enrollment
    ON enrollment.learner_id = assignment.learner_id
    AND enrollment.certification_id = allocation.certification_id
    AND enrollment.status = 'active'
WHERE assignment.status = 'active'
  AND enrollment.learner_certification_id IS NULL;
