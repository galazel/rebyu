-- Intentionally no account FK: cleanup must survive deletion of the account.
CREATE TABLE deletion_cleanup_tasks (
    cleanup_id BIGSERIAL PRIMARY KEY,
    kind VARCHAR(16) NOT NULL CHECK (kind IN ('FILE', 'BKT', 'AUTH')),
    target TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (kind, target)
);
