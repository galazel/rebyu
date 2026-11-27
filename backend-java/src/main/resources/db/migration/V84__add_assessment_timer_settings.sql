CREATE TABLE assessment_timer_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    lesson_quiz_minutes INTEGER NOT NULL CHECK (lesson_quiz_minutes > 0),
    middle_exam_minutes INTEGER NOT NULL CHECK (middle_exam_minutes > 0),
    major_exam_minutes INTEGER NOT NULL CHECK (major_exam_minutes > 0)
);

INSERT INTO assessment_timer_settings (id, lesson_quiz_minutes, middle_exam_minutes, major_exam_minutes)
VALUES (1, 10, 30, 60);

ALTER TABLE assessment_timer_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE certifications
    ADD COLUMN diagnostic_minutes INTEGER CHECK (diagnostic_minutes > 0),
    ADD COLUMN mock_exam_minutes INTEGER CHECK (mock_exam_minutes > 0);
