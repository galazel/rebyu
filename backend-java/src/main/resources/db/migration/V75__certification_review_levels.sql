CREATE TABLE IF NOT EXISTS certification_review_levels (
    id BIGSERIAL PRIMARY KEY,
    level_number INTEGER NOT NULL UNIQUE,
    title VARCHAR(80) NOT NULL,
    required_xp BIGINT NOT NULL,
    description VARCHAR(220),
    image_key VARCHAR(512)
);
