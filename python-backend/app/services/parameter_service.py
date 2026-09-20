"""BKT parameters for one answer: the Smart Defaults, varied by the item's
difficulty (guess/slip) and the assessment type (learn). There is no trained
model at this scale -- see app/ml/smart_defaults.py for why."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.ml.smart_defaults import smart_defaults


@dataclass(frozen=True)
class ResolvedParameters:
    prior: float
    learn: float
    guess: float
    slip: float
    forget: float
    model_variant: str

    def as_dict(self) -> dict[str, float | str]:
        return {
            "prior": self.prior,
            "learn": self.learn,
            "guess": self.guess,
            "slip": self.slip,
            "forget": self.forget,
            "model_variant": self.model_variant,
        }


def resolve_parameters(
    session: Session,
    *,
    lesson_id: int,
    difficulty_level: str,
    assessment_type: str,
) -> ResolvedParameters:
    defaults = smart_defaults()
    return ResolvedParameters(
        prior=defaults.prior,
        learn=defaults.learn_for(assessment_type),
        guess=defaults.guess_for(difficulty_level),
        slip=defaults.slip_for(difficulty_level),
        forget=defaults.forget,
        model_variant="smart_defaults",
    )
