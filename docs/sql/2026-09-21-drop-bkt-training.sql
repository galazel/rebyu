-- REBYU: BKT training pipeline removed (2026-09-21). Run in the Supabase SQL editor.
--
-- Mastery runs on Smart Defaults; there is no fitted model, so the tables
-- that held training runs, fitted parameters and model artifacts go, along
-- with the column that pointed mastery rows at a run. The mastery, history,
-- priority and processed-event tables are untouched. The stored learner
-- ability (adaptive engine) is also gone: attempts start from the baseline.

begin;

alter table bkt.learner_lesson_mastery drop column if exists model_run_id;

drop table if exists bkt.bkt_model_artifacts;
drop table if exists bkt.bkt_parameter_classes;
drop table if exists bkt.bkt_parameters;
drop table if exists bkt.bkt_model_runs;

drop table if exists public.learner_abilities;

commit;
