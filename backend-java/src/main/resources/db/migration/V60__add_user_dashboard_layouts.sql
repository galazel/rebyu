CREATE TABLE user_dashboard_layouts (
    layout_id   BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    board       VARCHAR(40)  NOT NULL,
    tile_order  TEXT         NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_dashboard_layout_user_board UNIQUE (user_id, board)
);

CREATE INDEX idx_user_dashboard_layouts_user ON user_dashboard_layouts (user_id);
