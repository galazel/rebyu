ALTER TABLE questions ADD COLUMN IF NOT EXISTS owner_group_id BIGINT NULL REFERENCES institution_groups(institution_group_id);
CREATE INDEX IF NOT EXISTS idx_questions_owner_group_id ON questions(owner_group_id);
