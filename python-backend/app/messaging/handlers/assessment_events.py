"""Consumers for assessment.submitted.queue and assessment.retake.queue.

Per the approved Phase 6 scope for these two queues: minimal for now --
fetch the attempt, resolve its learner's user_id, and write a notification.
Grading itself already happens synchronously in AssessmentAttemptService.
submitAttempt, and BKT mastery updates already flow through the existing
outbox/dispatcher pipeline (see [[bkt-integration]]) -- this consumer does
not duplicate either.
"""

from __future__ import annotations

import logging

from app.db.session import SessionLocal
from app.repositories import java_backend as repo

logger = logging.getLogger(__name__)


def _fetch_recipient(assessment_attempt_id: int):
    with SessionLocal() as session:
        return repo.get_assessment_attempt_with_recipient(session, assessment_attempt_id)


async def handle_assessment_submitted(payload: dict) -> None:
    assessment_attempt_id = payload["assessmentAttemptId"]
    attempt = _fetch_recipient(assessment_attempt_id)
    if attempt is None:
        logger.warning("assessment_attempt %s not found, dropping message", assessment_attempt_id)
        return

    percentage = attempt["percentage"]
    passed = attempt["passed"]
    if percentage is not None and passed is not None:
        body = (f"{'Passed' if passed else 'Did not pass'} -- you scored {percentage:.0f}% on "
                f"{attempt['exam_title']} (attempt #{attempt['attempt_number']}).")
    else:
        # The Java side publishes only after the score is saved, so this is a
        # safety net, not a state: there is no manual-review step to wait on.
        body = f"Your results for {attempt['exam_title']} (attempt #{attempt['attempt_number']}) are ready."

    with SessionLocal() as session:
        repo.insert_notification(
            session,
            user_id=attempt["user_id"],
            title=f"Results ready: {attempt['exam_title']}",
            body=body,
            href=f"/learner/results/{assessment_attempt_id}",
        )

    logger.info("Notified user %s for submitted attempt %s", attempt["user_id"], assessment_attempt_id)


async def handle_assessment_retake_requested(payload: dict) -> None:
    assessment_attempt_id = payload["assessmentAttemptId"]
    attempt = _fetch_recipient(assessment_attempt_id)
    if attempt is None:
        logger.warning("assessment_attempt %s not found, dropping message", assessment_attempt_id)
        return

    with SessionLocal() as session:
        repo.insert_notification(
            session,
            user_id=attempt["user_id"],
            title=f"Retake started: {attempt['exam_title']}",
            body=f"Attempt #{attempt['attempt_number']} of {attempt['exam_title']} has started with a "
                 f"question set personalized to your past performance.",
            href=f"/learner/assessments/{attempt['exam_id']}",
        )

    logger.info("Notified user %s for retake attempt %s", attempt["user_id"], assessment_attempt_id)
