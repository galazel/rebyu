
ALTER TABLE learner_reward_ledger   ALTER COLUMN created_at  SET DEFAULT now();
ALTER TABLE learner_reward_balances ALTER COLUMN updated_at  SET DEFAULT now();

ALTER TABLE learner_practice_answers  ALTER COLUMN answered_at SET DEFAULT now();
ALTER TABLE learner_practice_attempts ALTER COLUMN started_at  SET DEFAULT now();
ALTER TABLE generated_study_sets      ALTER COLUMN created_at  SET DEFAULT now();
ALTER TABLE generated_study_sets      ALTER COLUMN updated_at  SET DEFAULT now();

ALTER TABLE community_post_reports ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE community_post_reports ALTER COLUMN status     SET DEFAULT 'OPEN';

ALTER TABLE learner_library_items   ALTER COLUMN created_at  SET DEFAULT now();
ALTER TABLE learner_library_items   ALTER COLUMN updated_at  SET DEFAULT now();
ALTER TABLE learner_mistake_reviews ALTER COLUMN reviewed_at SET DEFAULT now();

