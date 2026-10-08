
ALTER TABLE learners
    ADD COLUMN IF NOT EXISTS avatar_key varchar(512);
