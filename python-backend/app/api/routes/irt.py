"""Item response theory calibration: the batch job that re-fits every
question's difficulty and discrimination from real responses, and a read of
what it produced. The in-session engine lives in the Java backend; this is
its training step."""

from __future__ import annotations

from celery.result import AsyncResult
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import require_service_key
from app.db.session import get_db
from app.workers.celery_app import celery_app

router = APIRouter(prefix="/irt", tags=["irt"], dependencies=[Depends(require_service_key)])


class CalibrateRequest(BaseModel):
    min_responses_per_item: int | None = Field(default=None, ge=5)
    min_items_per_person: int | None = Field(default=None, ge=1)


@router.post("/calibrate")
def calibrate(body: CalibrateRequest | None = None) -> dict:
    settings = get_settings()
    from app.workers.tasks import calibrate_irt

    body = body or CalibrateRequest()
    task = calibrate_irt.delay(
        body.min_responses_per_item or settings.irt_min_responses_per_item,
        body.min_items_per_person or settings.irt_min_items_per_person,
    )
    if settings.celery_task_always_eager:
        return {"task_id": task.id, "status": "done", "result": task.result}
    return {"task_id": task.id, "status": "queued"}


@router.get("/calibrate/{task_id}")
def calibration(task_id: str) -> dict:
    result = AsyncResult(task_id, app=celery_app)
    out: dict = {"task_id": task_id, "status": result.status.lower()}
    if result.ready():
        out["result"] = result.result if result.successful() else str(result.result)
    return out


@router.get("/items/{question_id}")
def item(question_id: int, db: Session = Depends(get_db)) -> dict:
    row = db.execute(
        text(
            "SELECT question_id, discrimination, difficulty, guessing, response_count, source, "
            "calibrated_at, updated_at FROM public.question_item_parameters WHERE question_id = :id"
        ),
        {"id": question_id},
    ).mappings().first()
    return dict(row) if row else {"question_id": question_id, "known": False}
