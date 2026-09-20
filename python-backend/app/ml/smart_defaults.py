"""Smart Defaults: the hand-set BKT parameters the platform runs on, and a
pyBKT model built from them for prediction only.

Cold start. A BKT fit needs many learners per skill before its parameters
mean anything; with a handful, EM finds a set that explains those few
learners' streaks and nothing else. Until there is a cohort, every lesson
uses the same literature-range parameters (Corbett & Anderson's prior/learn
and the guess < 0.30, slip < 0.10 bounds from Baker et al.), varied only by
what is known *a priori*: the item's difficulty for guess/slip and the
assessment type for learn.

pyBKT is still the reference implementation: `build_model` assembles its
internal model structure directly from these numbers (transition matrix,
initial state, emissions), so `Model.predict` runs the standard forward pass
with no `fit` call anywhere. `evaluate` scores those predictions on the real
response log, which is how the defaults are checked against the data as it
grows. The live per-answer update in `app.services.bkt_math` is the same
recursion, kept in plain Python so one event costs one row, not a model.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np
import pandas as pd

from app.core.config import get_settings

DIFFICULTIES = ("EASY", "AVERAGE", "HARD")
ASSESSMENT_TYPES = ("DIAGNOSTIC", "LESSON_QUIZ", "MIDDLE_EXAM", "MAJOR_EXAM", "MOCK_EXAM")


@dataclass(frozen=True)
class SmartDefaults:
    prior: float
    learn: float
    guess: float
    slip: float
    forget: float
    guess_by_difficulty: dict[str, float]
    slip_by_difficulty: dict[str, float]
    learn_by_assessment: dict[str, float]

    def guess_for(self, difficulty: str | None) -> float:
        return self.guess_by_difficulty.get((difficulty or "").upper(), self.guess)

    def slip_for(self, difficulty: str | None) -> float:
        return self.slip_by_difficulty.get((difficulty or "").upper(), self.slip)

    def learn_for(self, assessment_type: str | None) -> float:
        return self.learn_by_assessment.get((assessment_type or "").upper(), self.learn)

    def as_dict(self) -> dict:
        return {
            "prior": self.prior,
            "learn": self.learn,
            "guess": self.guess,
            "slip": self.slip,
            "forget": self.forget,
            "guess_by_difficulty": dict(self.guess_by_difficulty),
            "slip_by_difficulty": dict(self.slip_by_difficulty),
            "learn_by_assessment": dict(self.learn_by_assessment),
        }


def smart_defaults() -> SmartDefaults:
    s = get_settings()
    return SmartDefaults(
        prior=s.fallback_prior,
        learn=s.fallback_learn,
        guess=s.fallback_guess,
        slip=s.fallback_slip,
        forget=s.fallback_forget,
        guess_by_difficulty={
            "EASY": s.smart_guess_easy,
            "AVERAGE": s.smart_guess_average,
            "HARD": s.smart_guess_hard,
        },
        slip_by_difficulty={
            "EASY": s.smart_slip_easy,
            "AVERAGE": s.smart_slip_average,
            "HARD": s.smart_slip_hard,
        },
        learn_by_assessment={
            "DIAGNOSTIC": s.smart_learn_diagnostic,
            "LESSON_QUIZ": s.smart_learn_lesson_quiz,
            "MIDDLE_EXAM": s.smart_learn_middle_exam,
            "MAJOR_EXAM": s.smart_learn_major_exam,
            "MOCK_EXAM": s.smart_learn_mock_exam,
        },
    )


def _skill_struct(defaults: SmartDefaults, gs_classes: list[str], learn_classes: list[str]) -> dict:
    """pyBKT's per-skill model structure, filled from the defaults.

    State 1 is "known". Mirrors what `pyBKT.generate.random_model_uni`
    produces -- `As[:, 1, 0]` is what pyBKT reads back as `learns` and
    `As[:, 0, 1]` as `forgets`; `emissions[g]` holds the observation
    probabilities for guess/slip class g -- without the randomness.
    """
    learns = np.array([defaults.learn_for(c) for c in learn_classes])
    guesses = np.array([defaults.guess_for(c) for c in gs_classes])
    slips = np.array([defaults.slip_for(c) for c in gs_classes])
    forget = defaults.forget

    As = np.zeros((len(learns), 2, 2))
    As[:, 0, 0] = 1.0 - forget
    As[:, 0, 1] = forget
    As[:, 1, 0] = learns
    As[:, 1, 1] = 1.0 - learns

    given_notknow = np.vstack((1.0 - guesses, guesses))  # 2 x G
    given_know = np.vstack((slips, 1.0 - slips))  # 2 x G
    emissions = np.stack((given_notknow.T, given_know.T), axis=1)  # G x 2 x 2

    return {
        "prior": defaults.prior,
        "pi_0": np.array([[1.0 - defaults.prior], [defaults.prior]]),
        "As": As,
        "learns": As[:, 1, 0],
        "forgets": As[:, 0, 1],
        "guesses": guesses,
        "slips": slips,
        "emissions": emissions,
        "resource_names": {name: i + 1 for i, name in enumerate(learn_classes)},
        "gs_names": {name: i + 1 for i, name in enumerate(gs_classes)},
    }


def build_model(skills: Iterable[str], *, defaults: SmartDefaults | None = None):
    """A pyBKT Model over `skills` (lesson ids as strings) that predicts with
    the Smart Defaults. One guess/slip class and one learn class per skill:
    the class-specific values are applied by the live update per answer,
    while the batch predictor uses the plain defaults so its forward pass
    matches pyBKT's single-class semantics exactly."""
    from pyBKT.models import Model

    defaults = defaults or smart_defaults()
    model = Model(seed=get_settings().bkt_seed)
    model.skills = list(skills)
    model.model_type = [False] * len(Model.MODELS_BKT)
    model.fit_model = {skill: _skill_struct(defaults, ["default"], ["default"]) for skill in model.skills}
    model.manual_param_init = True
    return model


