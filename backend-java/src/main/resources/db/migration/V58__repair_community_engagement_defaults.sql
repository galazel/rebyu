
ALTER TABLE community_post_likes   ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE community_saved_posts  ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE community_comments     ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE community_comments     ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE community_circles        ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE community_circle_members ALTER COLUMN joined_at  SET DEFAULT now();

ALTER TABLE community_posts ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE community_posts ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE community_post_shares ALTER COLUMN created_at SET DEFAULT now();

