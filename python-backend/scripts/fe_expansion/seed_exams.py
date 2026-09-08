"""Builds the FE certification's category exams, diagnostic and mock paper.

The question bank itself needs no separate step: every question is created by
`seed.py` attached to the lesson that teaches it, and the Question Bank pages
read exactly that set. What this script does is assemble those questions into
the four assessment types above the lesson quiz.

    LESSON_QUIZ   one per lesson, 10 items      -- made by seed.py
    MIDDLE_EXAM   one per middle category, 20   -- here
    MAJOR_EXAM    one per major category, 30    -- here
    DIAGNOSTIC    one per certification         -- here
    MOCK_EXAM     one per certification, 80     -- here

Questions are REUSED rather than written twice, which is the pattern the
existing TOPCIT certification follows -- of its 1,294 questions, 255 appear in
more than one assessment. Writing a separate bank for every exam would be four
times the authoring for no pedagogical gain, since a middle exam is meant to
test the same material its lessons taught.

Selection is spread and deterministic. Spread: items are taken round-robin
across the lessons in scope, so a twenty-item middle exam over five lessons
takes four from each rather than twenty from the first. Deterministic: the
shuffle is seeded from the exam's own title, so re-running produces the same
paper and a learner's half-finished attempt does not silently change under
them.

Usage:
    python scripts/fe_expansion/seed_exams.py            # create what is missing
    python scripts/fe_expansion/seed_exams.py --rebuild  # also refresh membership
    python scripts/fe_expansion/seed_exams.py --report   # show coverage, write nothing

`--rebuild` exists because these exams are assembled from lessons that arrive
in batches. An exam built when its category held two lessons should be
reassembled once it holds five, and without the flag the idempotency check
would leave it as it was.
"""

import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text

from dbsession import open_session
from structure import CERTIFICATION_TITLE

MIDDLE_EXAM_TYPE_ID = 4
MAJOR_EXAM_TYPE_ID = 3
DIAGNOSTIC_TYPE_ID = 1
MOCK_EXAM_TYPE_ID = 2

MIDDLE_EXAM_ITEMS = 20
MAJOR_EXAM_ITEMS = 30

#: The real paper: 60 Subject A items in 90 minutes, 20 Subject B in 100.
MOCK_SUBJECT_A_ITEMS = 60
MOCK_SUBJECT_B_ITEMS = 20
MOCK_DURATION_MINUTES = 190

#: 600 of 1000 in each subject. Stored as a percentage, which is what
#: `exams.passing_score` holds everywhere else in the product.
PASSING_SCORE = 60

#: Two minutes an item plus reading time, matching the lesson quizzes.
def _minutes(items):
    return 2 * items + 5


# ------------------------------------------------------------------ reading

def certification_id(db):
    found = db.execute(text(
        "select certification_id from public.certifications where title = :t"),
        {"t": CERTIFICATION_TITLE}).scalar()
    if not found:
        raise SystemExit("certification %r does not exist -- run "
                         "seed.py --skeleton first" % CERTIFICATION_TITLE)
    return found


def curriculum_rows(db, cert_id):
    """Every lesson under the certification, with its category ids."""
    return db.execute(text("""
        select mj.major_category_id, mj.title,
               mi.middle_category_id, mi.title,
               l.lesson_id, l.name
          from public.major_categories mj
          join public.middle_categories mi
            on mi.major_category_id = mj.major_category_id
          join public.lessons l
            on l.middle_category_id = mi.middle_category_id
         where mj.certification_id = :c
         order by mj.major_category_id, mi.middle_category_id, l.lesson_id"""),
        {"c": cert_id}).fetchall()


def questions_by_lesson(db, lesson_ids):
    """{lesson_id: [question_id]}, ordered so selection is reproducible."""
    if not lesson_ids:
        return {}
    rows = db.execute(text("""
        select lesson_id, question_id from public.questions
         where lesson_id = any(:ids) and parent_question_id is null
         order by lesson_id, question_id"""),
        {"ids": list(lesson_ids)}).fetchall()
    grouped = {}
    for lesson_id, question_id in rows:
        grouped.setdefault(lesson_id, []).append(question_id)
    return grouped


# ---------------------------------------------------------------- selecting

