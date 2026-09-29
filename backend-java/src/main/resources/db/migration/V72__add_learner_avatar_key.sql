-- A learner can upload a profile picture.
--
-- The object key only. The file itself lives in the same bucket as every other
-- upload and is served through a signed link, so nothing here expires and
-- nothing has to be made public to be shown.
--
-- Nullable on purpose: no picture is the ordinary state, and the initials
-- shown in its place are not a placeholder for a missing row -- they are what
-- a learner who has not uploaded one is meant to see.

ALTER TABLE learners
    ADD COLUMN IF NOT EXISTS avatar_key varchar(512);
