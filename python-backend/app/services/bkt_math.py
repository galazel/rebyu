from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class BktUpdateResult:
    predicted_correct_probability: float
    mastery_before: float
    mastery_posterior: float
    mastery_after: float


def clamp_probability(value: float, epsilon: float = 1e-12) -> float:
    return min(max(float(value), epsilon), 1.0 - epsilon)


def update_mastery(
    *,
    mastery_before: float,
    is_correct: bool,
    learn: float,
    guess: float,
    slip: float,
    forget: float = 0.0,
    score: float | None = None,
) -> BktUpdateResult:
    """One BKT step. ``score`` is the share of the item earned, 0..1; when
    given, the posterior is the partial-credit form (Wang & Heffernan 2013):
    the mix of the "right" and "wrong" posteriors weighted by the score, so a
    half-marked diagram is half the evidence of a right answer instead of
    being rounded to one or the other. Without it the step is the classic
    binary update on ``is_correct``."""
    p = clamp_probability(mastery_before)
    learn = min(max(float(learn), 0.0), 1.0)
    guess = min(max(float(guess), 0.0), 1.0)
    slip = min(max(float(slip), 0.0), 1.0)
    forget = min(max(float(forget), 0.0), 1.0)

    predicted_correct = p * (1.0 - slip) + (1.0 - p) * guess

    right = p * (1.0 - slip)
    posterior_right = right / max(right + (1.0 - p) * guess, 1e-12)
    wrong = p * slip
    posterior_wrong = wrong / max(wrong + (1.0 - p) * (1.0 - guess), 1e-12)

    weight = (1.0 if is_correct else 0.0) if score is None else min(max(float(score), 0.0), 1.0)
    posterior = weight * posterior_right + (1.0 - weight) * posterior_wrong
    transitioned = posterior * (1.0 - forget) + (1.0 - posterior) * learn
    mastery_after = min(max(transitioned, 0.0), 1.0)

    return BktUpdateResult(
        predicted_correct_probability=float(predicted_correct),
        mastery_before=float(p),
        mastery_posterior=float(posterior),
        mastery_after=float(mastery_after),
    )


def mastery_level(
    probability: float,
    *,
    developing_threshold: float,
    good_threshold: float,
    mastered_threshold: float,
) -> str:
    if probability >= mastered_threshold:
        return "mastered"
    if probability >= good_threshold:
        return "good"
    if probability >= developing_threshold:
        return "developing"
    return "weak"
