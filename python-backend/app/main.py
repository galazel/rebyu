from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.routes import ai_settings as ai_settings_routes
from app.api.routes import assessments as assessment_routes
from app.api.routes import certification as certification_routes
from app.api.routes import past_papers as past_paper_routes
from app.api.routes import question_bank as question_bank_routes
from app.api.routes import study_aids as study_aid_routes
from app.api.routes import tutor as tutor_routes
from app.api.routes import workflow_stream as workflow_stream_routes
from app.api.routes import workflows as workflow_routes
from app.api.ws import workflows as workflow_ws
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.messaging.registry import build_consumer_manager
from app.db.session import warm_pool
from app.db.training_view import ensure_training_view
from app.services import run_recovery
from app.utils.helpers import close_checkpointer

settings = get_settings()
configure_logging(settings.debug)
logger = logging.getLogger(__name__)


def _warm_retrieval_models() -> None:
    """Loads the embedder and the reranker into their caches. Never fatal: a
    model that cannot load here is loaded (or reported) on first use."""
    try:
        from app.rag.embeddings import get_embeddings
        from app.rag.retriever import _get_reranker

        get_embeddings().embed_query("warm-up")
        _get_reranker()
        logger.info("Retrieval models loaded")
    except Exception:
        logger.warning("Could not preload retrieval models; they load on first use", exc_info=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.ensure_directories()

    ensure_training_view()

    consumer_manager = build_consumer_manager()
    try:
        await consumer_manager.start()
    except Exception:
        logger.exception("Failed to start RabbitMQ consumers; API will run without them")

    recovery = asyncio.create_task(run_recovery.run_forever(), name="run-recovery")

    warmup = asyncio.create_task(asyncio.to_thread(_warm_retrieval_models), name="model-warmup")
    pool_warmup = asyncio.create_task(asyncio.to_thread(warm_pool), name="db-pool-warmup")

    yield

    warmup.cancel()
    pool_warmup.cancel()
    recovery.cancel()
    with suppress(asyncio.CancelledError):
        await recovery

    await consumer_manager.stop()
    await close_checkpointer()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "Bayesian Knowledge Tracing microservice for Rebyu. It trains pyBKT "
            "models, stores lesson parameters, and updates learner mastery in real time."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)
    app.include_router(assessment_routes.router, prefix="/api/v1/ai")
    app.include_router(ai_settings_routes.router, prefix="/api/v1/ai")
    app.include_router(certification_routes.router, prefix="/api/v1/ai")
    app.include_router(past_paper_routes.router, prefix="/api/v1/ai")
    app.include_router(question_bank_routes.router, prefix="/api/v1/ai")
    app.include_router(study_aid_routes.router, prefix="/api/v1/ai")
    app.include_router(tutor_routes.router, prefix="/api/v1/ai")
    app.include_router(workflow_routes.router, prefix="/api/v1/ai")
    app.include_router(workflow_stream_routes.router, prefix="/api/v1/ai")
    app.include_router(workflow_ws.router)

    @app.get("/", tags=["service"])
    def root() -> dict[str, str]:
        return {
            "service": settings.app_name,
            "version": settings.app_version,
            "docs": "/docs",
        }

    return app


app = create_app()