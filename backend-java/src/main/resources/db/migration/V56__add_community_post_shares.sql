CREATE TABLE community_post_shares (
    post_id BIGINT NOT NULL REFERENCES community_posts(post_id) ON DELETE CASCADE,
    learner_id BIGINT NOT NULL REFERENCES learners(learner_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, learner_id)
);

CREATE INDEX idx_community_post_shares_post ON community_post_shares(post_id);
