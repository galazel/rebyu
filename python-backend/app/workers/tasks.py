from __future__ import annotations

from celery import Task

from app.db.session import SessionLocal
from app.repositories.bkt import any_active_training
from app.services.training_service import create_training_run, execute_training_run
from app.workers.celery_app import celery_app


@celery_app.task(bind=True, name="app.workers.tasks.train_bkt_model")
def train_bkt_model(self: Task, run_id: str, csv_path: str | None = None) -> dict:
    with SessionLocal() as session:
        return execute_training_run(session, run_id=run_id, csv_path=csv_path)


@celery_app.task(name="app.workers.tasks.schedule_weekly_training")
def schedule_weekly_training() -> dict:
    with SessionLocal() as session:
        if any_active_training(session):
            return {"status": "skipped", "reason": "another training run is active"}
        run = create_training_run(
            session,
            source_type="database",
            trigger_type="scheduled",
            requested_by="celery-beat",
        )
        task = train_bkt_model.delay(run.model_run_id)
        run.celery_task_id = task.id
        session.commit()
        return {
            "status": "queued",
            "model_run_id": run.model_run_id,
            "celery_task_id": task.id,
        }
