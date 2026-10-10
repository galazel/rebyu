"""Trims the TOPCIT mock exam to the real paper's 65 items.

The mock grew to 77 items while lessons were being added (see
rebalance_exams.py, which appends when it must). The real TOPCIT paper is 65
items in 150 minutes, and a mock is only worth sitting if it has the real
paper's shape.

What is removed, and why:

  * Only MCQ. TOPCIT's short-answer, descriptive and critical-thinking items
    carry about half the real paper's points, so the mock keeps every one.
  * A lesson's repeats first, always from the lesson with the most items
    left, so no lesson ends up dominating the paper.
  * Only then a lesson's only MCQ. 64 lessons with 20 performance items cannot
    all keep one item in a 65-item paper, and the real paper does not touch
    every lesson either -- its length and its formats are what a mock imitates.

Dry run by default; --apply writes.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fe_expansion"))

from sqlalchemy import text

from dbsession import open_session

CERTIFICATION_TITLE = "TOPCIT"
MOCK_TITLE = "TOPCIT Mock Exam"
REAL_ITEMS = 65
REAL_MINUTES = 150


def main():
    apply_changes = "--apply" in sys.argv
    db = open_session()

    exam_id = db.execute(text("""
        select e.exam_id from public.exams e
          join public.certifications c on c.certification_id = e.certification_id
         where c.title = :c and e.title = :t"""),
        {"c": CERTIFICATION_TITLE, "t": MOCK_TITLE}).scalar()
    if not exam_id:
        raise SystemExit("%r not found" % MOCK_TITLE)

    items = db.execute(text("""
        select eq.exam_question_id, q.lesson_id, q.question_type
          from public.exam_questions eq
          join public.questions q on q.question_id = eq.question_id
         where eq.exam_id = :e
         order by eq.display_order desc, eq.exam_question_id desc"""),
        {"e": exam_id}).fetchall()

    by_lesson = {}
    for exam_question_id, lesson_id, question_type in items:
        by_lesson.setdefault(lesson_id, []).append((exam_question_id, question_type))

    removals = []
    while len(items) - len(removals) > REAL_ITEMS:
        candidates = [
            (len(rows), lesson_id) for lesson_id, rows in by_lesson.items()
            if len(rows) > 1 and any(t == "MCQ" for _id, t in rows)
        ] or [
            (len(rows), lesson_id) for lesson_id, rows in by_lesson.items()
            if any(t == "MCQ" for _id, t in rows)
        ]
        if not candidates:
            break
        _size, lesson_id = max(candidates)
        rows = by_lesson[lesson_id]
        index = next(i for i, (_id, t) in enumerate(rows) if t == "MCQ")
        removals.append(rows.pop(index)[0])

    remaining = len(items) - len(removals)
    covered = sum(1 for rows in by_lesson.values() if rows)
    print("%s: %d item(s) over %d lesson(s); removing %d MCQ -> %d item(s) over %d lesson(s)"
          % (MOCK_TITLE, len(items), len(by_lesson), len(removals), remaining, covered))
    if remaining != REAL_ITEMS:
        print("could not reach %d without dropping a performance item" % REAL_ITEMS)

    if not apply_changes:
        print("dry run -- re-run with --apply")
        db.close()
        return 0

    for exam_question_id in removals:
        db.execute(text("delete from public.exam_questions where exam_question_id = :i"),
                   {"i": exam_question_id})
    rows = db.execute(text("""
        select exam_question_id from public.exam_questions
         where exam_id = :e order by display_order, exam_question_id"""),
        {"e": exam_id}).fetchall()
    for order, (exam_question_id,) in enumerate(rows, start=1):
        db.execute(text("update public.exam_questions set display_order = :o "
                        "where exam_question_id = :i"),
                   {"o": order, "i": exam_question_id})
    db.execute(text("""
        update public.exams set total_questions = :n, duration_minutes = :d,
               updated_at = now() where exam_id = :e"""),
        {"n": len(rows), "d": REAL_MINUTES, "e": exam_id})
    db.commit()
    db.close()
    print("applied")
    return 0


if __name__ == "__main__":
    sys.exit(main())
