-- Study circles become public or private.
--
-- A private circle's posts are visible only to its members: they are filtered
-- out of the community feed, and out of a single-post read, for anyone who is
-- not in it. The circle itself stays listed either way, so it can still be
-- found and joined -- what is private is what was said inside, not that the
-- room exists.
--
-- Every circle that existed before this column was public in effect, so PUBLIC
-- is both the default and the backfill: no circle changes who can read it by
-- being migrated. The queries still COALESCE the value, because this schema is
-- also built by Hibernate ddl-auto in some environments, where the column
-- arrives without this default.

ALTER TABLE community_circles
    ADD COLUMN IF NOT EXISTS visibility varchar(16) NOT NULL DEFAULT 'PUBLIC';

UPDATE community_circles SET visibility = 'PUBLIC' WHERE visibility IS NULL;
