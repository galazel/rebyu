
ALTER TABLE community_circles
    ADD COLUMN IF NOT EXISTS visibility varchar(16) NOT NULL DEFAULT 'PUBLIC';

UPDATE community_circles SET visibility = 'PUBLIC' WHERE visibility IS NULL;