def spread(pools, wanted, seed):
    """Take `wanted` ids round-robin across `pools`, a list of id lists.

    Round-robin rather than a flat sample because a flat sample over uneven
    pools follows the sizes: a middle category whose first lesson carries ten
    questions and whose fifth carries ten would, sampled flatly, still give a
    paper weighted by whatever order the rows came back in. Taking one from
    each pool in turn guarantees every lesson is represented before any lesson
    is represented twice.

    Each pool is shuffled with its own seeded generator so the choice within a
    lesson is stable across runs but not simply "the lowest ids".
    """
    rng = random.Random(seed)
    shuffled = []
    for index, pool in enumerate(pools):
        copy = list(pool)
        random.Random("%s:%d" % (seed, index)).shuffle(copy)
        shuffled.append(copy)

    picked, exhausted = [], False
    while len(picked) < wanted and not exhausted:
        exhausted = True
        for pool in shuffled:
            if not pool:
                continue
            exhausted = False
            picked.append(pool.pop(0))
            if len(picked) >= wanted:
                break

    # The order questions are ASKED in is shuffled separately, so a paper does
    # not walk the syllabus lesson by lesson and hand the candidate the topic
    # of each item for free.
    rng.shuffle(picked)
    return picked


# ----------------------------------------------------------------- writing

def upsert_exam(db, cert_id, title, exam_type_id, target_scope, question_ids,
                duration_minutes=None, description=None,
                major_category_id=None, middle_category_id=None,
                rebuild=False):
    """Creates the exam, or refreshes its questions when --rebuild is given.

    Identity is (certification, title), which is how every other exam in the
    product is keyed. The `exam_type_id` check below is not redundant: a
    major category and one of its middle categories may legitimately share a
    name -- FE's "Basic Theory" major contains a "Basic Theory" middle -- and
    an unqualified "<name> Exam" title for both silently made the major exam
    adopt the middle exam's row instead of being created. The titles are now
    qualified so it cannot recur, and this raises rather than corrupts if a
    future collision slips through.
    """
    existing = db.execute(text("""
        select exam_id, exam_type_id from public.exams
         where title = :t and certification_id = :c"""),
        {"t": title, "c": cert_id}).fetchone()

    if existing and existing[1] != exam_type_id:
        raise SystemExit(
            "exam title %r already exists for this certification with a "
            "different type (exam %d). Titles must be unique per "
            "certification." % (title, existing[0]))

    existing = existing[0] if existing else None

    if existing and not rebuild:
        return existing, "="

    minutes = duration_minutes or _minutes(len(question_ids))

    if existing:
        db.execute(text("delete from public.exam_questions where exam_id = :e"),
                   {"e": existing})
        db.execute(text("""
            update public.exams
               set total_questions = :n, duration_minutes = :d,
                   description = coalesce(:desc, description), updated_at = now()
             where exam_id = :e"""),
            {"n": len(question_ids), "d": minutes, "desc": description,
             "e": existing})
        exam_id, mark = existing, "~"
    else:
        exam_id = db.execute(text("""
            insert into public.exams
                (title, description, status, target_scope, total_questions,
                 duration_minutes, passing_score, is_generated,
                 certification_id, exam_type_id, major_category_id,
                 middle_category_id, published_at, updated_at)
            values (:t, :desc, 'PUBLISHED', :scope, :n, :d, :p, false, :c,
                    :et, :maj, :mid, now(), now())
            returning exam_id"""), {
            "t": title, "desc": description, "scope": target_scope,
            "n": len(question_ids), "d": minutes, "p": PASSING_SCORE,
            "c": cert_id, "et": exam_type_id,
            "maj": major_category_id, "mid": middle_category_id,
        }).scalar()
        mark = "+"

    for order, question_id in enumerate(question_ids, start=1):
        db.execute(text("""
            insert into public.exam_questions (display_order, points, exam_id, question_id)
            values (:o, 1, :e, :q)"""),
            {"o": order, "e": exam_id, "q": question_id})

    return exam_id, mark


# -------------------------------------------------------------------- main

