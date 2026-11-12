"""Deletes the 77 JavaScript seed questions left behind by early CodeStrike test runs.

They are "[CS-1790804080899-N1-P1] Write a function that returns 3"-style placeholders
(question ids 23078-23251), with no language, never in an exam, never served, with no
written sub-questions. Before deleting, every integer column whose name contains
"question_id" in every schema is checked: only questions and programming_question_configs
reference them. Both are backed up to deleted_js_seed_questions_2026-11-12.json next to
this script, then deleted in one transaction. A question that turns out to be in an exam,
served, a parent, or referenced anywhere else stops the run.

    PYTHONPATH=. .venv/Scripts/python scripts/programming_expected_output/delete_js_seed_questions.py [--apply]
"""
import json
import sys
from pathlib import Path

from sqlalchemy import text

from app.db.session import SessionLocal

BACKUP = Path(__file__).with_name("deleted_js_seed_questions_2026-11-12.json")
ALLOWED = {("public", "questions", "question_id"), ("public", "programming_question_configs", "question_id")}


def seed_ids(session):
    rows = session.execute(text("""
        select q.question_id, q.question_text, p.starter_code
        from questions q join programming_question_configs p on p.question_id = q.question_id
        where p.language is null""")).all()
    return [qid for qid, question, starter in rows
            if qid != 2264 and ("function solve(" in (starter or "") or "function " in (starter or ""))
            and (question.startswith("[Node ") or question.startswith("[CS-"))]


def main():
    session = SessionLocal()
    try:
        ids = seed_ids(session)
        print(len(ids), "seed questions:", ids[:5], "...", ids[-3:])
        cols = session.execute(text("""
            select table_schema, table_name, column_name from information_schema.columns
            where column_name like '%question_id%' and data_type in ('bigint', 'integer')
              and table_schema not in ('pg_catalog', 'information_schema')""")).all()
        for schema, table, column in cols:
            n = session.execute(text(f'select count(*) from "{schema}"."{table}" where "{column}" = any(:i)'),
                                {"i": ids}).scalar()
            if n and (schema, table, column) not in ALLOWED:
                raise SystemExit(f"refusing: {schema}.{table}.{column} references {n} of them")

        questions = [dict(r) for r in session.execute(
            text("select * from questions where question_id = any(:i) order by question_id"), {"i": ids}).mappings()]
        configs = [dict(r) for r in session.execute(
            text("select * from programming_question_configs where question_id = any(:i)"), {"i": ids}).mappings()]
        print(f"backing up {len(questions)} questions and {len(configs)} configs")
        if "--apply" not in sys.argv:
            print("dry run -- nothing written")
            return
        BACKUP.write_text(json.dumps({"questions": questions, "programming_question_configs": configs},
                                     default=str, indent=1), encoding="utf-8")
        session.execute(text("delete from programming_question_configs where question_id = any(:i)"), {"i": ids})
        deleted = session.execute(text("delete from questions where question_id = any(:i)"), {"i": ids}).rowcount
        session.commit()
        print(f"deleted {deleted} questions; backup at {BACKUP.name}")
    finally:
        session.close()


if __name__ == "__main__":
    main()
