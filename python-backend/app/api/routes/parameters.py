from __future__ import annotations

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import require_service_key
from app.core.config import get_settings
from app.db.session import get_db
from app.ml import smart_defaults as smart
from app.repositories.bkt import get_active_artifact, get_lesson_parameters
from app.schemas.certification.parameters import (
    ActiveModelResponse,
    LessonParametersResponse,
    ParameterClassResponse,
)

router = APIRouter(
    prefix="/models",
    tags=["models and parameters"],
    dependencies=[Depends(require_service_key)],
)


@router.get("/active", response_model=ActiveModelResponse)
def active_model(db: Session = Depends(get_db)):
    artifact = get_active_artifact(db)
    if artifact is None:
        raise HTTPException(status_code=404, detail="No active trained model")
    return artifact


@router.get("/lessons/{lesson_id}/parameters", response_model=LessonParametersResponse)
def lesson_parameters(lesson_id: int, db: Session = Depends(get_db)):
    aggregate, classes = get_lesson_parameters(db, lesson_id)
    if aggregate is None:
        raise HTTPException(status_code=404, detail="No trained parameters for this lesson")
    return LessonParametersResponse(
        lesson_id=aggregate.lesson_id,
        prior_probability=aggregate.prior_probability,
        learn_probability=aggregate.learn_probability,
        guess_probability=aggregate.guess_probability,
        slip_probability=aggregate.slip_probability,
        forget_probability=aggregate.forget_probability,
        model_variant=aggregate.model_variant,
        model_run_id=aggregate.model_run_id,
        last_trained_at=aggregate.last_trained_at,
        classes=[
            ParameterClassResponse(
                parameter_name=row.parameter_name,
                class_name=row.class_name,
                parameter_value=row.parameter_value,
            )
            for row in classes
        ],
    )


@router.get("/smart-defaults")
def smart_defaults_in_use():
    """The hand-set BKT parameters the platform runs on while training is
    off, and whether they are the active source."""
    settings = get_settings()
    return {
        "active": not settings.model_training_enabled,
        "model_training_enabled": settings.model_training_enabled,
        "parameters": smart.smart_defaults().as_dict(),
    }


@router.post("/smart-defaults/evaluate")
def evaluate_smart_defaults(
    certification_id: int | None = None,
    db: Session = Depends(get_db),
):
    """Scores the Smart Defaults on the real response log with pyBKT's
    forward pass (predict only, no fit): AUC, RMSE, accuracy. A sanity
    check for the cold-start parameters as the data grows."""
    settings = get_settings()
    sql = (
        f"SELECT learner_id AS user_id, skill_name, is_correct AS correct, attempt_order AS order_id "
        f"FROM {settings.training_view_name}"
    )
    params: dict = {}
    if certification_id is not None:
        sql += " WHERE certification_id = :cid"
        params["cid"] = certification_id
    rows = db.execute(text(sql), params).mappings().all()
    df = pd.DataFrame(rows)
    if df.empty:
        raise HTTPException(status_code=404, detail="No graded responses to evaluate against")
    return {
        "parameters": smart.smart_defaults().as_dict(),
        "metrics": smart.evaluate(df),
    }
