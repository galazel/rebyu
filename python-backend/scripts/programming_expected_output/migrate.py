"""Moves programming questions from test cases to one expected output.

A programming question is now a problem plus the exact output a correct program
prints; the learner's program runs once with no input. Existing questions keep
working like this:

* `programming_question_configs.expected_output` is added (Hibernate would add
  it too on the next backend boot; doing it here makes the order explicit).
* Each question takes its FIRST test case (lowest id): that case's expected
  output becomes the question's expected output, and -- because the program no
  longer receives input -- that case's input is written into the question text
  so the single answer is reachable.
* `--drop` removes the `programming_test_cases` table and the now-unused
  `assessment_attempt_executions.passed_tests` / `total_tests` columns. Run it only
  AFTER the new backend is deployed: the old backend still maps all three.

Dry run by default: prints counts and examples, writes nothing.

    PYTHONPATH=. ./.venv/Scripts/python scripts/programming_expected_output/migrate.py
    PYTHONPATH=. ./.venv/Scripts/python scripts/programming_expected_output/migrate.py --apply
    PYTHONPATH=. ./.venv/Scripts/python scripts/programming_expected_output/migrate.py --drop
"""

from __future__ import annotations

import argparse
import ast
import re

from sqlalchemy import text

from app.db.session import engine

MARKER = "Your program reads no input."
CALL = re.compile(r"^\s*[A-Za-z_][\w.]*\s*\(")


def _is_python_call_code(data: str) -> bool:
    """The grader's harness rule: test input that parses as Python and makes a call is code."""
    try:
        tree = ast.parse(data)
    except SyntaxError:
        return False
    return any(isinstance(node, ast.Call) for node in ast.walk(tree))


def input_note(input_data: str) -> str:
    data = (input_data or "").strip()
    if not data:
        return ""
    if _is_python_call_code(data):
        if "\n" not in data and CALL.match(data):
            return f"\n\n{MARKER} It must print the result of:\n{data}"
        return (f"\n\n{MARKER} After your code, run these statements; "
                f"the output must match what they print:\n{data}")
    return f"\n\n{MARKER} Use this input data in your program and print the result:\n{data}"


def table_exists(conn, name: str) -> bool:
    return conn.execute(text("SELECT to_regclass(:n) IS NOT NULL"), {"n": f"public.{name}"}).scalar()


def plan(conn) -> list[dict]:
    rows = conn.execute(text("""
        SELECT DISTINCT ON (c.programming_question_config_id)
               c.programming_question_config_id AS config_id, q.question_id,
               q.question_text, t.input_data, t.expected_output
        FROM programming_question_configs c
        JOIN questions q ON q.question_id = c.question_id
        LEFT JOIN programming_test_cases t
               ON t.programming_question_config_id = c.programming_question_config_id
        WHERE c.expected_output IS NULL OR btrim(c.expected_output) = ''
        ORDER BY c.programming_question_config_id, t.programming_test_case_id
    """)).mappings().all()
    out = []
    for r in rows:
        text_now = r["question_text"] or ""
        note = "" if MARKER in text_now else input_note(r["input_data"])
        out.append({**r, "new_text": text_now.rstrip() + note if note else text_now, "note": note})
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="write expected outputs + question text")
    parser.add_argument("--drop", action="store_true", help="DROP TABLE programming_test_cases")
    args = parser.parse_args()

    with engine.begin() as conn:
        if args.apply:
            conn.execute(text(
                "ALTER TABLE programming_question_configs ADD COLUMN IF NOT EXISTS expected_output TEXT"
            ))

        has_tests = table_exists(conn, "programming_test_cases")
        if has_tests:
            has_column = conn.execute(text(
                "SELECT count(*) FROM information_schema.columns WHERE table_name = "
                "'programming_question_configs' AND column_name = 'expected_output'"
            )).scalar()
            if not has_column:
                # Dry run before the column exists: show what would happen.
                rows = conn.execute(text("""
                    SELECT DISTINCT ON (c.programming_question_config_id)
                           c.programming_question_config_id AS config_id, q.question_id,
                           q.question_text, t.input_data, t.expected_output
                    FROM programming_question_configs c
                    JOIN questions q ON q.question_id = c.question_id
                    LEFT JOIN programming_test_cases t
                           ON t.programming_question_config_id = c.programming_question_config_id
                    ORDER BY c.programming_question_config_id, t.programming_test_case_id
                """)).mappings().all()
                todo = [{**r, "note": input_note(r["input_data"]) if MARKER not in (r["question_text"] or "") else ""}
                        for r in rows]
            else:
                todo = plan(conn)

            no_case = [r for r in todo if r["expected_output"] is None or not r["expected_output"].strip()]
            print(f"programming questions to migrate: {len(todo)}")
            print(f"  with input written into the question text: {sum(1 for r in todo if r['note'])}")
            print(f"  with NO usable test case (expected output stays empty): {len(no_case)}")
            for r in no_case:
                print(f"    question {r['question_id']}: {(r['question_text'] or '')[:80]!r}")
            print(f"test-case rows that will be dropped with --drop: "
                  f"{conn.execute(text('SELECT count(*) FROM programming_test_cases')).scalar()}")
            for r in todo[:3]:
                print("\n--- question", r["question_id"])
                print("expected output:", repr(r["expected_output"])[:200])
                print("appended to text:", repr(r["note"])[:300])

            if args.apply:
                for r in todo:
                    conn.execute(text(
                        "UPDATE programming_question_configs SET expected_output = :o "
                        "WHERE programming_question_config_id = :id"
                    ), {"o": r["expected_output"], "id": r["config_id"]})
                    if r["note"]:
                        conn.execute(text(
                            "UPDATE questions SET question_text = :t WHERE question_id = :id"
                        ), {"t": (r["question_text"] or "").rstrip() + r["note"], "id": r["question_id"]})
                print(f"\nAPPLIED: {len(todo)} question(s) migrated")
        else:
            print("programming_test_cases is already gone; nothing to migrate")

        if args.drop:
            missing = conn.execute(text(
                "SELECT count(*) FROM programming_question_configs "
                "WHERE expected_output IS NULL OR btrim(expected_output) = ''"
            )).scalar()
            print(f"configs still without an expected output: {missing}")
            conn.execute(text("DROP TABLE IF EXISTS programming_test_cases"))
            print("DROPPED programming_test_cases")
            # Pass/total counts per run only existed for test-case checks; Run now just shows output.
            conn.execute(text(
                "ALTER TABLE assessment_attempt_executions "
                "DROP COLUMN IF EXISTS passed_tests, DROP COLUMN IF EXISTS total_tests"
            ))
            print("DROPPED assessment_attempt_executions.passed_tests, total_tests")
        elif not args.apply:
            print("\n(dry run -- nothing written)")


if __name__ == "__main__":
    main()
