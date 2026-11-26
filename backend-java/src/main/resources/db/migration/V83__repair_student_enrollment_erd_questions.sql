-- These legacy critical-thinking prompts ask for a drawing but have no diagram
-- configuration, so attempts render a text box. Reuse the matching ERD reference.
INSERT INTO diagram_question_configs
    (question_id, diagram_type, instructions, reference_diagram_json, reference_diagram_xml)
SELECT q.question_id, reference.diagram_type, reference.instructions,
       reference.reference_diagram_json, reference.reference_diagram_xml
FROM questions q
CROSS JOIN diagram_question_configs reference
WHERE reference.question_id = 23144
  AND q.question_id IN (23093, 23195)
  AND q.question_type = 'CRITICAL_THINKING'
  AND q.question_text LIKE '[Node 1, Problem 1] Draw an ERD for a student enrollment system%'
  AND NOT EXISTS (
      SELECT 1 FROM diagram_question_configs existing WHERE existing.question_id = q.question_id
  );

-- This newer ERD belongs to conceptual database design, not the introduction
-- to requirements engineering.
UPDATE questions
SET lesson_id = 375
WHERE question_id = 23144
  AND lesson_id = 363
  AND question_type = 'DIAGRAM'
  AND question_text LIKE 'Draw an ERD for a student enrollment system.%'
  AND EXISTS (SELECT 1 FROM lessons WHERE lesson_id = 375 AND name = 'Conceptual Database Design');
