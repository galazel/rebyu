CREATE TABLE IF NOT EXISTS learner_study_telemetry (
    learner_study_telemetry_id BIGSERIAL PRIMARY KEY,
    learner_id BIGINT NOT NULL REFERENCES learners(learner_id) ON DELETE CASCADE,
    lesson_id BIGINT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    event_type VARCHAR(32) NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    scroll_velocity INTEGER,
    correct_count INTEGER,
    question_count INTEGER,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_study_telemetry_learner_time
    ON learner_study_telemetry (learner_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_telemetry_lesson
    ON learner_study_telemetry (lesson_id, occurred_at DESC);
