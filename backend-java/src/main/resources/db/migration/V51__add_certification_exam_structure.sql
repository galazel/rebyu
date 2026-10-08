ALTER TABLE certifications
    ADD COLUMN exam_structure JSONB;

COMMENT ON COLUMN certifications.exam_structure IS
    'AI-researched shape of the real exam: {total_items, question_types[], notes}. NULL means unknown.';