def main():
    rebuild = "--rebuild" in sys.argv
    report_only = "--report" in sys.argv

    db = open_session()
    cert_id = certification_id(db)
    rows = curriculum_rows(db, cert_id)
    if not rows:
        print("no lessons yet -- seed some content first")
        return 0

    banks = questions_by_lesson(db, {r[4] for r in rows})

    # Group the curriculum once; every exam below is a different slice of it.
    middles, majors = {}, {}
    for major_id, major_title, middle_id, middle_title, lesson_id, _name in rows:
        middles.setdefault((major_id, middle_id, middle_title), []).append(lesson_id)
        majors.setdefault((major_id, major_title), []).append(lesson_id)

    print("%d lesson(s), %d question(s) in the bank\n"
          % (len(rows), sum(len(q) for q in banks.values())))

    if report_only:
        for (major_id, middle_id, title), lessons in sorted(middles.items()):
            available = sum(len(banks.get(l, [])) for l in lessons)
            print("  %-46s %2d lesson(s) %3d question(s)%s"
                  % (title[:46], len(lessons), available,
                     "" if available >= MIDDLE_EXAM_ITEMS else "  (thin)"))
        db.close()
        return 0

    # --- middle exams --------------------------------------------------
    print("Middle exams")
    for (major_id, middle_id, title), lessons in sorted(middles.items()):
        pools = [banks.get(l, []) for l in lessons]
        available = sum(len(p) for p in pools)
        if not available:
            continue
        exam_title = "%s Unit Exam" % title
        # A category with fewer questions than the target gets a shorter
        # paper rather than none: content arrives in batches, and an exam a
        # learner can sit now beats one that appears when the last lesson
        # lands. `--rebuild` grows it later.
        wanted = min(MIDDLE_EXAM_ITEMS, available)
        picked = spread(pools, wanted, exam_title)
        _exam_id, mark = upsert_exam(
            db, cert_id, exam_title, MIDDLE_EXAM_TYPE_ID, "MIDDLE", picked,
            description="Covers every lesson in %s." % title,
            middle_category_id=middle_id, rebuild=rebuild)
        print("  %s %-46s %2d item(s) from %d lesson(s)"
              % (mark, exam_title[:46], len(picked), len(lessons)))

    # --- major exams ---------------------------------------------------
    print("\nMajor exams")
    for (major_id, title), lessons in sorted(majors.items()):
        pools = [banks.get(l, []) for l in lessons]
        available = sum(len(p) for p in pools)
        if not available:
            continue
        exam_title = "%s Major Exam" % title
        wanted = min(MAJOR_EXAM_ITEMS, available)
        picked = spread(pools, wanted, exam_title)
        _exam_id, mark = upsert_exam(
            db, cert_id, exam_title, MAJOR_EXAM_TYPE_ID, "MAJOR", picked,
            description="Covers every middle category under %s." % title,
            major_category_id=major_id, rebuild=rebuild)
        print("  %s %-46s %2d item(s) from %d lesson(s)"
              % (mark, exam_title[:46], len(picked), len(lessons)))

    # --- diagnostic ----------------------------------------------------
    # One item per lesson, so a learner's first sitting produces a signal for
    # every lesson in the curriculum rather than a deep reading of a few. That
    # is what the adaptive engine needs from it.
    print("\nDiagnostic")
    lesson_pools = [banks.get(r[4], []) for r in rows]
    diagnostic_title = "FE Exam Diagnostic"
    picked = spread(lesson_pools, len(rows), diagnostic_title)
    if picked:
        _exam_id, mark = upsert_exam(
            db, cert_id, diagnostic_title, DIAGNOSTIC_TYPE_ID, "DIAGNOSTIC",
            picked,
            description=("One question from every lesson, to locate your "
                         "strengths and gaps before you start studying."),
            rebuild=rebuild)
        print("  %s %-46s %2d item(s), one per lesson"
              % (mark, diagnostic_title, len(picked)))

    # --- mock exam -----------------------------------------------------
    # Shaped like the real paper rather than like the curriculum. Subject A
    # samples the whole syllabus; Subject B is concentrated on Algorithm and
    # Programming with a security component, which is what the published
    # format specifies.
    print("\nMock exam")
    subject_b_titles = ("Algorithm and Programming", "Security")
    b_pools, a_pools = [], []
    for (_major_id, _major_title, _middle_id, middle_title,
         lesson_id, _name) in rows:
        pool = banks.get(lesson_id, [])
        if not pool:
            continue
        (b_pools if middle_title in subject_b_titles else a_pools).append(pool)

    subject_a = spread(a_pools or b_pools, MOCK_SUBJECT_A_ITEMS, "FE mock A")
    subject_b = spread(b_pools or a_pools, MOCK_SUBJECT_B_ITEMS, "FE mock B")
    # Subject A first, then Subject B, because that is the order the paper is
    # sat in and the two halves are not interchangeable.
    picked = subject_a + subject_b
    if picked:
        _exam_id, mark = upsert_exam(
            db, cert_id, "FE Exam Mock Paper", MOCK_EXAM_TYPE_ID, "MOCK",
            picked, duration_minutes=MOCK_DURATION_MINUTES,
            description=("A full paper in the shape of the real examination: "
                         "Subject A sampled across the whole syllabus, then "
                         "Subject B concentrated on algorithms, programming "
                         "and security."),
            rebuild=rebuild)
        print("  %s %-46s %2d item(s) (%d Subject A, %d Subject B)"
              % (mark, "FE Exam Mock Paper", len(picked),
                 len(subject_a), len(subject_b)))

    db.commit()
    db.close()
    print("\ndone%s" % ("" if rebuild else "   (use --rebuild to refresh "
                                          "membership as lessons are added)"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
