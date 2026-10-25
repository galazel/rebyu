ALTER TABLE learner_library_items ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE learner_library_items DROP CONSTRAINT IF EXISTS learner_library_items_item_type_check;
ALTER TABLE learner_library_items ADD CONSTRAINT learner_library_items_item_type_check
    CHECK (item_type IN ('quiz','flashcard','mindmap','activity','file','link','note'));
