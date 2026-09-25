"""The admin AI settings page: credit balance, and the model each task uses.

    GET    /ai-settings              credits, providers, every task and its model
    PUT    /ai-settings/{task}       choose a task's model
    DELETE /ai-settings/{task}       go back to the configured model

Behind the service key like every other AI route; the Java backend checks the
caller is an administrator before forwarding.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.ai import tasks
from app.ai.catalogue import TASK_INFO, blocked_reason, openrouter_credits, openrouter_models
from app.ai.overrides import all_overrides, clear_model, set_model
from app.core.config import get_settings
from app.core.security import require_service_key

router = APIRouter(
    prefix="/ai-settings",
    tags=["ai-settings"],
    dependencies=[Depends(require_service_key)],
)


class ChooseModel(BaseModel):
    model: str = Field(min_length=3, max_length=200)
    updatedBy: str | None = Field(default=None, max_length=200)


@router.get("")
def read_settings():
    settings = get_settings()
    try:
        models = openrouter_models()
        catalogue_error = None
    except Exception as error:  # noqa: BLE001 -- the page still shows what it can
        models, catalogue_error = [], f"OpenRouter's model list could not be loaded: {error}"
    by_id = {m["id"]: m for m in models}
    overrides = all_overrides()

    rows = []
    for name in tasks.TASKS:
        info = TASK_INFO.get(name, {"label": name, "usedFor": [], "vision": False,
                                    "recommended": [], "blocked": []})
        profile = tasks.profile_for(name, settings)
        configured = getattr(settings, f"ai_{name}_model")
        recommended = []
        for model_id, note in info["recommended"]:
            if models and model_id not in by_id:
                continue  # withdrawn by OpenRouter -- never offer it
            recommended.append({**by_id.get(model_id, {"id": model_id, "name": model_id}), "note": note})
        rows.append({
            "task": name,
            "label": info["label"],
            "usedFor": info["usedFor"],
            "needsVision": info["vision"],
            "provider": profile.provider.name,
            "model": profile.model,
            "modelInfo": by_id.get(profile.model),
            "configuredModel": configured,
            "overridden": name in overrides,
            "fallbacks": list(profile.fallbacks),
            "maxTokens": profile.max_tokens,
            "temperature": profile.temperature,
            "recommended": recommended,
            "blocked": info["blocked"],
            "changeable": profile.provider.name == "openrouter",
        })

    openrouter = tasks.provider_for("openrouter")
    providers = {}
    for name in ("openrouter", "groq", "gemini"):
        try:
            providers[name] = bool(tasks.provider_for(name).api_key())
        except Exception:  # noqa: BLE001
            providers[name] = False

    return {
        "credits": openrouter_credits(openrouter.api_key() if providers.get("openrouter") else None),
        "providers": providers,
        "tasks": rows,
        "models": models,
        "catalogueError": catalogue_error,
    }


@router.put("/{task}")
def choose_model(task: str, body: ChooseModel):
    if task not in tasks.TASKS:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown AI task {task!r}.")
    settings = get_settings()
    if getattr(settings, f"ai_{task}_provider") != "openrouter":
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            "This task does not run on OpenRouter, so its model cannot be chosen here.")
    reason = blocked_reason(task, body.model)
    if reason:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, reason)
    try:
        by_id = {m["id"]: m for m in openrouter_models()}
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status.HTTP_502_BAD_GATEWAY,
                            f"OpenRouter's model list could not be checked: {error}") from error
    chosen = by_id.get(body.model)
    if not chosen:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"OpenRouter has no model {body.model!r}.")
    if TASK_INFO.get(task, {}).get("vision") and not chosen["vision"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            f"{body.model} cannot read images, and this task sends pages and pictures.")
    set_model(task, body.model, body.updatedBy)
    return {"task": task, "model": body.model}


@router.delete("/{task}")
def reset_model(task: str):
    if task not in tasks.TASKS:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown AI task {task!r}.")
    clear_model(task)
    return {"task": task, "model": getattr(get_settings(), f"ai_{task}_model")}
