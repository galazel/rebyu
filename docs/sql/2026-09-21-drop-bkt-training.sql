
begin;

alter table bkt.learner_lesson_mastery drop column if exists model_run_id;

drop table if exists bkt.bkt_model_artifacts;
drop table if exists bkt.bkt_parameter_classes;
drop table if exists bkt.bkt_parameters;
drop table if exists bkt.bkt_model_runs;

drop table if exists public.learner_abilities;

commit;
