"""Pseudocode is no longer a question language: it can be neither run nor compared.

Every question still stored as PSEUDOCODE is converted to a real language. The only one
live on 2026-11-12 is CodeStrike problem 6 (#23633, "Shipping container nesting"); it
becomes Python again, with the same 70 boxes and the same answer. The Python reference
is run on Judge0 first and must print the stored expected output exactly.

A learner's saved but not yet graded pseudocode answer cannot be marked as Python, so it
is cleared (the editor then opens on the new starter). Attempt snapshots are refreshed.
One transaction.

    PYTHONPATH=. .venv/Scripts/python scripts/challenges/remove_pseudocode.py [--dry-run]
"""
import asyncio
import json
import sys
from pathlib import Path

from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).parent))

from codestrike_problems import p6_nested_containers  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.services.code_runner import run_tests  # noqa: E402

NOTE = ("Language: Python. Complete the function in the starter code; "
        "the data and the printing are already there.")


def python_version_of_23633():
    made = p6_nested_containers()
    starter = made["data"] + "\n" + made["stub"]
    reference = made["data"] + "\n" + made["ref"].lstrip("\n")
    stem = (f"{made['title']}\n\n{NOTE}\n\n{made['statement']}\n\n"
            "Your program receives no input: the data is already defined in the starter code. "
            "Keep it as given, and print exactly the output described above -- the judge compares "
            "your output with the expected output character for character (trailing spaces ignored).")
    explanation = made["explanation"] + "\n\nCommon mistake: " + made["mistake"]
    return starter, reference, stem, explanation


CONVERSIONS = {23633: python_version_of_23633}


async def main():
    session = SessionLocal()
    try:
        rows = session.execute(text(
            "select question_id, expected_output from programming_question_configs "
            "where upper(language) = 'PSEUDOCODE' order by question_id")).all()
        missing = [qid for qid, _ in rows if qid not in CONVERSIONS]
        if missing:
            raise SystemExit(f"No conversion written for pseudocode question(s) {missing}.")

        for qid, expected in rows:
            starter, reference, stem, explanation = CONVERSIONS[qid]()
            result = (await run_tests(reference, [""], "PYTHON"))[0]
            got = (result.stdout or "").rstrip()
            if not result.ok or got != (expected or "").rstrip():
                raise SystemExit(f"#{qid}: Python reference printed {got!r} ({result.error}), "
                                 f"expected {expected!r}")
            stub = (await run_tests(starter, [""], "PYTHON"))[0]
            if (stub.stdout or "").rstrip() == got:
                raise SystemExit(f"#{qid}: the starter already prints the answer")
            print(f"#{qid}: Python reference prints {got!r} on Judge0")

            session.execute(text("update questions set question_text = :t, explanation = :e "
                                 "where question_id = :q"), {"t": stem, "e": explanation, "q": qid})
            session.execute(text("update programming_question_configs set starter_code = :s, "
                                 "language = 'PYTHON' where question_id = :q"), {"s": starter, "q": qid})

            snaps = session.execute(text(
                "select attempt_question_id, question_data_snapshot from assessment_attempt_questions "
                "where source_question_id = :q"), {"q": qid}).all()
            for aqid, snapshot in snaps:
                data = json.loads(snapshot or "{}")
                data["starterCode"] = starter
                data["programmingLanguage"] = "PYTHON"
                if "questionText" in data:
                    data["questionText"] = stem
                session.execute(text("update assessment_attempt_questions set question_data_snapshot = :d, "
                                     "question_text_snapshot = :t where attempt_question_id = :a"),
                                {"d": json.dumps(data), "t": stem, "a": aqid})

            cleared = session.execute(text("""
                update assessment_attempt_answers a set submitted_code = null, programming_language = null
                from assessment_attempt_questions aq
                where a.attempt_question_id = aq.attempt_question_id and aq.source_question_id = :q
                  and upper(a.programming_language) = 'PSEUDOCODE' and a.is_correct is null"""),
                {"q": qid}).rowcount
            print(f"#{qid}: now Python ({len(snaps)} attempt snapshot(s), {cleared} ungraded pseudocode answer(s) cleared)")

        if "--dry-run" in sys.argv:
            session.rollback()
            print("dry run -- rolled back")
        else:
            session.commit()
            print("committed")
    finally:
        session.close()


asyncio.run(main())
