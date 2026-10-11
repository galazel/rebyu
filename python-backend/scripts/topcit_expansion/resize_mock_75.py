"""Rebuilds the TOPCIT mock exam to the current official paper: 75 items, 150 minutes.

Source: topcit.or.kr, Introduction > Overview > Test Structure -- 75 questions,
1,000 points, 2.5 hours, over four modules:

  M1 Software Development                          21
  M2 Data Management                               19
  M3 System Architecture and Information Security  18
  M4 IT Business                                   17

trim_mock.py cut the mock to 65 for the pre-2026 format; this supersedes it.
Our seven units map onto the four modules (MODULES below). Short-answer,
descriptive and performance items are never removed -- only MCQ is added or
dropped, always from the lesson with the most items in the mock (drops) or the
fewest (adds), so coverage spreads across lessons.

Dry run by default; --apply writes.
"""

import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fe_expansion"))

from sqlalchemy import text

from dbsession import open_session

CERTIFICATION_TITLE = "TOPCIT"
MOCK_TITLE = "TOPCIT Mock Exam"
REAL_MINUTES = 150
SOURCE = "https://www.topcit.or.kr (Introduction > Overview > Test Structure)"

MODULES = {
    "M1 Software Development": (21, ["Software Development"]),
    "M2 Data Management": (19, ["Database Construction and Management"]),
    "M3 System Architecture and Information Security": (18, ["Understanding of Network", "Understanding of Security"]),
    "M4 IT Business": (17, ["Understanding of IT Business", "Technical Communications", "Project Management"]),
}
REAL_ITEMS = sum(target for target, _units in MODULES.values())


def main():
    apply_changes = "--apply" in sys.argv
    db = open_session()

    exam_id, certification_id = db.execute(text("""
        select e.exam_id, c.certification_id from public.exams e
          join public.certifications c on c.certification_id = e.certification_id
         where c.title = :c and e.title = :t"""),
        {"c": CERTIFICATION_TITLE, "t": MOCK_TITLE}).fetchone()

    rows = db.execute(text("""
        select q.question_id, q.lesson_id, q.question_type, mj.title, q.parent_question_id,
               eq.exam_question_id
          from public.questions q
          join public.lessons l on l.lesson_id = q.lesson_id
          join public.middle_categories mi on mi.middle_category_id = l.middle_category_id
          join public.major_categories mj on mj.major_category_id = mi.major_category_id
          left join public.exam_questions eq on eq.question_id = q.question_id and eq.exam_id = :e
         where mj.certification_id = :c and mj.owner_department_id is null
           and q.owner_department_id is null
         order by q.question_id"""),
        {"e": exam_id, "c": certification_id}).fetchall()

    unit_module = {unit: module for module, (_t, units) in MODULES.items() for unit in units}
    in_mock = {m: [] for m in MODULES}
    spare = {m: [] for m in MODULES}
    for question_id, lesson_id, question_type, unit, parent_id, exam_question_id in rows:
        module = unit_module.get(unit)
        if module is None:
            continue
        if exam_question_id is not None:
            in_mock[module].append((exam_question_id, question_id, lesson_id, question_type))
        elif question_type == "MCQ" and parent_id is None:
            spare[module].append((question_id, lesson_id))

    points = db.execute(text("""
        select mode() within group (order by points) from public.exam_questions eq
          join public.questions q on q.question_id = eq.question_id
         where eq.exam_id = :e and q.question_type = 'MCQ'"""), {"e": exam_id}).scalar() or 1

    removals, additions = [], []
    for module, (target, _units) in MODULES.items():
        items = in_mock[module]
        before = len(items)
        per_lesson = {}
        for item in items:
            per_lesson[item[2]] = per_lesson.get(item[2], 0) + 1
        while len(items) > target:
            mcq = [i for i in items if i[3] == "MCQ"]
            if not mcq:
                break
            victim = max(mcq, key=lambda i: (per_lesson[i[2]], i[0]))
            items.remove(victim)
            per_lesson[victim[2]] -= 1
            removals.append(victim[0])
        pool = list(spare[module])
        while len(items) < target and pool:
            pick = min(pool, key=lambda p: (per_lesson.get(p[1], 0), p[0]))
            pool.remove(pick)
            per_lesson[pick[1]] = per_lesson.get(pick[1], 0) + 1
            items.append((None, pick[0], pick[1], "MCQ"))
            additions.append(pick[0])
        print("  %-48s %2d -> %2d (target %d)" % (module, before, len(items), target))

    total = sum(len(v) for v in in_mock.values())
    print("%s: removing %d MCQ, adding %d MCQ -> %d item(s)" % (MOCK_TITLE, len(removals), len(additions), total))
    if total != REAL_ITEMS:
        raise SystemExit("could not reach %d items" % REAL_ITEMS)
    if not apply_changes:
        print("dry run -- re-run with --apply")
        return 0

    for exam_question_id in removals:
        db.execute(text("delete from public.exam_questions where exam_question_id = :i"), {"i": exam_question_id})
    for question_id in additions:
        db.execute(text("""
            insert into public.exam_questions (exam_id, question_id, display_order, points)
            values (:e, :q, 100000, :p)"""), {"e": exam_id, "q": question_id, "p": points})
    ordered = db.execute(text("""
        select exam_question_id from public.exam_questions
         where exam_id = :e order by display_order, exam_question_id"""), {"e": exam_id}).fetchall()
    for order, (exam_question_id,) in enumerate(ordered, start=1):
        db.execute(text("update public.exam_questions set display_order = :o where exam_question_id = :i"),
                   {"o": order, "i": exam_question_id})
    db.execute(text("""
        update public.exams set total_questions = :n, duration_minutes = :d, updated_at = now()
         where exam_id = :e"""), {"n": len(ordered), "d": REAL_MINUTES, "e": exam_id})

    coverage = ", ".join("%s (%d items)" % (m, t) for m, (t, _u) in MODULES.items())
    db.execute(text("""
        update public.certification_exam_formats
           set total_items = :n, duration_minutes = :d, coverage = :cov, source = :src,
               origin = 'MANUAL', updated_at = now()
         where certification_id = :c"""),
        {"n": REAL_ITEMS, "d": REAL_MINUTES, "cov": coverage, "src": SOURCE, "c": certification_id})
    structure = db.execute(text("select exam_structure from public.certifications where certification_id = :c"),
                           {"c": certification_id}).scalar() or {}
    if isinstance(structure, str):
        structure = json.loads(structure)
    structure.update({"total_items": REAL_ITEMS, "duration_minutes": REAL_MINUTES,
                      "coverage": coverage, "source": SOURCE, "origin": "MANUAL"})
    db.execute(text("update public.certifications set exam_structure = cast(:s as jsonb) where certification_id = :c"),
               {"s": json.dumps(structure), "c": certification_id})
    db.commit()
    db.close()
    print("applied")
    return 0


if __name__ == "__main__":
    sys.exit(main())
