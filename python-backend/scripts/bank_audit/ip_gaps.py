"""Which IT Passport assessments cannot be sat, and why.

Read-only. Nothing here writes.

Mirrors `QuestionBankSizeService` exactly rather than approximating it, so the
numbers printed are the numbers the backend will refuse on:

  pool      = top-level questions in the exam's scope
              (`Question.parentQuestion IS NULL`, owner department null or
              equal to the exam's own -- see findSelectionViewsByLesson)
  required  = ceil(targetCount(type) * adaptive.min-bank-multiplier)

Scope falls through lesson -> middle -> major -> certification, first non-null
wins, which is what `EligibleQuestionService.resolveScopeViews` does.
"""

import math
import os
import re
import sys
from collections import defaultdict

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


def open_session():
    """The transaction-mode pooler, not the session-mode one.

    DATABASE_URL points at port 5432, which allows fifteen clients in total;
    with the Java backend holding up to eight, a read-only audit competing
    with anything else fails on EMAXCONNSESSION before it reads a row. 6543
    is the same database with far more slots.
    """
    url = os.environ.get("DATABASE_URL")
    if not url and os.path.exists("/app/.env"):
        with open("/app/.env", encoding="utf-8") as handle:
            match = re.search(r"^DATABASE_URL=(.+)$", handle.read(), re.M)
        if match:
            url = match.group(1).strip()
    if not url:
        raise RuntimeError("no DATABASE_URL available")
    engine = create_engine(
        url.replace(":5432/", ":6543/"), pool_pre_ping=True,
        pool_size=1, max_overflow=0,
        connect_args={"prepare_threshold": None})
    return sessionmaker(bind=engine)()

CERT = 4

# application.yml: adaptive.item-counts / min-bank-multiplier. Defaulted the
# way AdaptivePolicy.targetCount does (10 when unconfigured).
TARGETS = {
    "LESSON_QUIZ": 10,
    "MIDDLE_EXAM": 20,
    "MAJOR_EXAM": 30,
    "MOCK_EXAM": 60,
    "DIAGNOSTIC": 20,
    "KNOWLEDGE_CHECK": 5,
}
MULTIPLIER = 1.5


def target_for(exam_type):
    return TARGETS.get((exam_type or "").upper(), 10)


def main():
    db = open_session()

    cert_title = db.execute(
        text("select title from certifications where certification_id=:c"),
        {"c": CERT}).scalar()
    print("certification %s: %s" % (CERT, cert_title))

    # Top-level question counts per lesson.
    per_lesson = dict(db.execute(text("""
        select l.lesson_id, count(q.question_id)
          from lessons l
          join middle_categories mc on mc.middle_category_id = l.middle_category_id
          join major_categories m on m.major_category_id = mc.major_category_id
          left join questions q
                 on q.lesson_id = l.lesson_id and q.parent_question_id is null
         where m.certification_id = :c
         group by l.lesson_id"""), {"c": CERT}).fetchall())

    lesson_meta = {r[0]: (r[1], r[2], r[3]) for r in db.execute(text("""
        select l.lesson_id, l.name, mc.middle_category_id, m.major_category_id
          from lessons l
          join middle_categories mc on mc.middle_category_id = l.middle_category_id
          join major_categories m on m.major_category_id = mc.major_category_id
         where m.certification_id = :c"""), {"c": CERT}).fetchall()}

    by_middle = defaultdict(int)
    by_major = defaultdict(int)
    for lesson_id, count in per_lesson.items():
        meta = lesson_meta.get(lesson_id)
        if not meta:
            continue
        by_middle[meta[1]] += count
        by_major[meta[2]] += count
    cert_total = sum(per_lesson.values())

    exams = db.execute(text("""
        select e.exam_id, e.title, et.exam_type_text, e.certification_id,
               e.major_category_id, e.middle_category_id, e.lesson_id
          from exams e
          join exam_types et on et.exam_type_id = e.exam_type_id
         where e.certification_id = :c
           and e.learner_id is null
         order by et.exam_type_text, e.exam_id"""), {"c": CERT}).fetchall()

    print("lessons: %d   top-level questions: %d   exams: %d"
          % (len(lesson_meta), cert_total, len(exams)))

    short = []
    for ex in exams:
        exam_id, title, exam_type, _cert, major_id, middle_id, lesson_id = ex
        if lesson_id is not None:
            pool = per_lesson.get(lesson_id, 0)
            scope = "lesson %s" % lesson_id
        elif middle_id is not None:
            pool, scope = by_middle.get(middle_id, 0), "middle %s" % middle_id
        elif major_id is not None:
            pool, scope = by_major.get(major_id, 0), "major %s" % major_id
        else:
            pool, scope = cert_total, "certification"

        required = int(math.ceil(target_for(exam_type) * MULTIPLIER))
        if pool < required:
            short.append((exam_id, title, exam_type, scope, lesson_id, pool, required))

    print("\n%d of %d exams are below the bank minimum\n" % (len(short), len(exams)))
    for exam_id, title, exam_type, scope, lesson_id, pool, required in short:
        name = lesson_meta.get(lesson_id, ("-",))[0] if lesson_id else "-"
        print("  exam %-5s %-12s %-11s pool %3d / %3d   %s"
              % (exam_id, exam_type, scope, pool, required, (title or name)[:48]))

    empty = sorted(l for l, n in per_lesson.items() if n == 0)
    thin = sorted((n, l) for l, n in per_lesson.items() if 0 < n < 15)
    print("\nlessons with NO questions: %d" % len(empty))
    for lesson_id in empty:
        print("  lesson %-5s %s" % (lesson_id, lesson_meta[lesson_id][0][:60]))
    print("\nlessons with 1-14 questions: %d" % len(thin))
    for n, lesson_id in thin:
        print("  lesson %-5s %2d  %s" % (lesson_id, n, lesson_meta[lesson_id][0][:60]))


if __name__ == "__main__":
    main()
