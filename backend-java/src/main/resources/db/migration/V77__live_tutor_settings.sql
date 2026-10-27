CREATE TABLE IF NOT EXISTS live_tutor_settings (
    id BIGINT PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    daily_session_limit INTEGER NOT NULL DEFAULT 5,
    max_duration_seconds INTEGER NOT NULL DEFAULT 1800,
    voice_id VARCHAR(100) NOT NULL DEFAULT 'XrExE9yKIg1WjnnlVkGX',
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(255),
    CONSTRAINT ck_live_tutor_daily_limit CHECK (daily_session_limit BETWEEN 1 AND 1000),
    CONSTRAINT ck_live_tutor_duration CHECK (max_duration_seconds BETWEEN 60 AND 1800)
);
INSERT INTO live_tutor_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
