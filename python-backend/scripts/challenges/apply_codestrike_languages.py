"""Switches the live CodeStrike problems to the languages in `codestrike_languages.py`.

Same questions, same data, same expected output (verified on Judge0 by
`verify_codestrike_languages.py`); only the statement's language notes, the starter code
and the stored language change. Attempt snapshots are updated too, so a learner who
already opened a problem sees the new starter code. One transaction.

    PYTHONPATH=. .venv/Scripts/python scripts/challenges/apply_codestrike_languages.py [--dry-run]
"""
import json
import sys
from pathlib import Path

from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).parent))

from codestrike_languages import LABEL, build  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402

NOTES = {
    "SQL": (
        "Language: SQL (SQLite). The starter script creates and fills the tables `task` and "
        "`prerequisite`. Add TWO SELECT queries after it: the first returns one row with the number "
        "of days, the second one row with the path. SQLite prints each result row on its own line, "
        "so those two rows are your two output lines."
    ),
}

RENAMES = {1: [("`plan_rooms(meetings)`", "`planRooms(meetings)`")]}


def statement(number, language, text_):
    title, _, rest = text_.partition("\n\n")
    note = NOTES.get(language, f"Language: {LABEL[language]}. Complete the function in the starter code; "
                               "the data and the printing are already there.")
    for old, new in RENAMES.get(number, []):
        rest = rest.replace(old, new)
    if rest.startswith("Language:"):  # re-runs replace the note instead of stacking another
        rest = rest.partition("\n\n")[2]
    return f"{title}\n\n{note}\n\n{rest}"


def main():
    session = SessionLocal()
    try:
        rows = session.execute(text("""
            select eq.display_order, q.question_id, q.question_text, p.starter_code
            from exam_questions eq join questions q on q.question_id = eq.question_id
            join programming_question_configs p on p.question_id = q.question_id
            where eq.exam_id = 609 order by eq.display_order""")).all()
        for number, qid, question_text, starter in rows:
            language, new_starter, _ = build(number, starter)
            if new_starter is None:
                new_starter = starter
            stem = statement(number, language, question_text)
            session.execute(text("update questions set question_text = :t where question_id = :q"),
                            {"t": stem, "q": qid})
            session.execute(text("update programming_question_configs set starter_code = :s, language = :l "
                                 "where question_id = :q"), {"s": new_starter, "l": language, "q": qid})
            snaps = session.execute(text("select attempt_question_id, question_data_snapshot from "
                                         "assessment_attempt_questions where source_question_id = :q"),
                                    {"q": qid}).all()
            for aqid, snapshot in snaps:
                data = json.loads(snapshot or "{}")
                data["starterCode"] = new_starter
                data["programmingLanguage"] = language
                session.execute(text("update assessment_attempt_questions set question_data_snapshot = :d, "
                                     "question_text_snapshot = :t where attempt_question_id = :a"),
                                {"d": json.dumps(data), "t": stem, "a": aqid})
            print(f"p{number} #{qid} -> {language} ({len(snaps)} attempt snapshot(s))")
        if "--dry-run" in sys.argv:
            session.rollback()
            print("dry run -- rolled back")
        else:
            session.commit()
            print("committed")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


main()
