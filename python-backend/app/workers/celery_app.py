from __future__ import annotations

from celery import Celery
from celery.schedules import crontab

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "rebyu_bkt",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks"],
)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone=settings.timezone,
    enable_utc=True,
    task_track_started=True,
    task_time_limit=60 * 60 * 4,
    task_soft_time_limit=60 * 60 * 3 + 45 * 60,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    broker_connection_retry_on_startup=True,
    task_always_eager=settings.celery_task_always_eager,
    task_eager_propagates=settings.celery_task_eager_propagates,
)

if settings.scheduled_retraining_enabled:
    celery_app.conf.beat_schedule = {
        "weekly-rebyu-bkt-retraining": {
            "task": "app.workers.tasks.schedule_weekly_training",
            "schedule": crontab(
                minute=settings.scheduled_retraining_minute,
                hour=settings.scheduled_retraining_hour,
                day_of_week=settings.scheduled_retraining_day_of_week,
            ),
        }
    }

if settings.scheduled_irt_calibration_enabled:
    celery_app.conf.beat_schedule = {
        **(celery_app.conf.beat_schedule or {}),
        "weekly-rebyu-irt-calibration": {
            "task": "app.workers.tasks.calibrate_irt",
            "schedule": crontab(minute=30, hour=3, day_of_week="sunday"),
        },
    }
