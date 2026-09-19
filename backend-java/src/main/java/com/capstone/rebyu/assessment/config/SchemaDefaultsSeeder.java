package com.capstone.rebyu.assessment.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(1)
public class SchemaDefaultsSeeder implements ApplicationRunner {

    private static final String[] STATEMENTS = {
            "ALTER TABLE learner_reward_ledger ALTER COLUMN created_at SET DEFAULT now()",
            "ALTER TABLE learner_reward_balances ALTER COLUMN updated_at SET DEFAULT now()",

            "ALTER TABLE learner_practice_answers ALTER COLUMN answered_at SET DEFAULT now()",
            "ALTER TABLE learner_practice_attempts ALTER COLUMN started_at SET DEFAULT now()",
            "ALTER TABLE generated_study_sets ALTER COLUMN created_at SET DEFAULT now()",
            "ALTER TABLE generated_study_sets ALTER COLUMN updated_at SET DEFAULT now()",

            "ALTER TABLE community_post_reports ALTER COLUMN created_at SET DEFAULT now()",
            "ALTER TABLE community_post_reports ALTER COLUMN status SET DEFAULT 'OPEN'",

            "ALTER TABLE learner_library_items ALTER COLUMN created_at SET DEFAULT now()",
            "ALTER TABLE learner_library_items ALTER COLUMN updated_at SET DEFAULT now()",
            "ALTER TABLE learner_mistake_reviews ALTER COLUMN reviewed_at SET DEFAULT now()",

            "ALTER TABLE community_posts ALTER COLUMN created_at SET DEFAULT now()",
            "ALTER TABLE community_posts ALTER COLUMN updated_at SET DEFAULT now()",
            "ALTER TABLE community_comments ALTER COLUMN created_at SET DEFAULT now()",
            "ALTER TABLE community_comments ALTER COLUMN updated_at SET DEFAULT now()",
            "ALTER TABLE community_post_likes ALTER COLUMN created_at SET DEFAULT now()",
            "ALTER TABLE community_saved_posts ALTER COLUMN created_at SET DEFAULT now()",
            "ALTER TABLE community_post_shares ALTER COLUMN created_at SET DEFAULT now()",
            "ALTER TABLE community_circles ALTER COLUMN created_at SET DEFAULT now()",
            "ALTER TABLE community_circle_members ALTER COLUMN joined_at SET DEFAULT now()",

            """
            DO $$ BEGIN
              IF EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_name = 'study_plan'
                           AND column_name = 'schedule'
                           AND data_type <> 'text') THEN
                ALTER TABLE study_plan ALTER COLUMN schedule TYPE TEXT;
              END IF;
            END $$""",
    };

    private final JdbcTemplate jdbc;

    @Override
    public void run(ApplicationArguments args) {
        for (String statement : STATEMENTS) {
            try {
                jdbc.execute(statement);
            } catch (Exception ex) {
                log.warn("Could not apply schema default ({}): {}", statement, ex.getMessage());
            }
        }
        log.info("Schema defaults repaired ({} statements)", STATEMENTS.length);
    }
}
