"""Seeds the FE Exam certification: skeleton, lessons, and lesson quizzes.

Nothing here calls a model. The FE syllabus is a published, stable document
and the account has no generation credits, so the curriculum is written by
hand -- the same decision the TOPCIT expansion made, for the same reasons, and
it produces better material anyway: a generated lesson can only be as good as
the one-line description the planner gave it.

Everything is idempotent, keyed by title at every level. The certification is
matched by `CERTIFICATION_TITLE`, a major by (certification, title), a middle
by (major, title), a lesson by (middle, name), and a quiz by (certification,
title). Running any of it twice adds nothing the second time -- which matters
because these tables go live and learners accumulate progress against the row
ids.

A lesson already in the database is REWRITTEN only when the module has grown
it, measured on both section and block count. Content here is revised upward;
shrinking is never automatic, because that would silently discard material if
a module were edited down by accident.

Usage:

    # skeleton only -- certification, 9 majors, 23 middles
    python scripts/fe_expansion/seed.py --skeleton

    # one or more content batches
    python scripts/fe_expansion/seed.py basic_theory_01 basic_theory_02

    # every content module that exists
    python scripts/fe_expansion/seed.py --all

Runs either inside the `python-api` container or on the host; see
`dbsession.py` for how the connection is resolved.
"""

import glob
import importlib
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text

from dbsession import open_session
from structure import (CERTIFICATION_DESCRIPTION, CERTIFICATION_INDUSTRY,
                       CERTIFICATION_TITLE, CURRICULUM, EXAM_STRUCTURE)

LESSON_QUIZ_TYPE_ID = 5
QUIZ_PASSING_SCORE = 70

#: `certifications.status`. 0 is what both existing certifications carry.
CERTIFICATION_STATUS = 0

#: What the grader splits `accepted_variations` on. Named rather than inlined
#: because it is a contract with Java code in another service, and a comma
#: here silently disables every variation in the bank.
VARIATION_SEPARATOR = "\n"


# ------------------------------------------------------------------ skeleton

def ensure_certification(db):
    existing = db.execute(text(
        "select certification_id from public.certifications where title = :t"),
        {"t": CERTIFICATION_TITLE}).scalar()
    if existing:
        # The description and the exam structure are refreshed on every run,
        # unlike everything else here. They are this file's statement of what
        # the paper *is*, they carry no learner progress, and getting the
        # format wrong is the kind of error that is found after the row
        # already exists -- so "create once and never touch" would mean the
        # correction never reaches the database.
        db.execute(text("""
            update public.certifications
               set description = :d, industry = :i,
                   exam_structure = cast(:e as jsonb), date_updated = now()
             where certification_id = :c
               and (description is distinct from :d
                    or exam_structure is distinct from cast(:e as jsonb))"""), {
            "c": existing, "d": CERTIFICATION_DESCRIPTION,
            "i": CERTIFICATION_INDUSTRY, "e": json.dumps(EXAM_STRUCTURE),
        })
        print("= certification %s  %s" % (existing, CERTIFICATION_TITLE))
        return existing

    certification_id = db.execute(text("""
        insert into public.certifications
            (title, description, industry, status, exam_structure,
             date_created, date_updated)
        values (:t, :d, :i, :s, cast(:e as jsonb), now(), now())
        returning certification_id"""), {
        "t": CERTIFICATION_TITLE, "d": CERTIFICATION_DESCRIPTION,
        "i": CERTIFICATION_INDUSTRY, "s": CERTIFICATION_STATUS,
        "e": json.dumps(EXAM_STRUCTURE),
    }).scalar()
    print("+ certification %s  %s" % (certification_id, CERTIFICATION_TITLE))
    return certification_id


