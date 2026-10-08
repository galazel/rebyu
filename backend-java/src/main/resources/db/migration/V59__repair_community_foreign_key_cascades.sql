DO $$
DECLARE
    spec RECORD;
    existing RECORD;
BEGIN
    FOR spec IN
        SELECT * FROM (VALUES
            -- Children of a post: deleting the post clears its engagement.
            ('community_comments',      'post_id',           'community_posts',   'CASCADE'),
            ('community_post_likes',    'post_id',           'community_posts',   'CASCADE'),
            ('community_saved_posts',   'post_id',           'community_posts',   'CASCADE'),
            ('community_post_shares',   'post_id',           'community_posts',   'CASCADE'),
            ('community_post_reports',  'post_id',           'community_posts',   'CASCADE'),
            -- A reply chain dies with the comment it hangs from.
            ('community_comments',      'parent_comment_id', 'community_comments', 'CASCADE'),
            -- Membership dies with the circle; posts survive it, unparented.
            ('community_circle_members', 'circle_id',        'community_circles', 'CASCADE'),
            ('community_posts',          'circle_id',        'community_circles', 'SET NULL')
        ) AS t(child, col, parent, action)
    LOOP
        FOR existing IN
            SELECT c.conname
            FROM pg_constraint c
            WHERE c.contype = 'f'
              AND c.conrelid = spec.child::regclass
              AND c.confrelid = spec.parent::regclass
              AND (SELECT a.attname FROM pg_attribute a
                   WHERE a.attrelid = c.conrelid AND a.attnum = c.conkey[1]) = spec.col
        LOOP
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', spec.child, existing.conname);
        END LOOP;

        EXECUTE format(
            'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I ON DELETE %s',
            spec.child, 'fk_' || spec.child || '_' || spec.col, spec.col, spec.parent, spec.action);
    END LOOP;
END $$;
