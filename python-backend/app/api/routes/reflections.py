from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.ai.router import AllModelsExhausted, OutOfCredits, RequestTooLarge
from app.core.security import require_service_key
from app.schemas.assessment.reflection_schema import GeneratedReflection, ReflectionGenerationRequest
from app.services.ai.reflection import generate_reflection

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/reflections",
    tags=["reflections"],
    dependencies=[Depends(require_service_key)],
)


@router.post("/generate", response_model=GeneratedReflection)
async def generate(payload: ReflectionGenerationRequest) -> GeneratedReflection:
    """Writes a topic's reflection for Java's `ReflectionService` to store."""
    try:
        return await generate_reflection(payload)
    except (AllModelsExhausted, OutOfCredits, RequestTooLarge) as unavailable:
        logger.error("Cannot generate a reflection right now: %s", unavailable)
        raise HTTPException(
            status_code=503, detail=f"Reflection generation is unavailable: {unavailable}"
        ) from unavailable
