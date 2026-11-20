from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.ai.router import AllModelsExhausted, OutOfCredits, RequestTooLarge
from app.core.security import require_service_key
from app.schemas.learning.study_plan_note_schema import StudyPlanNoteRequest, StudyPlanRules
from app.services.ai.study_plan_note import read_study_plan_note

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/study-plans",
    tags=["study-plans"],
    dependencies=[Depends(require_service_key)],
)


@router.post("/read-note", response_model=StudyPlanRules)
async def read_note(payload: StudyPlanNoteRequest) -> StudyPlanRules:
    """Reads a learner's free-text study note into the rules the planner accepts."""
    if not (payload.note or "").strip():
        return StudyPlanRules()
    try:
        return await read_study_plan_note(payload)
    except (AllModelsExhausted, OutOfCredits, RequestTooLarge) as unavailable:
        logger.error("Cannot read a study note right now: %s", unavailable)
        raise HTTPException(
            status_code=503, detail=f"Reading study notes is unavailable: {unavailable}"
        ) from unavailable
    except RuntimeError as failed:
        logger.error("Could not read a study note: %s", failed)
        raise HTTPException(status_code=503, detail=str(failed)) from failed
