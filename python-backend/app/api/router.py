from fastapi import APIRouter

from app.api.routes import analytics, health, irt, mastery, parameters, priorities, training
from app.core.config import get_settings

settings = get_settings()
api_router = APIRouter(prefix=settings.api_prefix)
api_router.include_router(health.router)
api_router.include_router(training.router)
api_router.include_router(mastery.router)
api_router.include_router(parameters.router)
api_router.include_router(analytics.router)
api_router.include_router(priorities.router)

# The IRT routes are the adaptive engine's calibration step, under their own
# prefix rather than /bkt: they are a different model over the same responses.
irt_router = APIRouter(prefix="/api/v1")
irt_router.include_router(irt.router)
