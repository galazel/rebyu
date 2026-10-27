-- Institution-issued certifications remain with the learner after the institution
-- assignment is removed, so they do not have a purchase order detail.
ALTER TABLE learner_certifications
    ALTER COLUMN order_detail_id DROP NOT NULL;
