"""Gives every question in a certification a real difficulty, judged from the question.

    docker compose exec -T python-api \
        python /app/scripts/bank_expansion/classify_difficulty.py --cert 4 [--commit]

WHY THIS EXISTS

`questions.difficulty_level` is not a tag on the side of a question -- it IS
the IRT difficulty parameter. `IrtModel.difficultyOf` maps EASY/AVERAGE/HARD
to b = -1.5 / 0.0 / +1.5, and the adaptive engine picks the next item by
comparing that b to the learner's ability.

The IT Passport bank came out 85.8% AVERAGE, 8.8% EASY, 5.4% HARD, with 43 of
its 63 lessons holding nothing but AVERAGE. That is not a cosmetic imbalance:
a bank at one point on the scale gives the engine nothing to climb or descend,
so every learner is served b = 0 items whatever they know, and every sitting
measures roughly the same thing. The proficiency it reports is then far less
informative than the number on screen suggests.

The cause is mundane -- IPA does not publish per-question difficulty, so the
past-paper import stored the column's default for all of them.

WHY NOT JUST REBALANCE THE LABELS

Because that would be inventing the data the engine then trusts. Assigning a
third of the bank to HARD at random makes the engine confidently wrong rather
than honestly limited, and the error is invisible: nothing downstream can tell
a measured difficulty from a made-up one.

Empirical calibration is not available either. Only 189 of 3,018 questions
have five or more recorded responses, and those come from a handful of
learners -- a p-value from that is noise wearing a number's clothes.

So the difficulty is JUDGED FROM THE QUESTION, by a model, against the same
three definitions the generator is now held to:

    EASY    a single recalled fact, term or definition
    AVERAGE applying one idea to a short scenario
    HARD    combining two or more ideas, a multi-step calculation, or
            reasoning about a trade-off

That is a genuine property of the item and it is what the labels are supposed
to mean. It is a judgement, not a measurement, and it is recorded as such:
every row this writes is stamped in `difficulty_source` so a later empirical
calibration can tell which labels came from a model and overwrite them without
having to guess.

WHAT IT DOES NOT DO

It does not force a distribution. If a paper really is mostly mid-level, the
result is mostly AVERAGE and the honest fix is to AUTHOR easier and harder
items -- which is what `--report-gaps` prints the work order for. Quotas belong
in generation, where they shape what gets written; applied here they would just
relabel.

Runs in batches, skips anything already classified (so it is resumable), and
without --commit writes nothing.
"""

import argparse
import asyncio
import json
import os
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")

from sqlalchemy import text

from app.utils.helpers import get_llm
from dbsession import open_session

LEVELS = ("EASY", "AVERAGE", "HARD")

#: Questions per model call. Big enough that the definitions are not re-sent
#: for every item, small enough that one malformed reply costs little.
BATCH = 25

#: How much of a stem to show. A past-paper stem plus its citation runs long,
#: and the difficulty is decided by what is being asked, which is at the front.
STEM_CHARS = 700

SYSTEM = """You judge how hard exam questions are. You are given questions
from an IT certification. For each, return exactly one difficulty:

EASY    - a single recalled fact, term or definition. The candidate either
          knows it or does not; no working is involved.
AVERAGE - applying one idea to a short scenario, or a one-step calculation.
HARD    - combining two or more ideas, a multi-step calculation, or reasoning
          about a trade-off between options.

Judge the question as asked, not the topic's reputation. A famous-sounding
topic asked as "what does X stand for" is EASY. An unglamorous topic that
needs three steps of arithmetic is HARD.

Reply with ONLY a JSON array, one object per question, in the order given:
[{"id": <the id>, "difficulty": "EASY|AVERAGE|HARD"}]
No prose, no markdown fence."""


def has_source_column(db):
    return db.execute(text("""
        select 1 from information_schema.columns
         where table_name = 'questions'
           and column_name = 'difficulty_source'""")).first() is not None


def fetch(db, cert, only_unjudged, limit):
    # On a dry run before the column exists, nothing can have been judged yet,
    # so the "skip what is already done" filter has nothing to filter and is
    # dropped rather than referencing a column that is not there.
    if only_unjudged and not has_source_column(db):
        only_unjudged = False
    # Built into the SQL rather than passed as a parameter: Postgres plans the
    # whole statement before it evaluates anything, so a column named in a
    # branch that can never run still has to exist. Parameterising this is what
    # made a dry run fail on a database the script had not yet migrated.
    unjudged_only = "and q.difficulty_source is null" if only_unjudged else ""
    rows = db.execute(text(f"""
        select q.question_id, q.question_text, q.difficulty_level
          from questions q
          join lessons l on l.lesson_id = q.lesson_id
          join middle_categories m on m.middle_category_id = l.middle_category_id
          join major_categories j on j.major_category_id = m.major_category_id
         where j.certification_id = :cert
           and q.parent_question_id is null
           {unjudged_only}
         order by q.question_id
         limit :limit"""),
        {"cert": cert, "limit": limit}).fetchall()
    return [(r[0], (r[1] or "")[:STEM_CHARS], r[2]) for r in rows]


