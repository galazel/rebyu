"""Rebuilds the IT Passport diagnostic and mock papers from the current syllabus.

Both papers were assembled before the syllabus tree was rebuilt to 63 lessons,
so they drew from only 8 old lessons. Diagnostic and mock exams are fixed
papers -- every learner and every retake gets the same questions -- so their
membership has to be rebuilt here rather than chosen at attempt time.

    DIAGNOSTIC   one question from every lesson
    MOCK_EXAM    100 questions, round-robin across every lesson, 120 minutes,
                 pass mark 60% -- the real paper's shape (100 four-option
                 MCQs in 120 minutes, 600 of 1,000 to pass)

Both draw from MCQ only: the real paper never asks for a written answer.
Selection reuses the FE script's `spread`, so it is deterministic: re-running
produces the same papers.

Usage:
    python scripts/itp_papers/rebuild.py            # rebuild both papers
    python scripts/itp_papers/rebuild.py --report   # show coverage, write nothing
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fe_expansion"))

from sqlalchemy import text

from dbsession import open_session
from seed_exams import (DIAGNOSTIC_TYPE_ID, MOCK_EXAM_TYPE_ID, curriculum_rows,
                        spread, upsert_exam)

CERTIFICATION_TITLE = "IT Passport Exam"
DIAGNOSTIC_TITLE = "Diagnostic Exam"
MOCK_TITLE = "Mock Exam"
MOCK_ITEMS = 100
MOCK_MINUTES = 120
MOCK_PASSING_SCORE = 60


def existing_duration(db, cert_id, title):
    return db.execute(text("""
        select duration_minutes from public.exams
         where certification_id = :c and title = :t"""),
        {"c": cert_id, "t": title}).scalar()


def mcq_by_lesson(db, lesson_ids):
    """{lesson_id: [question_id]} of top-level MCQs, ordered for reproducibility."""
    rows = db.execute(text("""
        select lesson_id, question_id from public.questions
         where lesson_id = any(:ids) and parent_question_id is null
           and question_type = 'MCQ'
         order by lesson_id, question_id"""),
        {"ids": list(lesson_ids)}).fetchall()
    grouped = {}
    for lesson_id, question_id in rows:
        grouped.setdefault(lesson_id, []).append(question_id)
    return grouped


def main():
    report_only = "--report" in sys.argv

    db = open_session()
    cert_id = db.execute(text(
        "select certification_id from public.certifications where title = :t"),
        {"t": CERTIFICATION_TITLE}).scalar()
    if not cert_id:
        raise SystemExit("certification %r does not exist" % CERTIFICATION_TITLE)

    rows = curriculum_rows(db, cert_id)
    banks = mcq_by_lesson(db, {r[4] for r in rows})
    pools = [banks.get(r[4], []) for r in rows]
    empty = [r[5] for r in rows if not banks.get(r[4])]

    print("%d lesson(s), %d question(s) in the bank"
          % (len(rows), sum(len(p) for p in pools)))
    if empty:
        print("lessons with no questions (cannot be covered): %s" % ", ".join(empty))

    diagnostic = spread(pools, len(rows), DIAGNOSTIC_TITLE)
    mock = spread(pools, MOCK_ITEMS, MOCK_TITLE)
    print("diagnostic: %d item(s); mock: %d item(s)" % (len(diagnostic), len(mock)))

    if report_only:
        db.close()
        return 0

    _id, mark = upsert_exam(
        db, cert_id, DIAGNOSTIC_TITLE, DIAGNOSTIC_TYPE_ID, "DIAGNOSTIC", diagnostic,
        duration_minutes=existing_duration(db, cert_id, DIAGNOSTIC_TITLE),
        description=("One question from every lesson, to locate your "
                     "strengths and gaps before you start studying."),
        rebuild=True)
    print("  %s %s" % (mark, DIAGNOSTIC_TITLE))

    mock_id, mark = upsert_exam(
        db, cert_id, MOCK_TITLE, MOCK_EXAM_TYPE_ID, "MOCK", mock,
        duration_minutes=MOCK_MINUTES, rebuild=True)
    db.execute(text("update public.exams set passing_score = :p where exam_id = :e"),
               {"p": MOCK_PASSING_SCORE, "e": mock_id})
    print("  %s %s" % (mark, MOCK_TITLE))

    db.commit()
    db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
