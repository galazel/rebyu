from __future__ import annotations

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import require_service_key
from app.core.config import get_settings
from app.db.session import get_db
from app.ml import smart_defaults as smart

router = APIRouter(
    prefix="/models",
    tags=["models and parameters"],
    dependencies=[Depends(require_service_key)],
)


@router.get("/smart-defaults")
def smart_defaults_in_use():
    """The hand-set BKT parameters the platform runs on."""
    return {"parameters": smart.smart_defaults().as_dict()}


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
