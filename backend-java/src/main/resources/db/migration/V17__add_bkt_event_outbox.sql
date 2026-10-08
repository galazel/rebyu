CREATE TABLE IF NOT EXISTS bkt_event_outbox (
    id                BIGSERIAL PRIMARY KEY,
    event_id          VARCHAR(200) NOT NULL,
    batch_id          VARCHAR(120),
    learner_id        BIGINT       NOT NULL,
    certification_id  BIGINT,
    exam_id           BIGINT,
    exam_result_id    BIGINT,
    attempt_no        INTEGER,
    event_type        VARCHAR(40)  NOT NULL DEFAULT 'MASTERY',
    payload_json      TEXT         NOT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    retry_count       INTEGER      NOT NULL DEFAULT 0,
    next_retry_at     TIMESTAMP,
    locked_at         TIMESTAMP,
    locked_by         VARCHAR(100),
    last_error        TEXT,
    created_at        TIMESTAMP    NOT NULL DEFAULT now(),
    processed_at      TIMESTAMP,
    CONSTRAINT uq_bkt_event_outbox_event_id UNIQUE (event_id),
    CONSTRAINT ck_bkt_event_outbox_status
        CHECK (status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD_LETTER'))
);

CREATE INDEX IF NOT EXISTS ix_bkt_outbox_status_retry
    ON bkt_event_outbox (status, next_retry_at, created_at);

CREATE INDEX IF NOT EXISTS ix_bkt_outbox_learner
    ON bkt_event_outbox (learner_id);
CREATE INDEX IF NOT EXISTS ix_bkt_outbox_exam_result
    ON bkt_event_outbox (exam_result_id, attempt_no);
