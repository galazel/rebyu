ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS attachment_key VARCHAR(500);