def ensure_major(db, certification_id, title):
    existing = db.execute(text("""
        select major_category_id from public.major_categories
         where certification_id = :c and title = :t"""),
        {"c": certification_id, "t": title}).scalar()
    if existing:
        return existing, False
    major_id = db.execute(text("""
        insert into public.major_categories (title, certification_id)
        values (:t, :c) returning major_category_id"""),
        {"t": title, "c": certification_id}).scalar()
    return major_id, True


def ensure_middle(db, major_id, title):
    existing = db.execute(text("""
        select middle_category_id from public.middle_categories
         where major_category_id = :m and title = :t"""),
        {"m": major_id, "t": title}).scalar()
    if existing:
        return existing, False
    middle_id = db.execute(text("""
        insert into public.middle_categories (title, major_category_id)
        values (:t, :m) returning middle_category_id"""),
        {"t": title, "m": major_id}).scalar()
    return middle_id, True


def seed_skeleton(db):
    """Creates the certification and its category tree, and returns the map
    a content module needs: {(major title, middle title): middle_category_id}."""
    certification_id = ensure_certification(db)
    index = {}
    for major_title, middles in CURRICULUM:
        major_id, made = ensure_major(db, certification_id, major_title)
        print("  %s major  %-5s %s" % ("+" if made else "=", major_id, major_title))
        for middle_title, _lessons in middles:
            middle_id, made = ensure_middle(db, major_id, middle_title)
            print("    %s middle %-5s %s"
                  % ("+" if made else "=", middle_id, middle_title))
            index[(major_title, middle_title)] = middle_id
    return certification_id, index


def middle_index(db):
    """The same map as `seed_skeleton` returns, without creating anything.

    A content module addresses its middle category by the pair of titles
    rather than by a hard-coded id, because the ids are assigned by the
    database on first run and differ between the developer's copy and
    production. The TOPCIT modules hard-code them and are consequently pinned
    to one database.
    """
    rows = db.execute(text("""
        select mj.title, mi.title, mi.middle_category_id
          from public.middle_categories mi
          join public.major_categories mj
            on mj.major_category_id = mi.major_category_id
          join public.certifications c
            on c.certification_id = mj.certification_id
         where c.title = :t"""), {"t": CERTIFICATION_TITLE}).fetchall()
    return {(major, middle): middle_id for major, middle, middle_id in rows}


# ----------------------------------------------------------------- questions

def insert_question(db, lesson_id, item):
    question_id = db.execute(text("""
        insert into public.questions
            (question_text, question_type, total_points, difficulty_level,
             lesson_id, created_at)
        values (:t, :qt, :p, :d, :l, now())
        returning question_id"""), {
        "t": item["question"], "qt": item["type"], "p": 1,
        "d": item["difficulty"], "l": lesson_id,
    }).scalar()

    if item["type"] == "MCQ":
        for choice_text, is_correct in item["choices"]:
            db.execute(text("""
                insert into public.choices
                    (choice_text, is_correct, explanation, question_id)
                values (:c, :ok, :e, :q)"""), {
                "c": choice_text, "ok": is_correct,
                # The bank only ever explains the correct choice; why a given
                # distractor is wrong belongs inside that same text.
                "e": item["explanation"] if is_correct else None,
                "q": question_id,
            })

    elif item["type"] in ("SHORT_ANSWER", "DESCRIPTIVE"):
        if item["type"] == "SHORT_ANSWER":
            # Newline-joined, not comma-joined. AssessmentAttemptService's
            # matchesTextAnswer splits accepted variations on a newline, so a
            # comma-joined list is stored as one long string no learner will
            # ever type, and every variation in it is silently dead.
            method = "EXACT_MATCH"
            variations = VARIATION_SEPARATOR.join(item["variations"])
        else:
            method, variations = "AI_SEMANTIC", None
        db.execute(text("""
            insert into public.text_question_configs
                (checking_method, correct_answer, accepted_variations, question_id)
            values (:m, :a, :v, :q)"""), {
            "m": method, "a": item["answer"], "v": variations, "q": question_id,
        })
        for order_index, (name, max_points) in enumerate(item.get("rubric", []), start=1):
            db.execute(text("""
                insert into public.question_rubric_criteria
                    (display_order, max_points, name, question_id)
                values (:o, :mp, :n, :q)"""), {
                "o": order_index, "mp": max_points, "n": name, "q": question_id,
            })

    return question_id


