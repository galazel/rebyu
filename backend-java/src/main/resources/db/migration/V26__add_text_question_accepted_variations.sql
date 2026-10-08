ALTER TABLE text_question_configs
    ADD COLUMN IF NOT EXISTS accepted_variations TEXT;
