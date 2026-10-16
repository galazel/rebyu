from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_service_key
from app.db.session import get_db
from app.rag.lesson_index import index_lesson
from app.rag.store import VectorStoreUnavailable

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/lessons",
    tags=["lessons"],
    dependencies=[Depends(require_service_key)],
)


@router.post("/{lesson_id}/index")
def index_lesson_route(lesson_id: int, db: Session = Depends(get_db)) -> dict:
    """Re-embeds a lesson after it is saved, so its content is retrievable."""
    try:
        return {"lessonId": lesson_id, "chunks": index_lesson(db, lesson_id)}
    except VectorStoreUnavailable as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