async def judge(llm, batch):
    """{question_id: level} for one batch, empty when the reply is unusable."""
    listing = "\n\n".join(f'id {qid}: {stem}' for qid, stem, _ in batch)
    reply = await llm.ainvoke(
        [("system", SYSTEM), ("human", listing)]
    )
    body = (reply.content or "").strip()
    if body.startswith("```"):
        body = body.split("\n", 1)[1].rsplit("```", 1)[0]
    try:
        parsed = json.loads(body)
    except json.JSONDecodeError:
        print("   (unreadable reply for a batch of %d -- left alone)" % len(batch))
        return {}

    known = {qid for qid, _, _ in batch}
    out = {}
    for item in parsed if isinstance(parsed, list) else []:
        try:
            qid = int(item["id"])
            level = str(item["difficulty"]).strip().upper()
        except (KeyError, TypeError, ValueError):
            continue
        # A level outside the three is dropped rather than coerced: coercing
        # it to AVERAGE is exactly the failure this script exists to undo.
        if qid in known and level in LEVELS:
            out[qid] = level
    return out


def ensure_source_column(db):
    """`difficulty_source` marks where a label came from.

    Without it there is no way to tell a judged label from an imported default
    from a hand-set one, and a rerun cannot know what it has already done.
    Added here rather than on the entity because it is bookkeeping for this
    process, not a property the application reads.
    """
    db.execute(text(
        "alter table questions add column if not exists difficulty_source varchar(20)"))
    db.commit()


def report_gaps(db, cert):
    print("\nper-lesson work order -- what is still missing after judging:")
    rows = db.execute(text("""
        select l.lesson_id, l.name,
               count(*) filter (where upper(q.difficulty_level) = 'EASY')    as easy,
               count(*) filter (where upper(q.difficulty_level) = 'AVERAGE') as average,
               count(*) filter (where upper(q.difficulty_level) = 'HARD')    as hard,
               count(*) as total
          from lessons l
          join questions q on q.lesson_id = l.lesson_id and q.parent_question_id is null
          join middle_categories m on m.middle_category_id = l.middle_category_id
          join major_categories j on j.major_category_id = m.major_category_id
         where j.certification_id = :cert
         group by l.lesson_id, l.name
         order by l.lesson_id"""), {"cert": cert}).fetchall()

    short = [r for r in rows if min(r[2], r[3], r[4]) < 3]
    for lesson_id, name, easy, average, hard, total in short:
        need = ", ".join(
            "%d more %s" % (3 - count, level)
            for level, count in (("EASY", easy), ("AVERAGE", average), ("HARD", hard))
            if count < 3)
        print("   lesson %-5d %-40s E=%-3d A=%-3d H=%-3d  needs %s"
              % (lesson_id, name[:40], easy, average, hard, need))
    print("   (%d of %d lessons hold fewer than 3 at some level)" % (len(short), len(rows)))


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cert", type=int, required=True)
    parser.add_argument("--limit", type=int, default=100000)
    parser.add_argument("--redo", action="store_true",
                        help="re-judge questions already judged")
    parser.add_argument("--report-gaps", action="store_true")
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()

    db = open_session()
    try:
        if args.commit:
            ensure_source_column(db)
        elif not has_source_column(db):
            print("note: difficulty_source does not exist yet; --commit adds it\n")

        if args.report_gaps:
            report_gaps(db, args.cert)
            return

        pending = fetch(db, args.cert, not args.redo, args.limit)
        if not pending:
            print("nothing left to judge for certification %d" % args.cert)
            return

        # The cheap instruction model: this is a three-way classification
        # against definitions supplied in the prompt, not authoring.
        llm = get_llm("grading")
        print("judging %d questions in batches of %d\n" % (len(pending), BATCH))

        moved = {}
        unchanged = 0
        for start in range(0, len(pending), BATCH):
            batch = pending[start:start + BATCH]
            verdicts = await judge(llm, batch)
            for qid, _, current in batch:
                level = verdicts.get(qid)
                if level is None:
                    continue
                if level == (current or "").upper():
                    unchanged += 1
                else:
                    moved[qid] = level
                if args.commit:
                    db.execute(text("""
                        update questions
                           set difficulty_level = :level, difficulty_source = 'AI_JUDGED'
                         where question_id = :qid"""), {"level": level, "qid": qid})
            done = min(start + BATCH, len(pending))
            print("   %d/%d judged" % (done, len(pending)), flush=True)
            if args.commit:
                db.commit()

        print("\njudged:      %d" % (len(moved) + unchanged))
        print("   kept:     %d" % unchanged)
        print("   changed:  %d" % len(moved))
        tally = {level: sum(1 for v in moved.values() if v == level) for level in LEVELS}
        print("   moved to: " + ", ".join("%s %d" % (k, v) for k, v in tally.items()))

        rows = db.execute(text("""
            select upper(q.difficulty_level) as level, count(*) as n
              from questions q
              join lessons l on l.lesson_id = q.lesson_id
              join middle_categories m on m.middle_category_id = l.middle_category_id
              join major_categories j on j.major_category_id = m.major_category_id
             where j.certification_id = :cert and q.parent_question_id is null
             group by 1 order by 2 desc"""), {"cert": args.cert}).fetchall()
        total = sum(r[1] for r in rows) or 1
        print("\nbank now:")
        for level, n in rows:
            print("   %-8s %5d  %5.1f%%" % (level, n, 100.0 * n / total))

        report_gaps(db, args.cert)

        if args.commit:
            db.commit()
            print("\ncommitted")
        else:
            db.rollback()
            print("\nDRY RUN -- nothing written")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
