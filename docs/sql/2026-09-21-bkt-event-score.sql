-- REBYU: partial-credit BKT (2026-09-21). Run in the Supabase SQL editor.
--
-- Written, coded and drawn answers now reach the mastery update as the share
-- they earned instead of a rounded right/wrong; the event keeps that share.
-- Older events stay null (they were binary).

alter table bkt.bkt_mastery_events add column if not exists score numeric(5,4);