# ------------------------------------------------------------------- lessons

def _without_ids(value):
    """The same structure with every `id` removed, at any depth.

    Block and list-item ids are uuid4 and are minted fresh on every import of
    a content module, so two structurally identical lessons never compare
    equal with them left in. They are React keys and nothing else -- no other
    row references them -- so dropping them is exactly the right basis for
    "has this lesson actually changed?".
    """
    if isinstance(value, dict):
        return {key: _without_ids(item) for key, item in value.items()
                if key != "id"}
    if isinstance(value, list):
        return [_without_ids(item) for item in value]
    return value


def seed_lesson(db, certification_id, middles, spec):
    middle_id = middles.get((spec["major"], spec["middle"]))
    if middle_id is None:
        raise KeyError("no middle category %r / %r -- run --skeleton first"
                       % (spec["major"], spec["middle"]))

    existing = db.execute(text("""
        select lesson_id, lesson_component_structure
          from public.lessons
         where middle_category_id = :m and name = :n"""),
        {"m": middle_id, "n": spec["name"]}).fetchone()

    if existing:
        lesson_id, stored_structure = existing
        if isinstance(stored_structure, str):
            stored_structure = json.loads(stored_structure)

        stored_sections = len(stored_structure)
        new_sections = len(spec["structure"])
        stored_blocks = sum(len(s.get("content", [])) for s in stored_structure)
        new_blocks = sum(len(s["content"]) for s in spec["structure"])

        # Compare the CONTENT, not the counts.
        #
        # Counting sections and blocks was the original test and it silently
        # missed a whole class of revision: swapping every SVG-table figure in
        # a lesson for a real `table` block changed what a learner sees on
        # every page while leaving both counts exactly equal, so the lesson
        # reported "unchanged" and the database kept the old version. Any edit
        # that rewrites a paragraph has the same problem.
        #
        # Block ids are uuid4 and are regenerated on every import, so they are
        # stripped before comparing -- otherwise every run would look changed
        # and every lesson would be rewritten pointlessly.
        differs = _without_ids(stored_structure) != _without_ids(spec["structure"])

        # Shrinking is still never automatic. Content here is revised upward,
        # and a module accidentally edited down should not quietly discard
        # material from a live row -- so a smaller lesson is reported and
        # skipped rather than written.
        shrinking = new_sections < stored_sections or new_blocks < stored_blocks

        if differs and not shrinking:
            db.execute(text("""
                update public.lessons
                   set lesson_component_structure = cast(:s as jsonb)
                 where lesson_id = :i"""),
                {"s": json.dumps(spec["structure"]), "i": lesson_id})
            print("  ~ lesson %-5s %-46s %2d->%2d sections  %3d->%3d blocks"
                  % (lesson_id, spec["name"][:46], stored_sections,
                     new_sections, stored_blocks, new_blocks))
        elif shrinking:
            print("  ! lesson %-5s %-46s WOULD SHRINK %2d->%2d sections "
                  "%3d->%3d blocks -- skipped"
                  % (lesson_id, spec["name"][:46], stored_sections,
                     new_sections, stored_blocks, new_blocks))
        else:
            print("  = lesson %-5s %-46s %2d sections %3d blocks (unchanged)"
                  % (lesson_id, spec["name"][:46], stored_sections, stored_blocks))
        return lesson_id, 0, False

    lesson_id = db.execute(text("""
        insert into public.lessons (name, middle_category_id, lesson_component_structure)
        values (:n, :m, cast(:s as jsonb)) returning lesson_id"""), {
        "n": spec["name"], "m": middle_id,
        "s": json.dumps(spec["structure"]),
    }).scalar()

    for item in spec["quiz"]:
        insert_question(db, lesson_id, item)

    quiz_title = "%s Quiz" % spec["name"]
    quiz_exists = db.execute(text(
        "select exam_id from public.exams where title = :t and certification_id = :c"),
        {"t": quiz_title, "c": certification_id}).scalar()

    made_quiz = False
    if not quiz_exists and spec["quiz"]:
        # The same shape every other LESSON_QUIZ in the product has:
        # published, 70% to pass, scoped to the lesson, two minutes an item
        # plus a few to read the stems.
        minutes = 2 * len(spec["quiz"]) + 3
        exam_id = db.execute(text("""
            insert into public.exams
                (title, status, target_scope, total_questions, duration_minutes,
                 passing_score, is_generated, certification_id, exam_type_id,
                 lesson_id, published_at, updated_at)
            values (:t, 'PUBLISHED', 'LESSON', :n, :d, :p, false, :c, :et, :l,
                    now(), now())
            returning exam_id"""), {
            "t": quiz_title, "n": len(spec["quiz"]), "d": minutes,
            "p": QUIZ_PASSING_SCORE, "c": certification_id,
            "et": LESSON_QUIZ_TYPE_ID, "l": lesson_id,
        }).scalar()

        for order, item in enumerate(spec["quiz"], start=1):
            question_id = db.execute(text("""
                select question_id from public.questions
                 where lesson_id = :l and question_text = :t
                 order by question_id desc limit 1"""),
                {"l": lesson_id, "t": item["question"]}).scalar()
            db.execute(text("""
                insert into public.exam_questions (display_order, points, exam_id, question_id)
                values (:o, 1, :e, :q)"""),
                {"o": order, "e": exam_id, "q": question_id})
        made_quiz = True

    print("  + lesson %-5s %-52s %2d sections, %2d questions%s"
          % (lesson_id, spec["name"][:52], len(spec["structure"]),
             len(spec["quiz"]), ", quiz" if made_quiz else ""))
    return lesson_id, len(spec["quiz"]), made_quiz