def predict(df: pd.DataFrame, *, defaults: SmartDefaults | None = None) -> pd.DataFrame:
    """Runs pyBKT's forward pass over a response log.

    `df` needs `user_id`, `skill_name`, `correct` (0/1) and `order_id`; the
    result adds `correct_predictions` (P(correct) before the answer) and
    `state_predictions` (P(known) before the answer)."""
    if df.empty:
        return df.assign(correct_predictions=pd.Series(dtype=float), state_predictions=pd.Series(dtype=float))
    ordered = df.sort_values(["user_id", "skill_name", "order_id"]).reset_index(drop=True)
    ordered["skill_name"] = ordered["skill_name"].astype(str)
    model = build_model(sorted(ordered["skill_name"].unique()), defaults=defaults)
    return model.predict(data=ordered)


def evaluate(df: pd.DataFrame, *, defaults: SmartDefaults | None = None) -> dict:
    """AUC / RMSE / accuracy of the Smart Defaults on a response log.
    Measured on the same data the learners produced, as a sanity check of
    the defaults -- there is no held-out set to speak of at this scale."""
    from sklearn.metrics import roc_auc_score

    predictions = predict(df, defaults=defaults)
    y = predictions["correct"].astype(int).to_numpy()
    p = predictions["correct_predictions"].astype(float).to_numpy()
    return {
        "rows": int(len(predictions)),
        "learners": int(predictions["user_id"].nunique()) if len(predictions) else 0,
        "skills": int(predictions["skill_name"].nunique()) if len(predictions) else 0,
        "rmse": float(np.sqrt(np.mean((y - p) ** 2))) if len(y) else None,
        "accuracy": float(np.mean((p >= 0.5) == (y == 1))) if len(y) else None,
        "auc": float(roc_auc_score(y, p)) if len(np.unique(y)) == 2 else None,
    }
