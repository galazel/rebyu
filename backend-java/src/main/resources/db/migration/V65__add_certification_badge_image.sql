-- A certification's badge: the artwork a learner earns, Credly/Cisco style.
-- Stored as an S3 key; null means the certification has no badge yet and the
-- cover falls back to the wordmark.
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS badge_image_key VARCHAR(500);
