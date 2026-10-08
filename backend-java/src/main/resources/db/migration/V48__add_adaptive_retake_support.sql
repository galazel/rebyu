CREATE INDEX IF NOT EXISTS idx_questions_lesson_difficulty ON questions(lesson_id, difficulty_level);

ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS retake_basis TEXT NULL;