def content_batches():
    here = os.path.dirname(os.path.abspath(__file__))
    names = [os.path.basename(p)[len("content_"):-len(".py")]
             for p in sorted(glob.glob(os.path.join(here, "content_*.py")))]
    return names


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return 1

    batches = []
    if "--all" in args:
        batches = content_batches()
    else:
        batches = [a for a in args if not a.startswith("--")]

    # Refuse to write content that fails the quality gate.
    #
    # This was learned the hard way: `check.py` reported two lessons below the
    # platform's section minimum and `seed.py`, run in the same breath,
    # cheerfully wrote them anyway -- because nothing connected the two. A
    # gate nobody is forced through is a gate that gets skipped on the busy
    # day, and these rows go live.
    #
    # `--force` exists for the deliberate case: seeding a batch mid-revision
    # to look at it in the app before it is finished.
    if batches and "--force" not in args:
        import check
        if check.main_for(batches) != 0:
            print("\nrefusing to seed: fix the problems above, or pass "
                  "--force to write anyway")
            return 1

    db = open_session()
    certification_id, middles = seed_skeleton(db)

    total_lessons = total_questions = total_quizzes = 0
    for batch in batches:
        module = importlib.import_module("content_%s" % batch)
        print("\n== %s: %d lessons" % (batch, len(module.LESSONS)))
        for spec in module.LESSONS:
            _, questions, made_quiz = seed_lesson(db, certification_id, middles, spec)
            if questions:
                total_lessons += 1
            total_questions += questions
            total_quizzes += 1 if made_quiz else 0

    db.commit()
    db.close()
    print("\nseeded %d lessons, %d questions, %d quizzes"
          % (total_lessons, total_questions, total_quizzes))
    return 0


if __name__ == "__main__":
    sys.exit(main())
