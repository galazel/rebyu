"""Re-fits every question's IRT parameters from the graded responses the
assessment engine has recorded, and writes them back for the engine to use.

Reads the Java-owned attempt tables in ``public`` (an answer is a response
once its attempt is submitted and it has a definitive mark), keeps the latest
response per learner and question, binarises partial credit at the same 0.6
threshold the in-session engine uses, drops items and persons too thin to
fit, runs the 2PL fit, and upserts ``public.question_item_parameters`` as
CALIBRATED -- from then on the online updates move those items gently
rather than boldly.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import numpy as np
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.ml.irt import fit_2pl

log = logging.getLogger(__name__)

PARTIAL_CREDIT_CORRECT = 0.60

_RESPONSES_SQL = text(
    """
    SELECT DISTINCT ON (a.learner_id, q.source_question_id)
           a.learner_id,
           q.source_question_id AS question_id,
           qq.question_type,
           qq.difficulty_level,
           ans.is_correct,
           ans.earned_points,
           q.points,
           (SELECT COUNT(*) FROM public.choices ch WHERE ch.question_id = qq.question_id) AS choice_count
    FROM public.assessment_attempt_answers ans
    JOIN public.assessment_attempt_questions q ON q.attempt_question_id = ans.attempt_question_id
    JOIN public.assessment_attempts a ON a.assessment_attempt_id = ans.assessment_attempt_id
    JOIN public.questions qq ON qq.question_id = q.source_question_id
    WHERE a.status = 'SUBMITTED'
      AND ans.pending_manual_evaluation = false
      AND (ans.is_correct IS NOT NULL OR ans.earned_points IS NOT NULL)
    ORDER BY a.learner_id, q.source_question_id, ans.answered_at DESC NULLS LAST, ans.attempt_answer_id DESC
    """
)

_UPSERT_SQL = text(
    """
    INSERT INTO public.question_item_parameters
        (question_id, discrimination, difficulty, guessing, response_count, source, calibrated_at, updated_at)
    VALUES (:question_id, :a, :b, :c, :n, 'CALIBRATED', :now, :now)
    ON CONFLICT (question_id) DO UPDATE SET
        discrimination = EXCLUDED.discrimination,
        difficulty = EXCLUDED.difficulty,
        guessing = EXCLUDED.guessing,
        response_count = EXCLUDED.response_count,
        source = 'CALIBRATED',
        calibrated_at = EXCLUDED.calibrated_at,
        updated_at = EXCLUDED.updated_at
    """
)


def _binary(row) -> float:
    if row.is_correct is not None:
        return 1.0 if bool(row.is_correct) else 0.0
    points = float(row.points or 0)
    earned = float(row.earned_points or 0)
    return 1.0 if points > 0 and earned / points >= PARTIAL_CREDIT_CORRECT else 0.0


def _guessing(row) -> float:
    if str(row.question_type or "").upper() in ("MCQ", "MULTIPLE_CHOICE", "TRUE_FALSE"):
        n = int(row.choice_count or 0)
        return max(0.2, 1.0 / n) if n >= 2 else 0.25
    return 0.0


def _seed_difficulty(level: str | None) -> float:
    return {"EASY": -1.0, "HARD": 1.0}.get(str(level or "").upper(), 0.0)


def calibrate(session: Session, min_responses_per_item: int = 20, min_items_per_person: int = 3) -> dict:
    rows = session.execute(_RESPONSES_SQL).fetchall()
    if not rows:
        return {"status": "empty", "items_fitted": 0, "persons": 0}

    by_item: dict[int, list] = {}
    for row in rows:
        by_item.setdefault(int(row.question_id), []).append(row)
    items = [qid for qid, rs in by_item.items() if len(rs) >= min_responses_per_item]
    if not items:
        return {
            "status": "too_sparse",
            "items_fitted": 0,
            "persons": 0,
            "items_seen": len(by_item),
            "min_responses_per_item": min_responses_per_item,
        }

    persons_count: dict[int, int] = {}
    for qid in items:
        for row in by_item[qid]:
            persons_count[int(row.learner_id)] = persons_count.get(int(row.learner_id), 0) + 1
    persons = [pid for pid, n in persons_count.items() if n >= min_items_per_person]
    if len(persons) < 2:
        return {"status": "too_sparse", "items_fitted": 0, "persons": len(persons)}

    p_index = {pid: i for i, pid in enumerate(persons)}
    i_index = {qid: j for j, qid in enumerate(items)}
    matrix = np.full((len(persons), len(items)), np.nan)
    guessing = np.zeros(len(items))
    b_init = np.zeros(len(items))
    for qid in items:
        j = i_index[qid]
        first = by_item[qid][0]
        guessing[j] = _guessing(first)
        b_init[j] = _seed_difficulty(first.difficulty_level)
        for row in by_item[qid]:
            i = p_index.get(int(row.learner_id))
            if i is not None:
                matrix[i, j] = _binary(row)

    result = fit_2pl(matrix, guessing, b_init=b_init)
    now = datetime.now(timezone.utc)
    for qid in items:
        j = i_index[qid]
        session.execute(
            _UPSERT_SQL,
            {
                "question_id": qid,
                "a": float(result.a[j]),
                "b": float(result.b[j]),
                "c": float(result.c[j]),
                "n": int(result.n_responses[j]),
                "now": now,
            },
        )
    session.commit()
    summary = {
        "status": "ok",
        "items_fitted": len(items),
        "persons": len(persons),
        "iterations": result.iterations,
        "converged": result.converged,
        "log_likelihood": result.log_likelihood,
        "calibrated_at": now.isoformat(),
    }
    log.info("IRT calibration: %s", summary)
    return summary
